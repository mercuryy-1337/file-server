import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNow } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
}

export function getFileIcon(extension: string) {
  const imageExtensions = ["jpg", "jpeg", "png", "gif", "svg", "webp"]
  const videoExtensions = ["mp4", "webm", "avi", "mov", "wmv"]
  const audioExtensions = ["mp3", "wav", "ogg", "flac"]
  const documentExtensions = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx"]
  const codeExtensions = ["js", "ts", "jsx", "tsx", "html", "css", "json", "xml"]
  const archiveExtensions = ["zip", "rar", "7z", "tar", "gz"]

  if (imageExtensions.includes(extension.toLowerCase())) {
    return "image"
  } else if (videoExtensions.includes(extension.toLowerCase())) {
    return "video"
  } else if (audioExtensions.includes(extension.toLowerCase())) {
    return "audio"
  } else if (documentExtensions.includes(extension.toLowerCase())) {
    return "document"
  } else if (codeExtensions.includes(extension.toLowerCase())) {
    return "code"
  } else if (archiveExtensions.includes(extension.toLowerCase())) {
    return "archive"
  } else {
    return "file"
  }
}

export function getFilePreviewType(extension: string) {
  const imageExtensions = ["jpg", "jpeg", "png", "gif", "svg", "webp"]
  const videoExtensions = ["mp4", "webm", "avi", "mov", "wmv"]
  const textExtensions = ["txt", "md", "csv"]
  const jsonExtensions = ["json"]

  if (imageExtensions.includes(extension.toLowerCase())) {
    return "image"
  } else if (videoExtensions.includes(extension.toLowerCase())) {
    return "video"
  } else if (textExtensions.includes(extension.toLowerCase())) {
    return "text"
  } else if (jsonExtensions.includes(extension.toLowerCase())) {
    return "json"
  } else {
    return "none"
  }
}

export function formatTimeAgo(date: Date) {
  return formatDistanceToNow(date, { addSuffix: true })
}

export function validateEmail(email: string) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export function generateObjectName(userId: string, fileName: string, path = "/") {
  const timestamp = Date.now()
  const sanitizedPath = path.startsWith("/") ? path.slice(1) : path
  const fullPath = sanitizedPath ? `${sanitizedPath}/` : ""
  return `${userId}/${fullPath}${timestamp}-${fileName}`
}

export function extractFilenameFromObjectName(objectName: string) {
  const parts = objectName.split("/")
  return parts[parts.length - 1]
}

export function extractPathFromObjectName(objectName: string) {
  const parts = objectName.split("/")
  // Remove user ID and filename
  parts.shift()
  parts.pop()
  return parts.length > 0 ? `/${parts.join("/")}` : "/"
}
