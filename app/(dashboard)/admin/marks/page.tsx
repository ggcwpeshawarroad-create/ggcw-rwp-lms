"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, BookOpen, ClipboardList, Download, FileCheck2, Loader2, Search } from "lucide-react"
import { Toast, ToastType } from "@/components/ui/Toast"
import { formatText } from "@/lib/utils"

function classKey(course: any) {
  return [course.classLevel || "No Class", course.program || "No Program", course.semester || "No Semester"].join("||")
}

function classLabel(course: any) {
  return [course.classLevel, course.program, course.semester].filter(Boolean).map(formatText).join(" | ") || "Unassigned Class"
}

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
  const percentage = calcPercentage(getObtainedMarks(mark), getTotalMarks(mark))
  if (percentage === null) return "Pending"
  return percentage >= 50 ? "Pass" : "Fail"
}

export default function AdminMarksPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [marks, setMarks] = useState<any[]>([])
  const [selectedClassKey, setSelectedClassKey] = useState("")
  const [courseId, setCourseId] = useState("")
  const [studentId, setStudentId] = useState("")
  const [type, setType] = useState("")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    if (courseId) fetchMarks()
    else setMarks([])
  }, [courseId, studentId, type])

  const fetchCourses = async () => {
    try {
      const res = await fetch("/api/courses")
      const data = await res.json()
      if (res.ok) setCourses(data)
    } catch {
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
    } catch {
      console.error("Failed to fetch marks")
    } finally {
      setLoading(false)
    }
  }

  const classGroups = useMemo(() => {
    const groups = new Map<string, { key: string; label: string; courses: any[] }>()
    courses.forEach((course: any) => {
      const key = classKey(course)
      if (!groups.has(key)) groups.set(key, { key, label: classLabel(course), courses: [] })
      groups.get(key)?.courses.push(course)
    })
    return Array.from(groups.values()).sort((a, b) => a.label.localeCompare(b.label))
  }, [courses])

  const selectedClass = classGroups.find(group => group.key === selectedClassKey)
  const selectedCourse = courses.find((course: any) => course._id === courseId)

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
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || "Failed to download marksheet")
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

  const selectClass = (key: string) => {
    setSelectedClassKey(key)
    setCourseId("")
    setStudentId("")
    setType("")
    setSearch("")
  }

  const selectCourse = (id: string) => {
    setCourseId(id)
    setStudentId("")
    setType("")
    setSearch("")
  }

  return (
    <div className="glass-card animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap", marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ background: "var(--primary)", padding: "0.75rem", borderRadius: "1rem", color: "white" }}><FileCheck2 size={24} /></div>
          <div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Marks Sheet</h2>
            <p style={{ fontSize: "0.875rem", opacity: 0.6 }}>Choose a class, then a subject, then view marks</p>
          </div>
        </div>
        {courseId && (
          <button onClick={downloadExcel} disabled={downloading} className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {downloading ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
            {downloading ? "Downloading..." : "Download Excel"}
          </button>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem", color: "#64748b", fontSize: "0.875rem", fontWeight: 700 }}>
        <button type="button" onClick={() => { setSelectedClassKey(""); setCourseId(""); setSearch("") }} style={{ border: "none", background: "none", color: selectedClassKey ? "var(--primary)" : "#1e293b", cursor: selectedClassKey ? "pointer" : "default", fontWeight: 800 }}>Classes</button>
        {selectedClass && (
          <>
            <span>/</span>
            <button type="button" onClick={() => { setCourseId(""); setSearch("") }} style={{ border: "none", background: "none", color: courseId ? "var(--primary)" : "#1e293b", cursor: courseId ? "pointer" : "default", fontWeight: 800 }}>{selectedClass.label}</button>
          </>
        )}
        {selectedCourse && (
          <>
            <span>/</span>
            <span style={{ color: "#1e293b" }}>{formatText(selectedCourse.title)}</span>
          </>
        )}
      </div>

      {!selectedClassKey ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" }}>
          {classGroups.map(group => (
            <button key={group.key} type="button" onClick={() => selectClass(group.key)} style={{ padding: "1.25rem", textAlign: "left", borderRadius: "1rem", background: "white", border: "1px solid var(--glass-border)", cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "0.75rem", background: "rgba(1,65,28,0.08)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
                <FileCheck2 size={20} />
              </div>
              <div style={{ fontSize: "1rem", fontWeight: 800, color: "#1e293b", marginBottom: "0.35rem" }}>{group.label}</div>
              <div style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 700 }}>{group.courses.length} subject{group.courses.length !== 1 ? "s" : ""}</div>
            </button>
          ))}
        </div>
      ) : !courseId ? (
        <div>
          <button type="button" onClick={() => setSelectedClassKey("")} style={{ marginBottom: "1rem", display: "inline-flex", alignItems: "center", gap: "0.4rem", border: "none", background: "#f1f5f9", color: "#334155", padding: "0.55rem 0.8rem", borderRadius: "0.65rem", cursor: "pointer", fontWeight: 800 }}>
            <ArrowLeft size={16} /> Back to classes
          </button>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
            {selectedClass?.courses.map((course: any) => (
              <button key={course._id} type="button" onClick={() => selectCourse(course._id)} style={{ padding: "1.25rem", textAlign: "left", borderRadius: "1rem", background: "white", border: "1px solid var(--glass-border)", cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "0.75rem", background: "rgba(79,70,229,0.1)", color: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
                  <BookOpen size={20} />
                </div>
                <div style={{ fontSize: "1rem", fontWeight: 800, color: "#1e293b", marginBottom: "0.35rem" }}>{formatText(course.title)}</div>
                <div style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 700 }}>{classLabel(course)}</div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <button type="button" onClick={() => { setCourseId(""); setSearch("") }} style={{ marginBottom: "1rem", display: "inline-flex", alignItems: "center", gap: "0.4rem", border: "none", background: "#f1f5f9", color: "#334155", padding: "0.55rem 0.8rem", borderRadius: "0.65rem", cursor: "pointer", fontWeight: 800 }}>
            <ArrowLeft size={16} /> Back to subjects
          </button>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
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
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Student, assessment..." style={{ padding: "0.75rem", borderRadius: "0.75rem", border: "1px solid var(--glass-border)", background: "white", outline: "none" }} />
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(135px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
            {[
              ["Total Records", filteredMarks.length],
              ["Quizzes", quizMarks.length],
              ["Assignments", assignmentMarks.length],
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
                      <td style={{ padding: "1rem" }}>{formatText(mark.lessonId?.title || "Assessment")}</td>
                      <td style={{ padding: "1rem", fontWeight: 800 }}>{mark.lessonId?.type}</td>
                      <td style={{ padding: "1rem", fontWeight: 800 }}>{getTotalMarks(mark) ?? "-"}</td>
                      <td style={{ padding: "1rem", fontWeight: 800, color: "#059669" }}>{getObtainedMarks(mark) ?? "-"}</td>
                      <td style={{ padding: "1rem", fontWeight: 800, color: getResult(mark) === "Fail" ? "#dc2626" : getResult(mark) === "Pass" ? "#059669" : "#64748b" }}>{getResult(mark)}</td>
                      <td style={{ padding: "1rem", color: "#64748b" }}>{mark.submittedAt ? new Date(mark.submittedAt).toLocaleString() : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
