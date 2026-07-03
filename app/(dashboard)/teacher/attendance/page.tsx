"use client"

import { useEffect, useMemo, useState } from "react"
import { BookOpen, CalendarDays, ClipboardCheck, Download, Loader2, Save } from "lucide-react"
import { Toast, ToastType } from "@/components/ui/Toast"
import { formatText } from "@/lib/utils"

const statusOptions = [
  { value: "PRESENT", label: "Present", color: "#059669", bg: "rgba(16,185,129,0.1)" },
  { value: "ABSENT", label: "Absent", color: "#dc2626", bg: "rgba(239,68,68,0.1)" },
  { value: "LATE", label: "Late", color: "#d97706", bg: "rgba(245,158,11,0.12)" },
  { value: "EXCUSED", label: "Excused", color: "#2563eb", bg: "rgba(59,130,246,0.1)" },
  { value: "LEAVE", label: "Leave", color: "#7c3aed", bg: "rgba(124,58,237,0.1)" },
]

const today = new Date().toISOString().slice(0, 10)

export default function TeacherAttendancePage() {
  const [courses, setCourses] = useState<any[]>([])
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [attendance, setAttendance] = useState<any[]>([])
  const [courseAttendance, setCourseAttendance] = useState<any[]>([])
  const [courseId, setCourseId] = useState("")
  const [date, setDate] = useState(today)
  const [records, setRecords] = useState<Record<string, { status: string; note: string }>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    if (!courseId) {
      setEnrollments([])
      setAttendance([])
      setCourseAttendance([])
      setRecords({})
      return
    }

    fetchRoster()
    fetchAttendance()
  }, [courseId, date])

  useEffect(() => {
    const saved = attendance[0]?.records || []
    const savedByStudent = new Map(saved.map((record: any) => [record.studentId?._id, record]))
    const nextRecords: Record<string, { status: string; note: string }> = {}

    enrollments.forEach((enrollment: any) => {
      const studentId = enrollment.userId?._id
      const existing: any = savedByStudent.get(studentId)
      if (studentId) nextRecords[studentId] = { status: existing?.status || "PRESENT", note: existing?.note || "" }
    })

    setRecords(nextRecords)
  }, [attendance, enrollments])

  const fetchCourses = async () => {
    try {
      const res = await fetch("/api/courses")
      const data = await res.json()
      if (res.ok) {
        setCourses(data)
        if (data[0]?._id) setCourseId(data[0]._id)
      }
    } catch (err) {
      console.error("Failed to fetch courses")
    } finally {
      setLoading(false)
    }
  }

  const fetchRoster = async () => {
    try {
      const res = await fetch(`/api/enrollments?courseId=${courseId}`)
      const data = await res.json()
      if (res.ok) setEnrollments(data.filter((item: any) => item.userId?.role === "STUDENT"))
    } catch (err) {
      console.error("Failed to fetch roster")
    }
  }

  const fetchAttendance = async () => {
    try {
      const [dateRes, courseRes] = await Promise.all([
        fetch(`/api/attendance?courseId=${courseId}&date=${date}`),
        fetch(`/api/attendance?courseId=${courseId}`),
      ])
      const dateData = await dateRes.json()
      const courseData = await courseRes.json()
      if (dateRes.ok) setAttendance(dateData)
      if (courseRes.ok) setCourseAttendance(courseData)
    } catch (err) {
      console.error("Failed to fetch attendance")
    }
  }

  const selectedCourse = useMemo(() => courses.find(course => course._id === courseId), [courses, courseId])
  const recordValues = Object.values(records)
  const attendanceSummary = {
    totalClasses: courseId && date ? 1 : 0,
    totalRecords: recordValues.length,
    present: recordValues.filter(record => record.status === "PRESENT").length,
    absent: recordValues.filter(record => record.status === "ABSENT").length,
    late: recordValues.filter(record => record.status === "LATE").length,
    excused: recordValues.filter(record => record.status === "EXCUSED").length,
    leave: recordValues.filter(record => record.status === "LEAVE").length,
  }
  const percentage = (count: number, total = attendanceSummary.totalRecords) => total ? Math.round((count / total) * 100) + "%" : "0%"
  const presentCount = attendanceSummary.present
  const getStatusOption = (status: string) => statusOptions.find(option => option.value === status) || statusOptions[0]
  const getStudentSummary = (studentId: string) => {
    const rows = courseAttendance.flatMap((sheet: any) =>
      sheet.records
        .filter((record: any) => record.studentId?._id === studentId)
        .map((record: any) => ({ date: sheet.date, status: record.status }))
    )
    const currentRecord = records[studentId]
    const withoutCurrentDate = rows.filter((row: any) => row.date !== date)
    const mergedRows = currentRecord ? [...withoutCurrentDate, { date, status: currentRecord.status }] : rows
    const total = mergedRows.length
    const present = mergedRows.filter((row: any) => row.status === "PRESENT").length
    const absent = mergedRows.filter((row: any) => row.status === "ABSENT").length
    const late = mergedRows.filter((row: any) => row.status === "LATE").length
    const excused = mergedRows.filter((row: any) => row.status === "EXCUSED").length
    const leave = mergedRows.filter((row: any) => row.status === "LEAVE").length
    return { total, present, absent, late, excused, leave }
  }
  const downloadUrl = () => {
    const params = new URLSearchParams()
    if (courseId) params.set("courseId", courseId)
    if (date) params.set("date", date)
    return `/api/attendance/export?${params.toString()}`
  }

  const updateRecord = (studentId: string, key: "status" | "note", value: string) => {
    setRecords(prev => ({ ...prev, [studentId]: { status: prev[studentId]?.status || "PRESENT", note: prev[studentId]?.note || "", [key]: value } }))
  }

  const saveAttendance = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          date,
          records: Object.entries(records).map(([studentId, record]) => ({ studentId, status: record.status, note: record.note })),
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setToast({ message: "Attendance saved successfully", type: "success" })
        setAttendance([data.attendance])
      } else {
        setToast({ message: data.error || "Failed to save attendance", type: "error" })
      }
    } catch (err) {
      setToast({ message: "Failed to save attendance", type: "error" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="glass-card animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap", marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ background: "var(--primary)", padding: "0.75rem", borderRadius: "1rem", color: "white" }}><ClipboardCheck size={24} /></div>
          <div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Course Attendance</h2>
            <p style={{ fontSize: "0.875rem", opacity: 0.6 }}>Mark attendance for students registered in your course</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <a href={downloadUrl()} className="btn" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none", background: "#f1f5f9", color: "#334155" }}>
            <Download size={18} /> Download Excel
          </a>
          <button onClick={saveAttendance} disabled={saving || !courseId || enrollments.length === 0} className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Save Attendance
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontWeight: 700, color: "#334155" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}><BookOpen size={16} /> Course</span>
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)} style={{ padding: "0.75rem", borderRadius: "0.75rem", border: "1px solid var(--glass-border)", background: "white", outline: "none" }}>
            <option value="">{courses.length === 0 ? "No courses assigned" : "Select course"}</option>
            {courses.map(course => <option key={course._id} value={course._id}>{formatText(course.title)}</option>)}
          </select>
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontWeight: 700, color: "#334155" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}><CalendarDays size={16} /> Date</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ padding: "0.75rem", borderRadius: "0.75rem", border: "1px solid var(--glass-border)", background: "white", outline: "none" }} />
        </label>
        <div style={{ padding: "1rem", borderRadius: "0.75rem", background: "rgba(1,65,28,0.06)", border: "1px solid rgba(1,65,28,0.12)" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Marked Present</div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--primary)" }}>{presentCount}/{enrollments.length}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {[
          ["Total Classes", attendanceSummary.totalClasses, ""],
          ["Total Records", attendanceSummary.totalRecords, ""],
          ["Present", attendanceSummary.present, percentage(attendanceSummary.present)],
          ["Absent", attendanceSummary.absent, percentage(attendanceSummary.absent)],
          ["Late", attendanceSummary.late, percentage(attendanceSummary.late)],
          ["Excused", attendanceSummary.excused, percentage(attendanceSummary.excused)],
          ["Leave", attendanceSummary.leave, percentage(attendanceSummary.leave)],
        ].map(([label, value, percent]) => (
          <div key={label} style={{ padding: "0.85rem", borderRadius: "0.75rem", background: "white", border: "1px solid var(--glass-border)" }}>
            <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>{label}</div>
            <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#1e293b" }}>{value}</div>
            {percent && <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>{percent}</div>}
          </div>
        ))}
      </div>

      {selectedCourse && <div style={{ marginBottom: "1.5rem", color: "#64748b", fontSize: "0.875rem" }}>{[selectedCourse.classLevel, selectedCourse.program, selectedCourse.semester].filter(Boolean).map(formatText).join(" | ")}</div>}

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}><Loader2 className="animate-spin" size={42} color="var(--primary)" /></div>
      ) : enrollments.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "#94a3b8" }}>No registered students found for this course.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 0.5rem", textAlign: "left" }}>
            <thead>
              <tr style={{ color: "#64748b", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                <th style={{ padding: "0.75rem 1rem" }}>Student</th>
                <th style={{ padding: "0.75rem 1rem" }}>Registration</th>
                <th style={{ padding: "0.75rem 1rem" }}>Status</th>
                <th style={{ padding: "0.75rem 1rem" }}>Note</th>
                <th style={{ padding: "0.75rem 1rem" }}>Total</th>
                <th style={{ padding: "0.75rem 1rem" }}>Present</th>
                <th style={{ padding: "0.75rem 1rem" }}>Absent</th>
                <th style={{ padding: "0.75rem 1rem" }}>Late</th>
                <th style={{ padding: "0.75rem 1rem" }}>Excused</th>
                <th style={{ padding: "0.75rem 1rem" }}>Leave</th>
                <th style={{ padding: "0.75rem 1rem" }}>Present %</th>
                <th style={{ padding: "0.75rem 1rem" }}>Absent %</th>
                <th style={{ padding: "0.75rem 1rem" }}>Leave %</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((enrollment: any) => {
                const student = enrollment.userId
                const record = records[student?._id] || { status: "PRESENT", note: "" }
                const studentSummary = getStudentSummary(student?._id)
                return (
                  <tr key={enrollment._id} style={{ background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                    <td style={{ padding: "1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--primary)15", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>{student?.name?.[0]?.toUpperCase() || "S"}</div>
                        <div>
                          <div style={{ fontWeight: 700, color: "#1e293b" }}>{formatText(student?.name || "Student")}</div>
                          <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{student?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "1rem", color: "#475569", fontWeight: 700 }}>{student?.registrationNumber || "-"}</td>
                    <td style={{ padding: "1rem" }}>
                      <select
                        value={record.status}
                        onChange={(e) => updateRecord(student._id, "status", e.target.value)}
                        style={{
                          minWidth: "130px",
                          padding: "0.55rem 0.75rem",
                          borderRadius: "0.5rem",
                          border: `1px solid ${getStatusOption(record.status).color}`,
                          background: getStatusOption(record.status).bg,
                          color: getStatusOption(record.status).color,
                          fontSize: "0.8rem",
                          fontWeight: 800,
                          outline: "none",
                          cursor: "pointer",
                        }}
                      >
                        {statusOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <input value={record.note} onChange={(e) => updateRecord(student._id, "note", e.target.value)} placeholder="Optional note" style={{ width: "100%", minWidth: "180px", padding: "0.6rem 0.75rem", borderRadius: "0.5rem", border: "1px solid var(--glass-border)", outline: "none" }} />
                    </td>
                    <td style={{ padding: "1rem", fontWeight: 800 }}>{studentSummary.total}</td>
                    <td style={{ padding: "1rem", fontWeight: 800, color: "#059669" }}>{studentSummary.present}</td>
                    <td style={{ padding: "1rem", fontWeight: 800, color: "#dc2626" }}>{studentSummary.absent}</td>
                    <td style={{ padding: "1rem", fontWeight: 800, color: "#d97706" }}>{studentSummary.late}</td>
                    <td style={{ padding: "1rem", fontWeight: 800, color: "#2563eb" }}>{studentSummary.excused}</td>
                    <td style={{ padding: "1rem", fontWeight: 800, color: "#7c3aed" }}>{studentSummary.leave}</td>
                    <td style={{ padding: "1rem", fontWeight: 800 }}>{percentage(studentSummary.present, studentSummary.total)}</td>
                    <td style={{ padding: "1rem", fontWeight: 800 }}>{percentage(studentSummary.absent, studentSummary.total)}</td>
                    <td style={{ padding: "1rem", fontWeight: 800 }}>{percentage(studentSummary.leave, studentSummary.total)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
