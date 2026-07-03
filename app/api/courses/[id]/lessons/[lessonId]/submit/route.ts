import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Lesson from "@/models/Lesson"
import Submission from "@/models/Submission"
import Enrollment from "@/models/Enrollment"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { lessonId, id: courseId } = await params
    const body = await req.json()
    const { answers, assignmentFile } = body

    await connectDB()

    if (session.user.role === "STUDENT") {
      const isApprovedEnrollment = await Enrollment.exists({ courseId, userId: session.user.id, $or: [{ status: "APPROVED" }, { status: { $exists: false } }] })
      if (!isApprovedEnrollment) {
        return NextResponse.json({ error: "Enrollment approval required" }, { status: 403 })
      }
    }

    const lesson = await Lesson.findById(lessonId)
    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }

    // Date checks
    const now = new Date()
    if (lesson.startDate && now < new Date(lesson.startDate)) {
      return NextResponse.json({ error: "This content is not yet available" }, { status: 403 })
    }
    if (lesson.endDate && now > new Date(lesson.endDate)) {
      return NextResponse.json({ error: "The deadline for this submission has passed" }, { status: 403 })
    }

    // Retake check
    if (!lesson.isRetakeAllowed) {
      const existingSubmission = await Submission.findOne({ userId: session.user.id, lessonId })
      if (existingSubmission) {
        return NextResponse.json({ error: "You have already submitted this and retakes are not allowed." }, { status: 403 })
      }
    }

    let submissionData: any = {
      userId: session.user.id,
      lessonId,
      courseId,
    }

    // Handle Quiz Logic
    if (lesson.type === "QUIZ" && answers) {
      let score = 0
      const submissionAnswers = (lesson.quizData ?? []).map((q: any, idx: number) => {
        const userAnswer = answers.find((a: any) => a.questionIndex === idx)
        const isCorrect = userAnswer?.answerIndex === q.correctAnswer
        if (isCorrect) score++
        return {
          questionIndex: idx,
          answerIndex: userAnswer?.answerIndex ?? -1,
          isCorrect
        }
      })
      submissionData.score = score
      submissionData.totalQuestions = (lesson.quizData ?? []).length
      submissionData.answers = submissionAnswers
    } 
    // Handle Assignment Logic
    else if (lesson.type === "ASSIGNMENT" && assignmentFile) {
      submissionData.assignmentFile = assignmentFile
    }

    const submission = await Submission.create(submissionData)

    return NextResponse.json({
      success: true,
      score: submissionData.score,
      total: submissionData.totalQuestions,
      submissionId: submission._id
    })

  } catch (error) {
    console.error("Submission error:", error)
    return NextResponse.json({ error: "Failed to process submission" }, { status: 500 })
  }
}
