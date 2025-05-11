import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const { name, path } = await req.json()

    // Validate inputs
    if (!name) {
      return NextResponse.json({ message: "Folder name is required" }, { status: 400 })
    }

    // Check if folder already exists at this path
    const existingFolder = await prisma.file.findFirst({
      where: {
        userId,
        name,
        path,
        isFolder: true,
      },
    })

    if (existingFolder) {
      return NextResponse.json({ message: "A folder with this name already exists in this location" }, { status: 409 })
    }

    // Create folder
    const folder = await prisma.file.create({
      data: {
        name,
        path,
        isFolder: true,
        extension: "",
        size: BigInt(0),
        objectName: `${userId}${path === "/" ? "" : path}/${name}/`,
        userId,
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "folder_create",
        details: `Created folder: ${path === "/" ? "" : path}/${name}`,
        userId,
      },
    })

    return NextResponse.json({
      message: "Folder created successfully",
      folderId: folder.id,
    })
  } catch (error) {
    console.error("Create folder error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
