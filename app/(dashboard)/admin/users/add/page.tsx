"use client"

import { useState, useEffect } from "react"

type AcademicClass = {
  name: string
  programs?: string[]
  semesters?: string[]
}
import { UserPlus, Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function AddUserPage() {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const [academicConfig, setAcademicConfig] = useState<AcademicClass[]>([])

  useEffect(() => {
    fetch("/api/academic-config").then(r => r.json()).then(data => setAcademicConfig(data.classes || []))
  }, [])

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    registrationNumber: "",
    password: "",
    role: "STUDENT",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")
    setSuccess("")

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess("User created successfully!")
        setFormData({ name: "", email: "", registrationNumber: "", password: "", role: "STUDENT", classLevel: "", program: "", semester: "" })
        setTimeout(() => {
          router.push("/admin/users")
        }, 2000)
      } else {
        setError(data.error || "Failed to create user")
      }
    } catch {
      setError("Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <Link href="/admin/users" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', textDecoration: 'none', marginBottom: '2rem', fontWeight: 600 }}>
        <ArrowLeft size={18} /> Back to Users
      </Link>

      <div className="glass-card animate-fade-in">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ background: 'var(--primary)', padding: '0.75rem', borderRadius: '1rem', color: 'white' }}>
            <UserPlus size={24} />
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Add New User</h2>
        </div>

        {error && <div style={{ color: '#ef4444', marginBottom: '1.5rem', background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>{error}</div>}
        {success && <div style={{ color: '#10b981', marginBottom: '1.5rem', background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid rgba(16, 185, 129, 0.2)' }}>{success}</div>}

        <form onSubmit={handleSubmit} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#444' }}>Full Name</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Full Name"
                required
                style={{ width: '100%', padding: '0.875rem', borderRadius: '0.5rem', background: 'white', border: '1px solid var(--glass-border)', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#444' }}>Email Address</label>
              <input 
                type="email" 
                name="new-user-email"
                required
                autoComplete="off"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="your-email@example.com"
                style={{ width: '100%', padding: '0.875rem', borderRadius: '0.5rem', background: 'white', border: '1px solid var(--glass-border)', outline: 'none' }}
              />
            </div>
          </div>

          <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#444' }}>Registration Number / Roll No.</label>
              <input 
                type="text" 
                value={formData.registrationNumber}
                onChange={(e) => setFormData({...formData, registrationNumber: e.target.value})}
                placeholder="e.g. 2024-STUD-001"
                required
                style={{ width: '100%', padding: '0.875rem', borderRadius: '0.5rem', background: 'white', border: '1px solid var(--glass-border)', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#444' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? "text" : "password"}
                  name="new-user-password"
                  required
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="•••••••••••••"
                  style={{ width: '100%', padding: '0.875rem', paddingRight: '3rem', borderRadius: '0.5rem', background: 'white', border: '1px solid var(--glass-border)', outline: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    opacity: 0.6,
                    padding: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

            <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: formData.role === 'STUDENT' ? (formData.classLevel && hasSemesters(formData.classLevel) ? '1fr 1fr 1fr 1fr' : '1fr 1fr 1fr') : '1fr', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#444' }}>Role</label>
                <select 
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  style={{ width: '100%', padding: '0.875rem', borderRadius: '0.5rem', background: 'white', border: '1px solid var(--glass-border)', outline: 'none' }}
                >
                  <option value="STUDENT">Student</option>
                  <option value="TEACHER">Teacher</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              {formData.role === "STUDENT" && (
                <>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#444' }}>Class Name</label>
                    <select 
                      required
                      value={formData.classLevel}
                      onChange={(e) => setFormData({...formData, classLevel: e.target.value, program: "", semester: ""})}
                      style={{ width: '100%', padding: '0.875rem', borderRadius: '0.5rem', background: 'white', border: '1px solid var(--glass-border)', outline: 'none' }}
                    >
                      <option value="">Select Class</option>
                      {classOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#444' }}>Program / Stream</label>
                    {formData.classLevel && hasPrograms(formData.classLevel) ? (
                      <select 
                        required
                        value={formData.program}
                        onChange={(e) => setFormData({...formData, program: e.target.value})}
                        style={{ width: '100%', padding: '0.875rem', borderRadius: '0.5rem', background: 'white', border: '1px solid var(--glass-border)', outline: 'none' }}
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
                        style={{ width: '100%', padding: '0.875rem', borderRadius: '0.5rem', background: formData.classLevel ? 'white' : '#f1f5f9', border: '1px solid var(--glass-border)', outline: 'none' }}
                      />
                    )}
                  </div>

                  {formData.classLevel && hasSemesters(formData.classLevel) && (
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#444' }}>Semester</label>
                      <select 
                        required
                        value={formData.semester}
                        onChange={(e) => setFormData({...formData, semester: e.target.value})}
                        style={{ width: '100%', padding: '0.875rem', borderRadius: '0.5rem', background: 'white', border: '1px solid var(--glass-border)', outline: 'none' }}
                      >
                        <option value="">Select Semester</option>
                        {getSemesterOptions(formData.classLevel).map((s: string) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}
            </div>
          
          <button className="btn btn-primary" disabled={submitting} style={{ padding: '1rem', marginTop: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
            {submitting ? <Loader2 className="animate-spin" /> : <>Create User</>}
          </button>
        </form>
      </div>
    </div>
  )
}
