"use client"

import { GraduationCap, Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { signIn, getSession, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role) {
      const role = session.user.role
      if (role === "ADMIN") {
        router.push("/admin")
      } else if (role === "TEACHER") {
        router.push("/teacher")
      } else if (role === "STUDENT") {
        router.push("/student")
      }
    }
  }, [session, status, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid email or password")
        setLoading(false)
      } else {
        // We don't call getSession() here because it can be racey.
        // Instead, we let the useEffect above handle the redirection
        // once 'status' becomes 'authenticated'.
        // We DON'T set loading to false here, to prevent the "nothing happened" feel.
        // It will remain loading until the page navigates.
      }
    } catch (err) {
      setError("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="responsive-flex" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}>
      {/* Left Side: Form */}
      <div style={{ flex: 1, minWidth: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: '#ffffff' }}>
        <div style={{ maxWidth: '400px', width: '100%' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', fontWeight: 800, color: 'var(--primary)' }}>Welcome Back</h2>
          <p style={{ opacity: 0.7, marginBottom: '2.5rem', fontSize: '1.1rem', color: 'var(--secondary)' }}>Sign in to access your dashboard</p>

          {error && (
            <div style={{ 
              background: 'rgba(239, 68, 68, 0.1)', 
              border: '1px solid #ef4444', 
              color: '#ef4444', 
              padding: '0.75rem', 
              borderRadius: '0.5rem', 
              marginBottom: '1.5rem',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--secondary)' }}>Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@school.com"
                required
                style={{
                  width: '100%',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  background: 'white',
                  border: '1px solid var(--card-border)',
                  color: 'black',
                  outline: 'none',
                  fontSize: '1rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--secondary)' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    padding: '1rem',
                    paddingRight: '3rem',
                    borderRadius: '0.5rem',
                    background: 'white',
                    border: '1px solid var(--card-border)',
                    color: 'black',
                    outline: 'none',
                    fontSize: '1rem'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--secondary)',
                    cursor: 'pointer',
                    opacity: 0.6,
                    padding: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '1rem', padding: '1rem', opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer', fontSize: '1.1rem', fontWeight: 600 }}
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <p style={{ marginTop: '2rem', opacity: 0.6, fontSize: '0.875rem', textAlign: 'center', color: 'var(--secondary)' }}>
            Don't have an account? <span style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}>Contact Administrator</span>
          </p>
        </div>
      </div>

      {/* Right Side: School Info & Image as Background */}
      <div style={{ 
        flex: 1.2, 
        minWidth: '400px', 
        backgroundImage: 'linear-gradient(rgba(1, 65, 28, 0.8), rgba(6, 23, 39, 0.9)), url(/school-hero.png)', 
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '4rem', 
        color: 'white', 
        textAlign: 'center', 
        position: 'relative', 
        overflow: 'hidden' 
      }}>
        <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ background: 'white', padding: '1rem', borderRadius: '1rem', width: 'fit-content', margin: '0 auto 2rem' }}>
              <img src="/logo.png" alt="Logo" style={{ height: '80px', display: 'block' }} />
            </div>
            <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1.5rem', lineHeight: 1.2, textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
              Govt. Graduate College<br />Peshawar Road, Rawalpindi
            </h1>
            <p style={{ fontSize: '1.4rem', opacity: 1, maxWidth: '600px', margin: '0 auto', fontWeight: 500, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
              Official Learning Management System. <br/> Empowering students through modern learning.
            </p>
        </div>
        
        {/* Background Decorative Elements */}
        <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '400px', height: '400px', background: 'rgba(255, 204, 0, 0.1)', borderRadius: '50%', filter: 'blur(80px)' }}></div>
      </div>
    </div>
  )
}
