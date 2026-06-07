import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Enrollment from "@/models/Enrollment"
import Course from "@/models/Course"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    const courseId = searchParams.get("courseId")

    await connectDB()

    let query: any = {}
    if (userId) query.userId = userId
    if (courseId) query.courseId = courseId

    // If teacher, they can see enrollments for their own courses
    if (session.user.role === "TEACHER") {
       const teacherCourses = await Course.find({ teacherId: session.user.id }, "_id")
       const courseIds = teacherCourses.map(c => c._id)
       query.courseId = { $in: courseIds }
    }

    const enrollments = await Enrollment.find(query)
      .populate("userId", "name email")
      .populate("courseId", "title description")
    
    return NextResponse.json(enrollments)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch enrollments" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { userId, courseId } = await req.json()

    if (!userId || !courseId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    await connectDB()

    // 1. Permission Check
    const course = await Course.findById(courseId)
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 })

    if (session.user.role === "STUDENT") {
      // Students can only enroll themselves
      if (userId !== session.user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      // Students can only enroll in published courses
      if (!course.published) return NextResponse.json({ error: "Course not available" }, { status: 400 })
    } else if (session.user.role === "TEACHER") {
      // Teachers can only enroll students in their own courses
      if (course.teacherId.toString() !== session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    } else if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Check existing enrollment
    const existing = await Enrollment.findOne({ userId, courseId })
    if (existing) {
      return NextResponse.json({ error: "Student is already enrolled in this course" }, { status: 400 })
    }

    // 3. Create Enrollment
    const enrollment = await Enrollment.create({ userId, courseId })

    // 4. Log the activity
    const Log = (await import("@/models/Log")).default
    await Log.create({
      userId: session.user.id,
      action: "STUDENT_ENROLLED",
      details: `Enrolled student into course: ${course.title}`
    })

    return NextResponse.json({ message: "Enrolled successfully", enrollment })
  } catch (error) {
    console.error("Enrollment error:", error)
    return NextResponse.json({ error: "Failed to enroll student" }, { status: 500 })
  }
}
