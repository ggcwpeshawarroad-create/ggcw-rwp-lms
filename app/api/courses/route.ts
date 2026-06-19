import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Course from "@/models/Course"
import User from "@/models/User"
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

    await connectDB()

    let query: any = {}
    if (browse === "true") {
      query = { published: true }
    } else if (session.user.role === "TEACHER") {
      query = { teacherId: session.user.id }
    } else if (session.user.role === "ADMIN") {
      // If admin and teacherId is provided, filter. Otherwise show all.
      if (teacherId) query = { teacherId }
    } else {
      // Students only see published courses
      query = { published: true }
    }

    const courses = await Course.find(query)
      .populate("teacherId", "name email")
      .sort({ createdAt: -1 })

    // Add enrollment count to each course
    const Enrollment = (await import("@/models/Enrollment")).default
    const studentIds = await User.find({ role: "STUDENT" }, "_id").lean()
    const studentUserIds = studentIds.map((student: any) => student._id)
    const coursesWithCounts = await Promise.all(
      courses.map(async (course) => {
        const enrollmentCount = await Enrollment.countDocuments({ courseId: course._id, userId: { $in: studentUserIds } })
        const isOwner = course.teacherId?._id?.toString() === session.user.id || course.teacherId?.toString() === session.user.id
        return {
          ...course.toObject(),
          enrollmentCount,
          isOwner
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
 
    await connectDB()
 
    const course = await Course.create({
      title,
      description,
      thumbnail,
      classLevel: classLevel || "",
      program: program || "",
      semester: semester || "",
      teacherId: providedTeacherId || session.user.id,
      published: true,
    })

    // Log the course creation
    const Log = (await import("@/models/Log")).default
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
