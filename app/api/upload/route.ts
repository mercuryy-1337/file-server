import { type NextRequest, NextResponse } from "next/server"
import path from "path"
import fs from "fs/promises"
import { existsSync, createWriteStream } from "fs"
import { pipeline } from "stream/promises"
import { isAuthenticated } from "@/lib/auth-server"
import multer from "multer"
import { Readable } from "stream"

// Base directory for files
const BASE_DIR = path.join(process.cwd(), "public/files")

// Ensure base directory exists
if (!existsSync(BASE_DIR)) {
  fs.mkdir(BASE_DIR, { recursive: true }).catch(console.error)
}

// Configure multer for disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Extract path from request - Node.js request headers are accessed differently
    const uploadPath = (req.headers["x-upload-path"] as string) || "/"
    const targetDir = path.join(BASE_DIR, uploadPath)

    // Create directory if it doesn't exist
    if (!existsSync(targetDir)) {
      fs.mkdir(targetDir, { recursive: true })
        .then(() => cb(null, targetDir))
        .catch((err) => cb(err, targetDir))
    } else {
      cb(null, targetDir)
    }
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname)
  },
})

// Create multer instance with file size limit (500MB = 500 * 1024 * 1024)
const upload = multer({
  storage: storage,
  limits: { fileSize: 500 * 1024 * 1024 },
})

// Helper function to convert NextRequest to Node's IncomingMessage
function requestToStream(request: NextRequest): Readable {
  const stream = new Readable()
  stream._read = () => {}

  request.body?.pipeTo(
    new WritableStream({
      write(chunk) {
        stream.push(Buffer.from(chunk))
      },
      close() {
        stream.push(null)
      },
    }),
  )

  return stream
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authenticated = await isAuthenticated(request)
    if (!authenticated) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
    }

    // For small files (under 500MB), use the original method
    const contentLength = Number.parseInt(request.headers.get("content-length") || "0")
    if (contentLength < 500 * 1024 * 1024) {
      // Parse the form data
      const formData = await request.formData()
      const files = formData.getAll("files") as File[]
      const uploadPath = (formData.get("path") as string) || "/"

      // Ensure the target directory exists
      const targetDir = path.join(BASE_DIR, uploadPath)
      await fs.mkdir(targetDir, { recursive: true })

      // Process each file
      const results = await Promise.all(
        files.map(async (file) => {
          const fileName = file.name
          const filePath = path.join(targetDir, fileName)

          // Convert file to buffer
          const buffer = Buffer.from(await file.arrayBuffer())

          // Write the file
          await fs.writeFile(filePath, buffer)

          return {
            name: fileName,
            path: path.join(uploadPath, fileName),
            size: file.size,
          }
        }),
      )

      return NextResponse.json({
        success: true,
        message: `${files.length} file(s) uploaded successfully`,
        files: results,
      })
    }
    // For large files, use multer
    else {
      // This is a simplified approach since multer doesn't work directly with NextRequest
      // In a production app, you might want to use a different approach or middleware

      // Extract upload path from headers
      const uploadPath = request.headers.get("x-upload-path") || "/"
      const targetDir = path.join(BASE_DIR, uploadPath)

      // Ensure directory exists
      await fs.mkdir(targetDir, { recursive: true })

      // Get file name from headers and ensure it's preserved exactly as sent
      const fileName = request.headers.get("x-file-name") || "unknown-file"
      console.log("Received file name:", fileName)

      const filePath = path.join(targetDir, fileName)
      console.log("Saving to path:", filePath)

      // Create a write stream
      const writeStream = createWriteStream(filePath)

      // Convert request body to stream and pipe to file
      const readable = requestToStream(request)
      await pipeline(readable, writeStream)

      // Get file size
      const stats = await fs.stat(filePath)

      return NextResponse.json({
        success: true,
        message: "File uploaded successfully",
        files: [
          {
            name: fileName,
            path: path.join(uploadPath, fileName),
            size: stats.size,
          },
        ],
      })
    }
  } catch (error) {
    console.error("Error uploading files:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
}
