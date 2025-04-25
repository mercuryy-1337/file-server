import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { apiKey } = await request.json()

    if (!apiKey) {
      return NextResponse.json({ status: 400, message: "API key is required" })
    }

    const backendUrl = process.env.BACKEND_URL || "http://localhost:5000"
    const response = await fetch(`${backendUrl}/api/v1/auth/validate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error validating API key:", error)
    return NextResponse.json({
      status: 500,
      message: "Internal server error",
    })
  }
}
