import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Course from "@/models/Course"
import User from "@/models/User"
import Enrollment from "@/models/Enrollment"
import Log from "@/models/Log"
import { Types } from "mongoose"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const teacherId = searchParams.get("teacherId")
    const browse = searchParams.get("browse")
    const teacherCatalog = searchParams.get("teacherCatalog")

    await connectDB()

    let query: any = {}
    if (browse === "true") {
      query = { published: true }
    } else if (teacherCatalog === "true") {
      query = { published: true }
    } else if (session.user.role === "TEACHER") {
      query = { teacherId: session.user.id }
    } else if (session.user.role === "ADMIN") {
      if (teacherId) query = { teacherId }
    } else {
      query = { published: true }
    }

    const courses = await Course.find(query)
      .populate("teacherId", "name email role")
      .sort({ createdAt: -1 })

    // Add enrollment count to each course
    const [studentIds, teacherIds] = await Promise.all([
      User.find({ role: "STUDENT" }, "_id").lean(),
      User.find({ role: "TEACHER" }, "_id").lean(),
    ])
    const studentUserIds = studentIds.map((student: any) => student._id)
    const teacherUserIds = teacherIds.map((teacher: any) => teacher._id)
    const coursesWithCounts = await Promise.all(
      courses.map(async (course) => {
        const [enrollmentCount, teacherEnrollment] = await Promise.all([
          Enrollment.countDocuments({ courseId: course._id, userId: { $in: studentUserIds } }),
          Enrollment.findOne({ courseId: course._id, userId: { $in: teacherUserIds } })
            .populate("userId", "name email role")
            .lean(),
        ])
        const isOwner = course.teacherId?._id?.toString() === session.user.id || course.teacherId?.toString() === session.user.id
        const assignedTeacher = course.teacherId?.role === "TEACHER" ? course.teacherId : null
        const teacherSource: any = teacherEnrollment?.userId || assignedTeacher
        const enrolledTeacher = teacherSource
          ? {
              _id: teacherSource._id?.toString?.() || teacherSource.toString?.(),
              name: teacherSource.name || "Teacher",
              email: teacherSource.email || "",
              role: teacherSource.role || "TEACHER",
            }
          : null
        return {
          ...course.toObject(),
          enrollmentCount,
          isOwner,
          enrolledTeacher,
          isTeacherEnrolled: enrolledTeacher?._id === session.user.id,
        }
      })
    )

    return NextResponse.json(coursesWithCounts)
  } catch (error) {
    console.error("Error fetching courses:", error)
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    // Only Admin can create courses now
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
 
    const { title, description, thumbnail, classLevel, program, semester, teacherId: providedTeacherId } = await req.json()
 
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }
 
    if (providedTeacherId && !Types.ObjectId.isValid(providedTeacherId)) {
      return NextResponse.json({ error: "Invalid teacherId" }, { status: 400 })
    }

    await connectDB()
 
    const course = await Course.create({
      title,
      description,
      thumbnail,
      classLevel: classLevel || "",
      program: program || "",
      semester: semester || "",
      ...(providedTeacherId ? { teacherId: providedTeacherId } : {}),
      published: true,
    })

    // Log the course creation
    await Log.create({
      userId: session.user.id,
      action: "COURSE_CREATED",
      details: `Created course: ${title}`
    })

    return NextResponse.json({
      message: "Course created successfully",
      course,
    })
  } catch (error) {
    console.error("Error creating course:", error)
    return NextResponse.json({ error: "Failed to create course" }, { status: 500 })
  }
}
