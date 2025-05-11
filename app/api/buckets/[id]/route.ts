import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
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

    // Check if it's the default bucket
    if (bucket.isDefault) {
      return NextResponse.json({ message: "Cannot delete the default bucket" }, { status: 400 })
    }

    // Delete bucket
    await prisma.bucketCredential.delete({
      where: {
        id: bucketId,
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "bucket_delete",
        details: `Deleted bucket: ${bucket.name}`,
        userId,
      },
    })

    return NextResponse.json({ message: "Bucket deleted successfully" })
  } catch (error) {
    console.error("Delete bucket error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
