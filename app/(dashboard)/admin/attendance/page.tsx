"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarDays, ClipboardCheck, Download, Loader2, Search } from "lucide-react"

export default function AdminAttendancePage() {
  const [courses, setCourses] = useState<any[]>([])
  const [attendance, setAttendance] = useState<any[]>([])
  const [courseId, setCourseId] = useState("")
  const [date, setDate] = useState("")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCourses()
    fetchAttendance()
  }, [])

  useEffect(() => {
    fetchAttendance()
  }, [courseId, date])

  const fetchCourses = async () => {
    try {
      const res = await fetch("/api/courses")
      const data = await res.json()
      if (res.ok) setCourses(data)
    } catch (err) {
      console.error("Failed to fetch courses")
    }
  }

  const fetchAttendance = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (courseId) params.set("courseId", courseId)
      if (date) params.set("date", date)
      const res = await fetch(`/api/attendance?${params.toString()}`)
      const data = await res.json()
      if (res.ok) setAttendance(data)
    } catch (err) {
      console.error("Failed to fetch attendance")
    } finally {
      setLoading(false)
    }
  }

  const rows = useMemo(() => attendance.flatMap((sheet: any) =>
    sheet.records.map((record: any) => ({
      id: `${sheet._id}-${record.studentId?._id}`,
      date: sheet.date,
      course: sheet.courseId,
      teacher: sheet.teacherId,
      student: record.studentId,
      status: record.status,
      note: record.note,
    }))
  ), [attendance])

  const filteredRows = rows.filter((row: any) => {
    const q = search.toLowerCase()
    return (
      row.student?.name?.toLowerCase().includes(q) ||
      row.student?.registrationNumber?.toLowerCase().includes(q) ||
      row.course?.title?.toLowerCase().includes(q) ||
      row.teacher?.name?.toLowerCase().includes(q) ||
      row.status?.toLowerCase().includes(q)
    )
  })

  const visibleSheetIds = new Set(filteredRows.map((row: any) => row.id.split("-")[0]))
  const attendanceSummary = {
    totalClasses: visibleSheetIds.size,
    totalRecords: filteredRows.length,
    present: filteredRows.filter((row: any) => row.status === "PRESENT").length,
    absent: filteredRows.filter((row: any) => row.status === "ABSENT").length,
    late: filteredRows.filter((row: any) => row.status === "LATE").length,
    excused: filteredRows.filter((row: any) => row.status === "EXCUSED").length,
    leave: filteredRows.filter((row: any) => row.status === "LEAVE").length,
  }
  const percentage = (count: number, total = attendanceSummary.totalRecords) => total ? Math.round((count / total) * 100) + "%" : "0%"
  const getStudentSummary = (studentId: string) => {
    const studentRows = filteredRows.filter((row: any) => row.student?._id === studentId)
    const total = studentRows.length
    const present = studentRows.filter((row: any) => row.status === "PRESENT").length
    const absent = studentRows.filter((row: any) => row.status === "ABSENT").length
    const late = studentRows.filter((row: any) => row.status === "LATE").length
    const excused = studentRows.filter((row: any) => row.status === "EXCUSED").length
    const leave = studentRows.filter((row: any) => row.status === "LEAVE").length
    return { total, present, absent, late, excused, leave }
  }

  const downloadUrl = () => {
    const params = new URLSearchParams()
    if (courseId) params.set("courseId", courseId)
    if (date) params.set("date", date)
    return `/api/attendance/export?${params.toString()}`
  }

  const statusStyle = (status: string) => {
    if (status === "PRESENT") return { color: "#059669", background: "rgba(16,185,129,0.1)" }
    if (status === "ABSENT") return { color: "#dc2626", background: "rgba(239,68,68,0.1)" }
    if (status === "LATE") return { color: "#d97706", background: "rgba(245,158,11,0.12)" }
    if (status === "EXCUSED") return { color: "#2563eb", background: "rgba(59,130,246,0.1)" }
    return { color: "#7c3aed", background: "rgba(124,58,237,0.1)" }
  }

  return (
    <div className="glass-card animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap", marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ background: "var(--primary)", padding: "0.75rem", borderRadius: "1rem", color: "white" }}><ClipboardCheck size={24} /></div>
          <div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Attendance List</h2>
            <p style={{ fontSize: "0.875rem", opacity: 0.6 }}>View all course attendance and download Excel sheets</p>
          </div>
        </div>
        <a href={downloadUrl()} className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
          <Download size={18} /> Download Excel
        </a>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontWeight: 700, color: "#334155" }}>
          <span style={{ fontSize: "0.875rem" }}>Course</span>
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)} style={{ padding: "0.75rem", borderRadius: "0.75rem", border: "1px solid var(--glass-border)", background: "white", outline: "none" }}>
            <option value="">All courses</option>
            {courses.map(course => <option key={course._id} value={course._id}>{course.title}</option>)}
          </select>
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontWeight: 700, color: "#334155" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}><CalendarDays size={16} /> Date</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ padding: "0.75rem", borderRadius: "0.75rem", border: "1px solid var(--glass-border)", background: "white", outline: "none" }} />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontWeight: 700, color: "#334155" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}><Search size={16} /> Search</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Student, course, teacher, status..." style={{ padding: "0.75rem", borderRadius: "0.75rem", border: "1px solid var(--glass-border)", background: "white", outline: "none" }} />
        </label>
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

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}><Loader2 className="animate-spin" size={42} color="var(--primary)" /></div>
      ) : filteredRows.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "#94a3b8" }}>No attendance records found.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 0.5rem", textAlign: "left" }}>
            <thead>
              <tr style={{ color: "#64748b", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                <th style={{ padding: "0.75rem 1rem" }}>Date</th>
                <th style={{ padding: "0.75rem 1rem" }}>Student</th>
                <th style={{ padding: "0.75rem 1rem" }}>Course</th>
                <th style={{ padding: "0.75rem 1rem" }}>Teacher</th>
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
              {filteredRows.map((row: any) => {
                const studentSummary = getStudentSummary(row.student?._id)
                return (
                <tr key={row.id} style={{ background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                  <td style={{ padding: "1rem", fontWeight: 700, color: "#475569" }}>{row.date}</td>
                  <td style={{ padding: "1rem" }}>
                    <div style={{ fontWeight: 700, color: "#1e293b" }}>{row.student?.name || "Student"}</div>
                    <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{row.student?.registrationNumber || row.student?.email || "-"}</div>
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <div style={{ fontWeight: 700, color: "#1e293b" }}>{row.course?.title || "Course"}</div>
                    <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{[row.course?.classLevel, row.course?.program, row.course?.semester].filter(Boolean).join(" | ")}</div>
                  </td>
                  <td style={{ padding: "1rem", color: "#475569" }}>{row.teacher?.name || "-"}</td>
                  <td style={{ padding: "1rem" }}>
                    <span style={{ ...statusStyle(row.status), padding: "0.35rem 0.75rem", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 800 }}>{row.status}</span>
                  </td>
                  <td style={{ padding: "1rem", color: "#64748b", minWidth: "160px" }}>{row.note || "-"}</td>
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
    </div>
  )
}
