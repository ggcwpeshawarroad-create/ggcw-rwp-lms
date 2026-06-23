"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { 
  Play, 
  ChevronRight, 
  Video, 
  FileText, 
  HelpCircle, 
  ClipboardList, 
  Loader2, 
  BookOpen,
  ArrowLeft,
  CheckCircle,
  Menu,
  X,
  AlertCircle,
  Upload,
  ShieldOff
} from "lucide-react"

function getYouTubeId(url: string) {
  return url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/)?.[1] || ""
}

function getVimeoId(url: string) {
  return url.match(/vimeo\.com\/(?:video\/)?(\d+)/)?.[1] || ""
}

function getVideoEmbedUrl(url: string) {
  const youTubeId = getYouTubeId(url)
  if (youTubeId) return "https://www.youtube-nocookie.com/embed/" + youTubeId
  const vimeoId = getVimeoId(url)
  if (vimeoId) return "https://player.vimeo.com/video/" + vimeoId
  return url
}

function getVideoThumbnailUrl(url: string) {
  const youTubeId = getYouTubeId(url)
  return youTubeId ? "https://img.youtube.com/vi/" + youTubeId + "/hqdefault.jpg" : ""
}

function normalizeLessonType(type?: string) {
  return (type || "LECTURE").trim().toUpperCase()
}

