"use client"

import { useState } from "react"
import { Shield, Bell, Database, Lock, Loader2, CheckCircle, AlertCircle, Activity, Eye, EyeOff } from "lucide-react"

export default function SettingsPage() {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [dbStatus, setDbStatus] = useState<any>(null)
  const [loadingDb, setLoadingDb] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState({ text: "", type: "" })
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const fetchDbStatus = async () => {
    setLoadingDb(true)
    try {
      const res = await fetch("/api/admin/system/db-status")
      const data = await res.json()
      if (res.ok) setDbStatus(data)
    } catch (err) {
      console.error("Failed to fetch DB status")
    } finally {
      setLoadingDb(false)
    }
  }

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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        {/* Security / Password Change */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'var(--primary)15', padding: '0.5rem', borderRadius: '0.75rem' }}>
              <Lock color="var(--primary)" size={20} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }} className="capitalize">Security & Password</h3>
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
              }} className="capitalize">
                {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                {message.text}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem', opacity: 0.8 }} className="capitalize">Current Password</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showCurrent ? "text" : "password"}
                  required
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
                  placeholder="Enter current password"
                  style={{ width: '100%', padding: '0.75rem', paddingRight: '2.5rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', outline: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
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
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem', opacity: 0.8 }} className="capitalize">New Password</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showNew ? "text" : "password"}
                  required
                  value={formData.newPassword}
                  onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                  placeholder="Enter new password"
                  style={{ width: '100%', padding: '0.75rem', paddingRight: '2.5rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', outline: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
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
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem', opacity: 0.8 }} className="capitalize">Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showConfirm ? "text" : "password"}
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  placeholder="Confirm new password"
                  style={{ width: '100%', padding: '0.75rem', paddingRight: '2.5rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', outline: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
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
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={submitting} className="btn btn-primary" style={{ padding: '0.75rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
              {submitting ? <Loader2 className="animate-spin" size={18} /> : "Update Password"}
            </button>
          </form>
        </div>

        {/* Database Status Card */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: 'var(--accent)15', padding: '0.5rem', borderRadius: '0.75rem' }}>
                <Database color="var(--accent)" size={20} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }} className="capitalize">Database Status</h3>
            </div>
            <button 
              onClick={fetchDbStatus} 
              disabled={loadingDb}
              style={{ padding: '0.5rem', borderRadius: '0.5rem', background: 'transparent', border: '1px solid var(--glass-border)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              title="Refresh Status"
            >
              <Activity size={16} className={loadingDb ? "animate-spin" : ""} />
            </button>
          </div>

          {dbStatus ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.02)', borderRadius: '0.75rem', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ opacity: 0.6, fontSize: '0.85rem' }}>Connection Status</span>
                  <span style={{ 
                    color: dbStatus.readyState === 1 ? '#10b981' : '#ef4444', 
                    fontWeight: 700, 
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: dbStatus.readyState === 1 ? '#10b981' : '#ef4444' }}></span>
                    {dbStatus.status}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ opacity: 0.6, fontSize: '0.85rem' }}>Database Name</span>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{dbStatus.name}</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid var(--glass-border)' }}>
                  <div style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '0.2rem' }}>Collections</div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{dbStatus.collections}</div>
                </div>
                <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid var(--glass-border)' }}>
                  <div style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '0.2rem' }}>Total Objects</div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{dbStatus.objects}</div>
                </div>
                <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid var(--glass-border)' }}>
                  <div style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '0.2rem' }}>Data Size</div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{dbStatus.dataSize}</div>
                </div>
                <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid var(--glass-border)' }}>
                  <div style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '0.2rem' }}>Storage</div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{dbStatus.storageSize}</div>
                </div>
              </div>

              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', opacity: 0.6 }}>
                <div>Host: {dbStatus.host}</div>
                <div>Server Version: v{dbStatus.version}</div>
                <div>Uptime: {dbStatus.uptime}</div>
              </div>
              
              <button onClick={fetchDbStatus} className="btn-primary btn" style={{ marginTop: '0.5rem', padding: '0.6rem' }}>
                Full Diagnostics
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p style={{ opacity: 0.6, fontSize: '0.9rem', marginBottom: '1rem' }}>
                Click below to fetch real-time database connection metrics and health reports.
              </p>
              <button 
                onClick={fetchDbStatus} 
                disabled={loadingDb}
                className="btn btn-primary" 
                style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
              >
                {loadingDb ? <Loader2 size={18} className="animate-spin" /> : "Fetch DB Status"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
