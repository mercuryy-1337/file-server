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
    })

    if (!file) {
      return NextResponse.json({ message: "File not found" }, { status: 404 })
    }

    // Get signed URL for file
    const s3 = await getS3Client(userId)
    const url = await s3.getFileUrl(file.objectName)

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "download",
        details: `Downloaded file: ${file.name}`,
        userId,
      },
    })

    return NextResponse.json({ url })
  } catch (error) {
    console.error("Download error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
