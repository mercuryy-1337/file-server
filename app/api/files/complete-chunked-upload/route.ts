import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { getS3Client } from "@/lib/s3"
import fs from "fs"
import path from "path"
import os from "os"

const TEMP_DIR = path.join(os.tmpdir(), "chunked-uploads")

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const { uploadId, fileId } = await req.json()

    if (!uploadId || !fileId) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    // Get file record
    const fileRecord = await prisma.file.findUnique({
      where: {
        id: fileId,
        userId,
      },
    })

    if (!fileRecord) {
      return NextResponse.json({ message: "File not found" }, { status: 404 })
    }

    // Get upload directory
    const uploadDir = path.join(TEMP_DIR, uploadId)
    if (!fs.existsSync(uploadDir)) {
      return NextResponse.json({ message: "Upload not found" }, { status: 404 })
    }

    // Get all chunk files and sort them
    const chunkFiles = fs
      .readdirSync(uploadDir)
      .filter((file) => file.startsWith("chunk-"))
      .sort((a, b) => {
        const indexA = Number.parseInt(a.split("-")[1])
        const indexB = Number.parseInt(b.split("-")[1])
        return indexA - indexB
      })

    // Create a combined file
    const combinedFilePath = path.join(uploadDir, "combined-file")
    const writeStream = fs.createWriteStream(combinedFilePath)

    for (const chunkFile of chunkFiles) {
      const chunkPath = path.join(uploadDir, chunkFile)
      const chunkData = fs.readFileSync(chunkPath)
      writeStream.write(chunkData)
    }

    writeStream.end()

    // Wait for the write to complete
    await new Promise<void>((resolve, reject) => {
      writeStream.on("finish", resolve)
      writeStream.on("error", reject)
    })

    // Upload the combined file to S3
    const s3 = await getS3Client(userId)
    const fileBuffer = fs.readFileSync(combinedFilePath)
    await s3.uploadFile(fileRecord.objectName, fileBuffer)

    // Clean up temporary files
    fs.rmSync(uploadDir, { recursive: true, force: true })

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "upload",
        details: `Uploaded file: ${fileRecord.name} (chunked)`,
        userId,
      },
    })

    return NextResponse.json({
      message: "File upload completed successfully",
      fileId: fileRecord.id,
    })
  } catch (error) {
    console.error("Complete chunked upload error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
