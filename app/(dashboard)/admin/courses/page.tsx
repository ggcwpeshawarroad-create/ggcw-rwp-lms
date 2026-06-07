"use client"

import { useState, useEffect } from "react"
import { BookOpen, Loader2, Calendar, User, Search, PlayCircle, Trash2, Edit2, Info, X } from "lucide-react"

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [editingCourse, setEditingCourse] = useState<any>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
  })

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const res = await fetch("/api/courses")
      const data = await res.json()
      if (res.ok) {
        setCourses(data)
      }
    } catch (err) {
      console.error("Failed to fetch courses")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete the course "${title}"? This cannot be undone.`)) return

    try {
      const res = await fetch(`/api/courses/${id}`, { method: "DELETE" })
      if (res.ok) {
        fetchCourses()
      }
    } catch (err) {
      console.error("Failed to delete course")
    }
  }

  const handleEdit = (course: any) => {
    setEditingCourse(course)
    setFormData({
      title: course.title,
      description: course.description || "",
    })
    setShowEditModal(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch(`/api/courses/${editingCourse._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        setShowEditModal(false)
        setEditingCourse(null)
        fetchCourses()
      }
    } catch (err) {
      console.error("Error updating course")
    } finally {
      setSubmitting(false)
    }
  }

  const togglePublish = async (courseId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !currentStatus }),
      })
      if (res.ok) fetchCourses()
    } catch (err) {
      console.error("Error toggling publish status")
    }
  }

  const filteredCourses = courses.filter(course => 
    course.title.toLowerCase().includes(search.toLowerCase()) || 
    course.teacherId?.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="glass-card animate-fade-in" style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'var(--primary)', padding: '0.75rem', borderRadius: '1rem', color: 'white' }}>
            <BookOpen size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Total Platform Courses</h2>
            <p style={{ fontSize: '0.875rem', opacity: 0.6 }}>Oversee and manage all curriculum content</p>
          </div>
        </div>

        <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
          <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} size={18} />
          <input 
            type="text" 
            placeholder="Search courses or teachers..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 3rem', borderRadius: '1rem', background: 'white', border: '1px solid var(--glass-border)', outline: 'none' }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader2 className="animate-spin" size={48} color="var(--primary)" />
        </div>
      ) : filteredCourses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.5 }}>No courses found.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.5rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 600 }}>
                <th style={{ padding: '1rem 1.5rem' }}>Course Info</th>
                <th style={{ padding: '1rem 1.5rem' }}>Instructor</th>
                <th style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>Enrolled</th>
                <th style={{ padding: '1rem 1.5rem' }}>Status</th>
                <th style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.map((course: any) => (
                <tr key={course._id} style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '0.75rem', background: 'var(--primary)10', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                        <PlayCircle size={24} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{course.title}</div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.6, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {course.description || "No description provided"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 700, fontSize: '0.75rem' }}>
                        {course.teacherId?.name?.[0] || 'T'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{course.teacherId?.name || "Unknown Teacher"}</div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{course.teacherId?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.1rem' }}>
                      {course.enrollmentCount || 0}
                    </div>
                    <div style={{ fontSize: '0.65rem', opacity: 0.5 }}>Students</div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '1rem', 
                      fontSize: '0.75rem', 
                      fontWeight: 700,
                      background: course.published ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      color: course.published ? '#10b981' : '#f59e0b',
                      border: `1px solid ${course.published ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`
                    }}>
                      {course.published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                      <button 
                        onClick={() => handleEdit(course)}
                        style={{ padding: '0.5rem', background: 'none', border: 'none', color: '#10b981', cursor: 'pointer' }}
                        title="Edit Course"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => togglePublish(course._id, course.published)}
                        style={{ 
                          padding: '0.4rem 0.8rem', 
                          fontSize: '0.75rem',
                          borderRadius: '0.5rem',
                          border: `1px solid ${course.published ? '#ef4444' : '#10b981'}`,
                          color: course.published ? '#ef4444' : '#10b981',
                          background: 'transparent',
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        {course.published ? "Unpublish" : "Publish"}
                      </button>
                      <button 
                        onClick={() => handleDelete(course._id, course.title)}
                        style={{ padding: '0.5rem', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                        title="Delete Course"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-card animate-scale-in" style={{ maxWidth: '500px', width: '100%', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>Edit Course Name</h3>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5 }}><X size={20} /></button>
            </div>
            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Course Title</label>
                <input 
                  type="text" 
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: '#f8fafc', border: '1px solid var(--glass-border)', outline: 'none' }}
                />
              </div>
              <button className="btn btn-primary" disabled={submitting} style={{ padding: '0.75rem', marginTop: '0.5rem' }}>
                {submitting ? <Loader2 className="animate-spin" /> : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
