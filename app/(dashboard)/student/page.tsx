import DashboardLayout from "@/components/layout/DashboardLayout"
import { PlayCircle, Trophy, Search } from "lucide-react"

export default function StudentPage() {
  return (
    <DashboardLayout title="My Learning Space" role="STUDENT">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
        <div className="glass-card animate-fade-in">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <PlayCircle size={32} color="var(--primary)" />
            <h3 className="gradient-text">Continue Learning</h3>
          </div>
          <p style={{ opacity: 0.8, marginBottom: '1.5rem' }}>You haven't started any courses yet.</p>
          <button className="btn btn-primary">Browse Catalog</button>
        </div>

        <div className="glass-card animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <Trophy size={32} color="var(--accent)" />
            <h3 className="gradient-text">Achievements</h3>
          </div>
          <p style={{ opacity: 0.8, marginBottom: '1.5rem' }}>0 badges earned this month.</p>
        </div>
      </div>

      <div className="glass-card animate-fade-in" style={{ marginTop: '2rem', animationDelay: '0.2s' }}>
        <h3 className="gradient-text" style={{ marginBottom: '1.5rem' }}>Recommended for You</h3>
        <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '1rem', border: '1px dashed var(--glass-border)' }}>
          <p style={{ opacity: 0.5 }}>Search for courses to see recommendations</p>
        </div>
      </div>
    </DashboardLayout>
  )
}
