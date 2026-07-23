"use client"

import { useState, useEffect } from "react"
import { Users, Loader2, Search, ChevronLeft, ChevronRight, X, PlusCircle, BookOpen, Trash2, CheckCircle, Lock, Eye, EyeOff, Edit2 } from "lucide-react"
import Link from "next/link"
import { Toast, ToastType } from "@/components/ui/Toast"
import { SearchableSelect } from "@/components/ui/SearchableSelect"
import { formatText } from "@/lib/utils"

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [activeRole, setActiveRole] = useState<"STUDENT" | "TEACHER">("STUDENT")
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
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [newPassword, setNewPassword] = useState("")

  const [academicConfig, setAcademicConfig] = useState<any[]>([])
  const [showEditModal, setShowEditModal] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    registrationNumber: "",
    role: "STUDENT",
    classLevel: "",
    program: "",
    semester: "",
  })
  const [popoverPosition, setPopoverPosition] = useState<{ top: number; left: number } | null>(null)

  useEffect(() => {
    fetchUsers()
    fetchCourses()
  }, [page, search, activeRole])

  useEffect(() => {
    fetch("/api/academic-config")
      .then(r => r.json())
      .then(data => setAcademicConfig(data.classes || []))
      .catch(err => console.error("Failed to fetch academic config:", err))
  }, [])

  const classOptions = academicConfig.map(c => c.name)

  const getProgramOptions = (classLevel: string) => {
    return academicConfig.find(c => c.name === classLevel)?.programs || []
  }

  const getSemesterOptions = (classLevel: string) => {
    return academicConfig.find(c => c.name === classLevel)?.semesters || []
  }

  const hasPrograms = (classLevel: string) => getProgramOptions(classLevel).length > 0
  const hasSemesters = (classLevel: string) => getSemesterOptions(classLevel).length > 0

  const handleOpenEdit = (user: any, e: React.MouseEvent) => {
    const rootDiv = e.currentTarget.closest('div[style*="position: relative"]') || e.currentTarget.closest('.glass-card')?.parentElement
    
    const scrollY = window.scrollY
    const viewportHeight = window.innerHeight
    const absoluteY = scrollY + (viewportHeight / 2)
    
    let top = absoluteY
    if (rootDiv) {
      const containerRect = rootDiv.getBoundingClientRect()
      const containerAbsoluteTop = containerRect.top + window.scrollY
      top = absoluteY - containerAbsoluteTop
    }

    setPopoverPosition({ top, left: 0 })

    setSelectedUser(user)
    setEditFormData({
      name: user.name || "",
      email: user.email || "",
      registrationNumber: user.registrationNumber || "",
      role: user.role || "STUDENT",
      classLevel: user.classLevel || "",
      program: user.program || "",
      semester: user.semester || "",
    })
    setShowEditModal(true)
  }

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    try {
      const res = await fetch(`/api/admin/users/${selectedUser._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData)
      })

      if (res.ok) {
        setShowEditModal(false)
        setToast({ message: "User updated successfully!", type: "success" })
        fetchUsers()
      } else {
        const d = await res.json()
        setToast({ message: d.error || "Update failed", type: "error" })
      }
    } catch (err) {
      setToast({ message: "Something went wrong", type: "error" })
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete the user "${userName}"? This will permanently remove their account.`)) return
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" })
      if (res.ok) {
        setToast({ message: "User deleted successfully", type: "success" })
        fetchUsers()
      } else {
        const data = await res.json()
        setToast({ message: data.error || "Failed to delete user", type: "error" })
      }
    } catch (err) {
      console.error("Deletion failed")
      setToast({ message: "Something went wrong", type: "error" })
    }
  }

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
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search,
        role: activeRole,
      })
      const res = await fetch(`/api/admin/users?${params.toString()}`)
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

  const handleRoleChange = (role: "STUDENT" | "TEACHER") => {
    setActiveRole(role)
    setPage(1)
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
              <p style={{ opacity: 0.6, fontSize: '0.875rem' }}>Total {activeRole === "STUDENT" ? "Students" : "Teachers"}: {totalUsers}</p>
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
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {[
            { role: "STUDENT" as const, label: "Students" },
            { role: "TEACHER" as const, label: "Teachers" },
          ].map(tab => {
            const isActive = activeRole === tab.role
            return (
              <button
                key={tab.role}
                type="button"
                onClick={() => handleRoleChange(tab.role)}
                style={{
                  padding: '0.65rem 1rem',
                  borderRadius: '0.75rem',
                  border: isActive ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                  background: isActive ? 'var(--primary)' : 'white',
                  color: isActive ? 'white' : '#475569',
                  fontWeight: 800,
                  cursor: 'pointer',
                  minWidth: '110px'
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><Loader2 className="animate-spin" size={48} color="var(--primary)" /></div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#64748b', border: '1px dashed #e2e8f0', borderRadius: '1rem', background: '#f8fafc' }}>
            No {activeRole === "STUDENT" ? "students" : "teachers"} found.
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.5rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 600 }}>
                    <th style={{ padding: '1rem 1.5rem' }}>S.No</th>
                    <th style={{ padding: '1rem 1.5rem' }}>User Info</th>
                    <th style={{ padding: '1rem 1.5rem' }}>Reg No.</th>
                    <th style={{ padding: '1rem 1.5rem' }}>Class/Program</th>
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
                        <div style={{ fontWeight: 600 }}>{formatText(user.name || "Anonymous User")}</div>
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
                      <td style={{ padding: '1rem 1.5rem' }}>
                        {user.classLevel ? (
                          <div style={{ fontSize: '0.85rem' }} className="capitalize">
                            <div style={{ fontWeight: 600 }}>{user.classLevel}</div>
                            {user.program && <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{user.program}</div>}
                            {user.semester && <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, marginTop: '0.1rem' }}>{user.semester}</div>}
                          </div>
                        ) : (
                          <span style={{ opacity: 0.3, fontStyle: 'italic', fontSize: '0.85rem' }}>N/A</span>
                        )}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', opacity: 0.8 }}>{user.email}</td>
                      <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                        <span 
                          className="capitalize"
                          style={{ 
                            padding: '0.35rem 1rem', 
                            borderRadius: '1rem', 
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: user.role === "ADMIN" ? 'rgba(239, 68, 68, 0.1)' : user.role === "TEACHER" ? 'rgba(99, 102, 241, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                            color: user.role === "ADMIN" ? '#ef4444' : user.role === "TEACHER" ? '#6366f1' : '#10b981',
                          }}
                        >
                          {formatText(user.role)}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', opacity: 0.8, fontSize: '0.875rem' }}>
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem', textAlign: 'center' }}>
                        <div className="user-actions-container">
                          {user.role === "STUDENT" && (
                            <button 
                              onClick={() => handleOpenAssign(user)}
                              className="btn-action-primary"
                              style={{ 
                                padding: '0.5rem 0.8rem', 
                                fontSize: '0.75rem', 
                                background: 'rgba(1, 65, 28, 0.06)', 
                                color: 'var(--primary)', 
                                fontWeight: 700, 
                                border: '1px solid rgba(1, 65, 28, 0.12)', 
                                borderRadius: '0.75rem', 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '0.4rem',
                                minWidth: '80px',
                                justifyContent: 'center',
                                transition: 'all 0.2s',
                                cursor: 'pointer',
                                flexShrink: 0
                              }}
                            >
                              <PlusCircle size={14} /> Course
                            </button>
                          )}
                          <button 
                            onClick={(e) => handleOpenEdit(user, e)}
                            className="btn-action-primary"
                            style={{ 
                              padding: '0.5rem 0.8rem', 
                              fontSize: '0.75rem', 
                              background: 'rgba(16, 185, 129, 0.06)', 
                              color: '#10b981', 
                              fontWeight: 700, 
                              border: '1px solid rgba(16, 185, 129, 0.12)', 
                              borderRadius: '0.75rem', 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '0.4rem',
                              minWidth: '70px',
                              justifyContent: 'center',
                              transition: 'all 0.2s',
                              cursor: 'pointer',
                              flexShrink: 0
                            }}
                            title="Edit User"
                          >
                            <Edit2 size={14} /> Edit
                          </button>
                          <button 
                            onClick={() => { setSelectedUser(user); setShowResetModal(true); }}
                            className="btn-action-danger"
                            style={{ 
                              padding: '0.5rem 0.8rem', 
                              fontSize: '0.75rem', 
                              background: 'rgba(239, 68, 68, 0.06)', 
                              color: '#ef4444', 
                              fontWeight: 700, 
                              border: '1px solid rgba(239, 68, 68, 0.12)', 
                              borderRadius: '0.75rem', 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '0.4rem',
                              minWidth: '80px',
                              justifyContent: 'center',
                              transition: 'all 0.2s',
                              cursor: 'pointer',
                              flexShrink: 0
                            }}
                            title="Reset Password"
                          >
                            <Lock size={14} /> Reset
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(user._id, user.name)}
                            className="btn-action-danger"
                            style={{ 
                              padding: '0.5rem 0.8rem', 
                              fontSize: '0.75rem', 
                              background: 'rgba(239, 68, 68, 0.06)', 
                              color: '#ef4444', 
                              fontWeight: 700, 
                              border: '1px solid rgba(239, 68, 68, 0.12)', 
                              borderRadius: '0.75rem', 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '0.4rem',
                              minWidth: '75px',
                              justifyContent: 'center',
                              transition: 'all 0.2s',
                              cursor: 'pointer',
                              flexShrink: 0
                            }}
                            title="Delete User"
                          >
                            <Trash2 size={14} /> Delete
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
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showResetPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new secure password"
                    style={{ width: '100%', padding: '0.75rem', paddingRight: '2.5rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)', background: '#f8fafc', outline: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary)',
                      cursor: 'pointer',
                      opacity: 0.5,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {showResetPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
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

      {/* Edit User Modal (Popover centered in viewport scroll) */}
      {showEditModal && popoverPosition && (
        <>
          <div 
            onClick={() => { setShowEditModal(false); setSelectedUser(null); }}
            style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} 
          />
          <div style={{ 
            position: 'absolute', 
            top: `${popoverPosition.top}px`, 
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000, 
            width: '100%',
            maxWidth: '600px',
            padding: '1rem'
          }}>
            <div className="glass-card animate-scale-in" style={{ background: 'white', padding: '1.75rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>Edit User Details</h3>
                <button onClick={() => { setShowEditModal(false); setSelectedUser(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5 }}><X size={20} /></button>
              </div>
              
              <form onSubmit={handleEditUser} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)', background: '#f8fafc', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)', background: '#f8fafc', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Registration / Roll No.</label>
                  <input 
                    type="text" 
                    required
                    value={editFormData.registrationNumber}
                    onChange={(e) => setEditFormData({...editFormData, registrationNumber: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)', background: '#f8fafc', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Role</label>
                  <select 
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({...editFormData, role: e.target.value, classLevel: "", program: "", semester: ""})}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)', background: '#f8fafc', outline: 'none' }}
                  >
                    <option value="STUDENT">Student</option>
                    <option value="TEACHER">Teacher</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>

              {editFormData.role === "STUDENT" && (
                <div style={{ display: 'grid', gridTemplateColumns: editFormData.classLevel && hasSemesters(editFormData.classLevel) ? '1fr 1fr 1fr' : '1fr 1fr', gap: '1rem', borderTop: '1px dashed #e2e8f0', paddingTop: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Class Name</label>
                    <select 
                      required
                      value={editFormData.classLevel}
                      onChange={(e) => setEditFormData({...editFormData, classLevel: e.target.value, program: "", semester: ""})}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)', background: '#f8fafc', outline: 'none' }}
                    >
                      <option value="">Select Class</option>
                      {classOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Program / Stream</label>
                    {editFormData.classLevel && hasPrograms(editFormData.classLevel) ? (
                      <select 
                        required
                        value={editFormData.program}
                        onChange={(e) => setEditFormData({...editFormData, program: e.target.value})}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)', background: '#f8fafc', outline: 'none' }}
                      >
                        <option value="">Select Program</option>
                        {getProgramOptions(editFormData.classLevel).map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : (
                      <input 
                        type="text"
                        placeholder={editFormData.classLevel ? "Custom tags or program..." : "Select class first"}
                        disabled={!editFormData.classLevel}
                        value={editFormData.program}
                        onChange={(e) => setEditFormData({...editFormData, program: e.target.value})}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)', background: editFormData.classLevel ? '#f8fafc' : '#f1f5f9', outline: 'none' }}
                      />
                    )}
                  </div>

                  {editFormData.classLevel && hasSemesters(editFormData.classLevel) && (
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Semester</label>
                      <select 
                        required
                        value={editFormData.semester}
                        onChange={(e) => setEditFormData({...editFormData, semester: e.target.value})}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)', background: '#f8fafc', outline: 'none' }}
                      >
                        <option value="">Select Semester</option>
                        {getSemesterOptions(editFormData.classLevel).map((s: string) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => { setShowEditModal(false); setSelectedUser(null); }} className="btn" style={{ flex: 1, background: '#f1f5f9' }}>Cancel</button>
                <button type="submit" disabled={updating} className="btn btn-primary" style={{ flex: 1 }}>
                  {updating ? <Loader2 className="animate-spin" size={20} /> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
        </>
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
