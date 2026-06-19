"use client"

import { useState, useEffect } from "react"
import { Users, UserPlus, Search, Loader2, BookOpen, Trash2, Mail, X } from "lucide-react"
import { Toast, ToastType } from "@/components/ui/Toast"
import { SearchableSelect } from "@/components/ui/SearchableSelect"

export default function TeacherStudentsPage() {
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  const [enrollForm, setEnrollForm] = useState({
      userId: "",
      courseId: ""
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [eRes, cRes, uRes] = await Promise.all([
        fetch("/api/enrollments"),
        fetch("/api/courses"),
        fetch("/api/admin/users?limit=500") // Fetch more users for the search dropdown
      ])
      
      const eData = await eRes.json()
      const cData = await cRes.json()
      const uData = await uRes.json()

      if (eRes.ok) {
        setEnrollments(eData.filter((enrollment: any) => enrollment.userId?.role === "STUDENT"))
      }

      if (cRes.ok) setCourses(cData)

      if (uRes.ok) setStudents(uData.users.filter((u: any) => u.role === "STUDENT"))
    } catch (err) {
      console.error("Failed to fetch data")
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(enrollForm)
      })
      if (res.ok) {
        setShowEnrollModal(false)
        fetchData()
        setToast({ message: "Student enrolled successfully!", type: "success" })
      } else {
        const d = await res.json()
        setToast({ message: d.error || "Enrollment failed", type: "error" })
      }
    } catch (err) {
      console.error("Enrollment failed")
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemove = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from this course?`)) return

    try {
      const res = await fetch(`/api/enrollments/${id}`, { method: "DELETE" })
      if (res.ok) {
        fetchData()
        setToast({ message: "Student removed from course", type: "success" })
      } else {
        const d = await res.json()
        setToast({ message: d.error || "Failed to remove student", type: "error" })
      }
    } catch (err) {
      console.error("Removal failed")
    }
  }

  const filteredEnrollments = enrollments.filter(e =>
    e.userId?.name?.toLowerCase().includes(search.toLowerCase()) ||
    e.courseId?.title?.toLowerCase().includes(search.toLowerCase()) ||
    e.userId?.program?.toLowerCase().includes(search.toLowerCase()) ||
    e.userId?.classLevel?.toLowerCase().includes(search.toLowerCase()) ||
    e.userId?.registrationNumber?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="glass-card animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'var(--primary)', padding: '0.75rem', borderRadius: '1rem', color: 'white' }}>
            <Users size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Student Roster</h2>
            <p style={{ fontSize: '0.875rem', opacity: 0.6 }}>Manage students enrolled in your courses</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', width: '100%', maxWidth: '600px', justifyContent: 'flex-end' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} size={18} />
            <input 
              type="text" 
              placeholder="Search by student or course..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 3rem', borderRadius: '1rem', background: 'white', border: '1px solid var(--glass-border)', outline: 'none' }}
            />
          </div>
          <button 
            onClick={() => setShowEnrollModal(true)}
            className="btn btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem' }}
          >
            <UserPlus size={18} />
            Enroll Student
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader2 className="animate-spin" size={48} color="var(--primary)" />
        </div>
      ) : filteredEnrollments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.5 }}>No enrollments found.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.5rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '0.75rem 1.25rem' }}>Student</th>
                <th style={{ padding: '0.75rem 1.25rem' }}>Program / Class</th>
                <th style={{ padding: '0.75rem 1.25rem' }}>Enrolled Course</th>
                <th style={{ padding: '0.75rem 1.25rem' }}>Date</th>
                <th style={{ padding: '0.75rem 1.25rem', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEnrollments.map((enr: any) => (
                <tr key={enr._id} style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', borderRadius: '0.75rem' }}>
                  {/* Student info */}
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'var(--primary)15', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 800, fontSize: '1rem', flexShrink: 0 }}>
                        {enr.userId?.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }} className="capitalize">{enr.userId?.name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{enr.userId?.email}</div>
                        {enr.userId?.registrationNumber && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 700, marginTop: '0.1rem' }}>Reg# {enr.userId.registrationNumber}</div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Program / Class / Semester */}
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      {enr.userId?.program && (
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.55rem', borderRadius: '0.35rem', background: 'rgba(79,70,229,0.08)', color: '#4f46e5', width: 'fit-content' }}>
                          {enr.userId.program}
                        </span>
                      )}
                      {enr.userId?.classLevel && (
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.55rem', borderRadius: '0.35rem', background: 'rgba(16,185,129,0.08)', color: '#059669', width: 'fit-content' }}>
                          {enr.userId.classLevel}
                        </span>
                      )}
                      {enr.userId?.semester && (
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.55rem', borderRadius: '0.35rem', background: 'rgba(245,158,11,0.08)', color: '#d97706', width: 'fit-content' }}>
                          {enr.userId.semester}
                        </span>
                      )}
                      {!enr.userId?.program && !enr.userId?.classLevel && !enr.userId?.semester && (
                        <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>—</span>
                      )}
                    </div>
                  </td>

                  {/* Course */}
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <BookOpen size={15} style={{ color: '#94a3b8', flexShrink: 0 }} />
                      <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.875rem' }} className="capitalize">{enr.courseId?.title}</span>
                    </div>
                  </td>

                  {/* Date */}
                  <td style={{ padding: '1rem 1.25rem' }}>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {new Date(enr.createdAt).toLocaleDateString()}
                    </span>
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '1rem 1.25rem', textAlign: 'center' }}>
                    <button
                      onClick={() => handleRemove(enr._id, enr.userId?.name)}
                      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', cursor: 'pointer', padding: '0.4rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      title="Remove Student"
                    >
                      <Trash2 size={13} /> Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Enroll Student Modal */}
      {showEnrollModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-card animate-scale-in" style={{ maxWidth: '500px', width: '100%', background: 'white' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--primary)' }}>Enroll Student in Course</h3>
            <form onSubmit={handleEnroll} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <SearchableSelect 
                label="Select Student"
                placeholder="Search by name or email..."
                value={enrollForm.userId}
                onChange={(val) => setEnrollForm({...enrollForm, userId: val})}
                options={students.map(s => ({
                   id: s._id,
                   label: s.name || "Anonymous Student",
                   subLabel: `${s.email}${s.registrationNumber ? ` | Reg: ${s.registrationNumber}` : ""}`
                }))}
              />
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Select Course</label>
                <select 
                  required
                  value={enrollForm.courseId}
                  onChange={(e) => setEnrollForm({...enrollForm, courseId: e.target.value})}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: '#f8fafc', border: '1px solid var(--glass-border)', outline: 'none' }}
                >
                  <option value="">{courses.length === 0 ? "No courses available" : "Choose a course..."}</option>
                  {courses.map(c => (
                    <option key={c._id} value={c._id} className="capitalize">{c.title}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowEnrollModal(false)} className="btn" style={{ flex: 1, background: '#f1f5f9' }}>Cancel</button>
                <button type="submit" disabled={submitting} className="btn btn-primary" style={{ flex: 1 }}>
                  {submitting ? <Loader2 className="animate-spin" size={20} /> : "Enroll Student"}
                </button>
              </div>
            </form>
          </div>
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
