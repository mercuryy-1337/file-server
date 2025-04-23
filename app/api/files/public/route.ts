import { NextResponse } from "next/server"
import path from "path"
import fs from "fs/promises"

// Base directory for files
const BASE_DIR = path.join(process.cwd(), "public/files")

export async function GET() {
  try {
    //console.log("Accessing root directory:", BASE_DIR)

    // Check if the directory exists
    try {
      await fs.access(BASE_DIR)
    } catch (error) {
      console.error("Directory not found, creating it:", BASE_DIR)
      await fs.mkdir(BASE_DIR, { recursive: true })
    }

    // Get file stats
    const stats = await fs.stat(BASE_DIR)

    // If it's a directory, return its contents
    if (stats.isDirectory()) {
      const files = await fs.readdir(BASE_DIR)
      console.log("Files found in root:", files.length)

      // Get details for each file/directory
      const fileDetails = await Promise.all(
        files.map(async (file) => {
          const filePath = path.join(BASE_DIR, file)
          const fileStats = await fs.stat(filePath)
          const isDirectory = fileStats.isDirectory()

          // Construct the relative path for the file
          const relativePath = `/${file}`

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

      // Set cache control headers to prevent caching issues
      return NextResponse.json(
        { files: fileDetails },
        {
          headers: {
            "Cache-Control": "no-store, max-age=0",
            Pragma: "no-cache",
            Expires: "0",
          },
        },
      )
    } else {
      return NextResponse.json({ error: "Root path is not a directory" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error accessing root directory:", error)
    return NextResponse.json({ error: "Internal server error", files: [] }, { status: 500 })
  }
}
