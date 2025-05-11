"use client"

import { useState, useEffect } from "react"
import { FileText } from "lucide-react"

interface FilePreviewProps {
  fileUrl: string
  fileName: string
  fileType: string
  fileExtension: string
}

export function FilePreview({ fileUrl, fileName, fileType, fileExtension }: FilePreviewProps) {
  const [content, setContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (fileType === "text" || fileType === "json") {
      fetchTextContent()
    } else {
      setLoading(false)
    }
  }, [fileUrl, fileType])

  const fetchTextContent = async () => {
    try {
      const response = await fetch(fileUrl)
      if (!response.ok) {
        throw new Error("Failed to fetch file content")
      }
      const text = await response.text()
      setContent(text)
    } catch (err) {
      console.error("Error fetching file content:", err)
      setError("Failed to load file content")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse">Loading preview...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  switch (fileType) {
    case "image":
      return (
        <div className="flex items-center justify-center bg-muted/30 p-4">
          <img src={fileUrl || "/placeholder.svg"} alt={fileName} className="max-w-full max-h-[500px] object-contain" />
        </div>
      )

    case "video":
      return (
        <div className="flex items-center justify-center bg-black p-0">
          <video src={fileUrl} controls className="max-w-full max-h-[500px]">
            Your browser does not support the video tag.
          </video>
        </div>
      )

    case "text":
      return (
        <div className="bg-muted/30 p-4 overflow-auto max-h-[500px]">
          <pre className="text-sm whitespace-pre-wrap">{content}</pre>
        </div>
      )

    case "json":
      return (
        <div className="bg-muted/30 p-4 overflow-auto max-h-[500px]">
          <pre className="text-sm whitespace-pre-wrap">{content && JSON.stringify(JSON.parse(content), null, 2)}</pre>
        </div>
      )

    default:
      return (
        <div className="flex flex-col items-center justify-center h-64 p-4">
          <div className="rounded-full bg-muted p-4 mb-4">
            <FileText className="h-12 w-12 text-muted-foreground" />
          </div>
          <p className="text-center text-muted-foreground">
            Preview not available for {fileExtension.toUpperCase()} files
          </p>
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 text-purple-600 hover:text-purple-700 font-medium"
          >
            Download to view
          </a>
        </div>
      )
  }
}
