import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const bucketId = params.id

    // Check if bucket exists and belongs to user
    const bucket = await prisma.bucketCredential.findUnique({
      where: {
        id: bucketId,
        userId,
      },
    })

    if (!bucket) {
      return NextResponse.json({ message: "Bucket not found" }, { status: 404 })
    }

    // Unset any existing default
    await prisma.bucketCredential.updateMany({
      where: {
        userId,
        isDefault: true,
      },
      data: {
        isDefault: false,
      },
    })

    // Set this bucket as default
    await prisma.bucketCredential.update({
      where: {
        id: bucketId,
      },
      data: {
        isDefault: true,
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "bucket_default",
        details: `Set default bucket: ${bucket.name}`,
        userId,
      },
    })

    return NextResponse.json({ message: "Default bucket updated successfully" })
  } catch (error) {
    console.error("Set default bucket error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
