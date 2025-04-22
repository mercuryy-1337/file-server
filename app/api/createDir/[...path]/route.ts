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

    // Create the directory
    await fs.mkdir(fullPath, { recursive: true })

    return NextResponse.json({
      success: true,
      message: `Directory ${requestPath} created successfully`,
    })
  } catch (error) {
    console.error("Error creating directory:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
