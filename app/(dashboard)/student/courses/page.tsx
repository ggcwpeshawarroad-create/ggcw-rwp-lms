"use client"

import { BookOpen, Search, PlayCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"

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
          {courses.map((course) => (
            <div key={course._id} className="glass-card">
              <Link href={`/student/courses/${course._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ position: 'relative', height: '140px', background: 'var(--primary)10', borderRadius: '0.75rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BookOpen size={40} color="var(--primary)" />
                </div>
                <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }} className="capitalize">{course.title}</h3>
                <p style={{ fontSize: '0.875rem', opacity: 0.6, marginBottom: '1.5rem' }} className="capitalize">{course.description}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary)' }}>
                      <PlayCircle size={16} /> Continue Learning
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
