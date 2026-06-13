import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import mongoose from "mongoose";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const db = mongoose.connection;
    if (!db.db) {
      return NextResponse.json({ error: "Database not ready" }, { status: 503 });
    }

    const admin = db.db.admin();
    
    // Get server info and status
    const serverStatus = await admin.serverStatus();
    const dbStats = await db.db.stats();

    const statusMap = {
      0: "Disconnected",
      1: "Connected",
      2: "Connecting",
      3: "Disconnecting",
    };

    return NextResponse.json({
      status: statusMap[db.readyState as keyof typeof statusMap] || "Unknown",
      readyState: db.readyState,
      host: db.host,
      name: db.name,
      collections: dbStats.collections,
      objects: dbStats.objects,
      avgObjSize: (dbStats.avgObjSize / 1024).toFixed(2) + " KB",
      dataSize: (dbStats.dataSize / (1024 * 1024)).toFixed(2) + " MB",
      storageSize: (dbStats.storageSize / (1024 * 1024)).toFixed(2) + " MB",
      version: serverStatus.version,
      uptime: (serverStatus.uptime / 3600).toFixed(2) + " hours",
    });
  } catch (error: any) {
    console.error("Database status fetch failed:", error);
    return NextResponse.json({ error: "Failed to fetch database status" }, { status: 500 });
  }
}
