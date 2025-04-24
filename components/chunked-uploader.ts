/**
 * Chunked file uploader with progress tracking
 */

interface ChunkUploadOptions {
  file: File
  chunkSize?: number
  path: string
  onProgress?: (progress: number) => void
  onComplete?: (result: any) => void
  onError?: (error: Error) => void
  apiKey?: string | null
}

export async function uploadFileInChunks({
  file,
  chunkSize = 5 * 1024 * 1024, // 5MB chunks by default
  path,
  onProgress,
  onComplete,
  onError,
  apiKey,
}: ChunkUploadOptions): Promise<void> {
  try {
    // Generate a unique upload ID
    const uploadId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`

    // Calculate total chunks
    const totalChunks = Math.ceil(file.size / chunkSize)
    let uploadedChunks = 0
    let uploadedBytes = 0

    // Initialize upload
    const initResponse = await fetch("/api/upload/init", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiKey ? `Bearer ${apiKey}` : "",
      },
      body: JSON.stringify({
        fileName: file.name,
        fileSize: file.size,
        uploadId,
        totalChunks,
        path,
      }),
    })

    if (!initResponse.ok) {
      throw new Error("Failed to initialize upload")
    }

    // Upload each chunk
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * chunkSize
      const end = Math.min(start + chunkSize, file.size)
      const chunk = file.slice(start, end)

      const formData = new FormData()
      formData.append("chunk", chunk)
      formData.append("uploadId", uploadId)
      formData.append("chunkIndex", chunkIndex.toString())
      formData.append("totalChunks", totalChunks.toString())

      const chunkResponse = await fetch("/api/upload/chunk", {
        method: "POST",
        headers: {
          Authorization: apiKey ? `Bearer ${apiKey}` : "",
        },
        body: formData,
      })

      if (!chunkResponse.ok) {
        throw new Error(`Failed to upload chunk ${chunkIndex + 1}/${totalChunks}`)
      }

      uploadedChunks++
      uploadedBytes += chunk.size

      // Report progress
      if (onProgress) {
        onProgress((uploadedBytes / file.size) * 100)
      }
    }

    // Complete the upload
    const completeResponse = await fetch("/api/upload/complete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiKey ? `Bearer ${apiKey}` : "",
      },
      body: JSON.stringify({
        uploadId,
        fileName: file.name,
        path,
      }),
    })

    if (!completeResponse.ok) {
      throw new Error("Failed to complete upload")
    }

    const result = await completeResponse.json()

    if (onComplete) {
      onComplete(result)
    }
  } catch (error) {
    console.error("Upload error:", error)
    if (onError) {
      onError(error instanceof Error ? error : new Error(String(error)))
    }
  }
}
