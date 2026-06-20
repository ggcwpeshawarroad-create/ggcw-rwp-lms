import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/db"
import Upload from "@/models/Upload"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    await connectDB()

    const upload = await Upload.create({
      name: file.name,
      contentType: file.type || "application/octet-stream",
      size: file.size,
      data: buffer,
      uploadedBy: session.user.id,
    })

    const encodedName = encodeURIComponent(file.name)
    const url = "/api/files/" + upload._id.toString() + "/" + encodedName
    return NextResponse.json({ url, name: file.name, size: file.size })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
