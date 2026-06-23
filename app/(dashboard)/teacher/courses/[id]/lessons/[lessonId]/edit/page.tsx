"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { 
  Video, FileText, HelpCircle, ClipboardList, Megaphone, Images,
  Plus, Trash2, Loader2, ChevronLeft, Upload, X, CheckCircle, 
  AlertCircle, Edit, Save 
} from "lucide-react"
import { Toast, ToastType } from "@/components/ui/Toast"

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

function toDateTimeLocalValue(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return localDate.toISOString().slice(0, 16)
}

function localDateTimeToIso(value: string) {
  return value ? new Date(value).toISOString() : ""
}

type UploadedFile = { name: string; url: string; size?: number }

const LESSON_TYPES = [
  { key: "LECTURE", label: "Lecture / Video", icon: Video, color: "#4f46e5", desc: "Add a video lecture with content notes" },
  { key: "QUIZ", label: "Quiz", icon: HelpCircle, color: "#f59e0b", desc: "Create a multiple choice quiz" },
  { key: "DOCUMENT", label: "Document", icon: FileText, color: "#6366f1", desc: "Share PDFs, PPTs, Word files" },
  { key: "ASSIGNMENT", label: "Assignment", icon: ClipboardList, color: "#ef4444", desc: "Assign homework or projects" },
  { key: "ANNOUNCEMENT", label: "Announcement", icon: Megaphone, color: "#10b981", desc: "Post an announcement to students" },
  { key: "SLIDER", label: "Slides / Gallery", icon: Images, color: "#8b5cf6", desc: "Add image slides or a gallery" },
]

