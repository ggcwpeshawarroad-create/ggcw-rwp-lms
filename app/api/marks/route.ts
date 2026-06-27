import { NextResponse } from "next/server"
import { Types } from "mongoose"
import { getServerSession } from "next-auth"
import connectDB from "@/lib/db"
import { authOptions } from "@/lib/auth"
import Course from "@/models/Course"
import Submission from "@/models/Submission"

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
    const userId = searchParams.get("userId")
    const type = searchParams.get("type")

    if (courseId && !Types.ObjectId.isValid(courseId)) {
      return NextResponse.json({ error: "Invalid courseId" }, { status: 400 })
    }
    if (userId && !Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid userId" }, { status: 400 })
    }
    if (type && !["QUIZ", "ASSIGNMENT"].includes(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 })
    }

    await connectDB()

    const query: any = {}
    if (courseId) query.courseId = courseId
    if (userId) query.userId = userId

    if (session.user.role === "TEACHER") {
      const teacherCourseIds = await getTeacherCourseIds(session.user.id)
      if (courseId && !teacherCourseIds.includes(courseId)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
      query.courseId = courseId || { $in: teacherCourseIds }
    }

    const submissions = await Submission.find(query)
      .populate("userId", "name email registrationNumber classLevel program semester")
      .populate("courseId", "title classLevel program semester teacherId")
      .populate("lessonId", "title type")
      .sort({ submittedAt: -1 })
      .lean()

    const filtered = type
      ? submissions.filter((submission: any) => submission.lessonId?.type === type)
      : submissions.filter((submission: any) => ["QUIZ", "ASSIGNMENT"].includes(submission.lessonId?.type))

    return NextResponse.json(filtered)
  } catch (error) {
    console.error("Marks fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch marks" }, { status: 500 })
  }
}
