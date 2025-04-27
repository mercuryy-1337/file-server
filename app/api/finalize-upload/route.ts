import { type NextRequest, NextResponse } from "next/server"
import path from "path"
import fs from "fs/promises"
import { existsSync, createReadStream, createWriteStream } from "fs"
import { pipeline } from "stream/promises"
import { isAuthenticated } from "@/lib/auth-server"

// Base directory for files
const BASE_DIR = path.join(process.cwd(), "public/files")
const TEMP_DIR = path.join(process.cwd(), "tmp/uploads")

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authenticated = await isAuthenticated(request)
    if (!authenticated) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
    }

    // Parse the JSON body
    const body = await request.json()
    const { fileId, fileName, totalChunks, path: uploadPath } = body

    if (!fileId || !fileName || !totalChunks) {
      return NextResponse.json({ error: "Missing required information" }, { status: 400 })
    }

    // Directory where chunks are stored
    const fileChunkDir = path.join(TEMP_DIR, fileId)

    // Ensure target directory exists
    const targetDir = path.join(BASE_DIR, uploadPath || "/")
    await fs.mkdir(targetDir, { recursive: true })

    // Path for the final file
    const finalFilePath = path.join(targetDir, fileName)

    // Create write stream for the final file
    const writeStream = createWriteStream(finalFilePath)

    // Combine all chunks
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(fileChunkDir, `chunk-${i}`)

      // Check if chunk exists
      if (!existsSync(chunkPath)) {
        await fs.rm(fileChunkDir, { recursive: true, force: true })
        return NextResponse.json({ error: `Chunk ${i} is missing` }, { status: 400 })
      }

      // Read the chunk and append to final file
      const readStream = createReadStream(chunkPath)
      await pipeline(readStream, writeStream, { end: false })
    }

    // Close the write stream
    writeStream.end()

    // Clean up chunks
    await fs.rm(fileChunkDir, { recursive: true, force: true })

    // Get file size
    const stats = await fs.stat(finalFilePath)

    return NextResponse.json({
      success: true,
      message: "File upload completed and chunks combined",
      file: {
        name: fileName,
        path: path.join(uploadPath || "/", fileName),
        size: stats.size,
      },
    })
  } catch (error) {
    console.error("Error finalizing upload:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const config = {
  api: {
    responseLimit: false,
  },
}
