import { type NextRequest, NextResponse } from "next/server"
import { isAuthenticated } from "@/lib/auth-server"

export async function POST(request: NextRequest) {
  try {
    // Check if the provided API key is valid
    const authenticated = await isAuthenticated(request)

    if (authenticated) {
      return NextResponse.json({ valid: true })
    } else {
      return NextResponse.json({ valid: false, error: "Invalid API key" }, { status: 401 })
    }
  } catch (error) {
    console.error("Error validating API key:", error)
    return NextResponse.json({ valid: false, error: "Internal server error" }, { status: 500 })
  }
}
