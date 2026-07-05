"use client"

import { useEffect, useMemo, useState } from "react"
import { BookOpen, ClipboardList, Download, FileCheck2, Loader2, Search } from "lucide-react"
import { Toast, ToastType } from "@/components/ui/Toast"
import { formatText } from "@/lib/utils"

function calcPercentage(score: unknown, total: unknown) {
  const nScore = Number(score)
  const nTotal = Number(total)
  return Number.isFinite(nScore) && Number.isFinite(nTotal) && nTotal > 0
    ? Math.round((nScore / nTotal) * 100)
    : null
}

function numericGrade(grade: unknown) {
  const value = Number(grade)
  return grade !== undefined && grade !== null && grade !== "" && Number.isFinite(value) ? value : null
}

function displayMarks(mark: any) {
  return getObtainedMarks(mark)
}

function getObtainedMarks(mark: any) {
  if (mark.lessonId?.type === "QUIZ") return Number(mark.score || 0)
  const gradeValue = numericGrade(mark.grade)
  return gradeValue !== null ? gradeValue : null
}

function getTotalMarks(mark: any) {
  if (mark.lessonId?.type === "QUIZ") return Number(mark.totalQuestions || 0)
  return numericGrade(mark.grade) !== null ? 100 : null
}

function getResult(mark: any) {
  const obtained = getObtainedMarks(mark)
  const total = getTotalMarks(mark)
  const percentage = calcPercentage(obtained, total)
  if (percentage === null) return "Pending"
  return percentage >= 50 ? "Pass" : "Fail"
}

export default function TeacherMarksPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [marks, setMarks] = useState<any[]>([])
  const [courseId, setCourseId] = useState("")
  const [studentId, setStudentId] = useState("")
  const [type, setType] = useState("")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

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
  const obtainedMarks = filteredMarks.reduce((sum, mark) => sum + (getObtainedMarks(mark) ?? 0), 0)
  const totalMarks = filteredMarks.reduce((sum, mark) => sum + (getTotalMarks(mark) ?? 0), 0)
  const passCount = filteredMarks.filter(mark => getResult(mark) === "Pass").length
  const failCount = filteredMarks.filter(mark => getResult(mark) === "Fail").length

  const downloadUrl = () => {
    const params = new URLSearchParams()
    if (courseId) params.set("courseId", courseId)
    if (studentId) params.set("userId", studentId)
    if (type) params.set("type", type)
    return `/api/marks/export?${params.toString()}`
  }

  const downloadExcel = async () => {
    setDownloading(true)
    try {
      const res = await fetch(downloadUrl(), { cache: "no-store" })
      if (!res.ok) {
        let message = "Failed to download marksheet"
        try {
          const data = await res.json()
          if (data?.error) message = data.error
        } catch {
          // Keep the default message when the server returns a non-JSON error page.
        }
        throw new Error(message)
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `marksheet-${new Date().toISOString().slice(0, 10)}.xls`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      setToast({ message: "Marksheet downloaded", type: "success" })
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : "Failed to download marksheet", type: "error" })
    } finally {
      setDownloading(false)
    }
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
        <button onClick={downloadExcel} disabled={downloading} className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {downloading ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
          {downloading ? "Downloading..." : "Download Excel"}
        </button>
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
          ["Total Marks", totalMarks],
          ["Obtained Marks", obtainedMarks],
          ["Pass / Fail", `${passCount} / ${failCount}`],
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
                <th style={{ padding: "0.75rem 1rem" }}>Total Marks</th>
                <th style={{ padding: "0.75rem 1rem" }}>Obtained Marks</th>
                <th style={{ padding: "0.75rem 1rem" }}>Result</th>
                <th style={{ padding: "0.75rem 1rem" }}>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {filteredMarks.map((mark: any) => (
                <tr key={mark._id} style={{ background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                  <td style={{ padding: "1rem" }}>
                    <div style={{ fontWeight: 700, color: "#1e293b" }}>{formatText(mark.userId?.name || "Student")}</div>
                    <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{mark.userId?.registrationNumber || mark.userId?.email || "-"}</div>
                  </td>
                  <td style={{ padding: "1rem", fontWeight: 700 }}>{formatText(mark.courseId?.title || "Course")}</td>
                  <td style={{ padding: "1rem" }}>{formatText(mark.lessonId?.title || "Assessment")}</td>
                  <td style={{ padding: "1rem", fontWeight: 800 }}>{mark.lessonId?.type}</td>
                  <td style={{ padding: "1rem", fontWeight: 800 }}>{getTotalMarks(mark) ?? "-"}</td>
                  <td style={{ padding: "1rem", fontWeight: 800, color: "#059669" }}>{displayMarks(mark) ?? "-"}</td>
                  <td style={{ padding: "1rem", fontWeight: 800, color: getResult(mark) === "Fail" ? "#dc2626" : getResult(mark) === "Pass" ? "#059669" : "#64748b" }}>{getResult(mark)}</td>
                  <td style={{ padding: "1rem", color: "#64748b" }}>{mark.submittedAt ? new Date(mark.submittedAt).toLocaleString() : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
