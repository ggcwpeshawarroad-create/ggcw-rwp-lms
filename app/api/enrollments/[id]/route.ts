import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Enrollment from "@/models/Enrollment"
import Log from "@/models/Log"
import Course from "@/models/Course"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const { status } = await req.json()

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid enrollment status" }, { status: 400 })
    }

    await connectDB()

    const enrollment = await Enrollment.findById(id)
      .populate("courseId")
      .populate("userId", "name role")

    if (!enrollment) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 })
    }

    const isTeacher = session.user.role === "TEACHER" && enrollment.courseId.teacherId?.toString() === session.user.id
    const isAdmin = session.user.role === "ADMIN"

    if (!isTeacher && !isAdmin) {
      return NextResponse.json({ error: "Only admins and assigned teachers can review enrollment requests" }, { status: 403 })
    }

    if (enrollment.userId?.role !== "STUDENT") {
      return NextResponse.json({ error: "Only student enrollment requests can be reviewed" }, { status: 400 })
    }

    enrollment.status = status
    enrollment.reviewedBy = session.user.id
    enrollment.reviewedAt = new Date()
    await enrollment.save()

    await Log.create({
      userId: session.user.id,
      action: status === "APPROVED" ? "ENROLLMENT_APPROVED" : "ENROLLMENT_REJECTED",
      details: (status === "APPROVED" ? "Approved" : "Rejected") + " enrollment request for course: " + enrollment.courseId.title
    })

    return NextResponse.json({
      message: status === "APPROVED" ? "Enrollment request approved" : "Enrollment request rejected",
      enrollment
    })
  } catch (error) {
    console.error("Enrollment review error:", error)
    return NextResponse.json({ error: "Failed to review enrollment request" }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    await connectDB()

    const enrollment = await Enrollment.findById(id).populate("courseId")
    if (!enrollment) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 })
    }

    // Only the course's teacher or an Admin can remove an enrollment
    const isTeacher = session.user.role === "TEACHER" && enrollment.courseId.teacherId?.toString() === session.user.id
    const isAdmin = session.user.role === "ADMIN"

    if (!isTeacher && !isAdmin) {
      return NextResponse.json({ error: "Only admins and teachers can remove enrollments" }, { status: 403 })
    }

    await Enrollment.findByIdAndDelete(id)

    // Log the removal
    await Log.create({
      userId: session.user.id,
      action: "STUDENT_UNENROLLED",
      details: `Removed student enrollment from course: ${enrollment.courseId.title}`
    })

    return NextResponse.json({ message: "Unenrolled successfully" })
  } catch (error) {
    console.error("Unenrollment error:", error)
    return NextResponse.json({ error: "Failed to process unenrollment" }, { status: 500 })
  }
}
