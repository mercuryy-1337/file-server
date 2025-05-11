import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getS3Client } from "@/lib/s3"

export async function GET(req: Request, { params }: { params: { token: string } }) {
  try {
    const token = params.token

    // Get share details
    const share = await prisma.share.findUnique({
      where: {
        token,
      },
      include: {
        files: true,
      },
    })

    if (!share || share.files.length === 0) {
      return NextResponse.json({ message: "Share not found" }, { status: 404 })
    }

    // Check if share has expired
    if (share.expiresAt && new Date() > new Date(share.expiresAt)) {
      return NextResponse.json({ message: "Share has expired" }, { status: 410 })
    }

    const file = share.files[0]

    // Get signed URL for file
    const s3 = await getS3Client(share.userId)
    const url = await s3.getFileUrl(file.objectName)

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "share_download",
        details: `Shared file downloaded: ${file.name}`,
        userId: share.userId,
      },
    })

    return NextResponse.json({ url })
  } catch (error) {
    console.error("Share download error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
