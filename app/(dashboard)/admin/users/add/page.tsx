"use client"

import { useState } from "react"
import { UserPlus, Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function AddUserPage() {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    registrationNumber: "",
    password: "",
    role: "STUDENT",
  })

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
        setFormData({ name: "", email: "", registrationNumber: "", password: "", role: "STUDENT" })
        setTimeout(() => {
          router.push("/admin/users")
        }, 2000)
      } else {
        setError(data.error || "Failed to create user")
      }
    } catch (err) {
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
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
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="your-email@example.com"
                style={{ width: '100%', padding: '0.875rem', borderRadius: '0.5rem', background: 'white', border: '1px solid var(--glass-border)', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
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
              <input 
                type="text" 
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="•••••••••••••"
                style={{ width: '100%', padding: '0.875rem', borderRadius: '0.5rem', background: 'white', border: '1px solid var(--glass-border)', outline: 'none' }}
              />
            </div>
          </div>

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
          
          <button className="btn btn-primary" disabled={submitting} style={{ padding: '1rem', marginTop: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
            {submitting ? <Loader2 className="animate-spin" /> : <>Create User</>}
          </button>
        </form>
      </div>
    </div>
  )
}
