import { NextResponse } from "next/server"
import path from "path"
import fs from "fs/promises"

// Temporary directory for uploads
const TEMP_DIR = path.join(process.cwd(), "tmp/uploads")

export async function GET() {
  try {
    // Create the temp directory if it doesn't exist
    await fs.mkdir(TEMP_DIR, { recursive: true })

    return NextResponse.json({
      success: true,
      message: "Temporary directory ensured",
      path: TEMP_DIR,
    })
  } catch (error) {
    console.error("Error ensuring temp directory:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
