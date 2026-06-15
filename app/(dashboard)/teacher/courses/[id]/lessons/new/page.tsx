"use client"

import { useState, useRef } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import {
  Video, FileText, HelpCircle, ClipboardList, Megaphone, Images,
  Plus, Trash2, Loader2, ChevronRight, Upload, X, CheckCircle, AlertCircle
} from "lucide-react"

const LESSON_TYPES = [
  { key: "LECTURE", label: "Lecture / Video", icon: Video, color: "#4f46e5", desc: "Add a video lecture with content notes" },
  { key: "QUIZ", label: "Quiz", icon: HelpCircle, color: "#f59e0b", desc: "Create a multiple choice quiz" },
  { key: "DOCUMENT", label: "Document", icon: FileText, color: "#6366f1", desc: "Share PDFs, PPTs, Word files" },
  { key: "ASSIGNMENT", label: "Assignment", icon: ClipboardList, color: "#ef4444", desc: "Assign homework or projects" },
  { key: "ANNOUNCEMENT", label: "Announcement", icon: Megaphone, color: "#10b981", desc: "Post an announcement to students" },
  { key: "SLIDER", label: "Slides / Gallery", icon: Images, color: "#8b5cf6", desc: "Add image slides or a gallery" },
]

type UploadedFile = { name: string; url: string; size?: number }

