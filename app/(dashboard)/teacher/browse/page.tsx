"use client"

import { useState, useEffect } from "react"
import { Search, BookOpen, Loader2, ArrowRight, UserPlus, CheckCircle } from "lucide-react"
import Link from "next/link"
import { Toast, ToastType } from "@/components/ui/Toast"
import { formatText } from "@/lib/utils"

type TeacherCourse = {
  _id: string
  title: string
  description?: string
  program?: string
  classLevel?: string
  semester?: string
  enrollmentCount?: number
  isOwner?: boolean
  isTeacherEnrolled?: boolean
  enrolledTeacher?: { _id?: string; name?: string; role?: string }
  teacherId?: { _id?: string; name?: string; role?: string }
}

export default function TeacherBrowsePage() {
  const [courses, setCourses] = useState<TeacherCourse[]>([])
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [claimingMap, setClaimingMap] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  async function fetchData() {
    try {
      const [cRes, eRes] = await Promise.all([
        fetch("/api/courses?teacherCatalog=true"),
        fetch("/api/enrollments?userId=self")
      ])
      const cData = await cRes.json()
      const eData = await eRes.json()
      if (cRes.ok) setCourses(cData)
      if (eRes.ok) setEnrollments(eData)
    } catch {
      console.error("Failed to fetch data")
    } finally {
      setLoading(false)
    }
  }

  const handleClaimCourse = async (courseId: string) => {
    setClaimingMap(prev => ({ ...prev, [courseId]: true }))
    try {
      const res = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      })

      if (res.ok) {
        await fetchData()
        setToast({ message: "Enrolled successfully! You can now access the course.", type: "success" })
      } else {
        const data = await res.json()
        setToast({ message: data.error || "Enrollment failed", type: "error" })
      }
    } catch {
      setToast({ message: "Network error. Please try again.", type: "error" })
    } finally {
      setClaimingMap(prev => ({ ...prev, [courseId]: false }))
    }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData() }, [])

  const getEnrollment = (courseId: string) =>
    enrollments.find(e => e.courseId?._id === courseId)

  const filteredCourses = courses.filter(c => {
    const searchLower = search.toLowerCase()
    const titleMatch = c.title?.toLowerCase().includes(searchLower)
    const teacherMatch = c.teacherId?.name ? c.teacherId.name.toLowerCase().includes(searchLower) : false
    return titleMatch || teacherMatch
  })

  // Gradient palette for cards
  const gradients = [
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
  ]

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.5rem' }}>
          Browse Catalog
        </h2>
        <p style={{ opacity: 0.6 }}>Enrol in available courses to start managing them</p>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: '500px', marginBottom: '3rem' }}>
        <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} size={20} />
        <input
          type="text"
          placeholder="Search by course or instructor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '1rem 1rem 1rem 3.5rem', borderRadius: '1rem', background: 'white', border: '1px solid var(--glass-border)', outline: 'none', fontSize: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', boxSizing: 'border-box' }}
        />
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader2 className="animate-spin" size={48} color="var(--primary)" />
        </div>
      ) : filteredCourses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 2rem', background: 'white', borderRadius: '1.5rem', border: '2px dashed #e2e8f0' }}>
          <BookOpen size={48} style={{ color: '#cbd5e1', marginBottom: '1rem' }} />
          <p style={{ color: '#64748b', fontWeight: 500 }}>No courses found. Try a different search.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
          {filteredCourses.map((course, idx) => {
            const enrollment = getEnrollment(course._id)
            const isEnrolled = !!enrollment
            const hasAnotherTeacher = !!course.enrolledTeacher && !isEnrolled
            const teacherName = course.enrolledTeacher?.name ? formatText(course.enrolledTeacher.name) : "another teacher"
            const teacherRegisteredMessage = course.enrolledTeacher?.name
              ? `Another teacher, ${teacherName}, is already registered with this course. Only one teacher can enroll in a course.`
              : "Another teacher is already registered with this course. Only one teacher can enroll in a course."

            return (
              <div
                key={course._id}
                className="glass-card"
                style={{ display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s' }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 20px 30px -8px rgba(0,0,0,0.12)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = ''
                }}
              >
                {/* Card thumbnail */}
                <div style={{
                  height: '140px',
                  background: gradients[idx % gradients.length],
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative'
                }}>
                  <BookOpen size={48} color="rgba(255,255,255,0.8)" />
                  <div style={{ position: 'absolute', bottom: '0.75rem', left: '1rem', background: 'rgba(0,0,0,0.35)', color: 'white', padding: '0.2rem 0.65rem', borderRadius: '0.5rem', fontSize: '0.72rem', fontWeight: 700, backdropFilter: 'blur(4px)' }}>
                    {course.enrollmentCount || 0} Learners
                  </div>
                  {isEnrolled && (
                    <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: '#10b981', color: 'white', padding: '0.25rem 0.65rem', borderRadius: '0.5rem', fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <CheckCircle size={12} /> Enrolled
                    </div>
                  )}
                </div>

                {/* Card body */}
                <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.6rem', color: '#1e293b' }}>{formatText(course.title)}</h3>

                  {/* Course metadata — Degree / Program / Semester */}
                  {(course.program || course.classLevel || course.semester) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.85rem', padding: '0.65rem 0.85rem', background: '#f8fafc', borderRadius: '0.6rem', border: '1px solid #f1f5f9' }}>
                      {course.program && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.78rem' }}>
                          <span style={{ color: '#94a3b8', fontWeight: 600, minWidth: '58px' }}>Degree:</span>
                          <span style={{ fontWeight: 700, color: '#4f46e5', background: 'rgba(79,70,229,0.08)', padding: '0.1rem 0.5rem', borderRadius: '0.35rem' }}>{formatText(course.program)}</span>
                        </div>
                      )}
                      {course.classLevel && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.78rem' }}>
                          <span style={{ color: '#94a3b8', fontWeight: 600, minWidth: '58px' }}>Program:</span>
                          <span style={{ fontWeight: 700, color: '#059669', background: 'rgba(16,185,129,0.08)', padding: '0.1rem 0.5rem', borderRadius: '0.35rem' }}>{formatText(course.classLevel)}</span>
                        </div>
                      )}
                      {course.semester && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.78rem' }}>
                          <span style={{ color: '#94a3b8', fontWeight: 600, minWidth: '58px' }}>Semester:</span>
                          <span style={{ fontWeight: 700, color: '#d97706', background: 'rgba(245,158,11,0.08)', padding: '0.1rem 0.5rem', borderRadius: '0.35rem' }}>{formatText(course.semester)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem', flex: 1, lineHeight: '1.5' }}>
                    {course.description ? formatText(course.description) : "No description provided."}
                  </p>

                  {/* Instructor */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 800, fontSize: '0.7rem', flexShrink: 0 }}>
                       {course.teacherId?.role === "TEACHER" && course.teacherId?.name ? course.teacherId.name[0]?.toUpperCase() : "-"}
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}> {course.teacherId?.role === "TEACHER" && course.teacherId?.name ? formatText(course.teacherId.name) : "Instructor not assigned"}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
                    {isEnrolled ? (
                      <Link
                        href={`/teacher/courses/${course._id}`}
                        className="btn btn-primary"
                        style={{ flex: 1, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.875rem', padding: '0.6rem 1rem' }}
                      >
                        Enter Course <ArrowRight size={15} />
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleClaimCourse(course._id)}
                        disabled={claimingMap[course._id] || hasAnotherTeacher}
                        className="btn btn-primary"
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.875rem', padding: '0.6rem 1rem', opacity: claimingMap[course._id] || hasAnotherTeacher ? 0.75 : 1 }}
                      >
                        {claimingMap[course._id] ? (
                          <>
                            <Loader2 className="animate-spin" size={15} /> Enrolling...
                          </>
                        ) : hasAnotherTeacher ? (
                          <>Course already has a teacher</>
                        ) : (
                          <>
                            <UserPlus size={15} /> Enrol Now
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  {hasAnotherTeacher && (
                    <p style={{ marginTop: '0.65rem', fontSize: '0.78rem', lineHeight: 1.45, color: '#b45309', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.22)', borderRadius: '0.55rem', padding: '0.55rem 0.7rem' }}>
                      {teacherRegisteredMessage}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
