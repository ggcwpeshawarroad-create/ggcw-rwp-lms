import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PlusCircle, BookOpen, Users, ClipboardList, TrendingUp, ArrowRight } from "lucide-react"
import Link from "next/link"
import connectDB from "@/lib/db"
import Course from "@/models/Course"
import Enrollment from "@/models/Enrollment"

export default async function TeacherPage() {
  const session = await getServerSession(authOptions)

  let courses: any[] = []
  let totalStudents = 0
  let courseCount = 0

  if (session?.user?.id) {
    await connectDB()
    const rawCourses = await Course.find({ teacherId: session.user.id })
      .sort({ createdAt: -1 })
      .lean()

    courseCount = rawCourses.length

    // Add enrollment count to each course
    courses = await Promise.all(
      rawCourses.map(async (c: any) => {
        const count = await Enrollment.countDocuments({ courseId: c._id })
        totalStudents += count
        return { ...c, enrollmentCount: count }
      })
    )
  }

  const stats = [
    { title: "Total Courses", value: String(courseCount), icon: BookOpen, color: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)" },
    { title: "Active Students", value: String(totalStudents), icon: Users, color: "#10b981", bg: "rgba(16, 185, 129, 0.1)" },
    { title: "Assigned Quizzes", value: "0", icon: ClipboardList, color: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)" },
    { title: "Average Score", value: "0%", icon: TrendingUp, color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.1)" },
  ]

  const gradients = [
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Hero */}
      <div style={{
        padding: '2.5rem',
        borderRadius: '1.5rem',
        background: 'linear-gradient(135deg, var(--primary) 0%, #063c1a 100%)',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Instructor Dashboard</h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.9, maxWidth: '600px' }}>Manage your courses, track student performance, and create engaging learning experiences.</p>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <Link href="/teacher/courses" className="btn" style={{ background: 'white', color: 'var(--primary)', fontWeight: 700, padding: '0.75rem 1.5rem', textDecoration: 'none' }}>
              View My Courses
            </Link>
          </div>
        </div>
        <div style={{ position: 'absolute', top: '-10%', right: '-5%', opacity: 0.1 }}>
          <BookOpen size={300} />
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        {stats.map((stat, i) => (
          <div key={i} className="glass-card" style={{
            padding: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            background: 'white',
            border: '1px solid rgba(0,0,0,0.05)',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
          }}>
            <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '1rem', background: stat.bg, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <stat.icon size={24} strokeWidth={2.5} />
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b', margin: 0 }}>{stat.title}</p>
              <h4 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>{stat.value}</h4>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
        {/* Recent Courses */}
        <div className="glass-card" style={{ padding: '2rem', background: 'white', border: '1px solid rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>Recent Courses</h3>
            <Link href="/teacher/courses" style={{ fontSize: '0.875rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>View All</Link>
          </div>

          {courses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', background: '#f8fafc', borderRadius: '1rem', border: '1px dashed #e2e8f0' }}>
              <BookOpen size={48} style={{ color: '#cbd5e1', marginBottom: '1rem' }} />
              <p style={{ color: '#64748b', fontWeight: 500 }}>No courses assigned yet.</p>
              <Link href="/teacher/courses" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                <PlusCircle size={18} /> Go to My Courses
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {courses.slice(0, 4).map((course: any, idx: number) => (
                <Link
                  key={String(course._id)}
                  href={`/teacher/courses/${course._id}`}
                  style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1rem', borderRadius: '1rem', border: '1px solid #f1f5f9', background: '#fafafa' }}
                >
                  <div style={{ width: '44px', height: '44px', borderRadius: '0.75rem', background: gradients[idx % gradients.length], display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <BookOpen size={18} color="rgba(255,255,255,0.9)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, color: '#1e293b', margin: 0, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{course.title}</p>
                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                      {course.program && <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#4f46e5', background: 'rgba(79,70,229,0.08)', padding: '0.1rem 0.4rem', borderRadius: '0.3rem' }}>{course.program}</span>}
                      {course.classLevel && <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#059669', background: 'rgba(16,185,129,0.08)', padding: '0.1rem 0.4rem', borderRadius: '0.3rem' }}>{course.classLevel}</span>}
                      {course.semester && <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#d97706', background: 'rgba(245,158,11,0.08)', padding: '0.1rem 0.4rem', borderRadius: '0.3rem' }}>{course.semester}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '0.4rem', background: course.published ? 'rgba(16,185,129,0.1)' : 'rgba(100,116,139,0.1)', color: course.published ? '#059669' : '#64748b' }}>
                      {course.published ? 'Published' : 'Draft'}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{course.enrollmentCount} students</span>
                  </div>
                  <ArrowRight size={14} color="#cbd5e1" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="glass-card" style={{ padding: '2rem', background: 'white', border: '1px solid rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', marginBottom: '1.5rem' }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { label: "Grade Submissions", icon: ClipboardList, desc: "Review pending work", href: "/teacher/students" },
              { label: "My Students", icon: Users, desc: `${totalStudents} enrolled`, href: "/teacher/students" },
              { label: "Manage Courses", icon: BookOpen, desc: `${courseCount} course${courseCount !== 1 ? 's' : ''}`, href: "/teacher/courses" },
            ].map((action, i) => (
              <Link key={i} href={action.href} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem',
                borderRadius: '1rem',
                border: '1px solid #f1f5f9',
                background: 'white',
                textDecoration: 'none',
                color: 'inherit'
              }}>
                <div style={{ color: 'var(--primary)' }}><action.icon size={20} /></div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#1e293b' }}>{action.label}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{action.desc}</div>
                </div>
                <ArrowRight size={14} color="#cbd5e1" style={{ marginLeft: 'auto' }} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
