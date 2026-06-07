import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Lesson from "@/models/Lesson"
import Course from "@/models/Course"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function DELETE(
  req: Request,
  { params }: { params: { id: string; lessonId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, lessonId } = await params
    await connectDB()
    
    const course = await Course.findById(id)
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 })
    if (session.user.role === "TEACHER" && course.teacherId.toString() !== session.user.id) {
       return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await Lesson.findByIdAndDelete(lessonId)
    return NextResponse.json({ message: "Lesson deleted" })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete lesson" }, { status: 500 })
  }
}

export async function GET(req: Request, { params }: { params: { id: string; lessonId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { id, lessonId } = await params
    await connectDB()
    const course = await Course.findById(id)
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 })
    // Authorization: teachers can access their own courses, admins any
    if (session.user.role === "TEACHER" && course.teacherId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const lesson = await Lesson.findById(lessonId).lean()
    if (!lesson) return NextResponse.json({ error: "Lesson not found" }, { status: 404 })

    // If student, strip correct answers and check dates
    if (session.user.role === "STUDENT") {
      const now = new Date()
      if (lesson.startDate && now < new Date(lesson.startDate)) {
         return NextResponse.json({ error: "Lesson not yet available", availableAt: lesson.startDate }, { status: 403 })
      }
      
      if (lesson.type === "QUIZ" && lesson.quizData) {
        lesson.quizData = lesson.quizData.map((q: any) => {
          const { correctAnswer, ...rest } = q
          return rest
        })
      }
    }

    return NextResponse.json(lesson)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch lesson" }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string; lessonId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { id, lessonId } = await params
    const payload = await req.json()
    await connectDB()
    const course = await Course.findById(id)
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 })
    if (session.user.role === "TEACHER" && course.teacherId.toString() !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const updated = await Lesson.findByIdAndUpdate(lessonId, payload, { new: true })
    if (!updated) return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update lesson" }, { status: 500 })
  }
}
