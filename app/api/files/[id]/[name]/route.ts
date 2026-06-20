import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import connectDB from "@/lib/db"
import Upload from "@/models/Upload"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; name: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    await connectDB()

    const upload = await Upload.findById(id).lean()
    if (!upload) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    const data = Buffer.isBuffer(upload.data)
      ? upload.data
      : Buffer.from(upload.data.buffer)

    const safeName = String(upload.name || "file").replace(/["\r\n]/g, "_")
    const encodedName = encodeURIComponent(safeName)

    return new NextResponse(data, {
      headers: {
        "Content-Type": upload.contentType || "application/octet-stream",
        "Content-Length": String(upload.size || data.length),
        "Content-Disposition": `inline; filename="${safeName}"; filename*=UTF-8''${encodedName}`,
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch (error) {
    console.error("File load error:", error)
    return NextResponse.json({ error: "Failed to load file" }, { status: 500 })
  }
}
