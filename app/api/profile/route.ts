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

    // Get user profile
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        firstName: true,
        lastName: true,
        username: true,
        email: true,
        image: true,
      },
    })

    if (!user) {
      return NextResponse.json({
        firstName: session.user.name?.split(" ")[0] || "",
        lastName: session.user.name?.split(" ")[1] || "",
        username: session.user.email?.split("@")[0] || "",
        email: session.user.email || "",
        image: session.user.image || null,
      })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Get profile error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const { firstName, lastName, username, email } = await req.json()

    // Validate inputs
    if (!firstName || !lastName || !username || !email) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 })
    }

    // Check if username is already taken by another user
    const existingUserByUsername = await prisma.user.findFirst({
      where: {
        username,
        id: {
          not: userId,
        },
      },
    })

    if (existingUserByUsername) {
      return NextResponse.json({ message: "Username already taken" }, { status: 409 })
    }

    // Check if email is already taken by another user
    const existingUserByEmail = await prisma.user.findFirst({
      where: {
        email,
        id: {
          not: userId,
        },
      },
    })

    if (existingUserByEmail) {
      return NextResponse.json({ message: "Email already in use" }, { status: 409 })
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        firstName,
        lastName,
        username,
        email,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        email: true,
      },
    })

    return NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUser,
    })
  } catch (error) {
    console.error("Update profile error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
