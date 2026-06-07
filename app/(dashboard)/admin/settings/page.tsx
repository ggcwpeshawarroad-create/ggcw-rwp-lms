"use client"

import { useState } from "react"
import { Shield, Bell, Database, Lock, Loader2, CheckCircle, AlertCircle } from "lucide-react"

export default function SettingsPage() {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState({ text: "", type: "" })

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ text: "New passwords do not match", type: "error" })
      return
    }

    setSubmitting(true)
    setMessage({ text: "", type: "" })

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({ text: "Password updated successfully!", type: "success" })
        setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" })
      } else {
        setMessage({ text: data.error || "Failed to update password", type: "error" })
      }
    } catch (err) {
      setMessage({ text: "Something went wrong", type: "error" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
        {/* Security / Password Change */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'var(--primary)15', padding: '0.5rem', borderRadius: '0.75rem' }}>
              <Lock color="var(--primary)" size={20} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Security & Password</h3>
          </div>
          
          <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {message.text && (
              <div style={{ 
                padding: '0.75rem 1rem', 
                borderRadius: '0.5rem', 
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: message.type === 'success' ? '#10b981' : '#ef4444',
                border: `1px solid ${message.type === 'success' ? '#10b98130' : '#ef444430'}`
              }}>
                {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                {message.text}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem', opacity: 0.8 }}>Current Password</label>
              <input 
                type="password"
                required
                value={formData.currentPassword}
                onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
                placeholder="Enter current password"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem', opacity: 0.8 }}>New Password</label>
              <input 
                type="password"
                required
                value={formData.newPassword}
                onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                placeholder="Enter new password"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem', opacity: 0.8 }}>Confirm New Password</label>
              <input 
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                placeholder="Confirm new password"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', outline: 'none' }}
              />
            </div>

            <button type="submit" disabled={submitting} className="btn btn-primary" style={{ padding: '0.75rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
              {submitting ? <Loader2 className="animate-spin" size={18} /> : "Update Password"}
            </button>
          </form>
        </div>

        {/* Existing placeholder cards */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <Bell color="var(--secondary)" />
            <h3 style={{ fontSize: '1.25rem' }}>Notifications</h3>
          </div>
          <div style={{ opacity: 0.7, fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Set up email alerts for new assignments, student enrollments, and system updates.
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }}>Manage Alerts</button>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <Database color="var(--accent)" />
            <h3 style={{ fontSize: '1.25rem' }}>Database</h3>
          </div>
          <div style={{ opacity: 0.7, fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Monitor database health, run backups, and manage data retention policies.
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }}>View Stats</button>
        </div>
      </div>
    </div>
  )
}
