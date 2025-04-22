import { type NextRequest, NextResponse } from "next/server"
import path from "path"
import fs from "fs/promises"
import { isAuthenticated } from "@/lib/auth-server"

// Base directory for files
const BASE_DIR = path.join(process.cwd(), "public/files")

export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    // Check authentication
    const authenticated = await isAuthenticated(request)
    if (!authenticated) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Get the requested path
    const requestPath = params.path ? params.path.join("/") : ""
    const fullPath = path.join(BASE_DIR, requestPath)

    // Check if the path exists
    try {
      await fs.access(fullPath)
    } catch (error) {
      return NextResponse.json({ error: "File or directory not found" }, { status: 404 })
    }

    // Get file stats
    const stats = await fs.stat(fullPath)

    // Delete the file or directory
    if (stats.isDirectory()) {
      await fs.rm(fullPath, { recursive: true })
    } else {
      await fs.unlink(fullPath)
    }

    return NextResponse.json({
      success: true,
      message: `${requestPath} deleted successfully`,
    })
  } catch (error) {
    console.error("Error deleting file:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
