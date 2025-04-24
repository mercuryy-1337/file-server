"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { isAuthenticated, getApiKey } from "@/lib/auth"
import { AuthDialog } from "@/components/auth-dialog"
import { Progress } from "@/components/ui/progress"
import { uploadFileInChunks } from "@/components/chunked-uploader"

interface UploadingFile {
  file: File
  progress: number
  status: "uploading" | "completed" | "error"
  error?: string
}

export function UploadButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
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

  const updateFileProgress = (fileIndex: number, progress: number) => {
    setUploadingFiles((prev) => prev.map((file, index) => (index === fileIndex ? { ...file, progress } : file)))
  }

  const updateFileStatus = (fileIndex: number, status: "uploading" | "completed" | "error", error?: string) => {
    setUploadingFiles((prev) => prev.map((file, index) => (index === fileIndex ? { ...file, status, error } : file)))
  }

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const auth = await isAuthenticated()
    if (!auth) {
      setIsAuthDialogOpen(true)
      return
    }

    // Get current path from URL or use root
    const urlParams = new URLSearchParams(window.location.search)
    const currentPath = urlParams.get("path") || "/"

    // Get API key
    const apiKey = getApiKey()

    // Add files to the uploading list
    const newFiles = Array.from(files).map((file) => ({
      file,
      progress: 0,
      status: "uploading" as const,
    }))

    setUploadingFiles((prev) => [...prev, ...newFiles])

    // Upload each file
    for (let i = 0; i < newFiles.length; i++) {
      const fileIndex = uploadingFiles.length + i
      const file = newFiles[i].file

      try {
        await uploadFileInChunks({
          file,
          path: currentPath,
          apiKey,
          onProgress: (progress) => {
            updateFileProgress(fileIndex, progress)
          },
          onComplete: () => {
            updateFileStatus(fileIndex, "completed")
            toast({
              title: "Upload Complete",
              description: `${file.name} uploaded successfully`,
            })
          },
          onError: (error) => {
            updateFileStatus(fileIndex, "error", error.message)
            toast({
              title: "Upload Failed",
              description: `Failed to upload ${file.name}: ${error.message}`,
              variant: "destructive",
            })
          },
        })
      } catch (error) {
        updateFileStatus(fileIndex, "error", error instanceof Error ? error.message : "Unknown error")
        toast({
          title: "Upload Failed",
          description: `Failed to upload ${file.name}`,
          variant: "destructive",
        })
      }
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

  const removeFile = (index: number) => {
    setUploadingFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const allUploadsComplete = uploadingFiles.every((file) => file.status !== "uploading")

  const handleClose = () => {
    if (allUploadsComplete) {
      setUploadingFiles([])
      setIsOpen(false)
      // Refresh the file list
      window.location.reload()
    } else {
      toast({
        title: "Uploads in Progress",
        description: "Please wait for uploads to complete before closing",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <Button onClick={handleButtonClick}>
        <Upload className="h-4 w-4 mr-2" />
        Upload
      </Button>

      <AuthDialog isOpen={isAuthDialogOpen} onClose={() => setIsAuthDialogOpen(false)} onSuccess={handleAuthSuccess} />

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Files</DialogTitle>
          </DialogHeader>

          {uploadingFiles.length > 0 ? (
            <div className="space-y-4 mt-4 max-h-80 overflow-y-auto">
              {uploadingFiles.map((file, index) => (
                <div key={index} className="border rounded-md p-3">
                  <div className="flex justify-between items-center mb-2">
                    <div className="truncate max-w-[200px]">{file.file.name}</div>
                    <div className="flex items-center">
                      <span className="text-xs text-slate-500 mr-2">
                        {file.status === "completed"
                          ? "Complete"
                          : file.status === "error"
                            ? "Error"
                            : `${Math.round(file.progress)}%`}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeFile(index)}
                        disabled={file.status === "uploading"}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Progress
                    value={file.status === "completed" ? 100 : file.progress}
                    className={file.status === "error" ? "bg-red-200" : ""}
                  />
                  {file.error && <p className="text-xs text-red-500 mt-1">{file.error}</p>}
                </div>
              ))}
            </div>
          ) : (
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
            </div>
          )}

          {uploadingFiles.length > 0 && (
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={handleClose} disabled={!allUploadsComplete}>
                {allUploadsComplete ? "Close" : "Uploading..."}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
