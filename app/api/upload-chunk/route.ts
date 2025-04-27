import { type NextRequest, NextResponse } from "next/server"
import path from "path"
import fs from "fs/promises"
import { existsSync } from "fs"
import { isAuthenticated } from "@/lib/auth-server"

// Base directory for temporary chunks and files
const BASE_DIR = path.join(process.cwd(), "public/files")
const TEMP_DIR = path.join(process.cwd(), "tmp/uploads")

// Ensure directories exist
if (!existsSync(BASE_DIR)) {
  fs.mkdir(BASE_DIR, { recursive: true }).catch(console.error)
}
if (!existsSync(TEMP_DIR)) {
  fs.mkdir(TEMP_DIR, { recursive: true }).catch(console.error)
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authenticated = await isAuthenticated(request)
    if (!authenticated) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
    }

    // Parse the form data
    const formData = await request.formData()

    // Get chunk information
    const fileId = formData.get("fileId") as string
    const fileName = formData.get("fileName") as string
    const chunkIndex = Number.parseInt(formData.get("chunkIndex") as string)
    const totalChunks = Number.parseInt(formData.get("totalChunks") as string)
    const uploadPath = (formData.get("path") as string) || "/"
    const chunk = formData.get("chunk") as File

    if (!fileId || !fileName || isNaN(chunkIndex) || isNaN(totalChunks) || !chunk) {
      return NextResponse.json({ error: "Missing required chunk information" }, { status: 400 })
    }

    // Create a directory for this file's chunks
    const fileChunkDir = path.join(TEMP_DIR, fileId)
    await fs.mkdir(fileChunkDir, { recursive: true })

    // Save this chunk
    const chunkPath = path.join(fileChunkDir, `chunk-${chunkIndex}`)
    const buffer = Buffer.from(await chunk.arrayBuffer())
    await fs.writeFile(chunkPath, buffer)

    return NextResponse.json({
      success: true,
      message: `Chunk ${chunkIndex + 1} of ${totalChunks} received`,
      fileId,
      chunkIndex,
      totalChunks,
    })
  } catch (error) {
    console.error("Error handling chunk upload:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
}
