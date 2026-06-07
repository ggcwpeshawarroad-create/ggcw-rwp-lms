"use client"
import { useState, useEffect } from "react"
import { BookOpen, PlusCircle, Loader2, PlayCircle, Edit2 } from "lucide-react"
import Link from "next/link"

export default function TeacherCoursesPage() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    thumbnail: "",
  })

  const [editingCourse, setEditingCourse] = useState<any>(null)

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    setLoading(true)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const url = editingCourse ? `/api/courses/${editingCourse._id}` : "/api/courses"
      const method = editingCourse ? "PATCH" : "POST"
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      
      if (res.ok) {
        setFormData({ title: "", description: "", thumbnail: "" })
        setShowAddForm(false)
        setEditingCourse(null)
        fetchCourses()
      }
    } catch (err) {
      console.error("Error saving course")
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

  const handleEdit = (course: any) => {
    setEditingCourse(course)
    setFormData({
      title: course.title,
      description: course.description || "",
      thumbnail: course.thumbnail || "",
    })
    setShowAddForm(true)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'var(--primary)', padding: '0.75rem', borderRadius: '1rem', color: 'white' }}>
            <BookOpen size={24} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Course Management</h2>
        </div>
        <button 
          onClick={() => {
            setShowAddForm(!showAddForm)
            if (showAddForm) {
              setEditingCourse(null)
              setFormData({ title: "", description: "", thumbnail: "" })
            }
          }}
          className="btn btn-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          {showAddForm ? "Cancel & View List" : <><PlusCircle size={18} /> Create New Course</>}
        </button>
      </div>

      {showAddForm ? (
        <div className="glass-card animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h3 style={{ color: 'var(--primary)', marginBottom: '1.5rem', fontWeight: 700 }}>
            {editingCourse ? "Edit Course" : "Create New Course"}
          </h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Course Title</label>
              <input 
                type="text" 
                required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="e.g. Introduction to Physics"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: 'white', border: '1px solid var(--glass-border)', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Description</label>
              <textarea 
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Briefly describe what this course covers..."
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: 'white', border: '1px solid var(--glass-border)', outline: 'none', resize: 'vertical' }}
              />
            </div>
            <button className="btn btn-primary" disabled={submitting} style={{ padding: '1rem', marginTop: '0.5rem' }}>
              {submitting ? <Loader2 className="animate-spin" /> : editingCourse ? "Update Course" : "Create Course"}
            </button>
          </form>
        </div>
      ) : (
        <div className="glass-card">
          {loading && courses.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><Loader2 className="animate-spin" size={48} color="var(--primary)" /></div>
          ) : courses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1.5rem', border: '1px dashed var(--glass-border)' }}>
              <p style={{ opacity: 0.6, marginBottom: '1.5rem' }}>You haven't created any courses yet.</p>
              <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>Get Started</button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.5rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 600 }}>
                    <th style={{ padding: '1rem 1.5rem' }}>S.No</th>
                    <th style={{ padding: '1rem 1.5rem' }}>Course Title</th>
                    <th style={{ padding: '1rem 1.5rem' }}>Status</th>
                    <th style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course: any, index: number) => (
                    <tr key={course._id} style={{ background: 'rgba(255,255,255,0.02)', transition: 'background 0.2s' }}>
                      <td style={{ padding: '1rem 1.5rem', fontWeight: 600, color: '#94a3b8' }}>{index + 1}</td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ fontWeight: 600 }}>{course.title}</div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <span style={{ 
                          padding: '0.25rem 0.75rem', 
                          borderRadius: '1rem', 
                          fontSize: '0.75rem', 
                          fontWeight: 700,
                          background: course.published ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                          color: course.published ? '#10b981' : '#f59e0b'
                        }}>
                          {course.published ? "Published" : "Draft"}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                          <Link 
                            href={`/teacher/courses/${course._id}`}
                            style={{ padding: '0.5rem', borderRadius: '0.5rem', background: '#f8fafc', color: 'var(--primary)', border: '1px solid #e2e8f0' }}
                            title="Manage Content"
                          >
                            <PlayCircle size={18} />
                          </Link>
                          <button 
                            onClick={() => handleEdit(course)}
                            style={{ padding: '0.5rem', borderRadius: '0.5rem', background: '#f8fafc', color: 'var(--primary)', border: '1px solid #e2e8f0' }}
                            title="Edit Info"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => togglePublish(course._id, course.published)}
                            className="btn" 
                            style={{ 
                              padding: '0.4rem 0.8rem', 
                              fontSize: '0.75rem',
                              border: `1px solid ${course.published ? '#ef4444' : '#10b981'}`,
                              color: course.published ? '#ef4444' : '#10b981',
                              background: 'transparent'
                            }}
                          >
                            {course.published ? "Unpublish" : "Publish"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