function FileUploadZone({ onUpload, initialFiles = [], multiple = false, accept = "*", label = "Upload File" }: {
  onUpload: (files: UploadedFile[]) => void
  initialFiles?: UploadedFile[]
  multiple?: boolean
  accept?: string
  label?: string
}) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(initialFiles)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setUploadedFiles(initialFiles) }, [initialFiles])

  const handleFiles = async (fileList: FileList) => {
    setUploading(true)
    const results: UploadedFile[] = []
    for (const file of Array.from(fileList)) {
      const formData = new FormData()
      formData.append("file", file)
      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData })
        if (res.ok) {
          const data = await res.json()
          results.push({ name: data.name, url: data.url, size: data.size })
        }
      } catch {}
    }
    const updated = [...uploadedFiles, ...results]
    setUploadedFiles(updated)
    onUpload(updated)
    setUploading(false)
  }

  const removeFile = (idx: number) => {
    const updated = uploadedFiles.filter((_, i) => i !== idx)
    setUploadedFiles(updated)
    onUpload(updated)
  }

  return (
    <div>
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? '#4f46e5' : '#e2e8f0'}`,
          borderRadius: '1rem',
          padding: '2.5rem',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragOver ? 'rgba(79,70,229,0.03)' : '#fafafa',
          transition: 'all 0.2s'
        }}
      >
        <input ref={inputRef} type="file" hidden multiple={multiple} accept={accept} onChange={e => { if (e.target.files) handleFiles(e.target.files) }} />
        {uploading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <Loader2 size={36} color="#4f46e5" className="animate-spin" />
            <p style={{ color: '#64748b' }}>Uploading...</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            <Upload size={36} color="#94a3b8" />
            <p style={{ color: '#475569', fontWeight: 600 }}>{label}</p>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Drag & drop or click to browse</p>
          </div>
        )}
      </div>
      {uploadedFiles.length > 0 && (
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {uploadedFiles.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'white', borderRadius: '0.75rem', border: '1px solid #e8effd' }}>
              <CheckCircle size={16} color="#10b981" style={{ flexShrink: 0 }} />
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                title={`Open ${f.name}`}
                style={{ flex: 1, fontSize: '0.875rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#4f46e5', textDecoration: 'none' }}
              >
                {f.name}
              </a>
              <button type="button" onClick={e => { e.stopPropagation(); removeFile(i) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0.2rem' }}>
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function EditLessonPage() {
  const router = useRouter()
  const { id, lessonId } = useParams()

  const [lesson, setLesson] = useState<any>(null)
  const [selectedType, setSelectedType] = useState<string>("LECTURE")
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [attachments, setAttachments] = useState<UploadedFile[]>([])
  const [quizData, setQuizData] = useState<{ question: string; options: string[]; correctAnswer: number }[]>([])
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [isRetakeAllowed, setIsRetakeAllowed] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  useEffect(() => {
    setIsMounted(true)
    async function fetchLesson() {
      try {
        const res = await fetch(`/api/courses/${id}/lessons/${lessonId}`)
        if (res.ok) {
          const data = await res.json()
          setLesson(data)
          setTitle(data.title || "")
          setSelectedType(data.type || "LECTURE")
          setContent(data.content || "")
          setVideoUrl(data.videoUrl || "")
          setAttachments(data.attachments || [])
          setQuizData(data.quizData || [])
          
          // Format dates for input[type="datetime-local"]
          if (data.startDate) setStartDate(toDateTimeLocalValue(data.startDate))
          if (data.endDate) setEndDate(toDateTimeLocalValue(data.endDate))
          setIsRetakeAllowed(!!data.isRetakeAllowed)
        } else {
          setToast({ message: "Failed to load lesson data", type: "error" })
        }
      } catch {
        setToast({ message: "Error loading lesson", type: "error" })
      } finally {
        setLoading(false)
      }
    }
    fetchLesson()
  }, [id, lessonId])

  const addQuestion = () => {
    setQuizData([...quizData, { question: "", options: ["", "", "", ""], correctAnswer: 0 }])
  }

  const updateQuestion = (qi: number, field: string, val: any) => {
    const q = [...quizData]
    q[qi] = { ...q[qi], [field]: val }
    setQuizData(q)
  }

  const updateOption = (qi: number, oi: number, val: string) => {
    const q = [...quizData]
    const opts = [...q[qi].options]
    opts[oi] = val
    q[qi] = { ...q[qi], options: opts }
    setQuizData(q)
  }

  const removeQuestion = (qi: number) => {
    setQuizData(quizData.filter((_, i) => i !== qi))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setToast({ message: "Please add a lesson title", type: "error" })
      return
    }
    setIsSaving(true)
    const payload: any = { 
      title, 
      type: selectedType, 
      content,
      startDate: startDate ? localDateTimeToIso(startDate) : null,
      endDate: endDate ? localDateTimeToIso(endDate) : null,
      isRetakeAllowed
    }
    if (selectedType === "LECTURE") payload.videoUrl = videoUrl
    if (selectedType === "QUIZ") payload.quizData = quizData
    if (["DOCUMENT", "LECTURE", "ASSIGNMENT", "SLIDER"].includes(selectedType)) payload.attachments = attachments

    try {
      const res = await fetch(`/api/courses/${id}/lessons/${lessonId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        setToast({ message: "Lesson updated successfully", type: "success" })
        setTimeout(() => router.push(`/teacher/courses/${id}`), 1200)
      } else {
        const d = await res.json()
        setToast({ message: d.error || "Failed to update lesson", type: "error" })
      }
    } catch {
      setToast({ message: "Network error. Please try again.", type: "error" })
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '10rem' }}>
      <Loader2 className="animate-spin" size={48} color="var(--primary)" />
    </div>
  )

  const typeInfo = LESSON_TYPES.find(t => t.key === selectedType)

  if (!isMounted) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '10rem' }}>
      <Loader2 className="animate-spin" size={48} color="var(--primary)" />
    </div>
  )

  return (
    <div suppressHydrationWarning style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 0' }} className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5, display: 'flex', alignItems: 'center' }}>
          <ChevronLeft size={28} />
        </button>
        <div style={{ background: 'var(--primary)', padding: '0.75rem', borderRadius: '1rem', color: 'white' }}>
          <Edit size={24} />
        </div>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Edit Lesson</h2>
          <p style={{ opacity: 0.5 }}>Update your lesson content and settings</p>
        </div>
      </div>

      {/* Step 1: Lesson Type Selector (Original Style) */}
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '1.5rem', fontSize: '1.1rem' }}>1. Lesson Type</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
          {LESSON_TYPES.map(type => {
            const Icon = type.icon
            const active = selectedType === type.key
            return (
              <button
                key={type.key}
                type="button"
                onClick={() => setSelectedType(type.key)}
                style={{
                  padding: '1.25rem 1.5rem',
                  borderRadius: '1rem',
                  border: `2px solid ${active ? type.color : '#e2e8f0'}`,
                  background: active ? `${type.color}08` : 'white',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem'
                }}
              >
                <div style={{ padding: '0.6rem', borderRadius: '0.6rem', background: active ? `${type.color}20` : '#f1f5f9', flexShrink: 0 }}>
                  <Icon size={20} color={active ? type.color : '#64748b'} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: active ? type.color : '#1e293b' }}>{type.label}</div>
                  <div style={{ fontSize: '0.78rem', opacity: 0.6, marginTop: '0.2rem' }}>{type.desc}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Step 2: Details */}
      <div className="glass-card" style={{ padding: '2.5rem', marginBottom: '2rem' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '2rem', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {typeInfo && <typeInfo.icon size={24} color={typeInfo.color} />}
          2. Lesson Content — {typeInfo?.label}
        </h3>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.6rem' }}>Lesson Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Introduction to Variables"
              style={{ width: '100%', padding: '0.85rem 1.25rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* Schedule Section */}
          {(selectedType === "QUIZ" || selectedType === "ASSIGNMENT") && (
            <div style={{ padding: '1.5rem', borderRadius: '1rem', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h4 style={{ fontWeight: 700, fontSize: '0.9rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit size={16} /> Schedule & Restrictions
              </h4>
              <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem' }}>Start Date & Time</label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem' }}>End Date & Time (Due Date)</label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>
              </div>
              {selectedType === "QUIZ" && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', marginTop: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={isRetakeAllowed}
                    onChange={e => setIsRetakeAllowed(e.target.checked)}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>Allow students to retake this quiz</span>
                </label>
              )}
            </div>
          )}

          {/* Type-Specific Fields */}
          {selectedType === "LECTURE" && (
            <>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.6rem' }}>Video URL (YouTube / Vimeo)</label>
                <input
                  type="text"
                  value={videoUrl}
                  onChange={e => setVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  style={{ width: '100%', padding: '0.85rem 1.25rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
                />
                {videoUrl && (
                  <div style={{ marginTop: '1rem', borderRadius: '1rem', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#0f172a' }}>
                    {getVideoThumbnailUrl(videoUrl) ? (
                      <img src={getVideoThumbnailUrl(videoUrl)} alt="Video thumbnail" style={{ width: '100%', display: 'block', aspectRatio: '16/9', objectFit: 'cover' }} />
                    ) : (
                      <iframe src={getVideoEmbedUrl(videoUrl)} title="Video preview" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen style={{ width: '100%', aspectRatio: '16/9', border: 0, display: 'block' }} />
                    )}
                  </div>
                )}
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.6rem' }}>Lecture Notes / Description</label>
                <textarea
                  rows={8}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  style={{ width: '100%', padding: '1rem 1.25rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', resize: 'vertical', fontSize: '1rem', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '1rem' }}>Supporting Documents</label>
                <FileUploadZone onUpload={setAttachments} initialFiles={attachments} multiple accept=".pdf,.ppt,.pptx,.doc,.docx" />
              </div>
            </>
          )}

          {selectedType === "DOCUMENT" && (
            <>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.6rem' }}>Description</label>
                <textarea
                  rows={4}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  style={{ width: '100%', padding: '1rem 1.25rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '1rem' }}>Uploaded Documents *</label>
                <FileUploadZone onUpload={setAttachments} initialFiles={attachments} multiple accept=".pdf,.ppt,.pptx,.doc,.docx,.txt,.zip" />
              </div>
            </>
          )}

          {selectedType === "ASSIGNMENT" && (
            <>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.6rem' }}>Assignment Instructions *</label>
                <textarea
                  rows={10}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  style={{ width: '100%', padding: '1rem 1.25rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '1rem' }}>Reference Files</label>
                <FileUploadZone onUpload={setAttachments} initialFiles={attachments} multiple />
              </div>
            </>
          )}

          {selectedType === "QUIZ" && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Quiz Questions ({quizData.length})</label>
                <button type="button" onClick={addQuestion} className="btn btn-primary" style={{ padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <Plus size={18} /> Add Question
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {quizData.length === 0 && <p style={{ textAlign: 'center', padding: '3rem', opacity: 0.5, border: '1px dashed #e2e8f0', borderRadius: '1rem' }}>No questions added yet.</p>}
                {quizData.map((q, qi) => (
                  <div key={qi} style={{ padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid #e2e8f0', background: '#fafafa' }}>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem' }}>
                      <span style={{ height: '24px', width: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f59e0b', color: 'white', borderRadius: '50%', fontSize: '0.7rem', fontWeight: 900, flexShrink: 0 }}>{qi + 1}</span>
                      <input
                        value={q.question}
                        onChange={e => updateQuestion(qi, "question", e.target.value)}
                        placeholder={`Question ${qi + 1}...`}
                        style={{ flex: 1, border: 'none', borderBottom: '2px solid #eee', background: 'transparent', padding: '0.2rem 0', outline: 'none', fontSize: '1rem', fontWeight: 700 }}
                      />
                      <button type="button" onClick={() => removeQuestion(qi)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={20} /></button>
                    </div>
                    <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      {q.options.map((opt, oi) => (
                        <label key={oi} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: q.correctAnswer === oi ? '#f0fdf4' : 'white', borderRadius: '0.75rem', border: `2px solid ${q.correctAnswer === oi ? '#10b981' : '#e2e8f0'}`, cursor: 'pointer' }}>
                          <input type="radio" checked={q.correctAnswer === oi} onChange={() => updateQuestion(qi, "correctAnswer", oi)} style={{ transform: 'scale(1.2)' }} />
                          <input
                            value={opt}
                            onChange={e => updateOption(qi, oi, e.target.value)}
                            placeholder={`Option ${oi + 1}`}
                            style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontWeight: q.correctAnswer === oi ? 700 : 400 }}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedType === "ANNOUNCEMENT" && (
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.6rem' }}>Announcement Message *</label>
              <textarea
                rows={10}
                value={content}
                onChange={e => setContent(e.target.value)}
                style={{ width: '100%', padding: '1rem 1.25rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', outline: 'none' }}
              />
            </div>
          )}

          {selectedType === "SLIDER" && (
            <>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.6rem' }}>Description</label>
                <textarea
                  rows={4}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  style={{ width: '100%', padding: '1rem 1.25rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '1rem' }}>Upload Slides / Images *</label>
                <FileUploadZone onUpload={setAttachments} initialFiles={attachments} multiple accept="image/*,.ppt,.pptx" />
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button
              type="button"
              onClick={() => router.push(`/teacher/courses/${id}`)}
              className="btn"
              style={{ flex: 1, padding: '1rem', background: '#f1f5f9' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="btn btn-primary"
              style={{ flex: 2, padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', fontSize: '1rem' }}
            >
              {isSaving ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Save Changes</>}
            </button>
          </div>
        </form>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
