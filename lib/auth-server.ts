import type { NextRequest } from "next/server"

// In a real application, you would validate the API key against a database
// For this example, we'll validate against an API key stored in the .env file
export const isAuthenticated = async (request: NextRequest): Promise<boolean> => {
  // Get the API key from the Authorization header
  const authHeader = request.headers.get("Authorization")
  if (!authHeader) return false

  // Extract the token from the Authorization header
  const token = authHeader.replace("Bearer ", "")
  if (!token) return false

  // Get the expected API key from environment variables
  const expectedApiKey = process.env.API_KEY
  if (!expectedApiKey) {
    console.error("API_KEY environment variable is not set")
    return false
  }

  // Compare the provided token with the expected API key
  return token === expectedApiKey
}
