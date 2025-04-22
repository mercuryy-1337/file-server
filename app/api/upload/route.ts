import { type NextRequest, NextResponse } from "next/server"
import path from "path"
import fs from "fs/promises"
import { isAuthenticated } from "@/lib/auth-server"

// Base directory for files
const BASE_DIR = path.join(process.cwd(), "public/files")

export async function POST(request: NextRequest) {
  try {
    // Get API key from the client-side auth
    const authHeader = request.headers.get("Authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Check authentication
    const authenticated = await isAuthenticated(request)
    if (!authenticated) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
    }

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
  } catch (error) {
    console.error("Error uploading files:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}
