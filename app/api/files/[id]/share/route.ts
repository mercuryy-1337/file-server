import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import crypto from "crypto"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const fileId = params.id
    const { expiresAt } = await req.json()

    // Check if file exists and belongs to user
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

    // Check if file already has a share
    if (file.shares.length > 0) {
      // Update existing share
      const share = file.shares[0]
      const updatedShare = await prisma.share.update({
        where: {
          id: share.id,
        },
        data: {
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        },
      })

      return NextResponse.json({
        message: "Share updated successfully",
        token: updatedShare.token,
      })
    }

    // Create new share
    const token = crypto.randomBytes(32).toString("hex")
    const share = await prisma.share.create({
      data: {
        token,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        userId,
        files: {
          connect: {
            id: fileId,
          },
        },
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "share",
        details: `Shared file: ${file.name}`,
        userId,
      },
    })

    return NextResponse.json({
      message: "File shared successfully",
      token: share.token,
    })
  } catch (error) {
    console.error("Share file error:", error)
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

    // Check if file exists and belongs to user
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

    // Delete all shares for this file
    if (file.shares.length > 0) {
      await prisma.share.deleteMany({
        where: {
          id: {
            in: file.shares.map((share) => share.id),
          },
        },
      })
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "share_delete",
        details: `Removed share for file: ${file.name}`,
        userId,
      },
    })

    return NextResponse.json({
      message: "Share deleted successfully",
    })
  } catch (error) {
    console.error("Delete share error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
