"use client"

import { useState, useEffect } from "react"
import { Search, BookOpen, Loader2, CheckCircle, ArrowRight } from "lucide-react"
import { Toast, ToastType } from "@/components/ui/Toast"
import Link from "next/link"
import { formatText } from "@/lib/utils"

type TeacherCourse = {
  _id: string
  title: string
  description?: string
  program?: string
  classLevel?: string
  semester?: string
  enrollmentCount?: number
  teacherId?: { name?: string }
}

type CourseEnrollment = {
  courseId?: { _id?: string } | string
}

export default function TeacherBrowsePage() {
  const [courses, setCourses] = useState<TeacherCourse[]>([])
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [enrollingMap, setEnrollingMap] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  async function fetchData() {
    try {
      const [cRes, eRes] = await Promise.all([
        fetch("/api/courses?teacherCatalog=true"),
        fetch("/api/enrollments")
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

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData() }, [])

  const handleEnroll = async (courseId: string) => {
    setEnrollingMap(prev => ({ ...prev, [courseId]: true }))
    try {
      const res = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId })   // userId derived from session server-side
      })
      if (res.ok) {
        await fetchData()
        setToast({ message: "Enrolled successfully! This course now appears in My Courses.", type: "success" })
      } else {
        const d = await res.json()
        setToast({ message: d.error || "Enrollment failed", type: "error" })
      }
    } catch {
      setToast({ message: "Network error. Please try again.", type: "error" })
    } finally {
      setEnrollingMap(prev => ({ ...prev, [courseId]: false }))
    }
  }

  const getEnrollment = (courseId: string) =>
    enrollments.find(e => (typeof e.courseId === "string" ? e.courseId : e.courseId?._id) === courseId)

  const filteredCourses = courses.filter(c =>
    c.title?.toLowerCase().includes(search.toLowerCase()) ||
    c.teacherId?.name?.toLowerCase().includes(search.toLowerCase())
  )

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
          Courses
        </h2>
        <p style={{ opacity: 0.6 }}>Enroll yourself in admin-created courses before entering them</p>
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
                      {course.teacherId?.name?.[0]?.toUpperCase() || 'T'}
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>{course.teacherId?.name ? formatText(course.teacherId.name) : 'Instructor'}</span>
                  </div>

                  {/* Action buttons */}
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
                        onClick={() => handleEnroll(course._id)}
                        disabled={enrollingMap[course._id]}
                        className="btn btn-primary"
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.6rem 1rem', fontSize: '0.875rem' }}
                      >
                        {enrollingMap[course._id]
                          ? <><Loader2 className="animate-spin" size={16} /> Enrolling...</>
                          : <><BookOpen size={14} /> Self-Enroll</>
                        }
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  )
}
