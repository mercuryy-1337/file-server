"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  File,
  Folder,
  FileText,
  ImageIcon,
  Video,
  ArrowLeft,
  RefreshCw,
  Trash2,
  ExternalLink,
  Download,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FileViewer } from "@/components/file-viewer"
import { useToast } from "@/hooks/use-toast"
import { isAuthenticated } from "@/lib/auth"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface FileItem {
  name: string
  type: "file" | "directory"
  size?: number
  mimeType?: string
  extension?: string
  path: string
}

export function FileExplorer({ path: initialPath = "/" }: { path?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)
  const [authenticated, setAuthenticated] = useState(false)

  // Get the current path from URL query parameters
  const currentPath = searchParams.get("path") || initialPath

  useEffect(() => {
    checkAuth()
    fetchFiles()
  }, [currentPath])

  const checkAuth = async () => {
    const auth = await isAuthenticated()
    setAuthenticated(auth)
  }

  const fetchFiles = async () => {
    setLoading(true)
    setError(null)
    try {
      // Normalize the path to ensure it starts with a slash
      const normalizedPath = currentPath.startsWith("/") ? currentPath : `/${currentPath}`

      console.log("Fetching files from:", normalizedPath)

      // Use the root endpoint for the root path, otherwise use the path-specific endpoint
      const endpoint = normalizedPath === "/" ? "/api/files/public" : `/api/files/public${normalizedPath}`

      console.log("Using endpoint:", endpoint)

      // Use our API client with retry logic
      const response = await fetch(`${endpoint}?t=${Date.now()}`, {
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
        next: { revalidate: 0 },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP error ${response.status}` }))
        console.error("API error:", errorData)
        throw new Error(errorData.error || `Failed to fetch files (HTTP ${response.status})`)
      }

      const data = await response.json()
      console.log("Files received:", data.files)

      if (Array.isArray(data.files)) {
        setFiles(data.files)
      } else {
        console.error("Invalid files data:", data)
        setFiles([])
        setError("Received invalid data from server")
      }
    } catch (error) {
      console.error("Error fetching files:", error)
      setError(error instanceof Error ? error.message : "Unknown error occurred")
      setFiles([])
    } finally {
      setLoading(false)
    }
  }

  const navigateToFolder = (folderPath: string) => {
    router.push(`/?path=${encodeURIComponent(folderPath)}`)
  }

  const navigateUp = () => {
    const pathParts = currentPath.split("/").filter(Boolean)
    const parentPath = pathParts.length > 0 ? `/${pathParts.slice(0, -1).join("/")}` : "/"
    router.push(`/?path=${encodeURIComponent(parentPath)}`)
  }

  const handleFileClick = (file: FileItem) => {
    if (file.type === "directory") {
      navigateToFolder(file.path)
    } else {
      setSelectedFile(file)
    }
  }

  const handleDeleteFile = async (filePath: string) => {
    if (!authenticated) {
      toast({
        title: "Authentication Required",
        description: "You need to authenticate to delete files",
        variant: "destructive",
      })
      return
    }

    try {
      // Get the API key from localStorage
      const apiKey = localStorage.getItem("file_server_auth_key")

      const response = await fetch(`/api/delete${filePath}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })

      if (!response.ok) throw new Error("Failed to delete file")

      toast({
        title: "Success",
        description: "File deleted successfully",
      })

      fetchFiles()
      if (selectedFile?.path === filePath) {
        setSelectedFile(null)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      })
    }
  }

  const handleDownloadFile = (file: FileItem) => {
    // Create a link element
    const link = document.createElement("a")
    link.href = `/api/files/public${file.path}`
    link.download = file.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getFileIcon = (file: FileItem) => {
    if (file.type === "directory") return <Folder className="h-5 w-5 text-blue-500" />

    const extension = file.extension?.toLowerCase()

    if (extension === ".jpg" || extension === ".jpeg" || extension === ".png") {
      return <ImageIcon className="h-5 w-5 text-purple-500" />
    } else if (extension === ".mp4" || extension === ".mov") {
      return <Video className="h-5 w-5 text-red-500" />
    } else if (extension === ".txt" || extension === ".html" || extension === ".json") {
      return <FileText className="h-5 w-5 text-amber-500" />
    }

    return <File className="h-5 w-5 text-gray-500" />
  }

  const formatFileSize = (bytes?: number) => {
    if (bytes === undefined) return ""
    if (bytes === 0) return "0 Bytes"

    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <Card className="p-4 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={navigateUp} disabled={currentPath === "/"}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-medium">{currentPath === "/" ? "Root" : currentPath}</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={fetchFiles}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Error: {error}.{" "}
                <Button variant="link" className="p-0 h-auto" onClick={fetchFiles}>
                  Try again
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-slate-500" />
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              {error ? "Failed to load files" : "No files found in this directory"}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {files.map((file) => (
                <div
                  key={file.path}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 ${
                    selectedFile?.path === file.path
                      ? "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                      : "border-slate-200 dark:border-slate-700"
                  }`}
                  onClick={() => handleFileClick(file)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                      {getFileIcon(file)}
                      <span className="font-medium truncate">{file.name}</span>
                    </div>
                    {authenticated && file.type === "file" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteFile(file.path)
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                  {file.type === "file" && (
                    <div className="mt-1 text-xs text-slate-500">{formatFileSize(file.size)}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="md:col-span-1">
        {selectedFile ? (
          <Card className="p-4 shadow-md h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium truncate">{selectedFile.name}</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleDownloadFile(selectedFile)}
                  title="Download file"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" asChild title="Open in new tab">
                  <a href={`/api/files/public${selectedFile.path}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
                {authenticated && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDeleteFile(selectedFile.path)}
                    title="Delete file"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>
            </div>
            <FileViewer file={selectedFile} />
          </Card>
        ) : (
          <Card className="p-4 shadow-md h-full flex items-center justify-center">
            <div className="text-center text-slate-500">
              <File className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>Select a file to preview</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
