"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, BookOpen, CalendarDays, ClipboardCheck, Download, Loader2, Search } from "lucide-react"
import { formatText } from "@/lib/utils"

function classKey(course: any) {
  return [course.classLevel || "No Class", course.program || "No Program", course.semester || "No Semester"].join("||")
}

function classLabel(course: any) {
  return [course.classLevel, course.program, course.semester].filter(Boolean).map(formatText).join(" | ") || "Unassigned Class"
}

export default function AdminAttendancePage() {
  const [courses, setCourses] = useState<any[]>([])
  const [attendance, setAttendance] = useState<any[]>([])
  const [selectedClassKey, setSelectedClassKey] = useState("")
  const [courseId, setCourseId] = useState("")
  const [dateMode, setDateMode] = useState<"all" | "date">("all")
  const [date, setDate] = useState("")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCourses()
    fetchAttendance()
  }, [])

  useEffect(() => {
    fetchAttendance()
  }, [courseId, date, dateMode])

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
      if (dateMode === "date" && date) params.set("date", date)
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
    if (dateMode === "date" && date) params.set("date", date)
    return `/api/attendance/export?${params.toString()}`
  }

  const selectClass = (key: string) => {
    setSelectedClassKey(key)
    setCourseId("")
    setSearch("")
  }

  const selectCourse = (id: string) => {
    setCourseId(id)
    setSearch("")
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
            <p style={{ fontSize: "0.875rem", opacity: 0.6 }}>Choose a class, then a subject, then view attendance</p>
          </div>
        </div>
        {courseId && (
          <a href={downloadUrl()} className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
            <Download size={18} /> Download Excel
          </a>
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

      <div style={{ display: "grid", gridTemplateColumns: courseId ? "repeat(auto-fit, minmax(220px, 1fr))" : "minmax(220px, 360px)", gap: "1rem", marginBottom: "1.5rem" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontWeight: 700, color: "#334155" }}>
          <span style={{ fontSize: "0.875rem" }}>Filter</span>
          <div style={{ display: "flex", gap: "0.5rem", padding: "0.25rem", border: "1px solid var(--glass-border)", borderRadius: "0.75rem", background: "white" }}>
            {[
              { key: "all" as const, label: "All Attendance" },
              { key: "date" as const, label: "Date Wise" },
            ].map(option => (
              <button
                key={option.key}
                type="button"
                onClick={() => setDateMode(option.key)}
                style={{
                  flex: 1,
                  border: "none",
                  borderRadius: "0.55rem",
                  padding: "0.55rem 0.7rem",
                  background: dateMode === option.key ? "var(--primary)" : "transparent",
                  color: dateMode === option.key ? "white" : "#475569",
                  fontWeight: 800,
                  cursor: "pointer",
                  whiteSpace: "nowrap"
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontWeight: 700, color: "#334155" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}><CalendarDays size={16} /> Date</span>
          <input
            type="date"
            value={date}
            disabled={dateMode === "all"}
            onChange={(e) => setDate(e.target.value)}
            style={{ padding: "0.75rem", borderRadius: "0.75rem", border: "1px solid var(--glass-border)", background: dateMode === "all" ? "#f8fafc" : "white", outline: "none", opacity: dateMode === "all" ? 0.65 : 1 }}
          />
        </label>
        {courseId && (
          <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontWeight: 700, color: "#334155" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}><Search size={16} /> Search</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Student, teacher, status..." style={{ padding: "0.75rem", borderRadius: "0.75rem", border: "1px solid var(--glass-border)", background: "white", outline: "none" }} />
          </label>
        )}
      </div>

      {!selectedClassKey ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" }}>
          {classGroups.map(group => (
            <button key={group.key} type="button" onClick={() => selectClass(group.key)} style={{ padding: "1.25rem", textAlign: "left", borderRadius: "1rem", background: "white", border: "1px solid var(--glass-border)", cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "0.75rem", background: "rgba(1,65,28,0.08)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
                <ClipboardCheck size={20} />
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
        </>
      )}
    </div>
  )
}
