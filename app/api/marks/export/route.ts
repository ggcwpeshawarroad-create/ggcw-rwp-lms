import { NextResponse } from "next/server"
import { Types } from "mongoose"
import { getServerSession } from "next-auth"
import connectDB from "@/lib/db"
import { authOptions } from "@/lib/auth"
import Course from "@/models/Course"
import Submission from "@/models/Submission"
import User from "@/models/User"
import Lesson from "@/models/Lesson"

function escapeCell(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function percent(score: unknown, total: unknown) {
  const nScore = Number(score)
  const nTotal = Number(total)
  return Number.isFinite(nScore) && Number.isFinite(nTotal) && nTotal > 0 ? (nScore / nTotal) * 100 : null
}

function numericGrade(grade: unknown) {
  const value = Number(grade)
  return grade !== undefined && grade !== null && grade !== "" && Number.isFinite(value) ? value : null
}

async function getTeacherCourseIds(teacherId: string) {
  const courses = await Course.find({ teacherId }, "_id").lean()
  return courses.map((course: any) => course._id.toString())
}

function result(score: unknown, total: unknown) {
  const percentage = percent(score, total)
  if (percentage === null) return "Pending"
  return percentage >= 50 ? "Pass" : "Fail"
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !["ADMIN", "TEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const courseId = searchParams.get("courseId")
    const userId = searchParams.get("userId")
    const type = searchParams.get("type")

    if (courseId && !Types.ObjectId.isValid(courseId)) {
      return NextResponse.json({ error: "Invalid courseId" }, { status: 400 })
    }
    if (userId && !Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid userId" }, { status: 400 })
    }
    if (type && !["QUIZ", "ASSIGNMENT"].includes(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 })
    }

    await connectDB()

    const query: any = {}
    if (courseId) query.courseId = courseId
    if (userId) query.userId = userId

    if (session.user.role === "TEACHER") {
      const teacherCourseIds = await getTeacherCourseIds(session.user.id)
      if (courseId && !teacherCourseIds.includes(courseId)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
      query.courseId = courseId || { $in: teacherCourseIds }
    }

    const submissions = await Submission.find(query)
      .populate("userId", "name email registrationNumber classLevel program semester")
      .populate("courseId", "title classLevel program semester")
      .populate("lessonId", "title type")
      .sort({ submittedAt: -1 })
      .lean()

    const rows = submissions
      .filter((submission: any) => {
        const lessonType = submission.lessonId?.type
        return type ? lessonType === type : ["QUIZ", "ASSIGNMENT"].includes(lessonType)
      })
      .map((submission: any) => ({
        date: submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : "",
        studentId: submission.userId?._id?.toString?.() || submission.userId?._id,
        student: submission.userId?.name,
        registrationNumber: submission.userId?.registrationNumber,
        email: submission.userId?.email,
        classLevel: submission.userId?.classLevel || submission.courseId?.classLevel,
        program: submission.userId?.program || submission.courseId?.program,
        semester: submission.userId?.semester || submission.courseId?.semester,
        course: submission.courseId?.title,
        lesson: submission.lessonId?.title,
        type: submission.lessonId?.type,
        obtainedMarks: submission.lessonId?.type === "ASSIGNMENT" ? (numericGrade(submission.grade) ?? "") : (submission.score ?? ""),
        totalMarks: submission.lessonId?.type === "ASSIGNMENT" ? (numericGrade(submission.grade) !== null ? 100 : "") : (submission.totalQuestions ?? ""),
      }))
      .map((row: any) => ({
        ...row,
        result: result(row.obtainedMarks, row.totalMarks),
      }))

    const quizRows = rows.filter(row => row.type === "QUIZ")
    const assignmentRows = rows.filter(row => row.type === "ASSIGNMENT")
    const scoredRows = rows.filter(row => row.obtainedMarks !== "" && row.totalMarks !== "")
    const scoreTotal = scoredRows.reduce((sum, row) => sum + Number(row.obtainedMarks || 0), 0)
    const maxTotal = scoredRows.reduce((sum, row) => sum + Number(row.totalMarks || 0), 0)
    const passCount = rows.filter(row => row.result === "Pass").length
    const failCount = rows.filter(row => row.result === "Fail").length
    const summaryRows = [
      ["Total Records", rows.length],
      ["Total Quizzes", quizRows.length],
      ["Total Assignments", assignmentRows.length],
      ["Total Marks", maxTotal],
      ["Obtained Marks", scoreTotal],
      ["Pass / Fail", `${passCount} / ${failCount}`],
    ]

    const headers = ["Submitted At", "Student", "Registration #", "Email", "Class", "Program", "Semester", "Course", "Assessment", "Type", "Total Marks", "Obtained Marks", "Result"]
    const detailRows = rows.map(row => (
      "<tr><td>" + escapeCell(row.date) + "</td><td>" + escapeCell(row.student) + "</td><td>" + escapeCell(row.registrationNumber) + "</td><td>" + escapeCell(row.email) + "</td><td>" + escapeCell(row.classLevel) + "</td><td>" + escapeCell(row.program) + "</td><td>" + escapeCell(row.semester) + "</td><td>" + escapeCell(row.course) + "</td><td>" + escapeCell(row.lesson) + "</td><td>" + escapeCell(row.type) + "</td><td>" + escapeCell(row.totalMarks) + "</td><td>" + escapeCell(row.obtainedMarks) + "</td><td>" + escapeCell(row.result) + "</td></tr>"
    )).join("")
    const summaryHtml = summaryRows.map(row => `<tr><td>${escapeCell(row[0])}</td><td>${escapeCell(row[1])}</td><td colspan="11"></td></tr>`).join("")
    const html = `\uFEFF<!doctype html><html><head><meta charset="utf-8" /></head><body><table><thead><tr>${headers.map(header => `<th>${escapeCell(header)}</th>`).join("")}</tr></thead><tbody>${detailRows}<tr><td colspan="13"></td></tr><tr><th colspan="2">Summary</th><th colspan="11"></th></tr>${summaryHtml}</tbody></table></body></html>`

    return new NextResponse(html, {
      headers: {
        "Content-Type": "application/vnd.ms-excel; charset=utf-8",
        "Content-Disposition": `attachment; filename="marksheet-${new Date().toISOString().slice(0, 10)}.xls"`,
        "Cache-Control": "no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch (error) {
    console.error("Marks export error:", error)
    return NextResponse.json({ error: "Failed to export marks" }, { status: 500 })
  }
}
