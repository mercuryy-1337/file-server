import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { getS3Client } from "@/lib/s3"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const fileId = params.id

    // Get file details
    const file = await prisma.file.findUnique({
      where: {
        id: fileId,
        userId,
      },
      include: {
        shares: true,
      },
    })

    if (!file) {
      return NextResponse.json({ message: "File not found" }, { status: 404 })
    }

    return NextResponse.json({ file })
  } catch (error) {
    console.error("Get file error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const fileId = params.id

    // Get file details
    const file = await prisma.file.findUnique({
      where: {
        id: fileId,
        userId,
      },
    })

    if (!file) {
      return NextResponse.json({ message: "File not found" }, { status: 404 })
    }

    // Delete from S3
    const s3 = await getS3Client(userId)
    await s3.deleteFile(file.objectName)

    // Delete from database
    await prisma.file.delete({
      where: {
        id: fileId,
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "delete",
        details: `Deleted file: ${file.name}`,
        userId,
      },
    })

    return NextResponse.json({ message: "File deleted successfully" })
  } catch (error) {
    console.error("Delete error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
