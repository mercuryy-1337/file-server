"use client"

import { useState, useEffect } from "react"
import type { FileItem } from "@/types/file"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface FilePreviewProps {
  file: FileItem
}

export function FilePreview({ file }: FilePreviewProps) {
  const [content, setContent] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (!file) return

    setIsLoading(true)
    setContent(null)

    const fetchFileContent = async () => {
      try {
        // Get API key if available, but don't require it
        const apiKey = localStorage.getItem("fileServerApiKey")

        const headers: HeadersInit = {}
        if (apiKey) {
          headers["Authorization"] = `Bearer ${apiKey}`
        }

        const response = await fetch(`/api/browse${file.path}`, { headers })

        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.statusText}`)
        }

        // For text-based files, get the content as text
        if (
          file.mimeType?.startsWith("text/") ||
          file.extension === ".json" ||
          file.extension === ".txt" ||
          file.extension === ".html"
        ) {
          const text = await response.text()
          setContent(text)
        } else {
          // For binary files (images, videos), create a blob URL
          const blob = await response.blob()
          const url = URL.createObjectURL(blob)
          setContent(url)
        }
      } catch (error) {
        console.error("Error fetching file:", error)
        toast({
          title: "Error",
          description: "Failed to load file content",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchFileContent()

    // Cleanup function to revoke object URLs
    return () => {
      if (content && !content.startsWith("text")) {
        URL.revokeObjectURL(content)
      }
    }
  }, [file, toast])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (!content) {
    return <div className="flex items-center justify-center h-full text-slate-500">Unable to preview this file</div>
  }

  // Render based on file type
  const renderContent = () => {
    const extension = file.extension?.toLowerCase()

    // Image preview
    if ([".jpg", ".jpeg", ".png"].includes(extension || "")) {
      return (
        <div className="flex items-center justify-center h-full bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
          <img
            src={content || "/placeholder.svg"}
            alt={file.name}
            className="max-w-full max-h-[70vh] object-contain rounded shadow-sm"
          />
        </div>
      )
    }

    // Video preview
    if ([".mp4", ".mov"].includes(extension || "")) {
      return (
        <div className="flex items-center justify-center h-full bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
          <video src={content} controls className="max-w-full max-h-[70vh] rounded shadow-sm">
            Your browser does not support the video tag.
          </video>
        </div>
      )
    }

    // HTML preview
    if (extension === ".html") {
      return (
        <div className="h-full flex flex-col">
          <div className="bg-white border rounded-lg shadow-sm h-full overflow-auto">
            <iframe srcDoc={content} title={file.name} className="w-full h-full" sandbox="allow-scripts" />
          </div>
        </div>
      )
    }

    // JSON preview
    if (extension === ".json" || extension === ".txt" || file.mimeType?.startsWith("text/")) {
      const isJson = extension === ".json"
      let displayContent = content

      if (isJson) {
        try {
          displayContent = JSON.stringify(JSON.parse(content), null, 2)
        } catch (e) {
          // If parsing fails, just display the raw content
        }
      }

      return (
        <div className="h-full bg-slate-50 dark:bg-slate-900 rounded-lg">
          <pre className="p-4 overflow-auto h-full text-sm">
            <code>{displayContent}</code>
          </pre>
        </div>
      )
    }

    // Fallback
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        Preview not available for this file type
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{file.name}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {file.mimeType} • {formatFileSize(file.size)}
        </p>
      </div>
      <div className="flex-1 overflow-auto">{renderContent()}</div>
    </div>
  )
}

function formatFileSize(size: number | null) {
  if (size === null) return "Unknown size"

  if (size < 1024) {
    return `${size} B`
  } else if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  } else if (size < 1024 * 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  } else {
    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`
  }
}
