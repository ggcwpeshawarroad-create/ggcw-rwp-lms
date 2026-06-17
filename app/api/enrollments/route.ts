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
    if (courseId) query.courseId = courseId

    if (session.user.role === "STUDENT") {
      // Students can only see their own enrollments
      query.userId = session.user.id
    } else if (session.user.role === "TEACHER") {
      // Teachers see their own enrollments, plus student enrollments only for assigned courses.
      const teacherCourses = await Course.find({ teacherId: session.user.id }, "_id")
      const courseIds = teacherCourses.map(c => c._id)
      const ownsRequestedCourse = courseId && courseIds.some(c => c.toString() === courseId)

      query.$or = [
        { userId: session.user.id, ...(courseId ? { courseId } : {}) },
      ]

      if (courseId) {
        if (ownsRequestedCourse) query.$or.push({ courseId, ...(userId ? { userId } : {}) })
      } else {
        query.$or.push({ courseId: { $in: courseIds }, ...(userId ? { userId } : {}) })
      }
    } else {
      // Admin can filter by userId if provided
      if (userId) query.userId = userId
    }

    const enrollments = await Enrollment.find(query)
      .populate("userId", "name email registrationNumber classLevel program semester")
      .populate("courseId", "title description program classLevel semester published teacherId")

    const enrollmentsWithOwnership = enrollments.map((enrollment: any) => {
      const item = enrollment.toObject()
      if (item.courseId && session.user.role === "TEACHER") {
        item.courseId.isOwner = item.courseId.teacherId?.toString() === session.user.id
      }
      return item
    })

    return NextResponse.json(enrollmentsWithOwnership)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch enrollments" }, { status: 500 })
  }
}


export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { courseId, userId: bodyUserId } = await req.json()

    if (!courseId) {
      return NextResponse.json({ error: "Missing courseId" }, { status: 400 })
    }

    await connectDB()

    // Resolve the effective userId
    let userId: string
    if (session.user.role === "STUDENT") {
      // Students always enroll themselves — ignore any userId in body
      userId = session.user.id
    } else if (session.user.role === "TEACHER") {
      if (bodyUserId) {
        // Teacher enrolling someone else — only allowed for their own course (enforced below)
        userId = bodyUserId
      } else {
        // Teacher self-enrolling
        userId = session.user.id
      }
    } else if (session.user.role === "ADMIN") {
      if (!bodyUserId) return NextResponse.json({ error: "Missing userId" }, { status: 400 })
      userId = bodyUserId
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 1. Permission & course check
    const course = await Course.findById(courseId)
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 })

    if (session.user.role === "STUDENT" && !course.published) {
      return NextResponse.json({ error: "Course not available" }, { status: 400 })
    }
    // If a teacher is enrolling someone *else*, they must own that course
    if (session.user.role === "TEACHER" && bodyUserId && course.teacherId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Check existing enrollment
    const existing = await Enrollment.findOne({ userId, courseId })
    if (existing) {
      return NextResponse.json({ error: "Already enrolled in this course" }, { status: 400 })
    }

    // 3. Create Enrollment
    const enrollment = await Enrollment.create({ userId, courseId })

    // 4. Log the activity
    const Log = (await import("@/models/Log")).default
    await Log.create({
      userId: session.user.id,
      action: "STUDENT_ENROLLED",
      details: `Enrolled into course: ${course.title}`
    })

    return NextResponse.json({ message: "Enrolled successfully", enrollment })
  } catch (error) {
    console.error("Enrollment error:", error)
    return NextResponse.json({ error: "Failed to enroll student" }, { status: 500 })
  }
}
