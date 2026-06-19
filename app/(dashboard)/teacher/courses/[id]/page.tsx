"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  Plus, 
  GripVertical, 
  Video, 
  FileText, 
  HelpCircle, 
  ClipboardList, 
  ChevronRight, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Loader2,
  Eye,
  BookOpen,
  Megaphone,
  Images
} from "lucide-react"
import { Toast, ToastType } from "@/components/ui/Toast"

const LESSON_ICON_MAP: Record<string, any> = {
  LECTURE: { Icon: Video, color: "#4f46e5" },
  QUIZ: { Icon: HelpCircle, color: "#f59e0b" },
  ASSIGNMENT: { Icon: ClipboardList, color: "#ef4444" },
  DOCUMENT: { Icon: FileText, color: "#6366f1" },
  ANNOUNCEMENT: { Icon: Megaphone, color: "#10b981" },
  SLIDER: { Icon: Images, color: "#8b5cf6" },
}

export default function CourseBuilderPage() {
  const { id } = useParams()
  const router = useRouter()
  const [course, setCourse] = useState<any>(null)
  const [isEnrolled, setIsEnrolled] = useState<boolean | null>(null)
  const [chapters, setChapters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)
  const [showAddChapter, setShowAddChapter] = useState(false)
  const [newChapterTitle, setNewChapterTitle] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingLessonId, setDeletingLessonId] = useState<string | null>(null)

  useEffect(() => { fetchCourseData() }, [])

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

      const enrolled = eRes.ok && Array.isArray(eData) && eData.length > 0
      const canAccessCourse = enrolled || !!cData?.isOwner
      setIsEnrolled(canAccessCourse)

      if (canAccessCourse && chRes.ok) {
        const chaptersWithLessons = await Promise.all(chData.map(async (ch: any) => {
          const lRes = await fetch(`/api/courses/${id}/lessons?chapterId=${ch._id}`)
          const lData = await lRes.json()
          return { ...ch, lessons: lRes.ok ? lData : [] }
        }))
        setChapters(chaptersWithLessons)
      }
    } catch {
      setToast({ message: "Failed to load course data", type: "error" })
    } finally {
      setLoading(false)
    }
  }

  const handleAddChapter = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/courses/${id}/chapters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newChapterTitle })
      })
      if (res.ok) {
        setNewChapterTitle("")
        setShowAddChapter(false)
        fetchCourseData()
        setToast({ message: "Chapter added successfully", type: "success" })
      }
    } catch {
      setToast({ message: "Failed to add chapter", type: "error" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteLesson = async (lessonId: string) => {
    await fetch("/api/courses/" + id + "/lessons/" + lessonId, { method: "DELETE" })
    setDeletingLessonId(null)
    fetchCourseData()
    setToast({ message: "Lesson removed", type: "success" })
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '10rem' }}>
      <Loader2 className="animate-spin" size={48} color="#4f46e5" />
    </div>
  )

  if (!isEnrolled) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: '2rem' }}>
      <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
        <BookOpen size={36} color="#ef4444" />
      </div>
      <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.75rem' }}>Enrollment Required</h2>
      <p style={{ color: '#64748b', fontSize: '1rem', maxWidth: '420px', lineHeight: '1.65', marginBottom: '2rem' }}>Enroll yourself in this course before entering it.</p>
      <button onClick={() => router.push("/teacher/browse")} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.85rem 2rem' }}>Browse Courses</button>
    </div>
  )

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5 }}>
              <ChevronRight style={{ transform: 'rotate(180deg)' }} size={24} />
            </button>
            <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Course Builder</h2>
          </div>
          <p style={{ opacity: 0.6, paddingLeft: '2.5rem' }}>
            Curriculum for <span style={{ color: '#4f46e5', fontWeight: 600 }}>{course?.title}</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {(course?.isOwner || isEnrolled) && (
          <button 
            onClick={() => router.push(`/teacher/courses/${id}/submissions`)}
            className="btn" 
            style={{ background: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--glass-border)' }}
          >
            <ClipboardList size={18} /> Submissions
          </button>
          )}
          <button className="btn" style={{ background: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--glass-border)' }}>
            <Eye size={18} /> Preview
          </button>
          {(course?.isOwner || isEnrolled) && (
          <button onClick={() => setShowAddChapter(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} /> Add Chapter
          </button>
          )}
        </div>
      </div>

      {/* Curriculum List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {chapters.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '6rem', background: 'white', borderRadius: '1.5rem', border: '2px dashed #e2e8f0', opacity: 0.5 }}>
            <BookOpen size={48} style={{ marginBottom: '1rem' }} />
            <p>Your curriculum is empty. Start by adding a chapter.</p>
          </div>
        ) : (
          chapters.map((chapter) => (
            <div key={chapter._id} className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
              {/* Chapter Header */}
              <div style={{ padding: '1.25rem 1.5rem', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <GripVertical size={20} style={{ opacity: 0.3 }} />
                  <div 
                    onClick={() => router.push(`/teacher/courses/${id}/chapters/${chapter._id}`)}
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.8rem' }}
                  >
                    <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary)', textDecoration: 'underline', textDecorationColor: 'rgba(1, 65, 28, 0.2)' }}>
                      {chapter.title}
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', background: '#f1f5f9', padding: '0.2rem 0.6rem', borderRadius: '1rem' }}>
                      {chapter.lessons?.length || 0} lessons
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {(course?.isOwner || isEnrolled) && (
                  <button 
                    onClick={() => router.push(`/teacher/courses/${id}/lessons/new?chapterId=${chapter._id}`)}
                    style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', background: '#4f46e5', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 700 }}
                  >
                    <Plus size={14} /> Add Lesson
                  </button>
                  )}
                  {(course?.isOwner || isEnrolled) && (
                  <button type="button" onClick={() => router.push("/teacher/courses/" + id + "/chapters/" + chapter._id)} title="Edit chapter" style={{ padding: '0.5rem', background: 'none', border: 'none', opacity: 0.65, cursor: 'pointer' }}>
                    <MoreVertical size={18} />
                  </button>
                  )}
                </div>
              </div>

              {/* Lessons */}
              <div style={{ padding: '0.25rem 0' }}>
                {chapter.lessons?.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.4, fontSize: '0.875rem' }}>
                    No lessons yet. Click "Add Lesson" to create your first lesson in this chapter.
                  </div>
                ) : (
                  chapter.lessons.map((lesson: any, li: number) => {
                    const typeInfo = LESSON_ICON_MAP[lesson.type] || LESSON_ICON_MAP.LECTURE
                    const Icon = typeInfo.Icon
                    return (
                      <div 
                        key={lesson._id} 
                        style={{ 
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '0.9rem 1.5rem 0.9rem 3.5rem',
                          borderBottom: li < chapter.lessons.length - 1 ? '1px solid #f8fafc' : 'none',
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#f8fafc")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                          <div style={{ padding: '0.4rem', borderRadius: '0.5rem', background: `${typeInfo.color}15` }}>
                            <Icon size={16} color={typeInfo.color} />
                          </div>
                          <div>
                            <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>{lesson.title}</span>
                            <span style={{ marginLeft: '0.6rem', fontSize: '0.72rem', color: typeInfo.color, background: `${typeInfo.color}15`, padding: '0.1rem 0.5rem', borderRadius: '0.3rem', fontWeight: 600 }}>
                              {lesson.type}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: (course?.isOwner || isEnrolled) ? 'flex' : 'none', gap: '0.4rem', alignItems: 'center' }}>
                          {deletingLessonId === lesson._id ? (
                            <>
                              <span style={{ fontSize: '0.78rem', color: '#64748b', whiteSpace: 'nowrap' }}>Delete?</span>
                              <button
                                onClick={e => { e.stopPropagation(); handleDeleteLesson(lesson._id) }}
                                style={{ padding: '0.25rem 0.6rem', borderRadius: '0.4rem', background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}
                              >Yes</button>
                              <button
                                onClick={e => { e.stopPropagation(); setDeletingLessonId(null) }}
                                style={{ padding: '0.25rem 0.6rem', borderRadius: '0.4rem', background: '#f1f5f9', color: '#475569', border: 'none', cursor: 'pointer', fontSize: '0.78rem' }}
                              >No</button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={e => { e.stopPropagation(); router.push(`/teacher/courses/${id}/lessons/${lesson._id}/edit`) }}
                                title="Edit lesson"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.35rem', borderRadius: '0.4rem', color: '#64748b', display: 'flex' }}
                              >
                                <Edit size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={e => { e.stopPropagation(); setDeletingLessonId(lesson._id) }}
                                title="Delete lesson"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.35rem', borderRadius: '0.4rem', color: '#ef4444', display: 'flex' }}
                              >
                                <Trash2 size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Chapter Modal */}
      {showAddChapter && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-card animate-scale-in" style={{ maxWidth: '440px', width: '100%', background: 'white' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#4f46e5' }}>Add New Chapter</h3>
            <p style={{ opacity: 0.5, fontSize: '0.875rem', marginBottom: '1.5rem' }}>Group your lessons into chapters for better organization.</p>
            <form onSubmit={handleAddChapter}>
              <input 
                autoFocus
                type="text" 
                placeholder="e.g. Chapter 1: Introduction" 
                value={newChapterTitle}
                onChange={e => setNewChapterTitle(e.target.value)}
                style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', marginBottom: '1.5rem', outline: 'none', fontSize: '0.95rem', boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" onClick={() => setShowAddChapter(false)} className="btn" style={{ flex: 1, background: '#f1f5f9' }}>Cancel</button>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ flex: 1 }}>
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Add Chapter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
