"use client"

import { useState, useEffect } from "react"
import { BookOpen, Loader2, Calendar, User, Search, PlayCircle, Trash2, Edit2, Info, X, PlusCircle } from "lucide-react"

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [editingCourse, setEditingCourse] = useState<any>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [teachers, setTeachers] = useState<any[]>([])
  const [academicConfig, setAcademicConfig] = useState<any[]>([])

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    classLevel: "",
    program: "",
    semester: "",
    teacherId: "",
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

  useEffect(() => {
    fetchCourses()
    fetchTeachers()
    fetch("/api/academic-config").then(r => r.json()).then(data => setAcademicConfig(data.classes || []))
  }, [])

  const fetchTeachers = async () => {
    try {
      const res = await fetch("/api/admin/users?role=TEACHER")
      const data = await res.json()
      if (res.ok) {
        setTeachers(data.users)
      }
    } catch (err) {
      console.error("Failed to fetch teachers")
    }
  }

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
      classLevel: course.classLevel || "",
      program: course.program || "",
      semester: course.semester || "",
      teacherId: course.teacherId?._id || course.teacherId || "",
    })
    setShowEditModal(true)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        setShowAddModal(false)
        setFormData({ title: "", description: "", classLevel: "", program: "", semester: "", teacherId: "" })
        fetchCourses()
      }
    } catch (err) {
      console.error("Error creating course")
    } finally {
      setSubmitting(false)
    }
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

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} size={18} />
            <input 
              type="text" 
              placeholder="Search courses or teachers..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 3rem', borderRadius: '1rem', background: 'white', border: '1px solid var(--glass-border)', outline: 'none' }}
            />
          </div>
          <button 
            onClick={() => {
              setFormData({ title: "", description: "", classLevel: "", program: "", semester: "", teacherId: "" })
              setShowAddModal(true)
            }}
            className="btn btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}
          >
            <PlusCircle size={18} /> Create Course
          </button>
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
                <th style={{ padding: '1rem 1.5rem' }}>Class</th>
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
                        <div style={{ fontWeight: 600 }} className="capitalize">{course.title}</div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.6, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} className="capitalize">
                          {course.description || "No description provided"}
                        </div>
                      </div>
                    </div>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 700, fontSize: '0.75rem' }}>
                        {course.teacherId?.name?.[0] || 'T'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }} className="capitalize">{course.teacherId?.name || "Unknown Teacher"}</div>
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
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>Edit Course</h3>
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
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Semester</label>
                  <select 
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
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Assign Instructor <span style={{ fontWeight: 400, opacity: 0.5, fontSize: '0.8rem' }}>(Optional)</span></label>
                <select 
                  value={formData.teacherId}
                  onChange={(e) => setFormData({...formData, teacherId: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: '#f8fafc', border: '1px solid var(--glass-border)', outline: 'none' }}
                >
                  <option value="">No instructor assigned</option>
                  {teachers.map(t => (
                    <option key={t._id} value={t._id}>{t.name} ({t.email})</option>
                  ))}
                </select>
              </div>
              <button className="btn btn-primary" disabled={submitting} style={{ padding: '0.75rem', marginTop: '0.5rem' }}>
                {submitting ? <Loader2 className="animate-spin" /> : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, padding: '5rem 1rem 1rem', overflowY: 'auto' }}>
          <div className="glass-card animate-scale-in" style={{ maxWidth: '500px', width: '100%', background: 'white', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>Create New Course</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5 }}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Course Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Physics"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: '#f8fafc', border: '1px solid var(--glass-border)', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Class Level</label>
                <select 
                  required
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
                    required
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
                <div>
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
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Assign Instructor <span style={{ fontWeight: 400, opacity: 0.5, fontSize: '0.8rem' }}>(Optional)</span></label>
                <select 
                  value={formData.teacherId}
                  onChange={(e) => setFormData({...formData, teacherId: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: '#f8fafc', border: '1px solid var(--glass-border)', outline: 'none' }}
                >
                  <option value="">No instructor assigned</option>
                  {teachers.map(t => (
                    <option key={t._id} value={t._id}>{t.name} ({t.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Description</label>
                <textarea 
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: '#f8fafc', border: '1px solid var(--glass-border)', outline: 'none' }}
                />
              </div>
              <button className="btn btn-primary" disabled={submitting} style={{ padding: '0.75rem', marginTop: '0.5rem' }}>
                {submitting ? <Loader2 className="animate-spin" /> : "Create Course"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
