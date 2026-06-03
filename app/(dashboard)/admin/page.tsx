import DashboardLayout from "@/components/layout/DashboardLayout"
import connectDB from "@/lib/db"
import User from "@/models/User"
import Course from "@/models/Course"

export default async function AdminPage() {
  await connectDB()
  
  const userCount = await User.countDocuments()
  const courseCount = await Course.countDocuments()

  return (
    <DashboardLayout title="Admin Overview" role="ADMIN">
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
        <div className="glass-card">
          <h2 style={{ color: 'var(--primary)', marginBottom: '1.5rem' }}>System Overview</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div style={{ padding: '1.5rem', background: 'var(--glass-bg)', borderRadius: '1rem', border: '1px solid var(--glass-border)' }}>
              <h3 style={{ fontSize: '0.875rem', opacity: 0.6, marginBottom: '0.5rem' }}>Total Users</h3>
              <p style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)' }}>{userCount}</p>
            </div>
            <div style={{ padding: '1.5rem', background: 'var(--glass-bg)', borderRadius: '1rem', border: '1px solid var(--glass-border)' }}>
              <h3 style={{ fontSize: '0.875rem', opacity: 0.6, marginBottom: '0.5rem' }}>Active Courses</h3>
              <p style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)' }}>{courseCount}</p>
            </div>
          </div>
        </div>

        <div className="glass-card">
          <h2 style={{ color: 'var(--secondary)', marginBottom: '1.5rem' }}>Quick Actions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <a href="/admin/users" className="btn btn-primary" style={{ textDecoration: 'none', textAlign: 'center' }}>Manage Users</a>
            <a href="/admin/settings" className="btn" style={{ border: '1px solid var(--primary)', color: 'var(--primary)', textDecoration: 'none', textAlign: 'center' }}>System Settings</a>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
