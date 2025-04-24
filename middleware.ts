import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// This middleware ensures proper handling of paths when behind a proxy
export function middleware(request: NextRequest) {
  // Log the request path for debugging
  console.log("Request path:", request.nextUrl.pathname)

  // Get the response
  const response = NextResponse.next()

  // Add CORS headers
  response.headers.set("Access-Control-Allow-Origin", "*")
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
  response.headers.set("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization")

  // Add proper MIME types for static assets
  if (request.nextUrl.pathname.startsWith("/_next/static/")) {
    if (request.nextUrl.pathname.endsWith(".js")) {
      response.headers.set("Content-Type", "application/javascript; charset=utf-8")
    } else if (request.nextUrl.pathname.endsWith(".css")) {
      response.headers.set("Content-Type", "text/css; charset=utf-8")
    }
  }

  return response
}

// See: https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
export const config = {
  matcher: ["/api/:path*", "/((?!_next/static|_next/image|favicon.ico).*)"],
}
