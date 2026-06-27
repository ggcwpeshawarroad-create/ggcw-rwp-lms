"use client"

import { useEffect, useMemo, useState } from "react"
import { BookOpen, ClipboardList, Download, FileCheck2, Loader2, Search } from "lucide-react"
import { formatText } from "@/lib/utils"

function calcPercentage(score: unknown, total: unknown) {
  const nScore = Number(score)
  const nTotal = Number(total)
  return Number.isFinite(nScore) && Number.isFinite(nTotal) && nTotal > 0
    ? Math.round((nScore / nTotal) * 100) + "%"
    : "-"
}

function numericGrade(grade: unknown) {
  const value = Number(grade)
  return grade !== undefined && grade !== null && grade !== "" && Number.isFinite(value) ? value : null
}

function displayMarks(mark: any) {
  if (mark.lessonId?.type === "QUIZ") {
    return String(mark.score || 0) + "/" + String(mark.totalQuestions || 0) + " (" + calcPercentage(mark.score, mark.totalQuestions) + ")"
  }
  const gradeValue = numericGrade(mark.grade)
  return gradeValue !== null ? String(gradeValue) : "Submitted"
}

export default function TeacherMarksPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [marks, setMarks] = useState<any[]>([])
  const [courseId, setCourseId] = useState("")
  const [studentId, setStudentId] = useState("")
  const [type, setType] = useState("")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    fetchMarks()
  }, [courseId, studentId, type])

  const fetchCourses = async () => {
    try {
      const res = await fetch("/api/courses")
      const data = await res.json()
      if (res.ok) setCourses(data)
    } catch (err) {
      console.error("Failed to fetch courses")
    }
  }

  const fetchMarks = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (courseId) params.set("courseId", courseId)
      if (studentId) params.set("userId", studentId)
      if (type) params.set("type", type)
      const res = await fetch(`/api/marks?${params.toString()}`)
      const data = await res.json()
      if (res.ok) setMarks(data)
    } catch (err) {
      console.error("Failed to fetch marks")
    } finally {
      setLoading(false)
    }
  }

  const students = useMemo(() => {
    const byId = new Map<string, any>()
    marks.forEach(mark => {
      if (mark.userId?._id) byId.set(mark.userId._id, mark.userId)
    })
    return Array.from(byId.values()).sort((a, b) => (a.name || "").localeCompare(b.name || ""))
  }, [marks])

  const filteredMarks = marks.filter(mark => {
    const q = search.toLowerCase()
    return (
      mark.userId?.name?.toLowerCase().includes(q) ||
      mark.userId?.registrationNumber?.toLowerCase().includes(q) ||
      mark.courseId?.title?.toLowerCase().includes(q) ||
      mark.lessonId?.title?.toLowerCase().includes(q)
    )
  })

  const quizMarks = filteredMarks.filter(mark => mark.lessonId?.type === "QUIZ")
  const assignmentMarks = filteredMarks.filter(mark => mark.lessonId?.type === "ASSIGNMENT")
  const assignmentScore = assignmentMarks.reduce((sum, mark) => sum + (numericGrade(mark.grade) ?? 0), 0)
  const assignmentTotal = assignmentMarks.reduce((sum, mark) => sum + (numericGrade(mark.grade) !== null ? 100 : 0), 0)
  const quizScore = quizMarks.reduce((sum, mark) => sum + Number(mark.score || 0), 0)
  const quizTotal = quizMarks.reduce((sum, mark) => sum + Number(mark.totalQuestions || 0), 0)
  const totalScore = quizScore + assignmentScore
  const totalPossible = quizTotal + assignmentTotal

  const getStudentSummary = (studentId: string) => {
    const studentMarks = filteredMarks.filter((mark: any) => mark.userId?._id === studentId)
    const studentQuizMarks = studentMarks.filter((mark: any) => mark.lessonId?.type === "QUIZ")
    const studentAssignments = studentMarks.filter((mark: any) => mark.lessonId?.type === "ASSIGNMENT")
    const assignmentMarks = studentAssignments.reduce((sum: number, mark: any) => sum + (numericGrade(mark.grade) ?? 0), 0)
    const assignmentPossible = studentAssignments.reduce((sum: number, mark: any) => sum + (numericGrade(mark.grade) !== null ? 100 : 0), 0)
    const totalMarks = studentQuizMarks.reduce((sum: number, mark: any) => sum + Number(mark.score || 0), 0) + assignmentMarks
    const possibleMarks = studentQuizMarks.reduce((sum: number, mark: any) => sum + Number(mark.totalQuestions || 0), 0) + assignmentPossible
    const gradedAssignments = studentAssignments.filter((mark: any) => mark.grade).length
    return {
      totalRecords: studentMarks.length,
      totalQuizzes: studentQuizMarks.length,
      totalAssignments: studentAssignments.length,
      totalMarks,
      possibleMarks,
      average: possibleMarks ? Math.round((totalMarks / possibleMarks) * 100) + "%" : "-",
      gradedAssignments,
    }
  }

  const downloadUrl = () => {
    const params = new URLSearchParams()
    if (courseId) params.set("courseId", courseId)
    if (studentId) params.set("userId", studentId)
    if (type) params.set("type", type)
    return `/api/marks/export?${params.toString()}`
  }

  return (
    <div className="glass-card animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap", marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ background: "var(--primary)", padding: "0.75rem", borderRadius: "1rem", color: "white" }}><FileCheck2 size={24} /></div>
          <div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Marks Sheet</h2>
            <p style={{ fontSize: "0.875rem", opacity: 0.6 }}>Quiz and assignment marks for your courses</p>
          </div>
        </div>
        <a href={downloadUrl()} className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
          <Download size={18} /> Download Excel
        </a>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontWeight: 700, color: "#334155" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}><BookOpen size={16} /> Course</span>
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)} style={{ padding: "0.75rem", borderRadius: "0.75rem", border: "1px solid var(--glass-border)", background: "white", outline: "none" }}>
            <option value="">All courses</option>
            {courses.map(course => <option key={course._id} value={course._id}>{formatText(course.title)}</option>)}
          </select>
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontWeight: 700, color: "#334155" }}>
          <span style={{ fontSize: "0.875rem" }}>Student</span>
          <select value={studentId} onChange={(e) => setStudentId(e.target.value)} style={{ padding: "0.75rem", borderRadius: "0.75rem", border: "1px solid var(--glass-border)", background: "white", outline: "none" }}>
            <option value="">All students</option>
            {students.map(student => <option key={student._id} value={student._id}>{formatText(student.name || "Student")}</option>)}
          </select>
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontWeight: 700, color: "#334155" }}>
          <span style={{ fontSize: "0.875rem" }}>Type</span>
          <select value={type} onChange={(e) => setType(e.target.value)} style={{ padding: "0.75rem", borderRadius: "0.75rem", border: "1px solid var(--glass-border)", background: "white", outline: "none" }}>
            <option value="">Quiz & Assignment</option>
            <option value="QUIZ">Quiz only</option>
            <option value="ASSIGNMENT">Assignment only</option>
          </select>
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontWeight: 700, color: "#334155" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}><Search size={16} /> Search</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Student, course, assessment..." style={{ padding: "0.75rem", borderRadius: "0.75rem", border: "1px solid var(--glass-border)", background: "white", outline: "none" }} />
        </label>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(135px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {[
          ["Total Records", filteredMarks.length],
          ["Quizzes", quizMarks.length],
          ["Assignments", assignmentMarks.length],
          ["Total Marks", totalScore],
          ["Possible", totalPossible],
          ["Average", totalPossible ? Math.round((totalScore / totalPossible) * 100) + "%" : "0%"],
        ].map(([label, value]) => (
          <div key={label} style={{ padding: "0.85rem", borderRadius: "0.75rem", background: "white", border: "1px solid var(--glass-border)" }}>
            <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>{label}</div>
            <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#1e293b" }}>{value}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}><Loader2 className="animate-spin" size={42} color="var(--primary)" /></div>
      ) : filteredMarks.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "#94a3b8" }}><ClipboardList size={48} style={{ marginBottom: "1rem" }} />No marks found.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 0.5rem", textAlign: "left" }}>
            <thead>
              <tr style={{ color: "#64748b", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                <th style={{ padding: "0.75rem 1rem" }}>Student</th>
                <th style={{ padding: "0.75rem 1rem" }}>Course</th>
                <th style={{ padding: "0.75rem 1rem" }}>Assessment</th>
                <th style={{ padding: "0.75rem 1rem" }}>Type</th>
                <th style={{ padding: "0.75rem 1rem" }}>Marks</th>
                <th style={{ padding: "0.75rem 1rem" }}>Grade</th>
                <th style={{ padding: "0.75rem 1rem" }}>Feedback</th>
                <th style={{ padding: "0.75rem 1rem" }}>Total</th>
                <th style={{ padding: "0.75rem 1rem" }}>Quizzes</th>
                <th style={{ padding: "0.75rem 1rem" }}>Assignments</th>
                <th style={{ padding: "0.75rem 1rem" }}>Total Marks</th>
                <th style={{ padding: "0.75rem 1rem" }}>Possible</th>
                <th style={{ padding: "0.75rem 1rem" }}>Average</th>
                <th style={{ padding: "0.75rem 1rem" }}>Graded Assignments</th>
                <th style={{ padding: "0.75rem 1rem" }}>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {filteredMarks.map((mark: any) => {
                const studentSummary = getStudentSummary(mark.userId?._id)
                return (
                  <tr key={mark._id} style={{ background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                    <td style={{ padding: "1rem" }}>
                      <div style={{ fontWeight: 700, color: "#1e293b" }}>{formatText(mark.userId?.name || "Student")}</div>
                      <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{mark.userId?.registrationNumber || mark.userId?.email || "-"}</div>
                    </td>
                    <td style={{ padding: "1rem", fontWeight: 700 }}>{formatText(mark.courseId?.title || "Course")}</td>
                    <td style={{ padding: "1rem" }}>{formatText(mark.lessonId?.title || "Assessment")}</td>
                    <td style={{ padding: "1rem", fontWeight: 800 }}>{mark.lessonId?.type}</td>
                    <td style={{ padding: "1rem", fontWeight: 800 }}>{displayMarks(mark)}</td>
                    <td style={{ padding: "1rem" }}>{mark.grade || "-"}</td>
                    <td style={{ padding: "1rem", color: "#64748b", minWidth: "180px" }}>{mark.feedback || "-"}</td>
                    <td style={{ padding: "1rem", fontWeight: 800 }}>{studentSummary.totalRecords}</td>
                    <td style={{ padding: "1rem", fontWeight: 800 }}>{studentSummary.totalQuizzes}</td>
                    <td style={{ padding: "1rem", fontWeight: 800 }}>{studentSummary.totalAssignments}</td>
                    <td style={{ padding: "1rem", fontWeight: 800, color: "#059669" }}>{studentSummary.totalMarks}</td>
                    <td style={{ padding: "1rem", fontWeight: 800 }}>{studentSummary.possibleMarks}</td>
                    <td style={{ padding: "1rem", fontWeight: 800 }}>{studentSummary.average}</td>
                    <td style={{ padding: "1rem", fontWeight: 800 }}>{studentSummary.gradedAssignments}</td>
                    <td style={{ padding: "1rem", color: "#64748b" }}>{mark.submittedAt ? new Date(mark.submittedAt).toLocaleString() : "-"}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
