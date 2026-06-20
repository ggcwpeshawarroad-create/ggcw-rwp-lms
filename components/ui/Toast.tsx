"use client"

import { useState, useEffect } from "react"
import { CheckCircle, XCircle, X, Info } from "lucide-react"

export type ToastType = "success" | "error" | "info"

interface ToastProps {
  message: string
  type: ToastType
  onClose: () => void
  duration?: number
}

export function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [onClose, duration])

  const colors = {
    success: { bg: "#f0fdf4", border: "#bbf7d0", text: "#166534", icon: <CheckCircle size={20} color="#16a34a" /> },
    error: { bg: "#fef2f2", border: "#fecaca", text: "#991b1b", icon: <XCircle size={20} color="#dc2626" /> },
    info: { bg: "#eff6ff", border: "#bfdbfe", text: "#1e40af", icon: <Info size={20} color="#2563eb" /> }
  }

  const style = colors[type]

  return (
    <div 
      className="animate-slide-in-right"
      style={{
        position: 'fixed',
        top: '1.5rem',
        right: '1.5rem',
        zIndex: 9999,
        background: style.bg,
        border: `1px solid ${style.border}`,
        color: style.text,
        padding: '1rem 1.25rem',
        borderRadius: '0.75rem',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        minWidth: '300px'
      }}
    >
      {style.icon}
      <div style={{ flex: 1, fontSize: '0.875rem', fontWeight: 600 }}>{message}</div>
      <button 
        onClick={onClose}
        style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5, display: 'flex', alignItems: 'center' }}
      >
        <X size={16} />
      </button>
    </div>
  )
}
