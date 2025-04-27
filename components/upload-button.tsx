"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Upload, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { isAuthenticated } from "@/lib/auth"
import { AuthDialog } from "@/components/auth-dialog"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Size constants
const CHUNK_SIZE = 5 * 1024 * 1024 // 5MB chunks
const LARGE_FILE_THRESHOLD = 500 * 1024 * 1024 // 500MB

export function UploadButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [currentFile, setCurrentFile] = useState("")
  const [uploadStatus, setUploadStatus] = useState("")
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

  // Function to upload a file in chunks
  const uploadFileInChunks = async (file: File, path: string): Promise<any> => {
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
    const fileId = Date.now().toString() // Simple unique ID for this upload
    const apiKey = localStorage.getItem("file_server_auth_key")

    setUploadStatus(`Preparing to upload in ${totalChunks} chunks`)

    // Upload each chunk
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * CHUNK_SIZE
      const end = Math.min(file.size, start + CHUNK_SIZE)
      const chunk = file.slice(start, end)

      setUploadStatus(`Uploading chunk ${chunkIndex + 1} of ${totalChunks}`)

      // Create form data for this chunk
      const formData = new FormData()
      formData.append("fileId", fileId)
      formData.append("fileName", file.name)
      formData.append("chunkIndex", chunkIndex.toString())
      formData.append("totalChunks", totalChunks.toString())
      formData.append("path", path)
      formData.append("chunk", chunk)

      try {
        const response = await fetch("/api/upload-chunk", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`Chunk upload failed with status ${response.status}`)
        }

        // Update progress
        const percentComplete = Math.round(((chunkIndex + 1) / totalChunks) * 100)
        setUploadProgress(percentComplete)
      } catch (error) {
        console.error(`Error uploading chunk ${chunkIndex}:`, error)
        throw error
      }
    }

    // All chunks uploaded, now tell the server to combine them
    setUploadStatus("Finalizing upload...")

    const finalizeResponse = await fetch("/api/finalize-upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        fileId,
        fileName: file.name,
        totalChunks,
        path,
      }),
    })

    if (!finalizeResponse.ok) {
      throw new Error("Failed to finalize upload")
    }

    return finalizeResponse.json()
  }

  const uploadFile = async (file: File, path: string): Promise<any> => {
    setCurrentFile(file.name)

    // Get the API key from localStorage
    const apiKey = localStorage.getItem("file_server_auth_key")

    // For large files, use chunked upload
    if (file.size > LARGE_FILE_THRESHOLD) {
      return uploadFileInChunks(file, path)
    }

    // For smaller files, use the original method
    const formData = new FormData()
    formData.append("path", path)
    formData.append("files", file)

    // Track upload progress for smaller files too
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()

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

      xhr.open("POST", "/api/upload", true)
      xhr.setRequestHeader("Authorization", `Bearer ${apiKey}`)
      xhr.send(formData)
    })
  }

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setIsUploading(true)
    setUploadProgress(0)
    setUploadStatus("")

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
        description: error instanceof Error ? error.message : "There was an error uploading your files",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      setCurrentFile("")
      setUploadProgress(0)
      setUploadStatus("")
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
                {uploadStatus && <p className="text-xs text-slate-500 mb-2">{uploadStatus}</p>}
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
                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Large File Support</AlertTitle>
                  <AlertDescription>
                    Files larger than 500MB will be uploaded in chunks to prevent timeouts.
                  </AlertDescription>
                </Alert>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
