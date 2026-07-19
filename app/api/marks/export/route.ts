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

    const filteredSubmissions = submissions.filter((submission: any) => {
      const lessonType = submission.lessonId?.type
      return type ? lessonType === type : ["QUIZ", "ASSIGNMENT"].includes(lessonType)
    })

    const courseIds = [...new Set(filteredSubmissions.map((sub: any) => sub.courseId?._id?.toString()).filter(Boolean))]

    const lessonQuery: any = {
      courseId: { $in: courseIds },
      type: { $in: ["QUIZ", "ASSIGNMENT"] }
    }
    if (type) {
      lessonQuery.type = type
    }
    const lessonsFromDb = await Lesson.find(lessonQuery)
      .sort({ courseId: 1, order: 1, createdAt: 1 })
      .lean()

    const uniqueLessonsMap = new Map()
    lessonsFromDb.forEach((lesson: any) => {
      uniqueLessonsMap.set(lesson._id.toString(), {
        _id: lesson._id.toString(),
        title: lesson.title,
        type: lesson.type,
        courseId: lesson.courseId.toString()
      })
    })

    filteredSubmissions.forEach((sub: any) => {
      if (sub.lessonId?._id) {
        const id = sub.lessonId._id.toString()
        if (!uniqueLessonsMap.has(id)) {
          uniqueLessonsMap.set(id, {
            _id: id,
            title: sub.lessonId.title,
            type: sub.lessonId.type,
            courseId: sub.courseId?._id?.toString()
          })
        }
      }
    })

    const lessonsList = Array.from(uniqueLessonsMap.values())

    const studentCourseGroups = new Map()
    filteredSubmissions.forEach((sub: any) => {
      const studentId = sub.userId?._id?.toString() || sub.userId?.toString()
      const cId = sub.courseId?._id?.toString() || sub.courseId?.toString()
      if (!studentId || !cId) return

      const key = `${studentId}-${cId}`
      if (!studentCourseGroups.has(key)) {
        studentCourseGroups.set(key, {
          studentId,
          courseId: cId,
          student: sub.userId?.name || "",
          registrationNumber: sub.userId?.registrationNumber || "",
          email: sub.userId?.email || "",
          classLevel: sub.userId?.classLevel || sub.courseId?.classLevel || "",
          program: sub.userId?.program || sub.courseId?.program || "",
          semester: sub.userId?.semester || sub.courseId?.semester || "",
          course: sub.courseId?.title || "",
          submissions: []
        })
      }
      studentCourseGroups.get(key).submissions.push(sub)
    })

    const rows = Array.from(studentCourseGroups.values()).map((group: any) => {
      const lessonMarks: any = {}
      let totalObtained = 0
      let totalMax = 0
      let hasScoredSubmissions = false

      const subMap = new Map()
      group.submissions.forEach((sub: any) => {
        if (sub.lessonId?._id) {
          subMap.set(sub.lessonId._id.toString(), sub)
        }
      })

      lessonsList.forEach((lesson: any) => {
        if (lesson.courseId !== group.courseId) {
          lessonMarks[`${lesson._id}-obtained`] = ""
          lessonMarks[`${lesson._id}-total`] = ""
          return
        }

        const sub = subMap.get(lesson._id)
        if (sub) {
          const obtained = lesson.type === "ASSIGNMENT" ? numericGrade(sub.grade) : sub.score
          const total = lesson.type === "ASSIGNMENT" ? (numericGrade(sub.grade) !== null ? 100 : null) : sub.totalQuestions

          const obtainedVal = obtained !== undefined && obtained !== null && obtained !== "" ? Number(obtained) : null
          const totalVal = total !== undefined && total !== null && total !== "" ? Number(total) : null

          lessonMarks[`${lesson._id}-obtained`] = obtainedVal !== null ? obtainedVal : ""
          lessonMarks[`${lesson._id}-total`] = totalVal !== null ? totalVal : ""

          if (obtainedVal !== null && totalVal !== null) {
            totalObtained += obtainedVal
            totalMax += totalVal
            hasScoredSubmissions = true
          }
        } else {
          lessonMarks[`${lesson._id}-obtained`] = ""
          lessonMarks[`${lesson._id}-total`] = ""
        }
      })

      const pct = hasScoredSubmissions && totalMax > 0 ? (totalObtained / totalMax) * 100 : null
      const res = pct !== null ? (pct >= 50 ? "Pass" : "Fail") : "Pending"

      return {
        student: group.student,
        registrationNumber: group.registrationNumber,
        email: group.email,
        classLevel: group.classLevel,
        program: group.program,
        semester: group.semester,
        course: group.course,
        lessonMarks,
        totalObtained: hasScoredSubmissions ? totalObtained : "",
        totalMax: hasScoredSubmissions ? totalMax : "",
        percentage: pct !== null ? pct.toFixed(1) + "%" : "",
        result: res
      }
    })

    const headers = [
      "Student",
      "Registration #",
      "Email",
      "Class",
      "Program",
      "Semester",
      "Course"
    ]

    lessonsList.forEach((lesson: any) => {
      headers.push(`${lesson.title} (Obtained)`)
      headers.push(`${lesson.title} (Total)`)
    })

    headers.push("Total Obtained", "Total Max Marks", "Percentage", "Result")

    const detailRows = rows.map((row: any) => {
      let cells = "<tr>"
      cells += "<td>" + escapeCell(row.student) + "</td>"
      cells += "<td>" + escapeCell(row.registrationNumber) + "</td>"
      cells += "<td>" + escapeCell(row.email) + "</td>"
      cells += "<td>" + escapeCell(row.classLevel) + "</td>"
      cells += "<td>" + escapeCell(row.program) + "</td>"
      cells += "<td>" + escapeCell(row.semester) + "</td>"
      cells += "<td>" + escapeCell(row.course) + "</td>"

      lessonsList.forEach((lesson: any) => {
        cells += "<td>" + escapeCell(row.lessonMarks[`${lesson._id}-obtained`]) + "</td>"
        cells += "<td>" + escapeCell(row.lessonMarks[`${lesson._id}-total`]) + "</td>"
      })

      cells += "<td>" + escapeCell(row.totalObtained) + "</td>"
      cells += "<td>" + escapeCell(row.totalMax) + "</td>"
      cells += "<td>" + escapeCell(row.percentage) + "</td>"
      cells += "<td>" + escapeCell(row.result) + "</td>"
      cells += "</tr>"
      return cells
    }).join("")

    const totalStudents = rows.length
    const totalPassed = rows.filter((r: any) => r.result === "Pass").length
    const totalFailed = rows.filter((r: any) => r.result === "Fail").length
    const totalPending = rows.filter((r: any) => r.result === "Pending").length

    const summaryRows = [
      ["Total Students", totalStudents],
      ["Passed", totalPassed],
      ["Failed", totalFailed],
      ["Pending", totalPending]
    ]

    const totalCols = headers.length
    const summaryHtml = summaryRows.map(row => `<tr><td>${escapeCell(row[0])}</td><td>${escapeCell(row[1])}</td><td colspan="${totalCols - 2}"></td></tr>`).join("")

    const html = `\uFEFF<!doctype html><html><head><meta charset="utf-8" /></head><body><table><thead><tr>${headers.map(header => `<th>${escapeCell(header)}</th>`).join("")}</tr></thead><tbody>${detailRows}<tr><td colspan="${totalCols}"></td></tr><tr><th colspan="2">Summary</th><th colspan="${totalCols - 2}"></th></tr>${summaryHtml}</tbody></table></body></html>`

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
