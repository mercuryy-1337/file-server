import { type NextRequest, NextResponse } from "next/server"
import path from "path"
import fs from "fs/promises"
import { isAuthenticated } from "@/lib/auth-server"

const TEMP_DIR = path.join(process.cwd(), "tmp/uploads")
const BASE_DIR = path.join(process.cwd(), "public/files")

export async function POST(request: NextRequest) {
  try {
    const authenticated = await isAuthenticated(request)
    if (!authenticated) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const body = await request.json()
    const { uploadId, fileName, path: uploadPath } = body

    if (!uploadId || !fileName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    const uploadDir = path.join(TEMP_DIR, uploadId)

    // Check if the upload exists
    try {
      await fs.access(uploadDir)
    } catch (error) {
      return NextResponse.json({ error: "Upload not found" }, { status: 404 })
    }

    // Read metadata
    const metadataPath = path.join(uploadDir, "metadata.json")
    const metadataRaw = await fs.readFile(metadataPath, "utf-8")
    const metadata = JSON.parse(metadataRaw)

    // Ensure all chunks are received
    if (metadata.receivedChunks !== metadata.totalChunks) {
      return NextResponse.json(
        { error: `Missing chunks: ${metadata.receivedChunks}/${metadata.totalChunks}` },
        { status: 400 },
      )
    }

    const targetDir = path.join(BASE_DIR, uploadPath)
    await fs.mkdir(targetDir, { recursive: true })

    // Create the final file
    const targetPath = path.join(targetDir, fileName)
    await fs.writeFile(targetPath, Buffer.from([]))

    for (let i = 0; i < metadata.totalChunks; i++) {
      const chunkPath = path.join(uploadDir, `chunk-${i}`)
      const chunkData = await fs.readFile(chunkPath)
      await fs.appendFile(targetPath, chunkData)
    }

    // Clean up temporary files
    await fs.rm(uploadDir, { recursive: true, force: true })

    return NextResponse.json({
      success: true,
      message: "Upload completed successfully",
      file: {
        name: fileName,
        path: path.join(uploadPath, fileName),
        size: metadata.fileSize,
      },
    })
  } catch (error) {
    console.error("Error completing upload:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
