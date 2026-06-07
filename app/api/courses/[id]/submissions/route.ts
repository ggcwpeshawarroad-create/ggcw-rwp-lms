import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Submission from "@/models/Submission"
import User from "@/models/User"
import Lesson from "@/models/Lesson"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user?.role !== "ADMIN" && session.user?.role !== "TEACHER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    await connectDB()

    // Fetch all submissions for any lesson in this course
    const submissions = await Submission.find({ courseId: id })
      .populate("userId", "name email registrationNumber")
      .populate("lessonId", "title type quizData")
      .sort({ submittedAt: -1 })

    return NextResponse.json(submissions)
  } catch (error) {
    console.error("Error fetching submissions:", error)
    return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 })
  }
}
