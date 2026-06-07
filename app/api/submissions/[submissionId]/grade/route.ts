import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Submission from "@/models/Submission"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { submissionId } = await params
    const { grade, feedback } = await req.json()

    await connectDB()

    const submission = await Submission.findByIdAndUpdate(
      submissionId,
      { grade, feedback },
      { new: true }
    )

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    return NextResponse.json(submission)
  } catch (error) {
    console.error("Grading error:", error)
    return NextResponse.json({ error: "Failed to save grade" }, { status: 500 })
  }
}
