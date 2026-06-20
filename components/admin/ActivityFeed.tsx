import { User, BookOpen, LogIn, Activity } from "lucide-react";

interface Activity {
  id: string;
  type: 'USER' | 'ENROLLMENT' | 'LOGIN';
  title: string;
  subtitle: string;
  time: string;
}

interface ActivityFeedProps {
  activities: Activity[];
}

const iconMap = {
  USER: User,
  ENROLLMENT: BookOpen,
  LOGIN: LogIn,
};

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <div className="glass-card" style={{ 
      padding: '1.5rem', 
      height: '100%', 
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', 
      border: '1px solid rgba(0,0,0,0.05)', 
      background: 'white',
      borderRadius: '1.25rem'
    }}>
      <h3 style={{ marginBottom: '1.5rem', fontSize: '1.125rem', fontWeight: 800, color: '#1e293b' }}>Recent Activity</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {activities.map((activity, index) => {
          const Icon = iconMap[activity.type] || User;
          return (
            <div key={activity.id} style={{ 
              display: 'flex', 
              gap: '1.25rem', 
              padding: '1rem 0',
              borderBottom: index === activities.length - 1 ? 'none' : '1px solid #f1f5f9',
              position: 'relative'
            }}>
              <div style={{ 
                width: '2.75rem', 
                height: '2.75rem', 
                borderRadius: '0.875rem', 
                background: activity.type === 'ENROLLMENT' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(var(--primary-rgb, 1, 65, 28), 0.1)', 
                color: activity.type === 'ENROLLMENT' ? '#3b82f6' : 'var(--primary)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Icon size={18} strokeWidth={2.5} />
              </div>
              <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <p style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activity.title}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.125rem' }}>
                  <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0, fontWeight: 500 }}>{activity.subtitle}</p>
                  <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>•</span>
                  <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0, fontWeight: 600 }}>{activity.time}</p>
                </div>
              </div>
            </div>
          );
        })}
        {activities.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <div style={{ opacity: 0.2, marginBottom: '1rem' }}><Activity size={48} /></div>
            <p style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>No live updates available yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
