"use client"

import { useState } from "react"
import {
  File,
  Folder,
  ChevronUp,
  Plus,
  Trash2,
  Loader2,
  FileText,
  FileImage,
  FileVideo,
  FileJson,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import type { FileItem } from "@/types/file"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface FileExplorerProps {
  files: FileItem[]
  currentPath: string
  isLoading: boolean
  selectedFile: FileItem | null
  onFileSelect: (file: FileItem) => void
  onCreateFolder: (name: string) => void
  onDeleteItem: (item: FileItem) => void
  onNavigateUp: () => void
  setCurrentPath: (path: string) => void
  isAuthenticated: boolean
}

export function FileExplorer({
  files,
  currentPath,
  isLoading,
  selectedFile,
  onFileSelect,
  onCreateFolder,
  onDeleteItem,
  onNavigateUp,
  setCurrentPath,
  isAuthenticated,
}: FileExplorerProps) {
  const [newFolderName, setNewFolderName] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleCreateFolder = () => {
    onCreateFolder(newFolderName)
    setNewFolderName("")
    setIsDialogOpen(false)
  }

  const getFileIcon = (file: FileItem) => {
    if (file.type === "directory") {
      return <Folder className="h-5 w-5 text-yellow-500" />
    }

    const extension = file.extension?.toLowerCase()

    if ([".jpg", ".jpeg", ".png"].includes(extension || "")) {
      return <FileImage className="h-5 w-5 text-blue-500" />
    } else if ([".mp4", ".mov"].includes(extension || "")) {
      return <FileVideo className="h-5 w-5 text-purple-500" />
    } else if (extension === ".json") {
      return <FileJson className="h-5 w-5 text-green-500" />
    } else if ([".html", ".txt"].includes(extension || "")) {
      return <FileText className="h-5 w-5 text-orange-500" />
    }

    return <File className="h-5 w-5 text-slate-500" />
  }

  const formatFileSize = (size: number | null) => {
    if (size === null) return ""

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

  const pathParts = currentPath.split("/").filter(Boolean)

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div className="flex items-center space-x-2 overflow-x-auto whitespace-nowrap">
          <Button variant="ghost" size="sm" onClick={() => setCurrentPath("")} className="flex items-center">
            <Folder className="h-4 w-4 mr-1" />
            Root
          </Button>

          {pathParts.map((part, index) => (
            <div key={index} className="flex items-center">
              <span className="text-slate-400">/</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const newPath = pathParts.slice(0, index + 1).join("/")
                  setCurrentPath(newPath)
                }}
              >
                {part}
              </Button>
            </div>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={onNavigateUp} disabled={!currentPath}>
            <ChevronUp className="h-4 w-4" />
          </Button>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" disabled={!isAuthenticated}>
                        <Plus className="h-4 w-4 mr-1" />
                        New Folder
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Folder</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <Input
                          placeholder="Folder name"
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                        />
                        <Button onClick={handleCreateFolder}>Create</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </TooltipTrigger>
              {!isAuthenticated && (
                <TooltipContent>
                  <p>Sign in to create folders</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-500 dark:text-slate-400">
            <p>No files found</p>
          </div>
        ) : (
          <ul className="space-y-1">
            {files.map((file) => {
              const isSelected = selectedFile?.path === file.path
              return (
                <li
                  key={file.path}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-all",
                    isSelected
                      ? "bg-slate-200 dark:bg-slate-700 border-l-4 border-blue-500"
                      : "border-l-4 border-transparent",
                  )}
                  onClick={() => onFileSelect(file)}
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1 overflow-hidden">
                    <div className="relative">
                      {getFileIcon(file)}
                      {isSelected}
                    </div>
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{file.name}</span>
                  </div>
                  <div className="flex items-center space-x-3 flex-shrink-0 ml-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400 w-14 text-right">
                      {formatFileSize(file.size)}
                    </span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex-shrink-0"
                              disabled={!isAuthenticated}
                              onClick={(e) => {
                                e.stopPropagation()
                                if (isAuthenticated) {
                                  onDeleteItem(file)
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-slate-500 hover:text-red-500" />
                            </Button>
                          </div>
                        </TooltipTrigger>
                        {!isAuthenticated && (
                          <TooltipContent>
                            <p>Sign in to delete</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
