"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Upload, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { isAuthenticated } from "@/lib/auth"
import { AuthDialog } from "@/components/auth-dialog"

export function UploadButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
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

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setIsUploading(true)

    try {
      const formData = new FormData()

      // Get current path from URL or use root
      const urlParams = new URLSearchParams(window.location.search)
      const currentPath = urlParams.get("path") || "/"
      formData.append("path", currentPath)

      // Append all files
      Array.from(files).forEach((file) => {
        formData.append("files", file)
      })

      // Get the API key from localStorage
      const apiKey = localStorage.getItem("file_server_auth_key")

      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
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
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-slate-500 mx-auto mb-4" />
                <p className="text-sm text-slate-500">Uploading files...</p>
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
