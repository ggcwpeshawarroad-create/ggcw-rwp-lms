import DashboardLayout from "@/components/layout/DashboardLayout"
import { PlusCircle, BookOpen, Users } from "lucide-react"

export default function TeacherPage() {
  return (
    <DashboardLayout title="Instructor Dashboard" role="TEACHER">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
        <div className="glass-card animate-fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <BookOpen size={32} color="var(--primary)" />
            <h3 className="gradient-text">My Courses</h3>
          </div>
          <p style={{ opacity: 0.8, marginBottom: '1.5rem' }}>Manage your curriculum and content.</p>
          <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PlusCircle size={18} /> Create New Course
          </button>
        </div>

        <div className="glass-card animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <Users size={32} color="var(--secondary)" />
            <h3 className="gradient-text">Active Students</h3>
          </div>
          <p style={{ opacity: 0.8, marginBottom: '1.5rem' }}>Track student progress and engagement.</p>
          <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>0</div>
        </div>
      </div>
    </DashboardLayout>
  )
}
