import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { getS3Client } from "@/lib/s3"
import { generateObjectName } from "@/lib/utils"
import path from "path"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const formData = await req.formData()
    const file = formData.get("file") as File
    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const folderPath = (formData.get("path") as string) || "/"

    if (!file) {
      return NextResponse.json({ message: "No file provided" }, { status: 400 })
    }

    // Get file details
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const fileSize = file.size
    const fileExtension = path.extname(file.name).substring(1)

    // Generate object name for S3
    const objectName = generateObjectName(userId, file.name, folderPath)

    // Upload to S3
    const s3 = await getS3Client(userId)
    await s3.uploadFile(objectName, fileBuffer)

    // Save file metadata to database
    const fileRecord = await prisma.file.create({
      data: {
        name,
        description,
        extension: fileExtension,
        size: BigInt(fileSize),
        objectName,
        path: folderPath,
        userId,
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "upload",
        details: `Uploaded file: ${name}`,
        userId,
      },
    })

    return NextResponse.json({
      message: "File uploaded successfully",
      fileId: fileRecord.id,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
