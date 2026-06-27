"use client"

import { useEffect, useState } from "react"
import { AtSign, CalendarDays, GraduationCap, IdCard, Loader2, Mail, UserRound } from "lucide-react"
import { formatRole, formatText } from "@/lib/utils"

function infoValue(value: any) {
  if (!value) return "-"
  if (typeof value === "string") return formatText(value)
  return String(value)
}

function dateValue(value: any) {
  if (!value) return "-"
  return new Date(value).toLocaleString()
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile")
      const data = await res.json()
      if (res.ok) setProfile(data)
    } catch (err) {
      console.error("Failed to fetch profile")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="glass-card" style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
        <Loader2 className="animate-spin" size={42} color="var(--primary)" />
      </div>
    )
  }

  if (!profile) {
    return <div className="glass-card" style={{ padding: "4rem", textAlign: "center", color: "#94a3b8" }}>Profile not found.</div>
  }

  const fields = [
    { label: "Full Name", value: infoValue(profile.name), icon: UserRound },
    { label: "Email", value: profile.email || "-", icon: Mail },
    { label: "Role", value: formatRole(profile.role || ""), icon: IdCard },
    { label: "Registration Number", value: profile.registrationNumber || "-", icon: AtSign },
    { label: "Class", value: infoValue(profile.classLevel), icon: GraduationCap },
    { label: "Program", value: infoValue(profile.program), icon: GraduationCap },
    { label: "Semester", value: infoValue(profile.semester), icon: GraduationCap },
    { label: "Last Login", value: dateValue(profile.lastLogin), icon: CalendarDays },
    { label: "Account Created", value: dateValue(profile.createdAt), icon: CalendarDays },
  ]

  return (
    <div className="glass-card animate-fade-in">
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem", fontWeight: 900 }}>
          {formatText(profile.name || profile.role || "U")[0]}
        </div>
        <div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a" }}>{formatText(profile.name || "User Profile")}</h2>
          <p style={{ color: "#64748b", fontWeight: 600 }}>{formatRole(profile.role || "")}</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
        {fields.map(field => {
          const Icon = field.icon
          return (
            <div key={field.label} style={{ border: "1px solid var(--glass-border)", borderRadius: "0.75rem", padding: "1rem", background: "white" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#64748b", fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", marginBottom: "0.5rem" }}>
                <Icon size={15} /> {field.label}
              </div>
              <div style={{ color: "#0f172a", fontWeight: 800 }}>{field.value}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
