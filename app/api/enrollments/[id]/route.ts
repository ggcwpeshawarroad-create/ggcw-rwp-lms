import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Enrollment from "@/models/Enrollment"
import Course from "@/models/Course"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

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
    const isTeacher = session.user.role === "TEACHER" && enrollment.courseId.teacherId.toString() === session.user.id
    const isAdmin = session.user.role === "ADMIN"

    if (!isTeacher && !isAdmin) {
      return NextResponse.json({ error: "Only admins and teachers can remove enrollments" }, { status: 403 })
    }

    await Enrollment.findByIdAndDelete(id)

    // Log the removal
    const Log = (await import("@/models/Log")).default
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
