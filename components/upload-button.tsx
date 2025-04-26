"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Upload, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { isAuthenticated } from "@/lib/auth"
import { AuthDialog } from "@/components/auth-dialog"
import { Progress } from "@/components/ui/progress"

export function UploadButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [currentFile, setCurrentFile] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const auth = await isAuthenticated()
    setAuthenticated(auth)
  }

  const handleButtonClick = async () => {
    const auth = await isAuthenticated()
    if (!auth) {
      setIsAuthDialogOpen(true)
    } else {
      setIsOpen(true)
    }
  }

  const handleAuthSuccess = () => {
    setIsAuthDialogOpen(false)
    setAuthenticated(true)
    setIsOpen(true)
  }

  const uploadFile = async (file: File, path: string): Promise<any> => {
    setCurrentFile(file.name)

    // Get the API key from localStorage
    const apiKey = localStorage.getItem("file_server_auth_key")

    // Determine if we should use the large file upload method
    const isLargeFile = file.size > 500 * 1024 * 1024 // 500MB

    if (isLargeFile) {
      // For large files, use a streaming approach with progress tracking
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        // Track upload progress
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100)
            setUploadProgress(percentComplete)
          }
        })

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText)
              resolve(response)
            } catch (e) {
              reject(new Error("Invalid response format"))
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`))
          }
        })

        xhr.addEventListener("error", () => reject(new Error("Network error")))
        xhr.addEventListener("abort", () => reject(new Error("Upload aborted")))

        // Open connection
        xhr.open("POST", "/api/upload", true)

        // Set headers
        xhr.setRequestHeader("Authorization", `Bearer ${apiKey}`)
        xhr.setRequestHeader("x-upload-path", path)
        xhr.setRequestHeader("x-file-name", file.name)
        console.log("Sending file with name:", file.name)

        // Send the file directly
        xhr.send(file)
      })
    } else {
      // For smaller files, use the original FormData approach
      const formData = new FormData()
      formData.append("path", path)
      formData.append("files", file)

      return fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
      }).then((response) => {
        if (!response.ok) {
          throw new Error("Upload failed")
        }
        return response.json()
      })
    }
  }

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Get current path from URL or use root
      const urlParams = new URLSearchParams(window.location.search)
      const currentPath = urlParams.get("path") || "/"

      // Upload files one by one to track progress better
      const results = []
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        console.log("Uploading file:", file.name, "Size:", file.size, "Type:", file.type)
        setCurrentFile(file.name)

        // Reset progress for each file
        setUploadProgress(0)

        // Upload the file and get result
        const result = await uploadFile(file, currentPath)
        results.push(result)
      }

      toast({
        title: "Success",
        description: `${files.length} file(s) uploaded successfully`,
      })

      // Close dialog and refresh file list
      setIsOpen(false)
      window.location.reload()
    } catch (error) {
      console.error(error)
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your files",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      setCurrentFile("")
      setUploadProgress(0)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files)
    }
  }

  return (
    <>
      <Button onClick={handleButtonClick}>
        <Upload className="h-4 w-4 mr-2" />
        Upload
      </Button>

      <AuthDialog isOpen={isAuthDialogOpen} onClose={() => setIsAuthDialogOpen(false)} onSuccess={handleAuthSuccess} />

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Files</DialogTitle>
          </DialogHeader>
          <div
            className={`mt-4 flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 transition-colors ${
              dragActive
                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20"
                : "border-slate-300 dark:border-slate-700"
            }`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
          >
            {isUploading ? (
              <div className="text-center w-full">
                <Loader2 className="h-8 w-8 animate-spin text-slate-500 mx-auto mb-4" />
                <p className="text-sm text-slate-500 mb-2">Uploading {currentFile}...</p>
                <div className="w-full mb-2">
                  <Progress value={uploadProgress} className="h-2 w-full" />
                </div>
                <p className="text-xs text-slate-500">{uploadProgress}% complete</p>
              </div>
            ) : (
              <>
                <Upload className="h-10 w-10 text-slate-500 mb-4" />
                <p className="text-sm text-slate-500 mb-2">Drag and drop files here or click to browse</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleUpload(e.target.files)}
                />
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  Browse Files
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
