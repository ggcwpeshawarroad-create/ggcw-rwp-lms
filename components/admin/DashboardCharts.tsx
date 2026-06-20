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
      <div className="glass-card" style={{ 
        padding: '2rem', 
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', 
        border: '1px solid rgba(0,0,0,0.05)', 
        background: 'white',
        borderRadius: '1.25rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>Performance Analytics</h3>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>User registration and course enrollment trends</p>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--primary)' }}></div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Users</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#3b82f6' }}></div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Enrollments</span>
            </div>
          </div>
        </div>
        
        <div style={{ width: '100%', height: 350 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} 
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ 
                  borderRadius: '1rem', 
                  border: 'none', 
                  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
                  padding: '1rem'
                }} 
                itemStyle={{ fontSize: '0.875rem', fontWeight: 600 }}
                labelStyle={{ marginBottom: '0.5rem', fontWeight: 700, color: '#1e293b' }}
              />
              <Bar 
                dataKey="users" 
                fill="var(--primary)" 
                radius={[6, 6, 0, 0]} 
                barSize={32} 
                name="New Users" 
              />
              <Bar 
                dataKey="enrollments" 
                fill="#3b82f6" 
                radius={[6, 6, 0, 0]} 
                barSize={32} 
                name="Enrollments" 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
