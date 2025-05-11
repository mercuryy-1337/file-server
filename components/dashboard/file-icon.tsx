import { FileText, ImageIcon, Video, FileAudio, FileCode, FileArchive, Folder } from "lucide-react"
import { getFileIcon } from "@/lib/utils"

interface FileIconProps {
  type: string
  size?: "sm" | "md" | "lg"
}

export function FileIcon({ type, size = "md" }: FileIconProps) {
  const iconSize = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  }

  const bgSize = {
    sm: "p-1",
    md: "p-2",
    lg: "p-3",
  }

  if (type === "folder") {
    return (
      <div className={`rounded-full bg-purple-100 ${bgSize[size]} dark:bg-purple-900/30`}>
        <Folder className={`${iconSize[size]} text-purple-700 dark:text-purple-300`} />
      </div>
    )
  }

  const fileType = getFileIcon(type)

  switch (fileType) {
    case "image":
      return (
        <div className={`rounded-full bg-green-100 ${bgSize[size]} dark:bg-green-900/30`}>
          <ImageIcon className={`${iconSize[size]} text-green-700 dark:text-green-300`} />
        </div>
      )
    case "video":
      return (
        <div className={`rounded-full bg-blue-100 ${bgSize[size]} dark:bg-blue-900/30`}>
          <Video className={`${iconSize[size]} text-blue-700 dark:text-blue-300`} />
        </div>
      )
    case "audio":
      return (
        <div className={`rounded-full bg-yellow-100 ${bgSize[size]} dark:bg-yellow-900/30`}>
          <FileAudio className={`${iconSize[size]} text-yellow-700 dark:text-yellow-300`} />
        </div>
      )
    case "code":
      return (
        <div className={`rounded-full bg-pink-100 ${bgSize[size]} dark:bg-pink-900/30`}>
          <FileCode className={`${iconSize[size]} text-pink-700 dark:text-pink-300`} />
        </div>
      )
    case "archive":
      return (
        <div className={`rounded-full bg-orange-100 ${bgSize[size]} dark:bg-orange-900/30`}>
          <FileArchive className={`${iconSize[size]} text-orange-700 dark:text-orange-300`} />
        </div>
      )
    default:
      return (
        <div className={`rounded-full bg-gray-100 ${bgSize[size]} dark:bg-gray-800`}>
          <FileText className={`${iconSize[size]} text-gray-700 dark:text-gray-300`} />
        </div>
      )
  }
}
