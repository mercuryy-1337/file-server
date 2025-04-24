import { Suspense } from "react"
import { FileExplorer } from "@/components/file-explorer"
import { UploadButton } from "@/components/upload-button"
import { CreateDirButton } from "@/components/create-dir-button"
import { AuthButton } from "@/components/auth-button"
import { Loader2 } from "lucide-react"
import fs from "fs/promises"
import path from "path"

async function ensureFileStructure() {
  try {
    const BASE_DIR = path.join(process.cwd(), "public/files")
    const TEMP_DIR = path.join(process.cwd(), "tmp/uploads")

    // Create the directories if they don't exist
    await fs.mkdir(BASE_DIR, { recursive: true })
    await fs.mkdir(TEMP_DIR, { recursive: true })

    // List files to verify the directory exists and is accessible
    const files = await fs.readdir(BASE_DIR)
    console.log("Files in directory:", files.length)
  } catch (error) {
    console.error("Error ensuring file structure:", error)
  }
}

export default async function Home() {
  // Ensure file structure exists on server-side
  await ensureFileStructure()

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto py-8 px-4">
        <header className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">File Server</h1>
            <div className="flex items-center gap-2">
              <AuthButton />
              <CreateDirButton />
              <UploadButton />
            </div>
          </div>
          <div className="h-1 w-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full"></div>
        </header>

        <Suspense
          fallback={
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
            </div>
          }
        >
          <FileExplorer path="/" />
        </Suspense>
      </div>
    </main>
  )
}
