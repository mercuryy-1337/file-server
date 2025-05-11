import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import fs from "fs"
import path from "path"
import os from "os"

// ToDo: Implement a more robust temporary storage solution in the future
const TEMP_DIR = path.join(os.tmpdir(), "chunked-uploads")

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true })
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const formData = await req.formData()
    const chunk = formData.get("chunk") as File
    const uploadId = formData.get("uploadId") as string
    const chunkIndex = Number.parseInt(formData.get("chunkIndex") as string)
    const totalChunks = Number.parseInt(formData.get("totalChunks") as string)

    if (!chunk || !uploadId || isNaN(chunkIndex) || isNaN(totalChunks)) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(TEMP_DIR, uploadId)
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    // Save chunk to temporary file
    const chunkPath = path.join(uploadDir, `chunk-${chunkIndex}`)
    const chunkBuffer = Buffer.from(await chunk.arrayBuffer())
    fs.writeFileSync(chunkPath, chunkBuffer)

    return NextResponse.json({
      message: "Chunk uploaded successfully",
      chunkIndex,
    })
  } catch (error) {
    console.error("Upload chunk error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
