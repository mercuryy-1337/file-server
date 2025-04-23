import { NextResponse } from "next/server"
import path from "path"
import fs from "fs/promises"

export async function GET() {
  try {
    // Check if the files directory exists
    const BASE_DIR = path.join(process.cwd(), "public/files")

    try {
      await fs.access(BASE_DIR)
    } catch (error) {
      await fs.mkdir(BASE_DIR, { recursive: true })
    }

    // Return basic system info
    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      filesDirectory: BASE_DIR,
    })
  } catch (error) {
    console.error("Health check failed:", error)
    return NextResponse.json({ status: "error", error: String(error) }, { status: 500 })
  }
}
