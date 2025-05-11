"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Upload } from "lucide-react"

interface FileUploaderProps {
  onFileSelect: (file: File | null) => void
  disabled?: boolean
}

export function FileUploader({ onFileSelect, disabled = false }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (disabled) return

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      onFileSelect(file)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      onFileSelect(file)
    }
  }

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
        isDragging
          ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
          : "border-muted-foreground/25 hover:border-muted-foreground/50",
        disabled && "opacity-50 cursor-not-allowed",
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" disabled={disabled} />
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/30">
          <Upload className="h-6 w-6 text-purple-700 dark:text-purple-300" />
        </div>
        <div className="space-y-2">
          <p className="font-medium">
            Drag and drop your file here, or{" "}
            <Button
              type="button"
              variant="link"
              className="p-0 h-auto text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
              onClick={handleButtonClick}
              disabled={disabled}
            >
              browse
            </Button>
          </p>
          <p className="text-sm text-muted-foreground">
            Support for a single file upload. Large files will be uploaded in chunks.
          </p>
        </div>
      </div>
    </div>
  )
}
