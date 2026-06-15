"use client"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  BookOpen, 
  Search, 
  LogOut,
  GraduationCap,
  UserPlus,
  Activity,
  SlidersHorizontal,
  Menu,
  X
} from "lucide-react"
import styles from "./DashboardLayout.module.css"
import { formatText } from "@/lib/utils"

export default function DashboardLayout({ 
  children, 
  title, 
  role,
  userName
}: { 
  children: React.ReactNode, 
  title: string,
  role: "ADMIN" | "TEACHER" | "STUDENT",
  userName?: string
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const pathname = usePathname()

  const navItems = {
    ADMIN: [
      { name: "Overview", href: "/admin", icon: LayoutDashboard },
      { name: "Users", href: "/admin/users", icon: Users },
      { name: "Courses", href: "/admin/courses", icon: BookOpen },
      { name: "Academic Config", href: "/admin/academic-config", icon: SlidersHorizontal },
      { name: "Logs", href: "/admin/logs", icon: Activity },
      { name: "Add User", href: "/admin/users/add", icon: UserPlus },
      { name: "Settings", href: "/admin/settings", icon: Settings },
    ],
    TEACHER: [
      { name: "Overview", href: "/teacher", icon: LayoutDashboard },
      { name: "Courses", href: "/teacher/browse", icon: Search },
      { name: "My Courses", href: "/teacher/courses", icon: BookOpen },
      { name: "Students", href: "/teacher/students", icon: Users },
    ],
    STUDENT: [
      { name: "Overview", href: "/student", icon: LayoutDashboard },
      { name: "My Learning", href: "/student/courses", icon: BookOpen },
      { name: "Browse Courses", href: "/student/browse", icon: Search },
    ],
  }

  const currentNavItems = navItems[role] || []

  const pathnameToTitle = (path: string) => {
    const titles: Record<string, string> = {
      "/admin": "Admin Overview",
      "/admin/users": "User Management",
      "/admin/courses": "Platform Courses",
      "/admin/academic-config": "Academic Config",
      "/admin/users/add": "Add New User",
      "/admin/logs": "System Logs",
      "/admin/settings": "System Settings",
      "/teacher": "Teacher Dashboard",
      "/teacher/browse": "Courses",
      "/teacher/courses": "My Courses",
      "/teacher/students": "Student Roster",
      "/student": "Student Dashboard",
      "/student/courses": "My Learning",
      "/student/browse": "Browse Catalog",
    }
    return titles[path] || title
  }

  return (
    <div className={styles.container}>
      <div 
        className={`${styles.sidebarOverlay} ${isSidebarOpen ? styles.sidebarOverlayOpen : ''}`} 
        onClick={() => setIsSidebarOpen(false)}
      />
      <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.logo}>
          <div style={{ 
            background: 'white', 
            padding: '0.625rem', 
            borderRadius: '1rem', 
            marginBottom: '1rem', 
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
            border: '1px solid rgba(0,0,0,0.02)'
          }}>
            <img src="/logo.png" alt="Logo" style={{ height: '44px', display: 'block' }} />
          </div>
          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--primary)', textAlign: 'center', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
            Govt. Graduate College<br /><span style={{ opacity: 0.6 }}>Rawalpindi</span>
          </div>
        </div>

        <nav className={styles.nav}>
          {currentNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <Icon size={20} />
                <span className="capitalize">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <button 
            onClick={() => signOut({ callbackUrl: "/" })} 
            className={styles.logoutButton}
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button 
              className={styles.menuButton} 
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open Menu"
            >
              <Menu size={20} />
            </button>
            <h1>{pathnameToTitle(pathname)}</h1>
          </div>
          <div className={styles.userProfile}>
            <div style={{ marginRight: '0.75rem', textAlign: 'right' }}>
              <div style={{ fontSize: '0.7rem', opacity: 0.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Logged in as</div>
              <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.9375rem' }}>
                {userName ? formatText(userName) : formatText(role || "")}
              </div>
            </div>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9375rem', fontWeight: 800, boxShadow: '0 4px 6px -1px rgba(var(--primary-rgb, 1, 65, 28), 0.3)' }}>
              {userName ? formatText(userName)[0] : formatText(role || "")[0]}
            </div>
          </div>
        </header>
        <section className={`${styles.content} dashboard-content`}>
          <div className="animate-fade-in dashboard-content-inner">
            {['/admin', '/teacher', '/student'].includes(pathname) && (
              <div className="dashboard-school-banner" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1.5rem', 
                marginBottom: '2.5rem', 
                padding: '1.5rem', 
                background: 'white', 
                borderRadius: '1.25rem', 
                border: '1px solid var(--glass-border)',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)'
              }}>
                <div style={{ background: 'white', padding: '0.75rem', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} className="hide-on-mobile">
                  <img src="/logo.png" alt="Logo" style={{ height: '60px', display: 'block' }} />
                </div>
                <div>
                  <h2 style={{ color: 'var(--primary)', margin: 0, fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.025em' }}>
                    Govt. Graduate College
                  </h2>
                  <p style={{ color: 'var(--primary)', margin: 0, fontSize: '1.25rem', fontWeight: 600, opacity: 0.8 }}>
                    Rawalpindi
                  </p>
                </div>
              </div>
            )}
            {children}
          </div>
        </section>
      </main>
    </div>
  )
}
