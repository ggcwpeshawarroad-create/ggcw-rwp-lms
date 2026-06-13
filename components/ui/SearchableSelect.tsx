"use client"

import { useState, useRef, useEffect } from "react"
import { Search, ChevronDown, Check, X } from "lucide-react"

interface Option {
  id: string
  label: string
  subLabel?: string
}

interface SearchableSelectProps {
  options: Option[]
  value: string
  onChange: (value: string) => void
  placeholder: string
  label: string
}

export function SearchableSelect({ options, value, onChange, placeholder, label }: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(opt => opt.id === value)

  const filteredOptions = options.filter(opt => 
    (opt.label || "").toLowerCase().includes(search.toLowerCase()) ||
    (opt.subLabel || "").toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>{label}</label>
      
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '0.75rem 1rem',
          borderRadius: '0.75rem',
          background: '#f8fafc',
          border: '1px solid var(--glass-border)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: '45px'
        }}
      >
        <div style={{ fontSize: '0.875rem', color: selectedOption ? 'inherit' : '#94a3b8' }}>
          {selectedOption ? (
            <div>
              <div style={{ fontWeight: 600 }} className="capitalize">{selectedOption.label}</div>
              {selectedOption.subLabel && <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{selectedOption.subLabel}</div>}
            </div>
          ) : placeholder}
        </div>
        <ChevronDown size={18} style={{ opacity: 0.4, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </div>

      {isOpen && (
        <div 
          className="animate-scale-in"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1100,
            marginTop: '0.5rem',
            background: 'white',
            borderRadius: '1rem',
            border: '1px solid var(--glass-border)',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            overflow: 'hidden',
            maxHeight: '300px',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div style={{ padding: '0.75rem', borderBottom: '1px solid #f1f5f9', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
            <input 
              autoFocus
              type="text" 
              placeholder="Search..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              style={{ width: '100%', padding: '0.5rem 0.5rem 0.5rem 2.25rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.875rem' }}
            />
          </div>

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', opacity: 0.5, fontSize: '0.875rem' }}>No matches found.</div>
            ) : (
              filteredOptions.map(opt => (
                <div 
                  key={opt.id}
                  onClick={() => {
                    onChange(opt.id)
                    setIsOpen(false)
                    setSearch("")
                  }}
                  style={{
                    padding: '0.75rem 1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: value === opt.id ? 'var(--primary)05' : 'transparent',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = value === opt.id ? 'var(--primary)05' : 'transparent')}
                >
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: value === opt.id ? 700 : 500 }} className="capitalize">{opt.label}</div>
                    {opt.subLabel && <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>{opt.subLabel}</div>}
                  </div>
                  {value === opt.id && <Check size={16} color="var(--primary)" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
