// Store the API key in localStorage
const AUTH_KEY = "file_server_auth_key"

// Check if the user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  if (typeof window === "undefined") return false

  const key = localStorage.getItem(AUTH_KEY)
  if (!key) return false

  return true
}

// Login function to store the API key
export const login = async (apiKey: string): Promise<void> => {
  if (typeof window === "undefined") return

  try {
    // Validate the key with the server before storing it
    const response = await fetch("/api/validate-key", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      // Add cache control to prevent caching issues
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error("Invalid API key")
    }

    // Store the validated key
    localStorage.setItem(AUTH_KEY, apiKey)
  } catch (error) {
    console.error("Authentication error:", error)
    throw new Error("Authentication failed. Please try again.")
  }
}

// Logout function to remove the API key
export const logout = async (): Promise<void> => {
  if (typeof window === "undefined") return

  localStorage.removeItem(AUTH_KEY)
}

// Get the stored API key
export const getApiKey = (): string | null => {
  if (typeof window === "undefined") return null
  return localStorage.getItem(AUTH_KEY)
}
