import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Course from "@/models/Course"
import User from "@/models/User"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    await connectDB()
    const teachers = await User.find({ role: "TEACHER" }, "_id").lean()
    const teacherUserIds = teachers.map(t => t._id.toString())

    const allCourses = await Course.find({}).populate("teacherId", "name role").lean()
    
    const debugData = allCourses.map((c: any) => ({
      title: c.title,
      teacherId: c.teacherId?._id || c.teacherId,
      teacherRole: c.teacherId?.role,
      teacherName: c.teacherId?.name,
      inTeacherList: teacherUserIds.includes(c.teacherId?._id?.toString() || c.teacherId?.toString() || ""),
      matchedNin: !teacherUserIds.includes(c.teacherId?._id?.toString() || c.teacherId?.toString() || ""),
      published: c.published
    }))

    return NextResponse.json({
      teacherUserIds,
      currentUserId: session.user.id,
      currentUserRole: session.user.role,
      courses: debugData
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
