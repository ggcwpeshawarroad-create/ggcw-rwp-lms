import { NextResponse } from "next/server"
import { Types } from "mongoose"
import { getServerSession } from "next-auth"
import connectDB from "@/lib/db"
import { authOptions } from "@/lib/auth"
import Attendance from "@/models/Attendance"
import Course from "@/models/Course"

function escapeCell(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !["ADMIN", "TEACHER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const courseId = searchParams.get("courseId")
    const date = searchParams.get("date")

    if (courseId && !Types.ObjectId.isValid(courseId)) {
      return NextResponse.json({ error: "Invalid courseId" }, { status: 400 })
    }

    await connectDB()

    const query: any = {}
    if (courseId) query.courseId = courseId
    if (date) query.date = date

    if (session.user.role === "TEACHER") {
      const teacherCourses = await Course.find({ teacherId: session.user.id }, "_id").lean()
      const teacherCourseIds = teacherCourses.map((course: any) => course._id.toString())

      if (courseId && !teacherCourseIds.includes(courseId)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      query.courseId = { $in: teacherCourseIds }
    }

    const attendance = await Attendance.find(query)
      .populate("courseId", "title classLevel program semester")
      .populate("teacherId", "name email")
      .populate("records.studentId", "name email registrationNumber classLevel program semester")
      .sort({ date: -1, createdAt: -1 })
      .lean()

    const rows = attendance.flatMap((sheet: any) =>
      sheet.records.map((record: any) => ({
        date: sheet.date,
        course: sheet.courseId?.title,
        classLevel: sheet.courseId?.classLevel,
        program: sheet.courseId?.program,
        semester: sheet.courseId?.semester,
        teacher: sheet.teacherId?.name,
        studentId: record.studentId?._id?.toString?.() || record.studentId?._id,
        student: record.studentId?.name,
        registrationNumber: record.studentId?.registrationNumber,
        email: record.studentId?.email,
        status: record.status,
        note: record.note,
      }))
    )

    const statusLabels = ["PRESENT", "ABSENT", "LATE", "EXCUSED", "LEAVE"]
    const statusCounts = statusLabels.reduce((acc: Record<string, number>, status) => {
      acc[status] = rows.filter(row => row.status === status).length
      return acc
    }, {})
    const percent = (count: number) => rows.length ? ((count / rows.length) * 100).toFixed(1) + "%" : "0%"
    const summaryRows = [
      ["Total Classes", attendance.length],
      ["Total Records", rows.length],
      ...statusLabels.map(status => ["Total " + status.charAt(0) + status.slice(1).toLowerCase(), statusCounts[status]]),
      ...statusLabels.map(status => [status.charAt(0) + status.slice(1).toLowerCase() + " Percentage", percent(statusCounts[status])]),
    ]

    const getStudentSummary = (studentId: string) => {
      const studentRows = rows.filter((row: any) => row.studentId === studentId)
      const total = studentRows.length
      const present = studentRows.filter((row: any) => row.status === "PRESENT").length
      const absent = studentRows.filter((row: any) => row.status === "ABSENT").length
      const late = studentRows.filter((row: any) => row.status === "LATE").length
      const excused = studentRows.filter((row: any) => row.status === "EXCUSED").length
      const leave = studentRows.filter((row: any) => row.status === "LEAVE").length
      return { total, present, absent, late, excused, leave }
    }
    const studentPercent = (count: number, total: number) => total ? ((count / total) * 100).toFixed(1) + "%" : "0%"

    const headers = ["Date", "Course", "Class", "Program", "Semester", "Teacher", "Student", "Registration #", "Email", "Status", "Note", "Student Total", "Student Present", "Student Absent", "Student Late", "Student Excused", "Student Leave", "Student Present %", "Student Absent %", "Student Leave %"]
    const detailRows = rows.map(row => {
      const studentSummary = getStudentSummary(row.studentId)
      return "<tr><td>" + escapeCell(row.date) + "</td><td>" + escapeCell(row.course) + "</td><td>" + escapeCell(row.classLevel) + "</td><td>" + escapeCell(row.program) + "</td><td>" + escapeCell(row.semester) + "</td><td>" + escapeCell(row.teacher) + "</td><td>" + escapeCell(row.student) + "</td><td>" + escapeCell(row.registrationNumber) + "</td><td>" + escapeCell(row.email) + "</td><td>" + escapeCell(row.status) + "</td><td>" + escapeCell(row.note) + "</td><td>" + escapeCell(studentSummary.total) + "</td><td>" + escapeCell(studentSummary.present) + "</td><td>" + escapeCell(studentSummary.absent) + "</td><td>" + escapeCell(studentSummary.late) + "</td><td>" + escapeCell(studentSummary.excused) + "</td><td>" + escapeCell(studentSummary.leave) + "</td><td>" + escapeCell(studentPercent(studentSummary.present, studentSummary.total)) + "</td><td>" + escapeCell(studentPercent(studentSummary.absent, studentSummary.total)) + "</td><td>" + escapeCell(studentPercent(studentSummary.leave, studentSummary.total)) + "</td></tr>"
    }).join("")
    const summaryHtml = summaryRows.map(row => `<tr><td>${escapeCell(row[0])}</td><td>${escapeCell(row[1])}</td><td colspan="18"></td></tr>`).join("")
    const html = `<!doctype html><html><head><meta charset="utf-8" /></head><body><table><thead><tr>${headers.map(header => `<th>${escapeCell(header)}</th>`).join("")}</tr></thead><tbody>${detailRows}<tr><td colspan="20"></td></tr><tr><th colspan="2">Summary</th><th colspan="18"></th></tr>${summaryHtml}</tbody></table></body></html>`

    return new NextResponse(html, {
      headers: {
        "Content-Type": "application/vnd.ms-excel; charset=utf-8",
        "Content-Disposition": `attachment; filename="attendance-${new Date().toISOString().slice(0, 10)}.xls"`,
      },
    })
  } catch (error) {
    console.error("Attendance export error:", error)
    return NextResponse.json({ error: "Failed to export attendance" }, { status: 500 })
  }
}
