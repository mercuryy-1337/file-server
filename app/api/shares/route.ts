import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // Get all shares for the user
    const shares = await prisma.share.findMany({
      where: {
        userId,
      },
      include: {
        files: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({ shares })
  } catch (error) {
    console.error("Get shares error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
