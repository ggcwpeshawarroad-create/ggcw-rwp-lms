"use client"

import { useState, useEffect } from "react"
import { SlidersHorizontal, PlusCircle, Trash2, Loader2, ChevronDown, ChevronUp, Check } from "lucide-react"

type ClassEntry = {
  name: string
  programs: string[]
  semesters: string[]
}

export default function AcademicConfigPage() {
  const [classes, setClasses] = useState<ClassEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [expandedClass, setExpandedClass] = useState<string | null>(null)

  // Inline input states
  const [newClassName, setNewClassName] = useState("")
  const [newPrograms, setNewPrograms] = useState<Record<string, string>>({})
  const [newSemesters, setNewSemesters] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch("/api/academic-config")
      .then(r => r.json())
      .then(data => { setClasses(data.classes || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/academic-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classes }),
      })
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500) }
    } finally { setSaving(false) }
  }

  const addClass = () => {
    const name = newClassName.trim()
    if (!name || classes.some(c => c.name === name)) return
    setClasses(prev => [...prev, { name, programs: [], semesters: [] }])
    setNewClassName("")
    setExpandedClass(name)
  }

  const removeClass = (name: string) => {
    if (!confirm(`Remove class "${name}" and all its programs/semesters?`)) return
    setClasses(prev => prev.filter(c => c.name !== name))
  }

  const addProgram = (className: string) => {
    const val = (newPrograms[className] || "").trim()
    if (!val) return
    setClasses(prev => prev.map(c => c.name === className
      ? { ...c, programs: c.programs.includes(val) ? c.programs : [...c.programs, val] }
      : c
    ))
    setNewPrograms(prev => ({ ...prev, [className]: "" }))
  }

  const removeProgram = (className: string, prog: string) => {
    setClasses(prev => prev.map(c => c.name === className
      ? { ...c, programs: c.programs.filter(p => p !== prog) }
      : c
    ))
  }

  const addSemester = (className: string) => {
    const val = (newSemesters[className] || "").trim()
    if (!val) return
    setClasses(prev => prev.map(c => c.name === className
      ? { ...c, semesters: c.semesters.includes(val) ? c.semesters : [...c.semesters, val] }
      : c
    ))
    setNewSemesters(prev => ({ ...prev, [className]: "" }))
  }

  const removeSemester = (className: string, sem: string) => {
    setClasses(prev => prev.map(c => c.name === className
      ? { ...c, semesters: c.semesters.filter(s => s !== sem) }
      : c
    ))
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
      <Loader2 className="animate-spin" size={48} color="var(--primary)" />
    </div>
  )

  const inputStyle = {
    padding: '0.6rem 0.9rem', borderRadius: '0.5rem',
    border: '1px solid #e2e8f0', background: '#f8fafc',
    outline: 'none', fontSize: '0.875rem', flex: 1 as const
  }

  const chipStyle = (color = 'var(--primary)') => ({
    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
    padding: '0.3rem 0.7rem', borderRadius: '1rem', fontSize: '0.8rem',
    background: `${color}15`, color, fontWeight: 600 as const,
    border: `1px solid ${color}30`
  })

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div className="glass-card" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'var(--primary)', padding: '0.75rem', borderRadius: '1rem', color: 'white' }}>
            <SlidersHorizontal size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Academic Configuration</h2>
            <p style={{ opacity: 0.6, fontSize: '0.875rem' }}>Manage class levels, programs, and semesters used across registration forms</p>
          </div>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '130px', justifyContent: 'center' }}
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : saved ? <><Check size={18} /> Saved!</> : "Save Changes"}
        </button>
      </div>

      {/* Add new class */}
      <div className="glass-card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <input
          value={newClassName}
          onChange={e => setNewClassName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addClass()}
          placeholder="New class level (e.g. 11th, Pre-Medical)"
          style={{ ...inputStyle, flex: 1 }}
        />
        <button onClick={addClass} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
          <PlusCircle size={18} /> Add Class
        </button>
      </div>

      {/* Classes list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {classes.map((cls) => {
          const isOpen = expandedClass === cls.name
          return (
            <div key={cls.name} className="glass-card" style={{ overflow: 'hidden', padding: 0 }}>
              {/* Class header */}
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', cursor: 'pointer', borderBottom: isOpen ? '1px solid #f1f5f9' : 'none', background: isOpen ? '#fafbff' : 'transparent' }}
                onClick={() => setExpandedClass(isOpen ? null : cls.name)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{cls.name}</span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>{cls.programs.length} programs · {cls.semesters.length} semesters</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button
                    onClick={e => { e.stopPropagation(); removeClass(cls.name) }}
                    style={{ padding: '0.4rem', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.6 }}
                    title="Remove class"
                  >
                    <Trash2 size={16} />
                  </button>
                  {isOpen ? <ChevronUp size={18} style={{ opacity: 0.4 }} /> : <ChevronDown size={18} style={{ opacity: 0.4 }} />}
                </div>
              </div>

              {isOpen && (
                <div className="responsive-grid" style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  {/* Programs */}
                  <div>
                    <h4 style={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', color: '#64748b', marginBottom: '1rem' }}>Programs / Streams</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem', minHeight: '2rem' }}>
                      {cls.programs.length === 0 && <span style={{ opacity: 0.4, fontSize: '0.875rem', fontStyle: 'italic' }}>No programs added</span>}
                      {cls.programs.map(p => (
                        <span key={p} style={chipStyle('#4f46e5')}>
                          {p}
                          <button onClick={() => removeProgram(cls.name, p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', padding: 0 }}>
                            <Trash2 size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        value={newPrograms[cls.name] || ""}
                        onChange={e => setNewPrograms(prev => ({ ...prev, [cls.name]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && addProgram(cls.name)}
                        placeholder="Add program..."
                        style={inputStyle}
                      />
                      <button onClick={() => addProgram(cls.name)} style={{ padding: '0.6rem 0.8rem', background: '#4f46e515', color: '#4f46e5', border: '1px solid #4f46e530', borderRadius: '0.5rem', cursor: 'pointer' }}>
                        <PlusCircle size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Semesters */}
                  <div>
                    <h4 style={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', color: '#64748b', marginBottom: '1rem' }}>Semesters</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem', minHeight: '2rem' }}>
                      {cls.semesters.length === 0 && <span style={{ opacity: 0.4, fontSize: '0.875rem', fontStyle: 'italic' }}>No semesters (leave blank for non-semester classes)</span>}
                      {cls.semesters.map(s => (
                        <span key={s} style={chipStyle('#10b981')}>
                          {s}
                          <button onClick={() => removeSemester(cls.name, s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', padding: 0 }}>
                            <Trash2 size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        value={newSemesters[cls.name] || ""}
                        onChange={e => setNewSemesters(prev => ({ ...prev, [cls.name]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && addSemester(cls.name)}
                        placeholder="Add semester..."
                        style={inputStyle}
                      />
                      <button onClick={() => addSemester(cls.name)} style={{ padding: '0.6rem 0.8rem', background: '#10b98115', color: '#10b981', border: '1px solid #10b98130', borderRadius: '0.5rem', cursor: 'pointer' }}>
                        <PlusCircle size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {classes.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.4 }}>
          <SlidersHorizontal size={48} style={{ marginBottom: '1rem' }} />
          <p>No class levels configured yet. Add your first class above.</p>
        </div>
      )}

      <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={save}
          disabled={saving}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.85rem 2rem' }}
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : saved ? <><Check size={18} /> Saved!</> : "Save All Changes"}
        </button>
      </div>
    </div>
  )
}
