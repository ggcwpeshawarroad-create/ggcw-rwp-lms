"use client"

import { BookOpen, PlayCircle, Loader2, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { formatText } from "@/lib/utils"

export default function StudentCoursesPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEnrollments()
  }, [])

  const fetchEnrollments = async () => {
    try {
      const res = await fetch("/api/enrollments")
      const data = await res.json()
      if (res.ok) {
        // Enrollment includes courseId populated
        setCourses(data.map((e: any) => e.courseId).filter(Boolean))
      }
    } catch (err) {
      console.error("Failed to fetch enrollments")
    } finally {
      setLoading(false)
    }
  }

  const gradients = [
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
  ]

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '10rem' }}><Loader2 className="animate-spin" size={48} color="var(--primary)" /></div>

  return (
    <div className="glass-card animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: 'var(--primary)', padding: '0.75rem', borderRadius: '1rem', color: 'white' }}>
          <BookOpen size={24} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>My Enrolled Courses</h2>
      </div>

      {courses.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {courses.map((course, idx) => (
            <div key={course._id} className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
              <Link href={`/student/courses/${course._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ position: 'relative', height: '145px', background: gradients[idx % gradients.length], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BookOpen size={48} color="rgba(255,255,255,0.85)" />
                  <div style={{ position: 'absolute', left: '1rem', bottom: '0.85rem', background: 'rgba(0,0,0,0.32)', color: 'white', padding: '0.22rem 0.7rem', borderRadius: '0.5rem', fontSize: '0.72rem', fontWeight: 800, backdropFilter: 'blur(4px)' }}>
                    Enrolled
                  </div>
                </div>
                <div style={{ padding: '1.25rem' }}>
                  <h3 style={{ fontWeight: 800, marginBottom: '0.65rem', color: '#1e293b' }}>{formatText(course.title)}</h3>
                  {(course.program || course.classLevel || course.semester) && (
                    <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.9rem', flexWrap: 'wrap' }}>
                      {course.program && <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#4f46e5', background: 'rgba(79,70,229,0.08)', padding: '0.12rem 0.5rem', borderRadius: '0.35rem' }}>{formatText(course.program)}</span>}
                      {course.classLevel && <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#059669', background: 'rgba(16,185,129,0.08)', padding: '0.12rem 0.5rem', borderRadius: '0.35rem' }}>{formatText(course.classLevel)}</span>}
                      {course.semester && <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#d97706', background: 'rgba(245,158,11,0.08)', padding: '0.12rem 0.5rem', borderRadius: '0.35rem' }}>{formatText(course.semester)}</span>}
                    </div>
                  )}
                  <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.5, minHeight: '2.6rem' }}>{course.description ? formatText(course.description) : "No description provided."}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary)' }}>
                      <PlayCircle size={16} /> Continue Learning
                    </div>
                    <ArrowRight size={16} color="#94a3b8" />
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1.5rem', border: '1px dashed var(--glass-border)' }}>
          <p style={{ opacity: 0.6, marginBottom: '2rem' }}>You haven't enrolled in any courses yet.</p>
          <Link href="/student/browse" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            Browse Course Catalog
          </Link>
        </div>
      )}
    </div>
  )
}
