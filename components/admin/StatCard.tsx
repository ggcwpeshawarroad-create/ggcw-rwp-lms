"use client";

import { Users, GraduationCap, BookOpen, FileText, TrendingUp, ClipboardList, LucideIcon } from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Users,
  GraduationCap,
  BookOpen,
  FileText,
  TrendingUp,
  ClipboardList,
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export default function StatCard({ title, value, icon, description, trend }: StatCardProps) {
  const Icon = ICON_MAP[icon] ?? BookOpen;

  return (
    <div className="glass-card" style={{ 
      padding: '1.5rem', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '0.75rem', 
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', 
      border: '1px solid rgba(0,0,0,0.05)', 
      background: 'white',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      cursor: 'default'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.05)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.02)';
    }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ 
          padding: '0.625rem', 
          background: 'rgba(var(--primary-rgb, 1, 65, 28), 0.08)', 
          borderRadius: '0.875rem', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: 'var(--primary)'
        }}>
          <Icon size={24} strokeWidth={2.5} />
        </div>
        {trend && (
          <div style={{ 
            fontSize: '0.75rem', 
            fontWeight: 700, 
            color: trend.isPositive ? '#10b981' : '#ef4444', 
            padding: '0.25rem 0.625rem',
            background: trend.isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            borderRadius: '2rem',
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.25rem' 
          }}>
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <div style={{ marginTop: '0.5rem' }}>
        <h3 style={{ fontSize: '1rem', color: '#64748b', fontWeight: 600, marginBottom: '0.25rem' }}>{title}</h3>
        <p style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1e293b', margin: 0, letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</p>
        {description && <p style={{ fontSize: '0.8125rem', color: '#94a3b8', marginTop: '0.5rem', fontWeight: 500 }}>{description}</p>}
      </div>
    </div>
  );
}
