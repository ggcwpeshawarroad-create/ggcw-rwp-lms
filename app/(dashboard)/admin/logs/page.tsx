"use client"

import { useState, useEffect } from "react"
import { Activity, Loader2, Calendar, User, Info, PieChart as PieChartIcon, ArrowRight, Filter } from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { formatText } from "@/lib/utils"

export default function AdminLogsPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 })
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    action: '',
    startDate: '',
    endDate: ''
  })

  useEffect(() => {
    fetchLogs(pagination.page)
  }, [pagination.page, filters])

  const fetchLogs = async (page: number) => {
    setLoading(true)
    try {
      let url = `/api/admin/logs?page=${page}`
      if (filters.action) url += `&action=${filters.action}`
      if (filters.startDate) url += `&startDate=${filters.startDate}`
      if (filters.endDate) url += `&endDate=${filters.endDate}`
      
      const res = await fetch(url)
      const data = await res.json()
      if (res.ok) {
        setLogs(data.logs)
        setPagination(data.pagination)
      }
    } catch (err) {
      console.error("Failed to fetch logs")
    } finally {
      setLoading(false)
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'LOGIN': return '#10b981';
      case 'COURSE_CREATED': return '#01411c';
      case 'USER_CREATED': return '#3b82f6';
      case 'PASSWORD_RESET': return '#ef4444';
      default: return '#64748b';
    }
  }

  // Calculate chart data from current logs
  const actionDistribution = logs.reduce((acc: any, log: any) => {
    const action = log.action;
    const existing = acc.find((item: any) => item.name === action);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: action, value: 1, color: getActionColor(action) });
    }
    return acc;
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header & Stats Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, var(--primary) 0%, #063c1a 100%)', 
              padding: '0.875rem', 
              borderRadius: '1.25rem', 
              color: 'white',
              boxShadow: '0 10px 15px -3px rgba(1, 65, 28, 0.3)' 
            }}>
              <Activity size={28} strokeWidth={2.5} />
            </div>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#1e293b', margin: 0, letterSpacing: '-0.02em' }}>System Logs</h1>
              <p style={{ fontSize: '1rem', color: '#64748b', fontWeight: 500 }}>Monitor system identity and activity patterns</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem' }}>
            <div className="glass-card" style={{ padding: '1.25rem 2rem', background: 'white', border: '1px solid rgba(0,0,0,0.05)', flex: 1 }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total Events</p>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b' }}>{logs.length}</h3>
            </div>
            <div className="glass-card" style={{ padding: '1.25rem 2rem', background: 'white', border: '1px solid rgba(0,0,0,0.05)', flex: 1 }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Active Admins</p>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b' }}>1</h3>
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', background: 'white', border: '1px solid rgba(0,0,0,0.05)', height: '240px' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PieChartIcon size={16} /> Activity Distribution
          </h3>
          <div style={{ width: '100%', height: '160px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={actionDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {actionDistribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontSize: '0.75rem', fontWeight: 600 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden', background: 'white', border: '1px solid rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#1e293b' }}>Audit Trail</h3>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {(filters.action || filters.startDate || filters.endDate) && (
              <button 
                onClick={() => setFilters({ action: '', startDate: '', endDate: '' })}
                className="btn" 
                style={{ fontSize: '0.8125rem', color: '#ef4444', fontWeight: 700, padding: '0.5rem 1rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)' }}
              >
                Clear All
              </button>
            )}
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="btn" 
              style={{ 
                fontSize: '0.875rem', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                padding: '0.5rem 1.25rem', 
                background: showFilters ? 'var(--primary)' : '#f8fafc', 
                color: showFilters ? 'white' : '#1e293b',
                border: '1px solid #e2e8f0',
                fontWeight: 700
              }}
            >
              <Filter size={14} /> Filter {showFilters ? 'Active' : ''}
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div style={{ padding: '1.5rem 2rem', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', animation: 'slideDown 0.2s ease-out' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Action Type</label>
              <select 
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                style={{ padding: '0.625rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}
              >
                <option value="">All Actions</option>
                <option value="LOGIN">Admin Login</option>
                <option value="USER_CREATED">User Creation</option>
                <option value="COURSE_CREATED">Course Creation</option>
                <option value="PASSWORD_RESET">Password Reset</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Start Date</label>
              <input 
                type="date" 
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                style={{ padding: '0.625rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>End Date</label>
              <input 
                type="date" 
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                style={{ padding: '0.625rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}
              />
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10rem', gap: '1rem' }}>
            <Loader2 className="animate-spin" size={40} color="var(--primary)" />
            <p style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600 }}>Syncing system data...</p>
          </div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '8rem', opacity: 0.5 }}>
            <Activity size={48} style={{ marginBottom: '1rem' }} />
            <p style={{ fontWeight: 600 }}>No system activity recorded yet.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '1rem 2rem' }}>Event Details</th>
                  <th style={{ padding: '1rem 2rem' }}>Administrator</th>
                  <th style={{ padding: '1rem 2rem' }}>Action</th>
                  <th style={{ padding: '1rem 2rem' }}>Timestamp</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '0.9375rem' }}>
                {logs.map((log: any) => (
                  <tr key={log._id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s ease' }}>
                    <td style={{ padding: '1.25rem 2rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                        <div style={{ 
                          width: '2.25rem', 
                          height: '2.25rem', 
                          borderRadius: '0.75rem', 
                          background: 'rgba(0,0,0,0.03)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          color: '#64748b'
                        }}>
                          <Info size={16} />
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, color: '#1e293b', margin: 0 }}>{log.details}</p>
                          <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.125rem 0 0', fontWeight: 500 }}>ID: {log._id.substring(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem 2rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ 
                          width: '36px', 
                          height: '36px', 
                          borderRadius: '50%', 
                          background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          color: 'var(--primary)', 
                          fontWeight: 800, 
                          fontSize: '0.875rem',
                          border: '2px solid white',
                          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                        }}>
                          {formatText(log.userId?.name)?.[0] || 'U'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.875rem' }}>{formatText(log.userId?.name)}</div>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700 }}>{formatText(log.userId?.role)}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem 2rem' }}>
                      <span style={{ 
                        padding: '0.375rem 0.875rem', 
                        borderRadius: '0.625rem', 
                        fontSize: '0.7rem', 
                        fontWeight: 800,
                        background: `${getActionColor(log.action)}15`,
                        color: getActionColor(log.action),
                        letterSpacing: '0.025em'
                      }}>
                        {formatText(log.action.replace(/_/g, ' '))}
                      </span>
                    </td>
                    <td style={{ padding: '1.25rem 2rem', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', color: '#64748b', fontWeight: 600, fontSize: '0.8125rem' }}>
                        <Calendar size={14} style={{ opacity: 0.4 }} />
                        {new Date(log.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {pagination.totalPages > 1 && (
              <div style={{ padding: '1.5rem 2rem', display: 'flex', justifyContent: 'center', borderTop: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button 
                    disabled={pagination.page === 1}
                    onClick={() => setPagination({...pagination, page: pagination.page - 1})}
                    className="btn"
                    style={{ background: '#f8fafc', padding: '0.5rem 1rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}
                  >
                    Prev
                  </button>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#64748b', padding: '0 1rem' }}>
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button 
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() => setPagination({...pagination, page: pagination.page + 1})}
                    className="btn"
                    style={{ background: '#f8fafc', padding: '0.5rem 1rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
