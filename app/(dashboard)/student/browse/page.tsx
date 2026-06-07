"use client"

import { useState, useEffect } from "react"
import { Search, BookOpen, User, PlayCircle, Loader2, CheckCircle } from "lucide-react"
import { Toast, ToastType } from "@/components/ui/Toast"

export default function StudentBrowsePage() {
  const [courses, setCourses] = useState<any[]>([])
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [enrollingMap, setEnrollingMap] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [cRes, eRes] = await Promise.all([
        fetch("/api/courses"),
        fetch("/api/enrollments")
      ])
      const cData = await cRes.json()
      const eData = await eRes.json()
      
      if (cRes.ok) setCourses(cData)
      if (eRes.ok) setEnrollments(eData)
    } catch (err) {
      console.error("Failed to fetch data")
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async (courseId: string) => {
    setEnrollingMap(prev => ({ ...prev, [courseId]: true }))
    try {
      const res = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: undefined, courseId }) // userId will be handled by server from session for students
      })
      if (res.ok) {
        fetchData()
        setToast({ message: "You have successfully enrolled in the course!", type: "success" })
      } else {
        const d = await res.json()
        setToast({ message: d.error || "Enrollment failed", type: "error" })
      }
    } catch (err) {
      console.error("Enrollment failed")
    } finally {
        setEnrollingMap(prev => ({ ...prev, [courseId]: false }))
    }
  }

  const isEnrolled = (courseId: string) => {
    return enrollments.some(e => e.courseId?._id === courseId)
  }

  const handleUnenroll = async (enrollmentId: string) => {
    if (!confirm("Are you sure you want to unenroll from this course?")) return
    try {
      const res = await fetch(`/api/enrollments/${enrollmentId}`, { method: "DELETE" })
      if (res.ok) {
        fetchData()
        setToast({ message: "Unenrolled successfully!", type: "success" })
      }
    } catch (err) {
      console.error("Unenrollment failed")
    }
  }

  const getEnrollmentId = (courseId: string) => {
    return enrollments.find(e => e.courseId?._id === courseId)?._id
  }

  const filteredCourses = courses.filter(c => 
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.teacherId?.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.5rem' }}>Browse Courses</h2>
        <p style={{ opacity: 0.6 }}>Discover new skills and expand your knowledge</p>
      </div>

      <div style={{ position: 'relative', maxWidth: '500px', marginBottom: '3rem' }}>
        <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} size={20} />
        <input 
          type="text" 
          placeholder="What do you want to learn today?" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '1rem 1rem 1rem 3.5rem', borderRadius: '1rem', background: 'white', border: '1px solid var(--glass-border)', outline: 'none', fontSize: '1rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}
        />
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader2 className="animate-spin" size={48} color="var(--primary)" />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
          {filteredCourses.map((course) => (
            <div key={course._id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '1.25rem', transition: 'transform 0.2s', cursor: 'default' }}>
              <div style={{ position: 'relative', height: '160px', background: 'var(--primary)10', borderRadius: '0.75rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                <BookOpen size={48} />
                <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', background: 'var(--primary)', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 600 }}>
                  {course.enrollmentCount || 0} Learners
                </div>
              </div>
              
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>{course.title}</h3>
              <p style={{ fontSize: '0.875rem', opacity: 0.6, marginBottom: '1.5rem', flex: 1 }}>{course.description}</p>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--glass-border)', paddingTop: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 700, fontSize: '0.7rem' }}>
                    {course.teacherId?.name?.[0] || 'T'}
                  </div>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, opacity: 0.8 }}>{course.teacherId?.name}</span>
                </div>

                {getEnrollmentId(course._id) ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#10b981', fontSize: '0.75rem', fontWeight: 700 }}>
                      <CheckCircle size={14} /> Enrolled
                    </div>
                    <button 
                      onClick={() => handleUnenroll(getEnrollmentId(course._id))}
                      style={{ fontSize: '0.7rem', color: '#ef4444', background: 'none', border: '1px solid #ef4444', padding: '0.2rem 0.5rem', borderRadius: '0.4rem', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Unenroll
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => handleEnroll(course._id)}
                    disabled={enrollingMap[course._id]}
                    className="btn btn-primary" 
                    style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                  >
                    {enrollingMap[course._id] ? <Loader2 className="animate-spin" size={16} /> : "Enroll Now"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  )
}
