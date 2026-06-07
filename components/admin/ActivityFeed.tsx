import { User, BookOpen, LogIn } from "lucide-react";

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
    <div className="glass-card" style={{ padding: '1.5rem', height: '100%', boxShadow: 'none', border: '1px solid var(--glass-border)', background: 'var(--card)' }}>
      <h3 style={{ marginBottom: '1.5rem', fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>Recent Activity</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {activities.map((activity) => {
          const Icon = iconMap[activity.type] || User;
          return (
            <div key={activity.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ 
                width: '2.5rem', 
                height: '2.5rem', 
                borderRadius: '50%', 
                background: 'var(--glass-bg)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Icon size={16} color="var(--primary)" />
              </div>
              <div style={{ overflow: 'hidden' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activity.title}</p>
                <p style={{ fontSize: '0.75rem', opacity: 0.6, margin: 0 }}>{activity.subtitle} • {activity.time}</p>
              </div>
            </div>
          );
        })}
        {activities.length === 0 && (
          <p style={{ fontSize: '0.875rem', opacity: 0.5, textAlign: 'center', padding: '2rem 0' }}>No recent activity</p>
        )}
      </div>
    </div>
  );
}
