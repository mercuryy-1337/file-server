import { type NextRequest, NextResponse } from "next/server"
import path from "path"
import fs from "fs/promises"

// Base directory for files
const BASE_DIR = path.join(process.cwd(), "public/files")

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    // Get the requested path
    const requestPath = params.path ? params.path.join("/") : ""
    const fullPath = path.join(BASE_DIR, requestPath)

    console.log("Requested path:", requestPath)
    console.log("Full path:", fullPath)

    // Check if the path exists
    try {
      await fs.access(fullPath)
    } catch (error) {
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
    // If it's a file, return the file
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

      // Read the file
      const fileBuffer = await fs.readFile(fullPath)

      // Return the file with appropriate headers
      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": mimeType,
          "Content-Length": stats.size.toString(),
        },
      })
    }
  } catch (error) {
    console.error("Error accessing file:", error)
    return NextResponse.json({ error: "Internal server error", files: [] }, { status: 500 })
  }
}
