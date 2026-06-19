import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Course from "@/models/Course"
import User from "@/models/User"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    await connectDB()
    const course = await Course.findById(id).populate("teacherId", "name email role")
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 })
    const courseData = course.toObject()
    courseData.isOwner = !!session?.user?.id && (course.teacherId?._id?.toString() === session.user.id || course.teacherId?.toString() === session.user.id)
    return NextResponse.json(courseData)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch course" }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const updates = await req.json()

    await connectDB()

    const course = await Course.findById(id)

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    if (session.user.role === "TEACHER") {
      const assignedUser = course.teacherId ? await User.findById(course.teacherId, "role") : null
      const isAssignedToTeacher = assignedUser?.role === "TEACHER"
      const isOwner = course.teacherId?.toString() === session.user.id
      const updateKeys = Object.keys(updates)
      const isClaimRequest = updateKeys.length === 1 && (updates.teacherId === session.user.id || updates.teacherId === "self")

      if (!isOwner) {
        if (!isClaimRequest || isAssignedToTeacher) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
      }
    }

    const normalizedUpdates = session.user.role === "TEACHER" && updates.teacherId === "self"
      ? { ...updates, teacherId: session.user.id }
      : updates

    const updatedCourse = await Course.findByIdAndUpdate(
      id,
      { 
        $set: {
          ...normalizedUpdates,
          classLevel: updates.classLevel ?? course.classLevel ?? "",
          program: updates.program ?? course.program ?? "",
          semester: updates.semester ?? course.semester ?? ""
        } 
      },
      { new: true }
    )
 
    // Log the update
    const Log = (await import("@/models/Log")).default
    await Log.create({
      userId: session.user.id,
      action: "COURSE_UPDATED",
      details: `Updated course: ${course.title}. New values: ${JSON.stringify(updates)}`
    })

    return NextResponse.json({
      message: "Course updated successfully",
      course: updatedCourse,
    })
  } catch (error) {
    console.error("Error updating course:", error)
    return NextResponse.json({ error: "Failed to update course" }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    await connectDB()

    const course = await Course.findById(id)
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    await Course.findByIdAndDelete(id)

    // Log the deletion
    const Log = (await import("@/models/Log")).default
    await Log.create({
      userId: session.user.id,
      action: "COURSE_DELETED",
      details: `Deleted course: ${course.title} (${id})`
    })

    return NextResponse.json({ message: "Course deleted successfully" })
  } catch (error) {
    console.error("Error deleting course:", error)
    return NextResponse.json({ error: "Failed to delete course" }, { status: 500 })
  }
}
