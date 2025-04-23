import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {

    const authHeader = request.headers.get("Authorization")
    if (!authHeader) {
      return NextResponse.json({ valid: false, error: "No authorization header" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ valid: false, error: "No token provided" }, { status: 401 })
    }

    // Get the expected API key from environment variables
    const expectedApiKey = process.env.API_KEY
    if (!expectedApiKey) {
      console.error("API_KEY environment variable is not set")
      return NextResponse.json({ valid: false, error: "Server configuration error" }, { status: 500 })
    }

    const isValid = token === expectedApiKey

    return NextResponse.json(
      { valid: isValid },
      {
        status: isValid ? 200 : 401,
        headers: {
          "Cache-Control": "no-store, max-age=0",
          Pragma: "no-cache",
        },
      },
    )
  } catch (error) {
    console.error("Error validating API key:", error)
    return NextResponse.json({ valid: false, error: "Internal server error" }, { status: 500 })
  }
}
