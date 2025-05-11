"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import { Download, MoreVertical, Pencil, Share2, Trash } from "lucide-react"

interface FileActionsProps {
  file: {
    id: string
    name: string
  }
}

export function FileActions({ file }: FileActionsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/files/${file.id}/download`)

      if (!response.ok) {
        throw new Error("Failed to download file")
      }

      const data = await response.json()

      // Create a temporary anchor element to trigger download
      const a = document.createElement("a")
      a.href = data.url
      a.download = file.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      toast({
        title: "Download started",
        description: `Downloading ${file.name}`,
      })
    } catch (error) {
      console.error("Download error:", error)
      toast({
        variant: "destructive",
        title: "Download failed",
        description: "There was an error downloading the file.",
      })
    }
  }

  const handleShare = () => {
    router.push(`/dashboard/files/${file.id}/share`)
  }

  const handleRename = () => {
    router.push(`/dashboard/files/${file.id}/rename`)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/files/${file.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete file")
      }

      toast({
        title: "File deleted",
        description: `${file.name} has been deleted.`,
      })

      router.refresh()
    } catch (error) {
      console.error("Delete error:", error)
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: "There was an error deleting the file.",
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            <span>Download</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" />
            <span>Share</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleRename}>
            <Pencil className="mr-2 h-4 w-4" />
            <span>Rename</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/20"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash className="mr-2 h-4 w-4" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{file.name}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
