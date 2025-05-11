import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import path from "path"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const { objectName, name, description, size, path: filePath } = await req.json()

    // Validate inputs
    if (!objectName || !name || size === undefined) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    // Check if file already exists in database
    const existingFile = await prisma.file.findFirst({
      where: {
        userId,
        objectName,
      },
    })

    if (existingFile) {
      return NextResponse.json({ message: "File already exists in the database" }, { status: 409 })
    }

    // Extract extension
    const extension = path.extname(name).substring(1)

    // Create file record in database
    const file = await prisma.file.create({
      data: {
        name,
        description,
        extension,
        size: BigInt(size),
        objectName,
        path: filePath || "/",
        userId,
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "import",
        details: `Imported file: ${name}`,
        userId,
      },
    })

    return NextResponse.json({
      message: "File imported successfully",
      fileId: file.id,
    })
  } catch (error) {
    console.error("Import file error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
