import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PlayCircle, Trophy, BookOpen, Clock, Star, Calendar, ArrowRight } from "lucide-react"
import Link from "next/link"
import connectDB from "@/lib/db"
import Enrollment from "@/models/Enrollment"

export default async function StudentPage() {
  const session = await getServerSession(authOptions)

  let enrolledCourses: any[] = []
  let enrollmentCount = 0

  if (session?.user?.id) {
    await connectDB()
    const enrollments = await Enrollment.find({ userId: session.user.id })
      .populate("courseId", "title description program classLevel semester teacherId")
      .sort({ createdAt: -1 })
      .lean()

    enrolledCourses = enrollments
      .map((e: any) => e.courseId)
      .filter(Boolean)
    enrollmentCount = enrolledCourses.length
  }

  const stats = [
    { title: "Courses Enrolled", value: String(enrollmentCount), icon: PlayCircle, color: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)" },
    { title: "Completed Courses", value: "0", icon: BookOpen, color: "#10b981", bg: "rgba(16, 185, 129, 0.1)" },
    { title: "Learning Hours", value: "0h", icon: Clock, color: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)" },
    { title: "Achievements", value: "0", icon: Trophy, color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.1)" },
  ]

  // Gradient palette for course cards
  const gradients = [
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Welcome Hero */}
      <div style={{ 
        padding: '3rem 2.5rem', 
        borderRadius: '2rem', 
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', 
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.5rem 1rem', borderRadius: '2rem', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Star size={14} style={{ color: '#fbbf24' }} /> Student Dashboard
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.5rem 1rem', borderRadius: '2rem', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={14} /> {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>Ready to Learn?</h1>
          <p style={{ fontSize: '1.25rem', opacity: 0.8, maxWidth: '600px', lineHeight: 1.6 }}>Track your progress, join new courses, and achieve your educational goals with ease.</p>
          <div style={{ display: 'flex', gap: '1.25rem', marginTop: '2.5rem' }}>
            <Link href="/student/browse" className="btn btn-primary" style={{ padding: '0.875rem 2rem', fontSize: '1rem', fontWeight: 700, textDecoration: 'none' }}>
              Explore Courses
            </Link>
          </div>
        </div>
        <div style={{ position: 'absolute', top: '-20%', right: '-10%', opacity: 0.05, transform: 'rotate(-15deg)' }}>
          <Trophy size={500} />
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
        {stats.map((stat, i) => (
          <div key={i} className="glass-card" style={{ 
            padding: '1.5rem', 
            background: 'white', 
            border: '1px solid rgba(0,0,0,0.05)',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{ width: '3.25rem', height: '3.25rem', borderRadius: '1rem', background: stat.bg, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <stat.icon size={22} strokeWidth={2.5} />
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b', margin: 0 }}>{stat.title}</p>
              <h4 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', margin: '0.25rem 0' }}>{stat.value}</h4>
            </div>
          </div>
        ))}
      </div>

      {/* Content Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
        {/* My Learning Journey */}
        <div className="glass-card" style={{ padding: '2rem', background: 'white', border: '1px solid rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>My Learning Journey</h3>
            <Link href="/student/courses" style={{ fontSize: '0.875rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>View All</Link>
          </div>

          {enrolledCourses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem 0', background: '#f8fafc', borderRadius: '1.5rem', border: '1px dashed #e2e8f0' }}>
              <PlayCircle size={64} style={{ color: '#cbd5e1', marginBottom: '1.5rem' }} />
              <h4 style={{ color: '#1e293b', fontWeight: 700, marginBottom: '0.5rem' }}>No active courses</h4>
              <p style={{ color: '#64748b', fontWeight: 500, maxWidth: '300px', margin: '0 auto' }}>You haven't started any learning paths yet. Explore our catalog to begin.</p>
              <Link href="/student/browse" className="btn btn-primary" style={{ marginTop: '2rem', padding: '0.75rem 2rem', textDecoration: 'none', display: 'inline-block' }}>
                Pick a Course
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {enrolledCourses.slice(0, 4).map((course: any, idx: number) => (
                <Link
                  key={course._id}
                  href={`/student/courses/${course._id}`}
                  style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: '1rem', border: '1px solid #f1f5f9', background: '#fafafa', transition: 'background 0.2s' }}
                >
                  {/* Mini thumbnail */}
                  <div style={{ width: '48px', height: '48px', borderRadius: '0.75rem', background: gradients[idx % gradients.length], display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <BookOpen size={20} color="rgba(255,255,255,0.9)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, color: '#1e293b', margin: 0, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{course.title}</p>
                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.3rem', flexWrap: 'wrap' }}>
                      {course.program && <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#4f46e5', background: 'rgba(79,70,229,0.08)', padding: '0.1rem 0.4rem', borderRadius: '0.3rem' }}>{course.program}</span>}
                      {course.classLevel && <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#059669', background: 'rgba(16,185,129,0.08)', padding: '0.1rem 0.4rem', borderRadius: '0.3rem' }}>{course.classLevel}</span>}
                      {course.semester && <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#d97706', background: 'rgba(245,158,11,0.08)', padding: '0.1rem 0.4rem', borderRadius: '0.3rem' }}>{course.semester}</span>}
                    </div>
                  </div>
                  <ArrowRight size={16} color="#94a3b8" style={{ flexShrink: 0 }} />
                </Link>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="glass-card" style={{ padding: '2rem', background: 'white', border: '1px solid rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', marginBottom: '1.5rem' }}>Upcoming Deadlines</h3>
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <Calendar size={32} style={{ color: '#cbd5e1', marginBottom: '1rem' }} />
              <p style={{ color: '#64748b', fontWeight: 500, fontSize: '0.875rem' }}>All caught up! No pending assignments.</p>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '2rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', border: 'none' }}>
            <Trophy size={32} style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: '0.5rem' }}>Ready for a Challenge?</h3>
            <p style={{ fontSize: '0.875rem', opacity: 0.9, lineHeight: 1.5 }}>Complete your first course to earn your freshman badge and unlock advanced paths.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
