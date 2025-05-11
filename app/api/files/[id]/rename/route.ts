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
    const fileId = params.id
    const { name, description } = await req.json()

    // Validate inputs
    if (!name) {
      return NextResponse.json({ message: "Name is required" }, { status: 400 })
    }

    // Check if file exists and belongs to user
    const file = await prisma.file.findUnique({
      where: {
        id: fileId,
        userId,
      },
    })

    if (!file) {
      return NextResponse.json({ message: "File not found" }, { status: 404 })
    }

    // Update file
    const updatedFile = await prisma.file.update({
      where: {
        id: fileId,
      },
      data: {
        name,
        description,
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "rename",
        details: `Renamed file: ${file.name} to ${name}`,
        userId,
      },
    })

    return NextResponse.json({
      message: "File updated successfully",
      file: updatedFile,
    })
  } catch (error) {
    console.error("Rename file error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