export default function CoursePlayerPage() {
  const { id } = useParams()
  const router = useRouter()
  const [course, setCourse] = useState<any>(null)
  const [chapters, setChapters] = useState<any[]>([])
  const [selectedLesson, setSelectedLesson] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isEnrolled, setIsEnrolled] = useState<boolean | null>(null)
  const [showSidebar, setShowSidebar] = useState(true)

  // Quiz States
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({})
  const [quizResult, setQuizResult] = useState<{ score: number; total: number } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [isMounted, setIsMounted] = useState(false)
  const [assignmentFile, setAssignmentFile] = useState<{ url: string; name: string } | null>(null)
  const [submissionSuccess, setSubmissionSuccess] = useState(false)
  const [submissionData, setSubmissionData] = useState<any>(null)

  useEffect(() => {
    setIsMounted(true)
    fetchCourseData()
  }, [])

  useEffect(() => {
    setQuizAnswers({})
    setQuizResult(null)
    setSubmissionData(null)
    setSubmissionSuccess(false)
    setError("")
    const lessonType = normalizeLessonType(selectedLesson?.type)
    setAssignmentFile(null)
    if (lessonType === "QUIZ" || lessonType === "ASSIGNMENT") {
        checkSubmissionStatus()
    }
  }, [selectedLesson?._id])

  const checkSubmissionStatus = async () => {
    try {
        const res = await fetch(`/api/courses/${id}/submissions?lessonId=${selectedLesson._id}`)
        if (res.ok) {
            const data = await res.json()
            if (data.length > 0) {
                const sub = data[0]
                setSubmissionData(sub)
                setSubmissionSuccess(true)
                if (normalizeLessonType(selectedLesson.type) === "QUIZ") {
                  setQuizResult({ score: sub.score, total: sub.totalQuestions })
                } else if (normalizeLessonType(selectedLesson.type) === "ASSIGNMENT") {
                  setAssignmentFile(sub.assignmentFile)
                }
            }
        }
    } catch {}
  }

  const handleAssignmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setIsSubmitting(true)
    setError("")
    
    const formData = new FormData()
    formData.append("file", file)
    
    try {
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData })
      if (!uploadRes.ok) throw new Error("Upload failed")
      const uploadData = await uploadRes.json()
      
      const submitRes = await fetch(`/api/courses/${id}/lessons/${selectedLesson._id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          assignmentFile: { url: uploadData.url, name: uploadData.name }
        })
      })
      
      if (submitRes.ok) {
        setAssignmentFile({ url: uploadData.url, name: uploadData.name })
        setSubmissionSuccess(true)
      } else {
        const d = await submitRes.json()
        setError(d.error || "Failed to submit assignment")
      }
    } catch (err) {
      setError("Failed to upload/submit assignment. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const submitQuiz = async () => {
    if (!selectedLesson?.quizData) return
    setIsSubmitting(true)
    setError("")
    
    const answers = Object.entries(quizAnswers).map(([qIdx, oIdx]) => ({
      questionIndex: parseInt(qIdx),
      answerIndex: oIdx
    }))

    try {
      const res = await fetch(`/api/courses/${id}/lessons/${selectedLesson._id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers })
      })
      
      const data = await res.json()
      if (res.ok) {
        setQuizResult({ score: data.score, total: data.total })
      } else {
        setError(data.error || "Failed to submit quiz")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const fetchCourseData = async () => {
    try {
      const [cRes, chRes, eRes] = await Promise.all([
        fetch(`/api/courses/${id}`),
        fetch(`/api/courses/${id}/chapters`),
        fetch(`/api/enrollments?courseId=${id}`)
      ])

      const cData = await cRes.json()
      const chData = await chRes.json()
      const eData = await eRes.json()

      if (cRes.ok) setCourse(cData)

      // Enrollment guard: check if student is in any enrollment for this course
      const enrolled = eRes.ok && Array.isArray(eData) && eData.length > 0
      setIsEnrolled(enrolled)

      if (enrolled && chRes.ok) {
          const chaptersWithLessons = await Promise.all(chData.map(async (ch: any) => {
              const lRes = await fetch(`/api/courses/${id}/lessons?chapterId=${ch._id}`)
              const lData = await lRes.json()
              return { ...ch, lessons: lRes.ok ? lData : [] }
          }))
          setChapters(chaptersWithLessons)
          if (chaptersWithLessons.length > 0 && chaptersWithLessons[0].lessons.length > 0) {
              setSelectedLesson({ ...chaptersWithLessons[0].lessons[0], type: normalizeLessonType(chaptersWithLessons[0].lessons[0].type) })
          }
      }
    } catch (err) {
      console.error("Failed to load course")
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '10rem' }}><Loader2 className="animate-spin" size={48} color="#4f46e5" /></div>

  if (!isEnrolled) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: '2rem' }}>
      <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
        <ShieldOff size={36} color="#ef4444" />
      </div>
      <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.75rem' }}>Access Restricted</h2>
      <p style={{ color: '#64748b', fontSize: '1rem', maxWidth: '400px', lineHeight: '1.65', marginBottom: '2rem' }}>
        You need to enroll in this course before accessing its content.
      </p>
      <Link href="/student/browse" className="btn btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.85rem 2rem' }}>
        Browse Courses
      </Link>
    </div>
  )

  return (
    <div className="course-player-shell" style={{ display: 'flex', height: 'calc(100vh - 80px)', margin: '-2rem', overflow: 'hidden' }}>
      {/* Sidebar */}
      {showSidebar && (
        <div className="course-player-sidebar" style={{ width: '320px', borderRight: '1px solid rgba(0,0,0,0.1)', background: 'white', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
            <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.25rem' }}>{course?.title}</h3>
            <p style={{ fontSize: '0.75rem', opacity: 0.5 }}>Course Content</p>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {chapters.map((chapter) => (
              <div key={chapter._id}>
                <div style={{ padding: '0.75rem 1.5rem', background: '#f8fafc', fontWeight: 700, fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {chapter.title}
                </div>
                <div>
                  {chapter.lessons.map((lesson: any) => {
                    const lessonType = normalizeLessonType(lesson.type)
                    const isActive = selectedLesson?._id === lesson._id

                    return (
                    <button
                      key={lesson._id}
                      type="button"
                      onClick={() => setSelectedLesson({ ...lesson, type: lessonType })}
                      style={{
                        width: '100%',
                        padding: '1rem 1.5rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        background: isActive ? 'rgba(79, 70, 229, 0.1)' : 'transparent',
                        border: 'none',
                        borderLeft: `4px solid ${isActive ? '#4f46e5' : 'transparent'}`,
                        textAlign: 'left',
                        transition: 'all 0.2s'
                      }}
                    >
                      {lessonType === "LECTURE" && <Video size={16} color={isActive ? '#4f46e5' : '#94a3b8'} />}
                      {lessonType === "QUIZ" && <HelpCircle size={16} color="#f59e0b" />}
                      {lessonType === "ASSIGNMENT" && <ClipboardList size={16} color="#ef4444" />}
                      {lessonType === "DOCUMENT" && <FileText size={16} color="#6366f1" />}
                      {lessonType !== "LECTURE" && lessonType !== "QUIZ" && lessonType !== "ASSIGNMENT" && lessonType !== "DOCUMENT" && <BookOpen size={16} color="#94a3b8" />}
                      <span style={{ fontSize: '0.875rem', fontWeight: isActive ? 700 : 500, color: isActive ? '#4f46e5' : '#1e293b' }}>
                        {lesson.title}
                      </span>
                    </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div suppressHydrationWarning className="course-player-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f8fafc', overflowY: 'auto' }}>
        <div className="course-player-toolbar" style={{ padding: '1rem 2rem', background: 'white', borderBottom: '1px solid rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={() => setShowSidebar(!showSidebar)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5 }}>
              <Menu size={20} />
            </button>
            <h4 style={{ fontWeight: 600 }}>{selectedLesson?.title || "Course Material"}</h4>
          </div>
          <button onClick={() => router.back()} style={{ fontSize: '0.875rem', fontWeight: 600, color: '#4f46e5', display: 'flex', alignItems: 'center', gap: '0.4rem', border: 'none', background: 'none', cursor: 'pointer' }}>
            <ArrowLeft size={16} /> Exit Course
          </button>
        </div>

        <div className="course-player-body" style={{ padding: '3rem', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
          {!isMounted ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10rem' }}><Loader2 className="animate-spin" size={48} color="#4f46e5" /></div>
          ) : !selectedLesson ? (
            <div style={{ textAlign: 'center', padding: '10rem', opacity: 0.5 }}>
              <BookOpen size={64} style={{ marginBottom: '1rem' }} />
              <p>Select a lesson from the sidebar to start learning.</p>
            </div>
          ) : (
            <div className="animate-slide-up">
              {normalizeLessonType(selectedLesson.type) === "LECTURE" && selectedLesson.videoUrl && (
                <div style={{ width: '100%', aspectRatio: '16/9', background: '#000', borderRadius: '1.5rem', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', marginBottom: '2.5rem' }}>
                   <iframe
                    src={getVideoEmbedUrl(selectedLesson.videoUrl)}
                    title={selectedLesson.title || "Lesson video"}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
                  />
                </div>
              )}

              {normalizeLessonType(selectedLesson.type) === "QUIZ" && (
                <div className="glass-card" style={{ padding: '3rem', marginBottom: '2rem' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                     <div>
                       <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>{selectedLesson.title}</h2>
                       {selectedLesson.endDate && (
                         <p style={{ fontSize: '0.85rem', color: new Date() > new Date(selectedLesson.endDate) ? '#ef4444' : '#64748b' }}>
                           Due: {new Date(selectedLesson.endDate).toLocaleString()}
                         </p>
                       )}
                     </div>
                   </div>

                   {error && (
                     <div style={{ padding: '1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.75rem', color: '#dc2626', marginBottom: '1.5rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                       <AlertCircle size={18} /> {error}
                     </div>
                   )}

                   {quizResult ? (
                     <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(79, 70, 229, 0.05)', borderRadius: '1.5rem', border: '1px solid rgba(79, 70, 229, 0.15)' }}>
                        <CheckCircle size={64} color="#4f46e5" style={{ marginBottom: '1.5rem' }} />
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Quiz Completed!</h3>
                        <p style={{ fontSize: '2rem', fontWeight: 800, color: '#4f46e5', margin: '1rem 0' }}>{quizResult.score} {' / '} {quizResult.total}</p>
                        <p style={{ opacity: 0.6 }}>Your score is {Math.floor(quizResult.score * 100 / (quizResult.total || 1))}%</p>
                         {(submissionData?.grade || submissionData?.feedback) && (
                            <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'white', borderRadius: '1rem', border: '1px solid #e2e8f0', textAlign: 'left' }}>
                              <h4 style={{ fontWeight: 700, fontSize: '0.85rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Instructor Marks &amp; Feedback</h4>
                              {submissionData.grade && (
                                <p style={{ fontWeight: 800, fontSize: '1.1rem', color: '#4f46e5' }}>Mark: {submissionData.grade}</p>
                              )}
                              {submissionData.feedback && (
                                <p style={{ fontSize: '0.95rem', lineHeight: '1.65', color: '#334155', fontStyle: 'italic', marginTop: '0.5rem' }}>"{submissionData.feedback}"</p>
                              )}
                            </div>
                          )}
                        {selectedLesson.isRetakeAllowed && (
                          <button onClick={() => { setQuizAnswers({}); setQuizResult(null); setError(""); }} className="btn btn-primary" style={{ marginTop: '2rem' }}>Retake Quiz</button>
                        )}
                        {!selectedLesson.isRetakeAllowed && (
                          <p style={{ marginTop: '2rem', fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic' }}>Retakes are not allowed for this quiz.</p>
                        )}
                     </div>
                   ) : (
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                        {selectedLesson.endDate && new Date() > new Date(selectedLesson.endDate) ? (
                          <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.5 }}>
                            <X size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Deadline Passed</h3>
                            <p>You can no longer submit this quiz.</p>
                          </div>
                        ) : (
                          <>
                            {selectedLesson.quizData?.map((q: any, qIdx: number) => (
                               <div key={qIdx}>
                                  <h4 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '1.1rem' }}>{qIdx + 1}. {q.question}</h4>
                                  <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                     {q.options.map((opt: string, oIdx: number) => (
                                       <div 
                                         key={oIdx}
                                         onClick={() => setQuizAnswers({ ...quizAnswers, [qIdx]: oIdx })}
                                         style={{ 
                                           padding: '1rem', 
                                           borderRadius: '0.75rem', 
                                           border: '1px solid',
                                           borderColor: quizAnswers[qIdx] === oIdx ? '#4f46e5' : '#e2e8f0',
                                           background: quizAnswers[qIdx] === oIdx ? 'rgba(79, 70, 229, 0.05)' : 'white',
                                           cursor: 'pointer',
                                           transition: 'all 0.2s',
                                           display: 'flex',
                                           alignItems: 'center',
                                           gap: '0.75rem'
                                         }}
                                       >
                                          <div style={{ 
                                            width: '20px', 
                                            height: '20px', 
                                            borderRadius: '50%', 
                                            border: '1px solid #e2e8f0',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: quizAnswers[qIdx] === oIdx ? '#4f46e5' : 'white'
                                          }}>
                                             {quizAnswers[qIdx] === oIdx && <div style={{ width: '8px', height: '8px', background: 'white', borderRadius: '50%' }} />}
                                          </div>
                                          <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>{opt}</span>
                                       </div>
                                     ))}
                                  </div>
                               </div>
                            ))}
                            <button 
                              onClick={submitQuiz}
                              disabled={isSubmitting || Object.keys(quizAnswers).length < (selectedLesson.quizData?.length || 0)}
                              className="btn btn-primary" 
                              style={{ alignSelf: 'flex-start', padding: '1rem 2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                               {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                               {isSubmitting ? "Submitting..." : "Submit Quiz"}
                            </button>
                          </>
                        )}
                     </div>
                   )}
                </div>
              )}

               {normalizeLessonType(selectedLesson.type) === "ASSIGNMENT" && (
                <div className="glass-card" style={{ padding: '3rem', marginBottom: '2rem' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                    <div>
                      <span style={{ padding: '0.4rem 1rem', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 700, marginBottom: '1rem', display: 'inline-block' }}>
                        ASSIGNMENT
                      </span>
                      <h2 style={{ fontSize: '2.25rem', fontWeight: 800 }}>{selectedLesson.title}</h2>
                      {selectedLesson.endDate && (
                        <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: new Date() > new Date(selectedLesson.endDate) ? '#ef4444' : '#64748b', fontWeight: 600 }}>
                          Due Date: {new Date(selectedLesson.endDate).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ lineHeight: '1.8', fontSize: '1.1rem', opacity: 0.8, whiteSpace: 'pre-wrap', marginBottom: '3rem' }}>
                    {selectedLesson.content || "No detailed instructions provided for this assignment."}
                  </div>

                  {selectedLesson.attachments?.length > 0 && (
                    <div style={{ marginTop: '3rem', borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '2.5rem' }}>
                      <h5 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Reference Materials</h5>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                        {selectedLesson.attachments.map((file: any, idx: number) => (
                          <a key={idx} href={file.url} target="_blank" rel="noopener noreferrer" title={`Open ${file.name}`} className="glass-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', transition: 'transform 0.2s' }}>
                            <FileText size={20} color="#4f46e5" />
                            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{file.name}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div style={{ marginTop: '3rem', padding: '2.5rem', background: submissionSuccess ? 'rgba(16, 185, 129, 0.05)' : '#f8fafc', borderRadius: '1.5rem', border: `2px dashed ${submissionSuccess ? '#10b981' : '#cbd5e1'}`, textAlign: 'center' }}>
                      {submissionSuccess ? (
                        <>
                          <CheckCircle size={48} color="#10b981" style={{ marginBottom: '1rem' }} />
                          <h4 style={{ fontWeight: 700, color: '#065f46' }}>Assignment Submitted!</h4>
                          <p style={{ fontSize: '0.9rem', opacity: 0.6, marginTop: '0.5rem' }}>You successfully uploaded: {assignmentFile?.name}</p>
                          <a href={assignmentFile?.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: '1.5rem', fontSize: '0.875rem', color: '#4f46e5', fontWeight: 600 }}>View My Submission</a>

                          {(submissionData?.grade || submissionData?.feedback) && (
                            <div style={{ marginTop: '2.5rem', padding: '1.5rem', background: 'white', borderRadius: '1.25rem', border: '1px solid #e2e8f0', textAlign: 'left' }}>
                              <h4 style={{ fontWeight: 700, fontSize: '0.9rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <BookOpen size={16} /> Instructor Marks & Feedback
                              </h4>
                              {submissionData.grade && (
                                <div style={{ marginBottom: '1rem' }}>
                                  <span style={{ fontSize: '0.8rem', fontWeight: 700, opacity: 0.5 }}>FINAL GRADE:</span>
                                  <span style={{ marginLeft: '0.5rem', fontWeight: 800, fontSize: '1.2rem', color: '#10b981' }}>{submissionData.grade}</span>
                                </div>
                              )}
                              {submissionData.feedback && (
                                <p style={{ fontSize: '1rem', lineHeight: '1.6', color: '#334155', fontStyle: 'italic' }}>"{submissionData.feedback}"</p>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <h4 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Submit Assignment</h4>
                          <p style={{ opacity: 0.6, fontSize: '0.9rem', marginBottom: '1.5rem' }}>Upload your completed work as a PDF or Zip file.</p>
                          
                          {error && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>}
                          
                          <input 
                            type="file" 
                            id="assign-upload" 
                            hidden 
                            onChange={handleAssignmentUpload}
                            disabled={isSubmitting || (selectedLesson.endDate && new Date() > new Date(selectedLesson.endDate))}
                          />
                          <label 
                            htmlFor="assign-upload"
                            className="btn btn-primary" 
                            style={{ 
                              cursor: (isSubmitting || (selectedLesson.endDate && new Date() > new Date(selectedLesson.endDate))) ? 'not-allowed' : 'pointer',
                              opacity: (isSubmitting || (selectedLesson.endDate && new Date() > new Date(selectedLesson.endDate))) ? 0.6 : 1,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}
                          >
                             {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                             {selectedLesson.endDate && new Date() > new Date(selectedLesson.endDate) ? "Deadline Passed" : (isSubmitting ? "Uploading..." : "Upload Submission")}
                          </label>
                        </>
                      )}
                  </div>
                </div>
              )}

              {normalizeLessonType(selectedLesson.type) !== "QUIZ" && normalizeLessonType(selectedLesson.type) !== "ASSIGNMENT" && (
                <div className="glass-card" style={{ padding: '3rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <span style={{ padding: '0.4rem 1rem', background: 'rgba(79, 70, 229, 0.15)', color: '#4f46e5', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 700 }}>
                      {normalizeLessonType(selectedLesson.type)}
                    </span>
                    <span style={{ opacity: 0.4 }}>•</span>
                    <span style={{ fontSize: '0.875rem', opacity: 0.6 }}>{course?.title}</span>
                  </div>
                  
                  <h2 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '2rem' }}>{selectedLesson.title}</h2>
                  
                  <div style={{ lineHeight: '1.8', fontSize: '1.1rem', opacity: 0.8, whiteSpace: 'pre-wrap' }}>
                    {selectedLesson.content || "No detailed content provided for this lesson."}
                  </div>

                  {selectedLesson.attachments?.length > 0 && (
                    <div style={{ marginTop: '3rem', borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '2.5rem' }}>
                      <h5 style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Supporting Documents</h5>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                        {selectedLesson.attachments.map((file: any, idx: number) => (
                          <a key={idx} href={file.url} target="_blank" rel="noopener noreferrer" title={`Open ${file.name}`} className="glass-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', transition: 'transform 0.2s' }}>
                            <FileText size={20} color="#4f46e5" />
                            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{file.name}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
