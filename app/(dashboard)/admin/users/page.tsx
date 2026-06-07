"use client"

import { useState, useEffect } from "react"
import { Users, Loader2, Search, ChevronLeft, ChevronRight, X, PlusCircle, BookOpen, Trash2, CheckCircle, Lock } from "lucide-react"
import Link from "next/link"
import { Toast, ToastType } from "@/components/ui/Toast"
import { SearchableSelect } from "@/components/ui/SearchableSelect"

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const limit = 50

  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [userEnrollments, setUserEnrollments] = useState<any[]>([])
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [selectedCourseId, setSelectedCourseId] = useState("")
  
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [newPassword, setNewPassword] = useState("")

  useEffect(() => {
    fetchUsers()
    fetchCourses()
  }, [page, search])

  const fetchUserEnrollments = async (userId: string) => {
    try {
        const res = await fetch(`/api/enrollments?userId=${userId}`)
        const data = await res.json()
        if (res.ok) setUserEnrollments(data)
    } catch (err) {
        console.error("Failed to fetch user enrollments")
    }
  }

  const handleOpenAssign = (user: any) => {
    setSelectedUser(user)
    fetchUserEnrollments(user._id)
    setShowAssignModal(true)
  }

  const handleRemoveEnrollment = async (enrollmentId: string) => {
    if (!confirm("Are you sure you want to remove this course assignment?")) return
    try {
      const res = await fetch(`/api/enrollments/${enrollmentId}`, { method: "DELETE" })
      if (res.ok) {
        fetchUserEnrollments(selectedUser._id)
        setToast({ message: "Course assignment removed", type: "success" })
      }
    } catch (err) {
      console.error("Removal failed")
    }
  }

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users?page=${page}&limit=${limit}&search=${search}`)
      const data = await res.json()
      if (res.ok) {
        setUsers(data.users)
        setTotalPages(data.pages)
        setTotalUsers(data.total)
      }
    } catch (err) {
      console.error("Failed to fetch users")
    } finally {
      setLoading(false)
    }
  }

  const fetchCourses = async () => {
    try {
      const res = await fetch("/api/courses")
      const data = await res.json()
      if (res.ok) setCourses(data)
    } catch (err) {
      console.error("Failed to fetch courses")
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword || newPassword.length < 6) {
      setToast({ message: "Password must be at least 6 characters", type: "error" })
      return
    }

    setResetting(true)
    try {
      const res = await fetch(`/api/admin/users/${selectedUser._id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword })
      })

      if (res.ok) {
        setShowResetModal(false)
        setNewPassword("")
        setToast({ message: "Password reset successfully!", type: "success" })
      } else {
        const d = await res.json()
        setToast({ message: d.error || "Reset failed", type: "error" })
      }
    } catch (err) {
      setToast({ message: "Something went wrong", type: "error" })
    } finally {
      setResetting(false)
    }
  }

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault()
    setAssigning(true)
    try {
      const res = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUser._id, courseId: selectedCourseId })
      })
      if (res.ok) {
        setSelectedCourseId("")
        fetchUserEnrollments(selectedUser._id)
        setToast({ message: "Course assigned successfully!", type: "success" })
      } else {
        const d = await res.json()
        setToast({ message: d.error || "Assignment failed", type: "error" })
      }
    } catch (err) {
      console.error("Assignment failed")
    } finally {
      setAssigning(false)
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setPage(1) // Reset to first page on search
  }

  return (
    <div style={{ position: 'relative' }}>
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'var(--primary)', padding: '0.75rem', borderRadius: '1rem', color: 'white' }}>
              <Users size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>User Directory</h2>
              <p style={{ opacity: 0.6, fontSize: '0.875rem' }}>Total Users: {totalUsers}</p>
            </div>
          </div>
          
          <div style={{ position: 'relative', width: '300px' }}>
            <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} size={18} />
            <input 
              type="text" 
              placeholder="Search by name, email, or reg no..." 
              value={search}
              onChange={handleSearchChange}
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 3rem',
                borderRadius: '0.75rem',
                border: '1px solid var(--glass-border)',
                background: 'rgba(255,255,255,0.05)',
                outline: 'none',
                fontSize: '0.875rem'
              }}
            />
          </div>
        </div>
      </div>

      <div className="glass-card">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><Loader2 className="animate-spin" size={48} color="var(--primary)" /></div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.5rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 600 }}>
                    <th style={{ padding: '1rem 1.5rem' }}>S.No</th>
                    <th style={{ padding: '1rem 1.5rem' }}>User Info</th>
                    <th style={{ padding: '1rem 1.5rem' }}>Reg No.</th>
                    <th style={{ padding: '1rem 1.5rem' }}>Email Address</th>
                    <th style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>Role</th>
                    <th style={{ padding: '1rem 1.5rem' }}>Last Login</th>
                    <th style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user: any, index: number) => (
                    <tr key={user._id} style={{ background: 'rgba(255,255,255,0.02)', transition: 'background 0.2s' }}>
                      <td style={{ padding: '1rem 1.5rem', fontWeight: 600, color: '#94a3b8' }}>
                        {(page - 1) * limit + index + 1}
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ fontWeight: 600 }}>{user.name || "Anonymous User"}</div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>ID: {user._id.slice(-6)}</div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        {user.registrationNumber ? (
                          <span style={{ fontWeight: 700, color: 'var(--primary)', background: 'var(--primary)15', padding: '0.3rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.85rem' }}>
                            {user.registrationNumber}
                          </span>
                        ) : (
                          <span style={{ opacity: 0.3, fontStyle: 'italic', fontSize: '0.85rem' }}>N/A</span>
                        )}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', opacity: 0.8 }}>{user.email}</td>
                      <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                        <span style={{ 
                          padding: '0.35rem 1rem', 
                          borderRadius: '1rem', 
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: user.role === "ADMIN" ? 'rgba(239, 68, 68, 0.1)' : user.role === "TEACHER" ? 'rgba(99, 102, 241, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                          color: user.role === "ADMIN" ? '#ef4444' : user.role === "TEACHER" ? '#6366f1' : '#10b981',
                        }}>
                          {user.role}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', opacity: 0.8, fontSize: '0.875rem' }}>
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          {user.role === "STUDENT" && (
                            <button 
                              onClick={() => { setSelectedUser(user); setShowAssignModal(true); }}
                              className="btn"
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', background: 'var(--primary)15', color: 'var(--primary)', fontWeight: 600, border: 'none', borderRadius: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                            >
                              <PlusCircle size={14} /> Course
                            </button>
                          )}
                          <button 
                            onClick={() => { setSelectedUser(user); setShowResetModal(true); }}
                            className="btn"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontWeight: 600, border: 'none', borderRadius: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                            title="Reset Password"
                          >
                            <Lock size={14} /> Reset
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2.5rem', padding: '1rem 0' }}>
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)', background: 'none', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.3 : 1 }}
                >
                  <ChevronLeft size={20} />
                </button>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setPage(i + 1)}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '0.5rem',
                        border: '1px solid var(--glass-border)',
                        background: page === i + 1 ? 'var(--primary)' : 'none',
                        color: page === i + 1 ? 'white' : 'inherit',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)', background: 'none', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.3 : 1 }}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Assign Course Modal */}
      {showAssignModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-card animate-scale-in" style={{ maxWidth: '500px', width: '100%', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>Manage Courses: {selectedUser?.name}</h3>
              <button onClick={() => setShowAssignModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5 }}><X size={20} /></button>
            </div>

            {/* List of current enrollments */}
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 700, opacity: 0.6, marginBottom: '0.75rem', textTransform: 'uppercase' }}>Active Enrollments</h4>
              {userEnrollments.length === 0 ? (
                <p style={{ fontSize: '0.875rem', opacity: 0.5, fontStyle: 'italic' }}>No active enrollments.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {userEnrollments.map(e => (
                    <div key={e._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <BookOpen size={16} color="var(--primary)" />
                        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{e.courseId?.title}</span>
                      </div>
                      <button 
                        onClick={() => handleRemoveEnrollment(e._id)}
                        style={{ padding: '0.35rem', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                        title="Remove Assignment"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 700, opacity: 0.6, marginBottom: '1rem', textTransform: 'uppercase' }}>Assign New Course</h4>
              <form onSubmit={handleAssign} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <SearchableSelect 
                    label="Select Course to Assign"
                    placeholder="Search by course title..."
                    value={selectedCourseId}
                    onChange={(val) => setSelectedCourseId(val)}
                    options={courses
                      .filter(c => !userEnrollments.some(e => e.courseId?._id === c._id))
                      .map(c => ({
                        id: c._id,
                        label: c.title,
                        subLabel: c.teacherId?.name ? `Instructor: ${c.teacherId.name}` : undefined
                      }))
                    }
                  />
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" onClick={() => setShowAssignModal(false)} className="btn" style={{ flex: 1, background: '#f1f5f9' }}>Close</button>
                  <button type="submit" disabled={assigning} className="btn btn-primary" style={{ flex: 1 }}>
                    {assigning ? <Loader2 className="animate-spin" size={20} /> : "Assign Course"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-card animate-scale-in" style={{ maxWidth: '400px', width: '100%', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ef4444' }}>Reset Password</h3>
              <button onClick={() => setShowResetModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5 }}><X size={20} /></button>
            </div>
            
            <p style={{ fontSize: '0.875rem', marginBottom: '1.5rem', opacity: 0.7 }}>
              Set a new password for <strong>{selectedUser?.name}</strong> ({selectedUser?.email}).
            </p>

            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>New Password</label>
                <input 
                  type="text" 
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new secure password"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)', background: '#f8fafc', outline: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowResetModal(false)} className="btn" style={{ flex: 1, background: '#f1f5f9' }}>Cancel</button>
                <button type="submit" disabled={resetting} className="btn btn-primary" style={{ flex: 1, background: '#ef4444', borderColor: '#ef4444' }}>
                  {resetting ? <Loader2 className="animate-spin" size={20} /> : "Reset Password"}
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
