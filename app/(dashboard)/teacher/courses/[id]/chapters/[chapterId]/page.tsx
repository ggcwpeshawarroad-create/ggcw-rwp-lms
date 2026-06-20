"use client"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Edit, Save, Trash2, ChevronLeft, Loader2 } from "lucide-react"
import { Toast, ToastType } from "@/components/ui/Toast"

export default function EditChapterPage() {
  const router = useRouter()
  const { id, chapterId } = useParams()
  
  const [title, setTitle] = useState("")
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  useEffect(() => {
    async function fetchChapter() {
      try {
        const res = await fetch(`/api/courses/${id}/chapters/${chapterId}`)
        if (res.ok) {
          const data = await res.json()
          setTitle(data.title)
        } else {
          setToast({ message: "Failed to load chapter data", type: "error" })
        }
      } catch {
        setToast({ message: "Error loading chapter", type: "error" })
      } finally {
        setLoading(false)
      }
    }
    fetchChapter()
  }, [id, chapterId])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const res = await fetch(`/api/courses/${id}/chapters/${chapterId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      })
      if (res.ok) {
        setToast({ message: "Chapter updated successfully", type: "success" })
        setTimeout(() => router.push(`/teacher/courses/${id}`), 1500)
      } else {
        setToast({ message: "Failed to update chapter", type: "error" })
      }
    } catch {
      setToast({ message: "Error saving chapter", type: "error" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/courses/${id}/chapters/${chapterId}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setToast({ message: "Chapter deleted", type: "success" })
        setTimeout(() => router.push(`/teacher/courses/${id}`), 1500)
      } else {
        setToast({ message: "Failed to delete chapter", type: "error" })
      }
    } catch {
      setToast({ message: "Error deleting chapter", type: "error" })
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '10rem' }}>
      <Loader2 className="animate-spin" size={48} color="var(--primary)" />
    </div>
  )

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={() => router.push(`/teacher/courses/${id}`)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', display: 'flex', alignItems: 'center' }}
          >
            <ChevronLeft size={24} />
          </button>
          <div style={{ background: 'var(--primary)', padding: '0.75rem', borderRadius: '1rem', color: 'white' }}>
            <Edit size={24} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Edit Chapter</h2>
        </div>
        <button 
          onClick={() => setShowDeleteConfirm(true)}
          className="btn"
          style={{ border: '1px solid #ef4444', color: '#ef4444', background: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Trash2 size={18} /> Delete Chapter
        </button>
      </div>

      <div className="glass-card animate-fade-in">
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Chapter Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Introduction to Physics"
              style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--glass-border)', outline: 'none', fontSize: '1rem' }}
            />
          </div>

          <div style={{ marginTop: '1rem' }}>
            <button
              type="submit"
              disabled={isSaving}
              className="btn btn-primary"
              style={{ width: '100%', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              {isSaving ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> Save Changes</>}
            </button>
          </div>
        </form>
      </div>

      {showDeleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-card animate-scale-in" style={{ maxWidth: '440px', width: '100%', background: 'white' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#ef4444' }}>Delete Chapter?</h3>
            <p style={{ opacity: 0.6, fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              This action cannot be undone. All lessons within this chapter will also be deleted.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={() => setShowDeleteConfirm(false)} 
                className="btn" 
                style={{ flex: 1, background: '#f1f5f9' }}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete} 
                disabled={isDeleting}
                className="btn" 
                style={{ flex: 1, background: '#ef4444', color: 'white' }}
              >
                {isDeleting ? <Loader2 className="animate-spin" size={18} /> : "Delete Everything"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
