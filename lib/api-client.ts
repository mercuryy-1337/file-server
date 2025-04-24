/**
 * API client with retry logic for resilient requests
 */

type RequestOptions = {
  method?: string
  headers?: Record<string, string>
  body?: any
  retries?: number
  retryDelay?: number
}

/**
 * Fetch with retry logic to handle intermittent 502 errors
 */
export async function fetchWithRetry(url: string, options: RequestOptions = {}): Promise<Response> {
  const { method = "GET", headers = {}, body = null, retries = 3, retryDelay = 1000 } = options

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Add cache busting for GET requests
      const urlWithCacheBusting = method === "GET" ? `${url}${url.includes("?") ? "&" : "?"}_t=${Date.now()}` : url

      // Add default headers to prevent caching
      const requestHeaders = {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        ...headers,
      }

      const response = await fetch(urlWithCacheBusting, {
        method,
        headers: requestHeaders,
        body,
      })

      // If we get a 502, retry
      if (response.status === 502 && attempt < retries) {
        console.log(`Received 502 on attempt ${attempt + 1}, retrying...`)
        await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)))
        continue
      }

      return response
    } catch (error) {
      console.error(`Request failed on attempt ${attempt + 1}:`, error)
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay * (attempt + 1)))
      }
    }
  }

  throw lastError || new Error(`Failed after ${retries} retries`)
}

/**
 * Get API client
 */
export async function apiGet(url: string, options: Omit<RequestOptions, "method" | "body"> = {}) {
  return fetchWithRetry(url, { ...options, method: "GET" })
}

/**
 * Post API client
 */
export async function apiPost(url: string, data?: any, options: Omit<RequestOptions, "method"> = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  }

  return fetchWithRetry(url, {
    ...options,
    method: "POST",
    headers,
    body: data ? JSON.stringify(data) : null,
  })
}
