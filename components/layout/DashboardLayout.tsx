import Link from "next/link"
import styles from "./DashboardLayout.module.css"

export default function DashboardLayout({ 
  children, 
  title, 
  role 
}: { 
  children: React.ReactNode, 
  title: string,
  role: string 
}) {
  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <img src="/logo.png" alt="Logo" style={{ height: '40px', marginBottom: '0.5rem' }} />
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', textAlign: 'center' }}>
            Govt. Graduate College<br />Rawalpindi
          </div>
        </div>

        <nav className={styles.nav}>
          <Link href={`/${role.toLowerCase()}`} className={styles.navItem}>Overview</Link>
          {role === 'ADMIN' && (
            <>
              <Link href="/admin/users" className={styles.navItem}>Users</Link>
              <Link href="/admin/settings" className={styles.navItem}>Settings</Link>
            </>
          )}
          {role === 'TEACHER' && (
            <>
              <Link href="/teacher/courses" className={styles.navItem}>My Courses</Link>
              <Link href="/teacher/students" className={styles.navItem}>Students</Link>
            </>
          )}
          {role === 'STUDENT' && (
            <>
              <Link href="/student/courses" className={styles.navItem}>My Learning</Link>
              <Link href="/student/browse" className={styles.navItem}>Browse Courses</Link>
            </>
          )}
        </nav>
      </aside>
      <main className={styles.main}>
        <header className={styles.header}>
          <h1>{title}</h1>
          <div className={styles.userProfile}>
            <span>{role}</span>
          </div>
        </header>
        <section className={styles.content}>
          {children}
        </section>
      </main>
    </div>
  )
}
