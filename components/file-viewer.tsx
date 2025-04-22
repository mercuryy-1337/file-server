"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Loader2 } from "lucide-react"

interface FileItem {
  name: string
  type: "file" | "directory"
  size?: number
  mimeType?: string
  extension?: string
  path: string
}

export function FileViewer({ file }: { file: FileItem }) {
  const [content, setContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (file.type === "file") {
      const extension = file.extension?.toLowerCase()

      if (extension === ".txt" || extension === ".html" || extension === ".json") {
        fetchTextContent()
      } else {
        setContent(null)
      }
    }
  }, [file])

  const fetchTextContent = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/files/public${file.path}`)
      if (!response.ok) throw new Error("Failed to fetch file content")

      const text = await response.text()
      setContent(text)
    } catch (error) {
      setError("Failed to load file content")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const renderFileContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
        </div>
      )
    }

    if (error) {
      return <div className="text-center py-12 text-red-500">{error}</div>
    }

    const extension = file.extension?.toLowerCase()

    // Image files
    if (extension === ".jpg" || extension === ".jpeg" || extension === ".png") {
      return (
        <div className="relative h-64 w-full">
          <Image src={`/api/files/public${file.path}`} alt={file.name} fill className="object-contain" />
        </div>
      )
    }

    // Video files
    if (extension === ".mp4" || extension === ".mov") {
      return (
        <video controls className="w-full h-auto max-h-64">
          <source src={`/api/files/public${file.path}`} type={file.mimeType || `video/${extension.substring(1)}`} />
          Your browser does not support the video tag.
        </video>
      )
    }

    // Text files
    if (extension === ".txt") {
      return (
        <pre className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md overflow-auto max-h-64 text-sm">{content}</pre>
      )
    }

    // HTML files
    if (extension === ".html") {
      return (
        <div className="max-h-64 overflow-auto">
          <iframe
            srcDoc={content || ""}
            className="w-full h-64 border-0"
            sandbox="allow-same-origin"
            title={file.name}
          />
        </div>
      )
    }

    // JSON files
    if (extension === ".json") {
      try {
        const formattedJson = content ? JSON.stringify(JSON.parse(content), null, 2) : ""
        return (
          <pre className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md overflow-auto max-h-64 text-sm">
            {formattedJson}
          </pre>
        )
      } catch (e) {
        return (
          <pre className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md overflow-auto max-h-64 text-sm">{content}</pre>
        )
      }
    }

    // Unsupported file type
    return <div className="text-center py-12 text-slate-500">Preview not available for this file type</div>
  }

  return <div className="h-full">{renderFileContent()}</div>
}
