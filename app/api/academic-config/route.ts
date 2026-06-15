import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import AcademicConfig from "@/models/AcademicConfig"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// Default seed data — only used when no config exists yet
const DEFAULT_CLASSES = [
  {
    name: "BS",
    programs: ["BS Computer Science", "BS Islamic Studies", "BS English", "BS Physics", "BS Chemistry", "BS Mathematics", "BS Zoology", "BS Botany", "BS Psychology", "BS Economics", "BS Sociology", "BS Political Science"],
    semesters: ["1st Semester", "2nd Semester", "3rd Semester", "4th Semester", "5th Semester", "6th Semester", "7th Semester", "8th Semester"],
  },
  { name: "2nd Year", programs: ["Pre-Engineering", "Pre-Medical", "Arts", "ICS", "I.Com"], semesters: [] },
  { name: "1st Year", programs: ["Pre-Engineering", "Pre-Medical", "Arts", "ICS", "I.Com"], semesters: [] },
  { name: "10th", programs: ["Science", "Arts"], semesters: [] },
  { name: "9th", programs: ["Science", "Arts"], semesters: [] },
  { name: "8th", programs: [], semesters: [] },
  { name: "7th", programs: [], semesters: [] },
  { name: "6th", programs: [], semesters: [] },
  { name: "5th", programs: [], semesters: [] },
  { name: "4th", programs: [], semesters: [] },
  { name: "3rd", programs: [], semesters: [] },
  { name: "2nd", programs: [], semesters: [] },
  { name: "1st", programs: [], semesters: [] },
]

// GET — public, no auth required
export async function GET() {
  try {
    await connectDB()
    let config = await AcademicConfig.findOne({ docId: "singleton" })
    if (!config) {
      // Seed with defaults on first access
      config = await AcademicConfig.create({ docId: "singleton", classes: DEFAULT_CLASSES })
    }
    return NextResponse.json(config)
  } catch (error) {
    console.error("AcademicConfig GET error:", error)
    return NextResponse.json({ error: "Failed to fetch config" }, { status: 500 })
  }
}

// PATCH — admin only
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    await connectDB()

    const config = await AcademicConfig.findOneAndUpdate(
      { docId: "singleton" },
      { $set: { classes: body.classes } },
      { new: true, upsert: true }
    )

    return NextResponse.json(config)
  } catch (error) {
    console.error("AcademicConfig PATCH error:", error)
    return NextResponse.json({ error: "Failed to update config" }, { status: 500 })
  }
}
