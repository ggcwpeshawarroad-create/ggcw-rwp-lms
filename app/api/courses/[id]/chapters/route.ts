import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Chapter from "@/models/Chapter"
import Course from "@/models/Course"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params
    await connectDB()
    const chapters = await Chapter.find({ courseId: id }).sort({ order: 1 })
    return NextResponse.json(chapters)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch chapters" }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { title } = await req.json()

    await connectDB()
    
    // Verify ownership
    const course = await Course.findById(id)
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 })
    if (session.user.role === "TEACHER" && course.teacherId.toString() !== session.user.id) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const lastChapter = await Chapter.findOne({ courseId: id }).sort({ order: -1 })
    const order = lastChapter ? lastChapter.order + 1 : 1

    const chapter = await Chapter.create({ title, courseId: id, order })
    return NextResponse.json(chapter)
  } catch (error) {
    return NextResponse.json({ error: "Failed to create chapter" }, { status: 500 })
  }
}
