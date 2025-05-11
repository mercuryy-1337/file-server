import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the request is for the API
  if (pathname.startsWith("/api")) {
    // Validate API key for specific endpoints
    if (
      pathname.startsWith("/api/files") ||
      pathname.startsWith("/api/buckets") ||
      pathname.startsWith("/api/folders")
    ) {
      const apiKey = request.headers.get("x-api-key")
      const expectedApiKey = process.env.API_KEY

      // Skip API key validation for authenticated users
      const token = await getToken({ req: request })
      if (!token) {
        if (!apiKey || apiKey !== expectedApiKey) {
          return NextResponse.json({ message: "Unauthorized: Invalid API key" }, { status: 401 })
        }
      }
    }
  }

  // Protect dashboard routes
  if (pathname.startsWith("/dashboard")) {
    const token = await getToken({ req: request })

    if (!token) {
      const url = new URL("/login", request.url)
      url.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
}