function FileUploadZone({ onUpload, multiple = false, accept = "*", label = "Upload File" }: {
  onUpload: (files: UploadedFile[]) => void
  multiple?: boolean
  accept?: string
  label?: string
}) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

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
    setUploadedFiles(prev => [...prev, ...results])
    onUpload([...uploadedFiles, ...results])
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
        <input ref={inputRef} type="file" hidden multiple={multiple} accept={accept} onChange={e => e.target.files && handleFiles(e.target.files)} />
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
              <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
              <button onClick={e => { e.stopPropagation(); removeFile(i) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0.2rem' }}>
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function NewLessonPage() {
  const { id } = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const chapterId = searchParams.get("chapterId") || ""

  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [attachments, setAttachments] = useState<UploadedFile[]>([])
  const [sliderImages, setSliderImages] = useState<UploadedFile[]>([])
  const [quizData, setQuizData] = useState<{ question: string; options: string[]; correctAnswer: number }[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [isRetakeAllowed, setIsRetakeAllowed] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

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

  const handleSubmit = async () => {
    if (!selectedType || !title.trim()) {
      setError("Please select a lesson type and add a title.")
      return
    }
    setSubmitting(true)
    setError("")
    try {
      const body: any = { title, content, type: selectedType, chapterId, startDate, endDate, isRetakeAllowed }
      if (selectedType === "LECTURE") body.videoUrl = videoUrl
      if (selectedType === "QUIZ") body.quizData = quizData
      if (selectedType === "DOCUMENT" || selectedType === "LECTURE" || selectedType === "ASSIGNMENT") body.attachments = attachments
      if (selectedType === "SLIDER") body.attachments = sliderImages.map(img => ({ name: img.name, url: img.url }))

      const res = await fetch(`/api/courses/${id}/lessons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      })
      if (res.ok) {
        setSuccess(true)
        setTimeout(() => router.push(`/teacher/courses/${id}`), 1200)
      } else {
        const d = await res.json()
        setError(d.error || "Failed to create lesson")
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem' }}>
        <CheckCircle size={72} color="#10b981" />
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Lesson Created!</h2>
        <p style={{ opacity: 0.6 }}>Redirecting back to course builder...</p>
      </div>
    )
  }

  const typeInfo = LESSON_TYPES.find(t => t.key === selectedType)

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 0' }} className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5, display: 'flex', alignItems: 'center' }}>
          <ChevronRight style={{ transform: 'rotate(180deg)' }} size={24} />
        </button>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Add New Lesson</h2>
          <p style={{ opacity: 0.5, fontSize: '0.9rem', marginTop: '0.2rem' }}>Select a type and fill in the details below</p>
        </div>
      </div>

      {/* Step 1: Select Type */}
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '1.5rem', fontSize: '1.1rem' }}>1. Choose Lesson Type</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
          {LESSON_TYPES.map(type => {
            const Icon = type.icon
            const active = selectedType === type.key
            return (
              <button
                key={type.key}
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

      {/* Step 2: Fill Details (only show if type selected) */}
      {selectedType && (
        <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '1.5rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {typeInfo && <typeInfo.icon size={20} color={typeInfo.color} />}
            2. Lesson Details {typeInfo && `— ${typeInfo.label}`}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Title */}
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem', color: '#374151' }}>Lesson Title *</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Introduction to Variables"
                style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Dates */}
            <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem', color: '#374151' }}>Start Date (Optional)</label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem', color: '#374151' }}>End Date / Due Date (Optional)</label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* LECTURE */}
            {selectedType === "LECTURE" && (
              <>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem', color: '#374151' }}>Video URL (YouTube / Vimeo)</label>
                  <input
                    type="text"
                    value={videoUrl}
                    onChange={e => setVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem', color: '#374151' }}>Lecture Notes / Description</label>
                  <textarea
                    rows={5}
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="Add any notes, summary, or learning objectives..."
                    style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', resize: 'vertical', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.75rem', color: '#374151' }}>Supporting Documents (Optional)</label>
                  <FileUploadZone
                    onUpload={setAttachments}
                    multiple
                    accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.txt"
                    label="Upload PDFs, PPTs, Word files..."
                  />
                </div>
              </>
            )}

            {/* DOCUMENT */}
            {selectedType === "DOCUMENT" && (
              <>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem', color: '#374151' }}>Description</label>
                  <textarea
                    rows={3}
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="Describe what students will find in these documents..."
                    style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', resize: 'vertical', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.75rem', color: '#374151' }}>Upload Documents *</label>
                  <FileUploadZone
                    onUpload={setAttachments}
                    multiple
                    accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.txt,.zip"
                    label="Upload PDFs, PPTs, Word, Excel..."
                  />
                </div>
              </>
            )}

            {/* ASSIGNMENT */}
            {selectedType === "ASSIGNMENT" && (
              <>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem', color: '#374151' }}>Assignment Instructions *</label>
                  <textarea
                    rows={6}
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="Describe the assignment in detail. Include objectives, rubric, and deadline..."
                    style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', resize: 'vertical', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.75rem', color: '#374151' }}>Attach Assignment Files (Optional)</label>
                  <FileUploadZone
                    onUpload={setAttachments}
                    multiple
                    accept="*"
                    label="Upload any reference files..."
                  />
                </div>
              </>
            )}

            {/* ANNOUNCEMENT */}
            {selectedType === "ANNOUNCEMENT" && (
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem', color: '#374151' }}>Announcement Message *</label>
                <textarea
                  rows={6}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Write your announcement here. This will be visible to all enrolled students..."
                  style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', resize: 'vertical', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            )}

            {/* SLIDER */}
            {selectedType === "SLIDER" && (
              <>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem', color: '#374151' }}>Description</label>
                  <textarea
                    rows={3}
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="Describe the slides or gallery..."
                    style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', resize: 'vertical', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.75rem', color: '#374151' }}>Upload Slides / Images *</label>
                  <FileUploadZone
                    onUpload={setSliderImages}
                    multiple
                    accept="image/*,.ppt,.pptx"
                    label="Upload images or PowerPoint slides..."
                  />
                  {sliderImages.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
                      {sliderImages.filter(f => f.url.match(/\.(png|jpg|jpeg|gif|webp)$/i)).map((img, i) => (
                        <div key={i} style={{ position: 'relative', aspectRatio: '4/3', borderRadius: '0.5rem', overflow: 'hidden', background: '#f1f5f9' }}>
                          <img src={img.url} alt={img.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* QUIZ */}
            {selectedType === "QUIZ" && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <label style={{ fontWeight: 600, fontSize: '0.875rem', color: '#374151' }}>Questions ({quizData.length})</label>
                  <button
                    type="button"
                    onClick={addQuestion}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '0.6rem', background: '#4f46e5', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                  >
                    <Plus size={15} /> Add Question
                  </button>
                </div>
                <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #e2e8f0' }}>
                  <input 
                    type="checkbox" 
                    id="retake" 
                    checked={isRetakeAllowed} 
                    onChange={e => setIsRetakeAllowed(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="retake" style={{ fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>Allow students to retake this quiz</label>
                </div>
                {quizData.length === 0 && (
                  <div style={{ padding: '3rem', textAlign: 'center', background: '#f8fafc', borderRadius: '1rem', border: '2px dashed #e2e8f0', opacity: 0.7 }}>
                    <HelpCircle size={40} color="#94a3b8" style={{ marginBottom: '0.75rem' }} />
                    <p style={{ color: '#64748b' }}>No questions yet. Click "Add Question" to start building your quiz.</p>
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {quizData.map((q, qi) => (
                    <div key={qi} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                        <span style={{ padding: '0.3rem 0.7rem', background: '#f59e0b20', color: '#f59e0b', borderRadius: '0.4rem', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>Q{qi + 1}</span>
                        <input
                          value={q.question}
                          onChange={e => updateQuestion(qi, "question", e.target.value)}
                          placeholder={`Question ${qi + 1}...`}
                          style={{ flex: 1, border: 'none', borderBottom: '1px solid #f1f5f9', padding: '0.3rem 0', fontSize: '0.95rem', fontWeight: 600, outline: 'none' }}
                        />
                        <button onClick={() => removeQuestion(qi)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', opacity: 0.7, flexShrink: 0 }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        {q.options.map((opt, oi) => (
                          <label key={oi} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '0.6rem', border: `1.5px solid ${q.correctAnswer === oi ? '#10b981' : '#e2e8f0'}`, background: q.correctAnswer === oi ? '#f0fdf4' : 'white', cursor: 'pointer', transition: 'all 0.2s' }}>
                            <input
                              type="radio"
                              name={`correct-${qi}`}
                              checked={q.correctAnswer === oi}
                              onChange={() => updateQuestion(qi, "correctAnswer", oi)}
                              style={{ accentColor: '#10b981', width: '16px', height: '16px', flexShrink: 0 }}
                            />
                            <input
                              value={opt}
                              onChange={e => updateOption(qi, oi, e.target.value)}
                              placeholder={`Option ${oi + 1}`}
                              style={{ border: 'none', fontSize: '0.875rem', flex: 1, outline: 'none', background: 'transparent', fontWeight: q.correctAnswer === oi ? 600 : 400 }}
                            />
                            {q.correctAnswer === oi && <CheckCircle size={15} color="#10b981" style={{ flexShrink: 0 }} />}
                          </label>
                        ))}
                      </div>
                      <p style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '0.75rem' }}>
                        Select the radio button next to the correct answer (highlighted in green)
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.25rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.75rem', marginBottom: '1.5rem', color: '#dc2626' }}>
          <AlertCircle size={18} />
          <span style={{ fontSize: '0.9rem' }}>{error}</span>
        </div>
      )}

      {/* Actions */}
      {selectedType && (
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button onClick={() => router.back()} style={{ padding: '0.85rem 2rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem' }}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{ padding: '0.85rem 2.5rem', borderRadius: '0.75rem', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: 'white', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
            {submitting ? "Creating..." : "Create Lesson"}
          </button>
        </div>
      )}
    </div>
  )
}
