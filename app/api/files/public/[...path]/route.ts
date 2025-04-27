import { type NextRequest, NextResponse } from "next/server"
import path from "path"
import fs from "fs/promises"
import { createReadStream, existsSync } from "fs"
import type { Readable } from "stream"

// Base directory for files
const BASE_DIR = path.join(process.cwd(), "public/files")

// Helper function to convert a readable stream to a ReadableStream
function nodeStreamToWebStream(nodeStream: Readable): ReadableStream {
  return new ReadableStream({
    start(controller) {
      nodeStream.on("data", (chunk) => {
        controller.enqueue(chunk)
      })
      nodeStream.on("end", () => {
        controller.close()
      })
      nodeStream.on("error", (err) => {
        controller.error(err)
      })
    },
    cancel() {
      nodeStream.destroy()
    },
  })
}

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    // Get the requested path
    const requestPath = params.path ? params.path.join("/") : ""
    const fullPath = path.join(BASE_DIR, requestPath)

    // Check if the path exists
    if (!existsSync(fullPath)) {
      console.error("Path not found:", fullPath)
      return NextResponse.json({ error: "File or directory not found", files: [] }, { status: 404 })
    }

    // Get file stats
    const stats = await fs.stat(fullPath)

    // If it's a directory, return its contents
    if (stats.isDirectory()) {
      const files = await fs.readdir(fullPath)
      console.log("Files found:", files.length)

      // Get details for each file/directory
      const fileDetails = await Promise.all(
        files.map(async (file) => {
          const filePath = path.join(fullPath, file)
          const fileStats = await fs.stat(filePath)
          const isDirectory = fileStats.isDirectory()

          // Construct the relative path for the file
          const relativePath = path.join("/", requestPath, file).replace(/\\/g, "/")

          // Get file extension if it's a file
          let extension = null
          let mimeType = null

          if (!isDirectory) {
            extension = path.extname(file)
            // Simple mime type mapping
            const mimeTypes: Record<string, string> = {
              ".html": "text/html",
              ".json": "application/json",
              ".txt": "text/plain",
              ".jpg": "image/jpeg",
              ".jpeg": "image/jpeg",
              ".png": "image/png",
              ".mp4": "video/mp4",
              ".mov": "video/quicktime",
            }
            mimeType = mimeTypes[extension] || "application/octet-stream"
          }

          return {
            name: file,
            type: isDirectory ? "directory" : "file",
            size: isDirectory ? undefined : fileStats.size,
            mimeType,
            extension,
            path: relativePath,
          }
        }),
      )

      return NextResponse.json({ files: fileDetails })
    }
    // If it's a file, stream it instead of loading it all into memory
    else {
      // Get file extension
      const extension = path.extname(fullPath).toLowerCase()

      // Simple mime type mapping
      const mimeTypes: Record<string, string> = {
        ".html": "text/html",
        ".json": "application/json",
        ".txt": "text/plain",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".mp4": "video/mp4",
        ".mov": "video/quicktime",
      }

      const mimeType = mimeTypes[extension] || "application/octet-stream"

      // Check for range header for partial content requests
      const rangeHeader = request.headers.get("range")

      if (rangeHeader) {
        // Handle range requests (important for video streaming)
        const fileSize = stats.size
        const parts = rangeHeader.replace(/bytes=/, "").split("-")
        const start = Number.parseInt(parts[0], 10)
        const end = parts[1] ? Number.parseInt(parts[1], 10) : fileSize - 1
        const chunkSize = end - start + 1

        // Create a read stream for the specified range
        const fileStream = createReadStream(fullPath, { start, end })
        const webStream = nodeStreamToWebStream(fileStream)

        // Return the stream with appropriate headers
        return new NextResponse(webStream, {
          status: 206,
          headers: {
            "Content-Type": mimeType,
            "Content-Range": `bytes ${start}-${end}/${fileSize}`,
            "Content-Length": chunkSize.toString(),
            "Accept-Ranges": "bytes",
          },
        })
      } else {
        // Stream the entire file
        const fileStream = createReadStream(fullPath)
        const webStream = nodeStreamToWebStream(fileStream)

        // Return the stream with appropriate headers
        return new NextResponse(webStream, {
          headers: {
            "Content-Type": mimeType,
            "Content-Length": stats.size.toString(),
            "Accept-Ranges": "bytes",
          },
        })
      }
    }
  } catch (error) {
    console.error("Error accessing file:", error)
    return NextResponse.json({ error: "Internal server error", files: [] }, { status: 500 })
  }
}
