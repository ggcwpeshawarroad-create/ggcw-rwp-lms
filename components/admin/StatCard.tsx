import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export default function StatCard({ title, value, icon: Icon, description, trend }: StatCardProps) {
  return (
    <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', boxShadow: 'none', border: '1px solid var(--glass-border)', background: 'var(--card)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ padding: '0.5rem', background: 'var(--glass-bg)', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={20} color="var(--primary)" />
        </div>
        {trend && (
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: trend.isPositive ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <div>
        <h3 style={{ fontSize: '0.875rem', opacity: 0.6, fontWeight: 500 }}>{title}</h3>
        <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)', margin: '0.25rem 0' }}>{value}</p>
        {description && <p style={{ fontSize: '0.75rem', opacity: 0.5 }}>{description}</p>}
      </div>
    </div>
  );
}
