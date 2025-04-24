import { type NextRequest, NextResponse } from "next/server"
import path from "path"
import fs from "fs/promises"
import { isAuthenticated } from "@/lib/auth-server"

// Temporary directory for chunks
const TEMP_DIR = path.join(process.cwd(), "tmp/uploads")

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authenticated = await isAuthenticated(request)
    if (!authenticated) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Parse the request body
    const body = await request.json()
    const { fileName, fileSize, uploadId, totalChunks, path: uploadPath } = body

    if (!fileName || !uploadId || !totalChunks) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create temp directory for this upload if it doesn't exist
    const uploadTempDir = path.join(TEMP_DIR, uploadId)
    await fs.mkdir(uploadTempDir, { recursive: true })

    // Save upload metadata
    await fs.writeFile(
      path.join(uploadTempDir, "metadata.json"),
      JSON.stringify({
        fileName,
        fileSize,
        uploadId,
        totalChunks,
        uploadPath,
        receivedChunks: 0,
        createdAt: new Date().toISOString(),
      }),
    )

    return NextResponse.json({
      success: true,
      uploadId,
      message: "Upload initialized",
    })
  } catch (error) {
    console.error("Error initializing upload:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
