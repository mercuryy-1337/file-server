import { NextResponse } from "next/server"
import { hash } from "bcrypt"
import prisma from "@/lib/prisma"
import { validateEmail } from "@/lib/utils"

export async function POST(req: Request) {
  try {
    const { firstName, lastName, username, email, password } = await req.json()

    // Validate inputs
    if (!firstName || !lastName || !username || !email || !password) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 })
    }

    if (!validateEmail(email)) {
      return NextResponse.json({ message: "Invalid email address" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ message: "Password must be at least 8 characters" }, { status: 400 })
    }

    // Check if user already exists
    const existingUserByEmail = await prisma.user.findUnique({
      where: {
        email,
      },
    })

    if (existingUserByEmail) {
      return NextResponse.json({ message: "Email already in use" }, { status: 409 })
    }

    const existingUserByUsername = await prisma.user.findUnique({
      where: {
        username,
      },
    })

    if (existingUserByUsername) {
      return NextResponse.json({ message: "Username already taken" }, { status: 409 })
    }

    // Hash password
    const hashedPassword = await hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        username,
        email,
        password: hashedPassword,
      },
    })

    // Create login attempts record
    await prisma.loginAttempt.create({
      data: {
        userId: user.id,
        attempts: 0,
      },
    })

    return NextResponse.json(
      {
        message: "User registered successfully",
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          email: user.email,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
