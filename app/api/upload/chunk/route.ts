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

    // Parse the form data
    const formData = await request.formData()
    const chunk = formData.get("chunk") as File
    const uploadId = formData.get("uploadId") as string
    const chunkIndex = Number.parseInt(formData.get("chunkIndex") as string)
    const totalChunks = Number.parseInt(formData.get("totalChunks") as string)

    if (!chunk || !uploadId || isNaN(chunkIndex) || isNaN(totalChunks)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get the upload directory
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

    // Save the chunk
    const chunkPath = path.join(uploadDir, `chunk-${chunkIndex}`)
    const buffer = Buffer.from(await chunk.arrayBuffer())
    await fs.writeFile(chunkPath, buffer)

    // Update metadata
    metadata.receivedChunks += 1
    await fs.writeFile(metadataPath, JSON.stringify(metadata))

    return NextResponse.json({
      success: true,
      message: `Chunk ${chunkIndex + 1}/${totalChunks} received`,
      progress: (metadata.receivedChunks / totalChunks) * 100,
    })
  } catch (error) {
    console.error("Error uploading chunk:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}
