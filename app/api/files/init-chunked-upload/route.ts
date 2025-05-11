import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { generateObjectName } from "@/lib/utils"
import path from "path"
import crypto from "crypto"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const { name, description, size, totalChunks } = await req.json()
    const folderPath = "/" // Default path

    if (!name || !size) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    const fileExtension = path.extname(name).substring(1)
    const objectName = generateObjectName(userId, name, folderPath)
    const uploadId = crypto.randomUUID()

    // Create file record in database
    const fileRecord = await prisma.file.create({
      data: {
        name,
        description,
        extension: fileExtension,
        size: BigInt(size),
        objectName,
        path: folderPath,
        userId,
      },
    })

    // ToDo: Store upload information in a temporary storage (could be Redis or similar)
    // For simplicity, we'll just return the uploadId and fileId
    // ToD: Store chunk information

    return NextResponse.json({
      uploadId,
      fileId: fileRecord.id,
    })
  } catch (error) {
    console.error("Init chunked upload error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
