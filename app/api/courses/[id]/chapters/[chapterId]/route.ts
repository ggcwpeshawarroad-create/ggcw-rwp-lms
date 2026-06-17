import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Chapter from "@/models/Chapter"
import Course from "@/models/Course"
import Enrollment from "@/models/Enrollment"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; chapterId: string }> }
) {
  try {
    const { chapterId } = await params
    await connectDB()
    const chapter = await Chapter.findById(chapterId)
    if (!chapter) return NextResponse.json({ error: "Chapter not found" }, { status: 404 })
    return NextResponse.json(chapter)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch chapter" }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; chapterId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, chapterId } = await params
    const { title } = await req.json()

    await connectDB()
    
    // Verify ownership
    const course = await Course.findById(id)
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 })
    if (session.user.role === "TEACHER" && course.teacherId.toString() !== session.user.id) {
      const enrollment = await Enrollment.exists({ courseId: id, userId: session.user.id })
      if (!enrollment) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const chapter = await Chapter.findByIdAndUpdate(chapterId, { title }, { new: true })
    if (!chapter) return NextResponse.json({ error: "Chapter not found" }, { status: 404 })
    return NextResponse.json(chapter)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update chapter" }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; chapterId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, chapterId } = await params
    await connectDB()
    
    // Verify ownership
    const course = await Course.findById(id)
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 })
    if (session.user.role === "TEACHER" && course.teacherId.toString() !== session.user.id) {
      const enrollment = await Enrollment.exists({ courseId: id, userId: session.user.id })
      if (!enrollment) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Optional: Delete lessons associated with this chapter?
    // For now just delete chapter
    await Chapter.findByIdAndDelete(chapterId)
    // Also delete lessons
    const Lesson = (await import("@/models/Lesson")).default
    await Lesson.deleteMany({ chapterId })

    return NextResponse.json({ message: "Chapter deleted" })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete chapter" }, { status: 500 })
  }
}
