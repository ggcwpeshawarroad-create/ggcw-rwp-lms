"use client"

import { useState, useEffect } from "react"
import { Activity, Loader2, Calendar, User, Info } from "lucide-react"

export default function AdminLogsPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 })

  useEffect(() => {
    fetchLogs(pagination.page)
  }, [pagination.page])

  const fetchLogs = async (page: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/logs?page=${page}`)
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
      case 'COURSE_CREATED': return 'var(--primary)';
      case 'USER_CREATED': return '#3b82f6';
      default: return '#64748b';
    }
  }

  return (
    <div className="glass-card animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: 'var(--primary)', padding: '0.75rem', borderRadius: '1rem', color: 'white' }}>
          <Activity size={24} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>System Activity Logs</h2>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader2 className="animate-spin" size={48} color="var(--primary)" />
        </div>
      ) : logs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.5 }}>No logs found.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.5rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 600 }}>
                <th style={{ padding: '1rem 1.5rem' }}>Timestamp</th>
                <th style={{ padding: '1rem 1.5rem' }}>User</th>
                <th style={{ padding: '1rem 1.5rem' }}>Action</th>
                <th style={{ padding: '1rem 1.5rem' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log: any) => (
                <tr key={log._id} style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <td style={{ padding: '1rem 1.5rem', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                      <Calendar size={14} opacity={0.5} />
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 700, fontSize: '0.75rem' }}>
                        {log.userId?.name?.[0] || 'U'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{log.userId?.name}</div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{log.userId?.role}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '1rem', 
                      fontSize: '0.75rem', 
                      fontWeight: 700,
                      background: `${getActionColor(log.action)}10`,
                      color: getActionColor(log.action),
                      border: `1px solid ${getActionColor(log.action)}20`
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', opacity: 0.8 }}>
                      <Info size={14} />
                      {log.details}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {pagination.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
              <button 
                disabled={pagination.page === 1}
                onClick={() => setPagination({...pagination, page: pagination.page - 1})}
                className="btn"
                style={{ border: '1px solid var(--glass-border)', padding: '0.5rem 1rem' }}
              >
                Previous
              </button>
              <button 
                disabled={pagination.page === pagination.totalPages}
                onClick={() => setPagination({...pagination, page: pagination.page + 1})}
                className="btn btn-primary"
                style={{ padding: '0.5rem 1rem' }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
