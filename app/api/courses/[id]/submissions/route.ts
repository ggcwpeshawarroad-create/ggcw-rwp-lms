import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Submission from "@/models/Submission"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const { searchParams } = new URL(req.url)
    const lessonId = searchParams.get("lessonId")

    await connectDB()

    // STUDENT: fetch only their own submission for a specific lesson
    if (session.user?.role === "STUDENT") {
      if (!lessonId) return NextResponse.json([], { status: 200 })
      const submissions = await Submission.find({
        courseId: id,
        lessonId,
        userId: session.user.id,
      }).select("score totalQuestions answers assignmentFile submissionText grade feedback submittedAt lessonId")
        .populate("lessonId", "title type quizData")
        .sort({ submittedAt: -1 })
      return NextResponse.json(submissions)
    }

    // TEACHER / ADMIN: fetch all submissions for the course
    if (session.user?.role !== "ADMIN" && session.user?.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const query: any = { courseId: id }
    if (lessonId) query.lessonId = lessonId

    const submissions = await Submission.find(query)
      .populate("userId", "name email registrationNumber")
      .populate("lessonId", "title type quizData")
      .sort({ submittedAt: -1 })

    return NextResponse.json(submissions)
  } catch (error) {
    console.error("Error fetching submissions:", error)
    return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 })
  }
}
