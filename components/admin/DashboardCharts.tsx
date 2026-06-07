"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface DashboardChartsProps {
  data: {
    name: string;
    users: number;
    enrollments: number;
  }[];
}

export default function DashboardCharts({ data }: DashboardChartsProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
      <div className="glass-card" style={{ padding: '2rem', boxShadow: 'none', border: '1px solid var(--glass-border)', background: 'var(--card)' }}>
        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.125rem', fontWeight: 700, color: 'var(--primary)' }}>Registration & Activity Trend</h3>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--glass-border)" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: 'rgba(0,0,0,0.5)' }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: 'rgba(0,0,0,0.5)' }} 
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '0.5rem', 
                  border: '1px solid var(--glass-border)', 
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' 
                }} 
              />
              <Bar dataKey="users" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={30} name="New Users" />
              <Bar dataKey="enrollments" fill="var(--accent)" radius={[4, 4, 0, 0]} barSize={30} name="Enrollments" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
