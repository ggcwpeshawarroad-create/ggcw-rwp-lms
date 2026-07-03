import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Enrollment from "@/models/Enrollment"
import Course from "@/models/Course"
import User from "@/models/User"
import Log from "@/models/Log"
import { Types } from "mongoose"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    const courseId = searchParams.get("courseId")
    const status = searchParams.get("status")
    const includePending = searchParams.get("includePending") === "true"

    if (courseId && !Types.ObjectId.isValid(courseId)) {
      return NextResponse.json({ error: "Invalid courseId" }, { status: 400 })
    }
    if (userId && userId !== "self" && !Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid userId" }, { status: 400 })
    }
    if (status && !["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    await connectDB()

    let query: any = {}
    if (courseId) query.courseId = courseId

    if (session.user.role === "STUDENT") {
      // Students can only see their own enrollments
      query.userId = session.user.id
    } else if (session.user.role === "TEACHER") {
      const isSelfQuery = userId === "self" || userId === session.user.id

      if (isSelfQuery) {
        query.userId = session.user.id
      } else {
        // Teachers see student enrollments only for courses assigned to them.
        const teacherCourses = await Course.find({ teacherId: session.user.id }, "_id")
        const assignedCourseIds = teacherCourses.map(c => c._id.toString())

        if (courseId) {
          query = assignedCourseIds.includes(courseId)
            ? { courseId, ...(userId ? { userId } : {}) }
            : { _id: null }
        } else {
          query = { courseId: { $in: assignedCourseIds }, ...(userId ? { userId } : {}) }
        }
      }
    } else {
      // Admin can filter by userId if provided
      if (userId) query.userId = userId
    }

    if (status) {
      query.status = status
    } else if (includePending) {
      query.$or = [{ status: "APPROVED" }, { status: "PENDING" }, { status: { $exists: false } }]
    } else {
      query.$or = [{ status: "APPROVED" }, { status: { $exists: false } }]
    }

    const enrollments = await Enrollment.find(query)
      .populate("userId", "name email registrationNumber classLevel program semester role")
      .populate("courseId", "title description program classLevel semester published teacherId")

    const enrollmentsWithOwnership = enrollments.map((enrollment: any) => {
      const item = enrollment.toObject()
      if (item.courseId && session.user.role === "TEACHER") {
        item.courseId.isOwner = item.courseId.teacherId?.toString() === session.user.id
      }
      return item
    })

    const visibleEnrollments = session.user.role === "STUDENT" || (session.user.role === "TEACHER" && (userId === "self" || userId === session.user.id))
      ? enrollmentsWithOwnership
      : enrollmentsWithOwnership.filter((item: any) => item.userId?.role === "STUDENT")

    return NextResponse.json(visibleEnrollments)
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

    if (!Types.ObjectId.isValid(courseId)) {
      return NextResponse.json({ error: "Invalid courseId" }, { status: 400 })
    }
    if (bodyUserId && !Types.ObjectId.isValid(bodyUserId)) {
      return NextResponse.json({ error: "Invalid userId" }, { status: 400 })
    }

    await connectDB()

    // Resolve the user being enrolled. Students and teachers can self-enroll;
    // teachers/admins can still enroll students by supplying userId.
    let userId: string
    if (session.user.role === "STUDENT") {
      userId = session.user.id
    } else if (session.user.role === "TEACHER" && !bodyUserId) {
      userId = session.user.id
    } else if (session.user.role === "TEACHER" || session.user.role === "ADMIN") {
      if (!bodyUserId) {
        return NextResponse.json({ error: "Missing student userId" }, { status: 400 })
      }
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

    const targetUser = await User.findById(userId, "role")
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    const isTeacherSelfEnrollment = session.user.role === "TEACHER" && userId === session.user.id && targetUser.role === "TEACHER"
    if (targetUser.role !== "STUDENT" && !isTeacherSelfEnrollment) {
      return NextResponse.json({ error: "Only students can be enrolled by staff" }, { status: 400 })
    }

    if (session.user.role === "TEACHER" && !isTeacherSelfEnrollment && course.teacherId?.toString() !== session.user.id) {
      return NextResponse.json({ error: "Teachers can only enroll students in their assigned courses" }, { status: 401 })
    }

    if (isTeacherSelfEnrollment) {
      if (course.teacherId && course.teacherId.toString() !== userId) {
        const assignedUser = await User.findById(course.teacherId, "role")
        if (assignedUser?.role === "TEACHER") {
          return NextResponse.json({ error: "Another teacher is already registered with this course. Only one teacher can enroll in a course." }, { status: 400 })
        }
      }

      const teacherUsers = await User.find({ role: "TEACHER" }, "_id")
      const teacherUserIds = teacherUsers.map((teacher: any) => teacher._id)
      const existingTeacherForCourse = await Enrollment.findOne({
        courseId,
        userId: { $in: teacherUserIds },
      })

      if (existingTeacherForCourse && existingTeacherForCourse.userId.toString() !== userId) {
        return NextResponse.json({ error: "Another teacher is already registered with this course. Only one teacher can enroll in a course." }, { status: 400 })
      }

      if (!course.teacherId) {
        course.teacherId = userId
        await course.save()
      }
    }

    // 2. Check existing enrollment or request
    const existing = await Enrollment.findOne({ userId, courseId })
    if (existing) {
      const existingStatus = existing.status || "APPROVED"
      if (existingStatus === "PENDING") {
        return NextResponse.json({ error: "Enrollment request is already pending teacher approval" }, { status: 400 })
      }
      if (existingStatus === "APPROVED") {
        return NextResponse.json({ error: "Already enrolled in this course" }, { status: 400 })
      }
      if (session.user.role === "STUDENT") {
        existing.status = "PENDING"
        existing.reviewedBy = undefined
        existing.reviewedAt = undefined
        await existing.save()

        await Log.create({
          userId: session.user.id,
          action: "ENROLLMENT_REQUESTED",
          details: "Requested enrollment for course: " + course.title
        })

        return NextResponse.json({ message: "Enrollment request sent. Please wait for teacher approval.", enrollment: existing })
      }

      existing.status = "APPROVED"
      existing.reviewedBy = session.user.id
      existing.reviewedAt = new Date()
      await existing.save()

      await Log.create({
        userId: session.user.id,
        action: targetUser.role === "TEACHER" ? "TEACHER_ENROLLED" : "STUDENT_ENROLLED",
        details: "Enrolled into course: " + course.title
      })

      return NextResponse.json({ message: "Enrolled successfully", enrollment: existing })
    }

    const enrollmentStatus = session.user.role === "STUDENT" ? "PENDING" : "APPROVED"

    // 3. Create Enrollment or request
    const enrollment = await Enrollment.create({ userId, courseId, status: enrollmentStatus })

    // 4. Log the activity
    await Log.create({
      userId: session.user.id,
      action: targetUser.role === "TEACHER" ? "TEACHER_ENROLLED" : enrollmentStatus === "PENDING" ? "ENROLLMENT_REQUESTED" : "STUDENT_ENROLLED",
      details: enrollmentStatus === "PENDING" ? "Requested enrollment for course: " + course.title : "Enrolled into course: " + course.title
    })

    return NextResponse.json({
      message: enrollmentStatus === "PENDING" ? "Enrollment request sent. Please wait for teacher approval." : "Enrolled successfully",
      enrollment
    })
  } catch (error) {
    console.error("Enrollment error:", error)
    return NextResponse.json({ error: "Failed to enroll user" }, { status: 500 })
  }
}
