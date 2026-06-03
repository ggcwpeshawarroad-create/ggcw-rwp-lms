import Link from "next/link"
import { GraduationCap, Rocket, ShieldCheck } from "lucide-react"

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', overflowX: 'hidden' }}>
      <nav style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img src="/logo.png" alt="Logo" style={{ height: '50px' }} />
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1.2 }}>
            Govt. Graduate College<br />Peshawar Road, Rawalpindi
          </div>
        </div>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <Link href="/login" style={{ color: 'var(--secondary)', textDecoration: 'none', fontWeight: 600 }}>Login</Link>
          <Link href="/login" className="btn btn-primary" style={{ textDecoration: 'none' }}>Get Started</Link>
        </div>
      </nav>

      <section style={{ padding: '8rem 2rem', textAlign: 'center', maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '4.5rem', lineHeight: 1.1, marginBottom: '1.5rem', color: 'var(--secondary)' }} className="animate-fade-in">
          Unlock Your <span style={{ color: 'var(--primary)' }}>Potential</span> with Modern Learning
        </h1>
        <p style={{ fontSize: '1.25rem', opacity: 0.8, marginBottom: '3rem', color: 'var(--secondary)' }} className="animate-fade-in">
          The official Learning Management System for our students to collaborate, 
          teach, and learn with state-of-the-art tools.
        </p>
        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }} className="animate-fade-in">
          <Link href="/login" className="btn btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem', textDecoration: 'none' }}>Start Teaching</Link>
          <Link href="/login" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem', color: 'var(--primary)', border: '1px solid var(--primary)', borderRadius: '0.5rem', textDecoration: 'none' }}>Join as Student</Link>
        </div>
      </section>


      <section style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2.5rem' }}>
        <div className="glass-card animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '1rem', borderRadius: '1rem', width: 'fit-content', marginBottom: '1.5rem' }}>
            <GraduationCap size={32} color="var(--primary)" />
          </div>
          <h3 style={{ marginBottom: '1rem' }}>Smart Curriculum</h3>
          <p style={{ opacity: 0.7 }}>Advanced course management with modules, lessons, and interactive content.</p>
        </div>

        <div className="glass-card animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div style={{ background: 'rgba(236, 72, 153, 0.1)', padding: '1rem', borderRadius: '1rem', width: 'fit-content', marginBottom: '1.5rem' }}>
            <Rocket size={32} color="var(--secondary)" />
          </div>
          <h3 style={{ marginBottom: '1rem' }}>Rapid Progress</h3>
          <p style={{ opacity: 0.7 }}>Track student growth with real-time analytics and achievement badges.</p>
        </div>

        <div className="glass-card animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '1rem', borderRadius: '1rem', width: 'fit-content', marginBottom: '1.5rem' }}>
            <ShieldCheck size={32} color="var(--accent)" />
          </div>
          <h3 style={{ marginBottom: '1rem' }}>Secure Roles</h3>
          <p style={{ opacity: 0.7 }}>Dedicated environments for Admin, Teacher, and Student roles.</p>
        </div>
      </section>

      <footer style={{ padding: '4rem 2rem', textAlign: 'center', opacity: 0.5, fontSize: '0.875rem', color: 'var(--secondary)' }}>
        &copy; 2026 Govt. Graduate College, Peshawar Road, Rawalpindi. Built with Passion for Education.
      </footer>

    </div>
  )
}
