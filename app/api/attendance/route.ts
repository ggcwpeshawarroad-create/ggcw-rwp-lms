import { NextResponse } from "next/server"
import { Types } from "mongoose"
import { getServerSession } from "next-auth"
import connectDB from "@/lib/db"
import { authOptions } from "@/lib/auth"
import Attendance from "@/models/Attendance"
import Course from "@/models/Course"
import Enrollment from "@/models/Enrollment"

const STATUSES = ["PRESENT", "ABSENT", "LATE", "EXCUSED", "LEAVE"]

function isDateString(value: string | null) {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

async function getTeacherCourseIds(teacherId: string) {
  const courses = await Course.find({ teacherId }, "_id").lean()
  return courses.map((course: any) => course._id.toString())
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !["ADMIN", "TEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const courseId = searchParams.get("courseId")
    const date = searchParams.get("date")

    if (courseId && !Types.ObjectId.isValid(courseId)) {
      return NextResponse.json({ error: "Invalid courseId" }, { status: 400 })
    }
    if (date && !isDateString(date)) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 })
    }

    await connectDB()

    let query: any = {}
    if (courseId) query.courseId = courseId
    if (date) query.date = date

    if (session.user.role === "TEACHER") {
      const teacherCourseIds = await getTeacherCourseIds(session.user.id)
      if (courseId && !teacherCourseIds.includes(courseId)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
      query.courseId = { $in: teacherCourseIds }
    }

    const attendance = await Attendance.find(query)
      .populate("courseId", "title classLevel program semester")
      .populate("teacherId", "name email")
      .populate("records.studentId", "name email registrationNumber classLevel program semester")
      .sort({ date: -1, createdAt: -1 })

    return NextResponse.json(attendance)
  } catch (error) {
    console.error("Attendance fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !["ADMIN", "TEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { courseId, date, records } = await req.json()

    if (!courseId || !Types.ObjectId.isValid(courseId)) {
      return NextResponse.json({ error: "Valid courseId is required" }, { status: 400 })
    }
    if (!isDateString(date)) {
      return NextResponse.json({ error: "Valid date is required" }, { status: 400 })
    }
    if (!Array.isArray(records)) {
      return NextResponse.json({ error: "Attendance records are required" }, { status: 400 })
    }

    await connectDB()

    const course = await Course.findById(courseId)
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    if (session.user.role === "TEACHER" && course.teacherId?.toString() !== session.user.id) {
      return NextResponse.json({ error: "Teachers can only mark attendance for their assigned courses" }, { status: 401 })
    }

    const enrollments = await Enrollment.find({ courseId })
      .populate("userId", "role")
      .lean()
    const enrolledStudentIds = new Set(
      enrollments
        .filter((enrollment: any) => enrollment.userId?.role === "STUDENT")
        .map((enrollment: any) => enrollment.userId._id.toString())
    )

    const normalizedRecords = records.map((record: any) => ({
      studentId: record.studentId,
      status: String(record.status || "PRESENT").toUpperCase(),
      note: String(record.note || "").trim(),
    }))

    const invalidRecord = normalizedRecords.find((record: any) => (
      !Types.ObjectId.isValid(record.studentId) ||
      !enrolledStudentIds.has(record.studentId) ||
      !STATUSES.includes(record.status)
    ))

    if (invalidRecord) {
      return NextResponse.json({ error: "Attendance includes an invalid student or status" }, { status: 400 })
    }

    const attendance = await Attendance.findOneAndUpdate(
      { courseId, date },
      {
        $set: {
          courseId,
          date,
          teacherId: course.teacherId || session.user.id,
          records: normalizedRecords,
        },
      },
      { new: true, upsert: true, runValidators: true }
    )
      .populate("courseId", "title classLevel program semester")
      .populate("teacherId", "name email")
      .populate("records.studentId", "name email registrationNumber classLevel program semester")

    return NextResponse.json({ message: "Attendance saved successfully", attendance })
  } catch (error) {
    console.error("Attendance save error:", error)
    return NextResponse.json({ error: "Failed to save attendance" }, { status: 500 })
  }
}
