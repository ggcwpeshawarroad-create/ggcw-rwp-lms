"use client"
import { useState, useEffect } from "react"
import { BookOpen, Loader2, PlayCircle, Edit2, X, UserPlus, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function TeacherCoursesPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set())
  const [enrollingId, setEnrollingId] = useState<string | null>(null)
  const [academicConfig, setAcademicConfig] = useState<any[]>([])
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    thumbnail: "",
    classLevel: "",
    program: "",
    semester: "",
  })

  const classOptions = academicConfig.map(c => c.name)

  const getProgramOptions = (classLevel: string) => {
    return academicConfig.find(c => c.name === classLevel)?.programs || []
  }

  const getSemesterOptions = (classLevel: string) => {
    return academicConfig.find(c => c.name === classLevel)?.semesters || []
  }

  const hasPrograms = (classLevel: string) => getProgramOptions(classLevel).length > 0
  const hasSemesters = (classLevel: string) => getSemesterOptions(classLevel).length > 0

  const [editingCourse, setEditingCourse] = useState<any>(null)

  useEffect(() => {
    fetchCourses()
    fetchMyEnrollments()
    fetch("/api/academic-config").then(r => r.json()).then(data => setAcademicConfig(data.classes || []))
  }, [])

  const fetchMyEnrollments = async () => {
    try {
      const res = await fetch("/api/enrollments")
      const data = await res.json()
      if (res.ok) {
        const ids = new Set<string>(data.map((e: any) => e.courseId?._id || e.courseId))
        setEnrolledIds(ids)
      }
    } catch {}
  }

  const selfEnroll = async (courseId: string) => {
    setEnrollingId(courseId)
    try {
      const res = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      })
      if (res.ok) {
        setEnrolledIds(prev => new Set([...prev, courseId]))
      }
    } catch {}
    setEnrollingId(null)
  }

  const fetchCourses = async () => {
    setLoading(true)
    try {
      const [assignedRes, enrolledRes] = await Promise.all([
        fetch("/api/courses"),
        fetch("/api/enrollments"),
      ])
      const assignedData = await assignedRes.json()
      const enrolledData = await enrolledRes.json()

      const merged = new Map<string, any>()
      if (assignedRes.ok) {
        assignedData.forEach((course: any) => merged.set(course._id, course))
      }
      if (enrolledRes.ok) {
        enrolledData.forEach((enrollment: any) => {
          const course = enrollment.courseId
          if (course?._id) merged.set(course._id, course)
        })
      }

      setCourses(Array.from(merged.values()))
    } catch (err) {
      console.error("Failed to fetch courses")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCourse) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/courses/${editingCourse._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      
      if (res.ok) {
        setFormData({ title: "", description: "", thumbnail: "", classLevel: "", program: "", semester: "" })
        setShowEditModal(false)
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
      classLevel: course.classLevel || "",
      program: course.program || "",
      semester: course.semester || "",
    })
    setShowEditModal(true)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'var(--primary)', padding: '0.75rem', borderRadius: '1rem', color: 'white' }}>
            <BookOpen size={24} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>My Courses</h2>
        </div>
      </div>

      <div className="glass-card">
          {loading && courses.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><Loader2 className="animate-spin" size={48} color="var(--primary)" /></div>
          ) : courses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1.5rem', border: '1px dashed var(--glass-border)' }}>
              <p style={{ opacity: 0.6 }}>You have not enrolled in any courses yet.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.5rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 600 }}>
                     <th style={{ padding: '1rem 1.5rem' }}>S.No</th>
                    <th style={{ padding: '1rem 1.5rem' }}>Course Title</th>
                    <th style={{ padding: '1rem 1.5rem' }}>Class</th>
                    <th style={{ padding: '1rem 1.5rem' }}>Status</th>
                    <th style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course: any, index: number) => (
                    <tr key={course._id} style={{ background: 'rgba(255,255,255,0.02)', transition: 'background 0.2s' }}>
                      <td style={{ padding: '1rem 1.5rem', fontWeight: 600, color: '#94a3b8' }}>{index + 1}</td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ fontWeight: 600 }} className="capitalize">{course.title}</div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }} className="capitalize">
                          <span style={{ fontWeight: 600, color: 'var(--primary)', background: 'var(--primary)10', padding: '0.25rem 0.5rem', borderRadius: '0.5rem', alignSelf: 'flex-start' }}>
                            {course.classLevel || "N/A"}
                          </span>
                          {course.program && (
                            <span style={{ fontSize: '0.7rem', opacity: 0.6, marginTop: '0.25rem', paddingLeft: '0.25rem' }}>
                              {course.program}
                            </span>
                          )}
                          {course.semester && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600, marginTop: '0.1rem', paddingLeft: '0.25rem' }}>
                              {course.semester}
                            </span>
                          )}
                        </div>
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
                            title="Enter Course"
                          >
                            <PlayCircle size={18} />
                          </Link>
                          {course.isOwner && (
                          <button 
                            onClick={() => handleEdit(course)}
                            style={{ padding: '0.5rem', borderRadius: '0.5rem', background: '#f8fafc', color: 'var(--primary)', border: '1px solid #e2e8f0' }}
                            title="Edit Info"
                          >
                            <Edit2 size={18} />
                          </button>
                          )}
                          {enrolledIds.has(course._id) ? (
                            <span style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderRadius: '0.5rem', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                              <CheckCircle size={14} /> Enrolled
                            </span>
                          ) : (
                            <button
                              onClick={() => selfEnroll(course._id)}
                              disabled={enrollingId === course._id}
                              title="Enroll Yourself"
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderRadius: '0.5rem', background: 'rgba(79,70,229,0.08)', color: 'var(--primary)', border: '1px solid rgba(79,70,229,0.2)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600, cursor: 'pointer' }}
                            >
                              {enrollingId === course._id ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                              Self-Enroll
                            </button>
                          )}
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
 
      {/* Edit Modal */}
      {showEditModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-card animate-scale-in" style={{ maxWidth: '500px', width: '100%', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>Edit Course Info</h3>
              <button 
                onClick={() => {
                  setShowEditModal(false)
                  setEditingCourse(null)
                }} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5 }}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Class Level</label>
                <select 
                  value={formData.classLevel}
                  onChange={(e) => setFormData({...formData, classLevel: e.target.value, program: "", semester: ""})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: '#f8fafc', border: '1px solid var(--glass-border)', outline: 'none' }}
                >
                  <option value="">Select Class</option>
                  {classOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Program / Stream</label>
                {formData.classLevel && hasPrograms(formData.classLevel) ? (
                  <select 
                    value={formData.program}
                    onChange={(e) => setFormData({...formData, program: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: '#f8fafc', border: '1px solid var(--glass-border)', outline: 'none' }}
                  >
                    <option value="">Select Program</option>
                    {getProgramOptions(formData.classLevel).map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : (
                  <input 
                    type="text"
                    placeholder={formData.classLevel ? "Custom tags or program..." : "Select class first"}
                    disabled={!formData.classLevel}
                    value={formData.program}
                    onChange={(e) => setFormData({...formData, program: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: formData.classLevel ? '#f8fafc' : '#f1f5f9', border: '1px solid var(--glass-border)', outline: 'none' }}
                  />
                )}
              </div>
              {formData.classLevel && hasSemesters(formData.classLevel) && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Semester</label>
                  <select 
                    required
                    value={formData.semester}
                    onChange={(e) => setFormData({...formData, semester: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: '#f8fafc', border: '1px solid var(--glass-border)', outline: 'none' }}
                  >
                    <option value="">Select Semester</option>
                    {getSemesterOptions(formData.classLevel).map((s: string) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Description</label>
                <textarea 
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
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
