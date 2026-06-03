"use client"

import { Settings as SettingsIcon, Shield, Bell, Database } from "lucide-react"

export default function SettingsPage() {
  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>System Settings</h1>
        <p style={{ opacity: 0.7 }}>Configure your LMS platform preferences.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <Shield color="var(--primary)" />
            <h3 style={{ fontSize: '1.25rem' }}>Security</h3>
          </div>
          <div style={{ opacity: 0.7, fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Manage two-factor authentication, password policies, and session timeouts.
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }}>Configure Security</button>
        </div>

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
