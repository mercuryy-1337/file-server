import type { NextRequest } from "next/server"

export const isAuthenticated = async (request: NextRequest): Promise<boolean> => {
  try {
    const authHeader = request.headers.get("Authorization")
    if (!authHeader) return false

    const token = authHeader.replace("Bearer ", "")
    if (!token) return false

    const expectedApiKey = process.env.API_KEY
    if (!expectedApiKey) {
      console.error("API_KEY environment variable is not set")
      return false
    }

    return token === expectedApiKey
  } catch (error) {
    console.error("Authentication error:", error)
    return false
  }
}
