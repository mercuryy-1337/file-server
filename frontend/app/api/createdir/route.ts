import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const path = searchParams.get("path") || ""
    const authHeader = request.headers.get("Authorization")

    if (!authHeader) {
      return NextResponse.json({
        status: 401,
        message: "Authentication required",
      })
    }

    const backendUrl = process.env.BACKEND_URL || "http://localhost:5000"
    const response = await fetch(`${backendUrl}/api/v1/createdir?path=${path}`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
      },
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error creating directory:", error)
    return NextResponse.json({
      status: 500,
      message: "Internal server error",
    })
  }
}
