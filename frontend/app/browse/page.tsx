"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { FileExplorer } from "@/components/file-explorer"
import { FilePreview } from "@/components/file-preview"
import { Button } from "@/components/ui/button"
import { Loader2, LogOut, LogIn } from "lucide-react"
import type { FileItem } from "@/types/file"
import Link from "next/link"

export default function BrowsePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [currentPath, setCurrentPath] = useState("")
  const [files, setFiles] = useState<FileItem[]>([])
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated
    const apiKey = localStorage.getItem("fileServerApiKey")
    setIsAuthenticated(!!apiKey)

    fetchFiles(currentPath)
  }, [currentPath])

  const fetchFiles = async (path: string) => {
    setIsLoading(true)
    try {
      const apiKey = localStorage.getItem("fileServerApiKey")

      // Use the base endpoint for the root directory, and path-specific endpoint for subdirectories
      const endpoint = path ? `/api/browse?path=${path}` : `/api/browse`

      const headers: HeadersInit = {}
      if (apiKey) {
        headers["Authorization"] = `Bearer ${apiKey}`
      }

      const response = await fetch(endpoint, { headers })

      if (response.status === 401) {
        // Only show authentication error if user was previously authenticated
        if (isAuthenticated) {
          toast({
            title: "Authentication error",
            description: "Your session has expired. Please sign in again.",
            variant: "destructive",
          })
          localStorage.removeItem("fileServerApiKey")
          setIsAuthenticated(false)
        }
      }

      const data = await response.json()
      if (data.status === 200) {
        setFiles(data.files || [])
        setSelectedFile(null)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch files",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to the server",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileSelect = (file: FileItem) => {
    if (file.type === "directory") {
      setCurrentPath(file.path.substring(1)) // Remove leading slash
    } else {
      setSelectedFile(file)
    }
  }

  const handleCreateFolder = async (folderName: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create folders",
        variant: "destructive",
      })
      return
    }

    if (!folderName.trim()) return

    try {
      const apiKey = localStorage.getItem("fileServerApiKey")
      const path = currentPath ? `${currentPath}/${folderName}` : folderName

      const response = await fetch(`/api/createdir?path=${path}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })

      const data = await response.json()

      if (data.status === 200) {
        toast({
          title: "Success",
          description: "Folder created successfully",
        })
        fetchFiles(currentPath)
      } else if (data.status === 401) {
        toast({
          title: "Authentication required",
          description: "Please sign in to create folders",
          variant: "destructive",
        })
        setIsAuthenticated(false)
        localStorage.removeItem("fileServerApiKey")
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to create folder",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to the server",
        variant: "destructive",
      })
    }
  }

  const handleDeleteItem = async (item: FileItem) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please sign in to delete files or folders",
        variant: "destructive",
      })
      return
    }

    try {
      const apiKey = localStorage.getItem("fileServerApiKey")
      const response = await fetch(`/api/delete?path=${item.path.substring(1)}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })

      const data = await response.json()

      if (data.status === 200) {
        toast({
          title: "Success",
          description: `${item.type === "directory" ? "Folder" : "File"} deleted successfully`,
        })
        if (selectedFile && selectedFile.path === item.path) {
          setSelectedFile(null)
        }
        fetchFiles(currentPath)
      } else if (data.status === 401) {
        toast({
          title: "Authentication required",
          description: "Please sign in to delete files or folders",
          variant: "destructive",
        })
        setIsAuthenticated(false)
        localStorage.removeItem("fileServerApiKey")
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to delete item",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to the server",
        variant: "destructive",
      })
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("fileServerApiKey")
    setIsAuthenticated(false)
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    })
  }

  const navigateUp = () => {
    if (!currentPath) return

    const pathParts = currentPath.split("/")
    pathParts.pop()
    setCurrentPath(pathParts.join("/"))
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 sm:p-6 md:p-8 flex flex-col">
      <div className="max-w-7xl mx-auto w-full">
        <header className="bg-white dark:bg-slate-800 shadow-sm p-4 rounded-lg mb-6 flex justify-between items-center">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">File Server</h1>
          {isAuthenticated ? (
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          ) : (
            <Link href="/">
              <Button variant="outline" size="sm">
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            </Link>
          )}
        </header>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden">
          <div className="flex flex-col md:flex-row h-[calc(100vh-12rem)]">
            <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700">
              <FileExplorer
                files={files}
                currentPath={currentPath}
                isLoading={isLoading}
                onFileSelect={handleFileSelect}
                onCreateFolder={handleCreateFolder}
                onDeleteItem={handleDeleteItem}
                onNavigateUp={navigateUp}
                selectedFile={selectedFile}
                setCurrentPath={setCurrentPath}
                isAuthenticated={isAuthenticated}
              />
            </div>

            <div className="w-full md:w-2/3 p-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                </div>
              ) : selectedFile ? (
                <FilePreview file={selectedFile} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400">
                  <p>Select a file to preview</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
