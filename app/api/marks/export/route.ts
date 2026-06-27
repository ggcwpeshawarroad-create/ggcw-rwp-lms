import { NextResponse } from "next/server"
import { Types } from "mongoose"
import { getServerSession } from "next-auth"
import connectDB from "@/lib/db"
import { authOptions } from "@/lib/auth"
import Course from "@/models/Course"
import Submission from "@/models/Submission"

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
  return Number.isFinite(nScore) && Number.isFinite(nTotal) && nTotal > 0
    ? ((nScore / nTotal) * 100).toFixed(1) + "%"
    : ""
}

function numericGrade(grade: unknown) {
  const value = Number(grade)
  return grade !== undefined && grade !== null && grade !== "" && Number.isFinite(value) ? value : null
}

async function getTeacherCourseIds(teacherId: string) {
  const courses = await Course.find({ teacherId }, "_id").lean()
  return courses.map((course: any) => course._id.toString())
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
        score: submission.lessonId?.type === "ASSIGNMENT" ? (numericGrade(submission.grade) ?? "") : (submission.score ?? ""),
        total: submission.lessonId?.type === "ASSIGNMENT" ? (numericGrade(submission.grade) !== null ? 100 : "") : (submission.totalQuestions ?? ""),
        percentage: submission.lessonId?.type === "ASSIGNMENT" ? percent(numericGrade(submission.grade), numericGrade(submission.grade) !== null ? 100 : "") : percent(submission.score, submission.totalQuestions),
        grade: submission.grade || "",
        feedback: submission.feedback || "",
      }))

    const quizRows = rows.filter(row => row.type === "QUIZ")
    const assignmentRows = rows.filter(row => row.type === "ASSIGNMENT")
    const scoredRows = rows.filter(row => row.score !== "" && row.total !== "")
    const scoreTotal = scoredRows.reduce((sum, row) => sum + Number(row.score || 0), 0)
    const maxTotal = scoredRows.reduce((sum, row) => sum + Number(row.total || 0), 0)
    const summaryRows = [
      ["Total Records", rows.length],
      ["Total Quizzes", quizRows.length],
      ["Total Assignments", assignmentRows.length],
      ["Total Marks", scoreTotal],
      ["Total Possible Marks", maxTotal],
      ["Average Percentage", maxTotal ? ((scoreTotal / maxTotal) * 100).toFixed(1) + "%" : "0%"],
    ]

    const getStudentSummary = (studentId: string) => {
      const studentRows = rows.filter((row: any) => row.studentId === studentId)
      const studentQuizRows = studentRows.filter((row: any) => row.type === "QUIZ")
      const studentAssignmentRows = studentRows.filter((row: any) => row.type === "ASSIGNMENT")
      const scoredRows = studentRows.filter((row: any) => row.score !== "" && row.total !== "")
      const totalMarks = scoredRows.reduce((sum: number, row: any) => sum + Number(row.score || 0), 0)
      const possibleMarks = scoredRows.reduce((sum: number, row: any) => sum + Number(row.total || 0), 0)
      const gradedAssignments = studentAssignmentRows.filter((row: any) => row.grade).length
      return {
        totalRecords: studentRows.length,
        totalQuizzes: studentQuizRows.length,
        totalAssignments: studentAssignmentRows.length,
        totalMarks,
        possibleMarks,
        average: possibleMarks ? ((totalMarks / possibleMarks) * 100).toFixed(1) + "%" : "",
        gradedAssignments,
      }
    }

    const headers = ["Submitted At", "Student", "Registration #", "Email", "Class", "Program", "Semester", "Course", "Assessment", "Type", "Score", "Total", "Percentage", "Grade", "Feedback", "Student Total", "Student Quizzes", "Student Assignments", "Student Marks", "Student Possible", "Student Average", "Student Graded Assignments"]
    const detailRows = rows.map(row => {
      const studentSummary = getStudentSummary(row.studentId)
      return "<tr><td>" + escapeCell(row.date) + "</td><td>" + escapeCell(row.student) + "</td><td>" + escapeCell(row.registrationNumber) + "</td><td>" + escapeCell(row.email) + "</td><td>" + escapeCell(row.classLevel) + "</td><td>" + escapeCell(row.program) + "</td><td>" + escapeCell(row.semester) + "</td><td>" + escapeCell(row.course) + "</td><td>" + escapeCell(row.lesson) + "</td><td>" + escapeCell(row.type) + "</td><td>" + escapeCell(row.score) + "</td><td>" + escapeCell(row.total) + "</td><td>" + escapeCell(row.percentage) + "</td><td>" + escapeCell(row.grade) + "</td><td>" + escapeCell(row.feedback) + "</td><td>" + escapeCell(studentSummary.totalRecords) + "</td><td>" + escapeCell(studentSummary.totalQuizzes) + "</td><td>" + escapeCell(studentSummary.totalAssignments) + "</td><td>" + escapeCell(studentSummary.totalMarks) + "</td><td>" + escapeCell(studentSummary.possibleMarks) + "</td><td>" + escapeCell(studentSummary.average) + "</td><td>" + escapeCell(studentSummary.gradedAssignments) + "</td></tr>"
    }).join("")
    const summaryHtml = summaryRows.map(row => `<tr><td>${escapeCell(row[0])}</td><td>${escapeCell(row[1])}</td><td colspan="20"></td></tr>`).join("")
    const html = `<!doctype html><html><head><meta charset="utf-8" /></head><body><table><thead><tr>${headers.map(header => `<th>${escapeCell(header)}</th>`).join("")}</tr></thead><tbody>${detailRows}<tr><td colspan="22"></td></tr><tr><th colspan="2">Summary</th><th colspan="20"></th></tr>${summaryHtml}</tbody></table></body></html>`

    return new NextResponse(html, {
      headers: {
        "Content-Type": "application/vnd.ms-excel; charset=utf-8",
        "Content-Disposition": `attachment; filename="marksheet-${new Date().toISOString().slice(0, 10)}.xls"`,
      },
    })
  } catch (error) {
    console.error("Marks export error:", error)
    return NextResponse.json({ error: "Failed to export marks" }, { status: 500 })
  }
}
