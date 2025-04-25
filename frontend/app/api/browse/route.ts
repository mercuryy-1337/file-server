import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const path = searchParams.get("path") || ""
    const authHeader = request.headers.get("Authorization")

    const backendUrl = process.env.BACKEND_URL || "http://localhost:5000"

    // Use the base endpoint for root directory, and path-specific endpoint for subdirectories
    const endpoint = path ? `${backendUrl}/api/v1/browse/${path}` : `${backendUrl}/api/v1/browse`

    // For browsing, we don't require authentication
    const headers: HeadersInit = {}
    if (authHeader) {
      headers["Authorization"] = authHeader
    }

    const response = await fetch(endpoint, { headers })

    // If the response is JSON, return it
    const contentType = response.headers.get("Content-Type")
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json()
      return NextResponse.json(data)
    }

    // Otherwise, it's a file content, so pass it through
    return new Response(response.body, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/octet-stream",
        "Content-Length": response.headers.get("Content-Length") || "",
      },
    })
  } catch (error) {
    console.error("Error browsing files:", error)
    return NextResponse.json({
      status: 500,
      error: "Internal server error",
    })
  }
}
