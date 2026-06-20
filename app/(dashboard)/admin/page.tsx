import Link from "next/link"
import connectDB from "@/lib/db"
import User from "@/models/User"
import Course from "@/models/Course"
import Enrollment from "@/models/Enrollment"
import Lesson from "@/models/Lesson"
import StatCard from "@/components/admin/StatCard"
import DashboardCharts from "@/components/admin/DashboardCharts"
import ActivityFeed from "@/components/admin/ActivityFeed"
import { Settings } from "lucide-react"
import { formatText } from "@/lib/utils"

export default async function AdminPage() {
  await connectDB()
  
  // Fetch statistics in parallel
  const [
    totalUsers,
    studentCount,
    teacherCount,
    courseCount,
    enrollmentCount,
    lessonCount,
    recentEnrollments,
    recentUsers,
    userStats,
    enrollmentStats
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: "STUDENT" }),
    User.countDocuments({ role: "TEACHER" }),
    Course.countDocuments(),
    Enrollment.countDocuments(),
    Lesson.countDocuments(),
    Enrollment.find().sort({ createdAt: -1 }).limit(3).populate('userId', 'name email'),
    User.find().sort({ createdAt: -1 }).limit(2),
    // Aggregation for users
    User.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) }
        }
      },
      {
        $group: {
          _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]),
    // Aggregation for enrollments
    Enrollment.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) }
        }
      },
      {
        $group: {
          _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ])
  ])

  // Process aggregation results into chart data
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const chartData = [];
  
  // Create a 6-month window
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthNum = d.getMonth() + 1;
    const yearNum = d.getFullYear();
    
    const uStat = userStats.find((s: any) => s._id.month === monthNum && s._id.year === yearNum);
    const eStat = enrollmentStats.find((s: any) => s._id.month === monthNum && s._id.year === yearNum);
    
    chartData.push({
      name: months[monthNum - 1],
      users: uStat ? uStat.count : 0,
      enrollments: eStat ? eStat.count : 0
    });
  }

  // Map activities for the feed
  const activities: any[] = [
    ...recentEnrollments.map((e: any) => ({
      id: e._id.toString(),
      type: 'ENROLLMENT',
      title: `New Enrollment`,
      subtitle: `${formatText(e.userId?.name || 'User')} enrolled in a course`,
      time: new Date(e.createdAt).toLocaleDateString()
    })),
    ...recentUsers.map((u: any) => ({
      id: u._id.toString(),
      type: 'USER',
      title: 'New Account',
      subtitle: `${formatText(u.name || (u.email ? u.email.split('@')[0] : 'User'))} joined the system`,
      time: new Date(u.createdAt).toLocaleDateString()
    }))
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 900, color: '#1e293b', margin: 0, letterSpacing: '-0.02em' }}>Analytics Overview</h1>
          <p style={{ fontSize: '1.1rem', color: '#64748b', fontWeight: 500, marginTop: '0.25rem' }}>Real-time platform metrics and system health.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/admin/settings" className="btn" style={{ 
            background: 'white', 
            border: '1px solid #e2e8f0', 
            textDecoration: 'none', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            padding: '0.75rem 1.25rem',
            borderRadius: '0.75rem',
            fontWeight: 700,
            fontSize: '0.9375rem',
            color: '#475569'
          }}>
            <Settings size={18} /> Settings
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        <StatCard 
          title="Total Students" 
          value={studentCount} 
          icon="GraduationCap" 
          description="Enrolled in courses" 
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard 
          title="Total Teachers" 
          value={teacherCount} 
          icon="Users" 
          description="Managing content" 
        />
        <StatCard 
          title="Active Courses" 
          value={courseCount} 
          icon="BookOpen" 
          description="Published & Draft" 
        />
        <StatCard 
          title="Total Lessons" 
          value={lessonCount} 
          icon="FileText" 
          description="Across all courses" 
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        <div>
          <DashboardCharts data={chartData} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <ActivityFeed activities={activities} />
          
          <div className="glass-card" style={{ padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)', background: 'white', borderRadius: '1.25rem' }}>
            <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>System Infrastructure</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { label: "Database Engine", status: "Healthy", color: "#10b981" },
                { label: "Cloud Storage", status: "Active", color: "#10b981" },
                { label: "Authentication", status: "Online", color: "#10b981" }
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b' }}>{item.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: item.color }}></div>
                    <span style={{ color: item.color, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
