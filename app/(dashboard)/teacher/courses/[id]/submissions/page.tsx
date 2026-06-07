"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  ClipboardList, 
  Search, 
  Loader2, 
  ArrowLeft, 
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  User,
  BookOpen,
  Download,
  Eye,
  ChevronDown
} from "lucide-react"
import Link from "next/link"

export default function SubmissionsPage() {
  const { id } = useParams()
  const router = useRouter()
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const [selectedSubmission, setSelectedSubmission] = useState<any>(null)
  const [grade, setGrade] = useState("")
  const [feedback, setFeedback] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (selectedSubmission) {
      setGrade(selectedSubmission.grade || "")
      setFeedback(selectedSubmission.feedback || "")
    }
  }, [selectedSubmission])

  const fetchSubmissions = async () => {
    try {
      const res = await fetch(`/api/courses/${id}/submissions`)
      const data = await res.json()
      if (res.ok) setSubmissions(data)
    } catch (err) {
      console.error("Failed to fetch submissions")
    } finally {
      setLoading(false)
    }
  }

  const saveGrade = async () => {
    if (!selectedSubmission) return
    setIsUpdating(true)
    try {
      const res = await fetch(`/api/submissions/${selectedSubmission._id}/grade`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade, feedback })
      })
      if (res.ok) {
        setSubmissions(submissions.map(s => s._id === selectedSubmission._id ? { ...s, grade, feedback } : s))
        setSelectedSubmission(null)
      }
    } catch (err) {
      console.error("Failed to save grade")
    } finally {
      setIsUpdating(false)
    }
  }

  const filteredSubmissions = submissions.filter(s => 
    s.userId?.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.lessonId?.title?.toLowerCase().includes(search.toLowerCase()) ||
    s.userId?.registrationNumber?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Loader2 className="animate-spin" size={48} color="var(--primary)" />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5 }}>
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Student Submissions</h2>
            <p style={{ opacity: 0.6 }}>Review quiz results and assignment uploads</p>
          </div>
        </div>

        <div style={{ position: 'relative', width: '350px' }}>
          <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} size={18} />
          <input 
            type="text" 
            placeholder="Search student, lesson, or Reg No..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.8rem 1rem 0.8rem 3rem',
              borderRadius: '0.75rem',
              border: '1px solid var(--glass-border)',
              background: 'white',
              outline: 'none'
            }}
          />
        </div>
      </div>

      <div className="glass-card">
        {filteredSubmissions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem', opacity: 0.5 }}>
            <ClipboardList size={64} style={{ marginBottom: '1rem' }} />
            <p>No submissions found matching your search.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.5rem' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#64748b', fontSize: '0.875rem' }}>
                  <th style={{ padding: '1rem' }}>Student</th>
                  <th style={{ padding: '1rem' }}>Lesson / Type</th>
                  <th style={{ padding: '1rem' }}>Status / Score</th>
                  <th style={{ padding: '1rem' }}>Submitted At</th>
                  <th style={{ padding: '1rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.map((sub) => (
                  <tr key={sub._id} style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--primary)' }}>
                          {sub.userId?.name?.[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{sub.userId?.name}</div>
                          <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>Reg: {sub.userId?.registrationNumber || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 600 }}>{sub.lessonId?.title}</div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>{sub.lessonId?.type}</div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {sub.lessonId?.type === 'QUIZ' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ 
                            padding: '0.25rem 0.75rem', 
                            borderRadius: '1rem', 
                            fontSize: '0.875rem', 
                            fontWeight: 700,
                            background: sub.score >= (sub.totalQuestions / 2) ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: sub.score >= (sub.totalQuestions / 2) ? '#10b981' : '#ef4444'
                          }}>
                            {sub.score} / {sub.totalQuestions}
                          </span>
                        </div>
                      ) : (
                        <span style={{ padding: '0.25rem 0.75rem', borderRadius: '1rem', background: '#e2e8f0', fontSize: '0.875rem' }}>Submitted</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.875rem', opacity: 0.7 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Clock size={14} />
                        {new Date(sub.submittedAt).toLocaleString()}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {sub.lessonId?.type === 'QUIZ' ? (
                        <button 
                          onClick={() => setSelectedSubmission(sub)}
                          className="btn"
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', background: '#f1f5f9', color: '#1e293b', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', border: '1px solid #e2e8f0' }}
                        >
                          <Eye size={14} /> View Details
                        </button>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {sub.assignmentFile?.url && (
                             <a 
                               href={sub.assignmentFile.url} 
                               target="_blank" 
                               rel="noreferrer"
                               className="btn"
                               style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', background: 'var(--primary)', color: 'white', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                             >
                               <Download size={14} /> View File
                             </a>
                          )}
                          <button 
                            onClick={() => setSelectedSubmission(sub)}
                            className="btn"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', background: '#f1f5f9', color: '#1e293b', border: '1px solid #e2e8f0' }}
                          >
                            Grade & Comment
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quiz Detail Modal */}
      {selectedSubmission && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '2rem' }}>
          <div className="glass-card animate-scale-in" style={{ maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Submission Review</h3>
                <p style={{ opacity: 0.6 }}>{selectedSubmission.userId?.name} — {selectedSubmission.lessonId?.title}</p>
              </div>
              <button 
                onClick={() => setSelectedSubmission(null)} 
                style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', padding: '0.5rem', borderRadius: '50%' }}
              >
                <XCircle size={24} color="#64748b" />
              </button>
            </div>

            {selectedSubmission.lessonId?.type === 'QUIZ' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
                  <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '1rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Auto-Score</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{selectedSubmission.score} / {selectedSubmission.totalQuestions}</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '1rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Percentage</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{Math.floor(selectedSubmission.score * 100 / selectedSubmission.totalQuestions)}%</div>
                  </div>
                  <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '1rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Auto-Status</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: selectedSubmission.score >= (selectedSubmission.totalQuestions/2) ? '#10b981' : '#ef4444' }}>
                      {selectedSubmission.score >= (selectedSubmission.totalQuestions/2) ? 'PASSED' : 'FAILED'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '3rem' }}>
                  <h4 style={{ fontWeight: 700, fontSize: '1.1rem' }}>Detailed Responses</h4>
                  {selectedSubmission.lessonId?.quizData?.map((q: any, qi: number) => {
                    const subAns = selectedSubmission.answers?.find((a: any) => a.questionIndex === qi)
                    return (
                      <div key={qi} style={{ padding: '1.5rem', border: '1px solid #f1f5f9', borderRadius: '1rem' }}>
                        <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>{qi + 1}</span>
                          {q.question}
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1rem' }}>
                          {q.options?.map((opt: string, oi: number) => {
                            const isSelected = subAns?.answerIndex === oi
                            const isCorrect = q.correctAnswer === oi
                            let borderColor = '#e2e8f0'
                            let background = 'white'
                            if (isSelected) {
                              borderColor = isCorrect ? '#10b981' : '#ef4444'
                              background = isCorrect ? '#f0fdf4' : '#fef2f2'
                            } else if (isCorrect) {
                              borderColor = '#10b981'
                              background = '#f0fdf4'
                            }
                            return (
                              <div key={oi} style={{ padding: '0.875rem 1.25rem', borderRadius: '0.75rem', border: `1.5px solid ${borderColor}`, background, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s' }}>
                                <span>{opt}</span>
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                  {isSelected && !isCorrect && <XCircle size={16} color="#ef4444" />}
                                  {isCorrect && <CheckCircle size={16} color="#10b981" />}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            <div style={{ marginTop: '2.5rem', borderTop: '2px solid #f1f5f9', paddingTop: '2.5rem' }}>
              <h4 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Evaluation & Feedback</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Grade</label>
                  <input 
                    type="text" 
                    value={grade}
                    placeholder="e.g. A, 90, Pass"
                    onChange={e => setGrade(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Private Feedback to Student</label>
                  <textarea 
                    value={feedback}
                    placeholder="Provide constructive feedback..."
                    onChange={e => setFeedback(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', outline: 'none', minHeight: '100px', resize: 'vertical' }}
                  ></textarea>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button 
                onClick={() => setSelectedSubmission(null)} 
                style={{ padding: '0.75rem 2rem', background: '#f1f5f9', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={saveGrade} 
                className="btn btn-primary" 
                disabled={isUpdating}
                style={{ padding: '0.75rem 2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {isUpdating ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                Save Evaluation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
