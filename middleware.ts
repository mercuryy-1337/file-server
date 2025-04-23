import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// This middleware ensures proper handling of paths when behind a proxy
export function middleware(request: NextRequest) {
  // Log the request path for debugging
  console.log("Request path:", request.nextUrl.pathname)

  return NextResponse.next()
}

// See: https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
export const config = {
  matcher: ["/api/:path*", "/((?!_next/static|_next/image|favicon.ico).*)"],
}
