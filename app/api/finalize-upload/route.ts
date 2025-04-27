import { type NextRequest, NextResponse } from "next/server"
import path from "path"
import fs from "fs/promises"
import { existsSync, createReadStream, createWriteStream } from "fs"
import { isAuthenticated } from "@/lib/auth-server"
import { EventEmitter } from "events"

// Base directory for files
const BASE_DIR = path.join(process.cwd(), "public/files")
const TEMP_DIR = path.join(process.cwd(), "tmp/uploads")

// Increase max listeners for EventEmitter to prevent warnings
EventEmitter.defaultMaxListeners = 20

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

    try {
      // Combine all chunks
      for (let i = 0; i < totalChunks; i++) {
        const chunkPath = path.join(fileChunkDir, `chunk-${i}`)

        // Check if chunk exists
        if (!existsSync(chunkPath)) {
          writeStream.end() // Close the stream before returning
          await fs.rm(fileChunkDir, { recursive: true, force: true }).catch(console.error)
          return NextResponse.json({ error: `Chunk ${i} is missing` }, { status: 400 })
        }

        // Read the chunk and append to final file
        const readStream = createReadStream(chunkPath)
        await new Promise<void>((resolve, reject) => {
          readStream.pipe(writeStream, { end: false })
          readStream.on("end", () => resolve())
          readStream.on("error", (err) => {
            readStream.destroy()
            reject(err)
          })
        })

        // Delete the chunk after it's been processed to free up memory
        await fs.unlink(chunkPath).catch(console.error)
      }
    } finally {
      // Ensure the write stream is closed properly
      writeStream.end()
    }

    // Clean up chunks directory
    await fs.rm(fileChunkDir, { recursive: true, force: true }).catch(console.error)

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
