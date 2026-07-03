import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Lesson, { ILesson } from "@/models/Lesson"
import Course from "@/models/Course"
import Enrollment from "@/models/Enrollment"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const chapterId = searchParams.get("chapterId")

    const session = await getServerSession(authOptions)
    await connectDB()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const course = await Course.findById(id)
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 })

    if (session.user.role === "STUDENT") {
      const isApprovedEnrollment = await Enrollment.exists({ courseId: id, userId: session.user.id, $or: [{ status: "APPROVED" }, { status: { $exists: false } }] })
      if (!isApprovedEnrollment) {
        return NextResponse.json({ error: "Enrollment approval required" }, { status: 403 })
      }
    } else if (session.user.role === "TEACHER" && course.teacherId?.toString() !== session.user.id) {
      const isEnrolledTeacher = await Enrollment.exists({ courseId: id, userId: session.user.id })
      if (!isEnrolledTeacher) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    let query: any = { courseId: id }
    if (chapterId) query.chapterId = chapterId

    let lessons = (await Lesson.find(query).sort({ order: 1 }).lean()) as ILesson[]

    // If student, keep lessons visible but strip correct answers.
    // Availability is shown in the player so dated lessons do not disappear.
    if (session?.user?.role === "STUDENT") {
      lessons = lessons.map(lesson => {
        if (lesson.type === "QUIZ" && lesson.quizData) {
          lesson.quizData = lesson.quizData.map((q: any) => {
            const { correctAnswer, ...rest } = q
            return rest
          })
        }
        return lesson
      })
    }

    return NextResponse.json(lessons)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch lessons" }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()

    await connectDB()
    
    // Verify ownership
    const course = await Course.findById(id)
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 })
    if (session.user.role === "TEACHER" && course.teacherId?.toString() !== session.user.id) {
      const isEnrolledTeacher = await Enrollment.exists({ courseId: id, userId: session.user.id })
      if (!isEnrolledTeacher) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    const lastLesson = await Lesson.findOne({ chapterId: body.chapterId }).sort({ order: -1 })
    const order = lastLesson ? lastLesson.order + 1 : 1

    const lesson = await Lesson.create({ 
        ...body, 
        courseId: id, 
        order 
    })
    return NextResponse.json(lesson)
  } catch (error) {
    console.error("Lesson creation error:", error)
    return NextResponse.json({ error: "Failed to create lesson" }, { status: 500 })
  }
}
