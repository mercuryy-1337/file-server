"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { FolderPlus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { isAuthenticated } from "@/lib/auth"
import { AuthDialog } from "@/components/auth-dialog"

export function CreateDirButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [dirName, setDirName] = useState("")
  const [authenticated, setAuthenticated] = useState(false)
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

  const handleCreateDir = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!dirName.trim()) {
      toast({
        title: "Error",
        description: "Directory name cannot be empty",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)

    try {
      // Get current path from URL or use root
      const urlParams = new URLSearchParams(window.location.search)
      const currentPath = urlParams.get("path") || "/"

      // Create the full path for the new directory
      const newDirPath = currentPath === "/" ? `/${dirName}` : `${currentPath}/${dirName}`

      // Get the API key from localStorage
      const apiKey = localStorage.getItem("file_server_auth_key")

      const response = await fetch(`/api/createDir${newDirPath}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to create directory")
      }

      toast({
        title: "Success",
        description: `Directory "${dirName}" created successfully`,
      })

      // Close dialog and refresh file list
      setIsOpen(false)
      setDirName("")
      window.location.reload()
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "Failed to create directory",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <>
      <Button variant="outline" onClick={handleButtonClick}>
        <FolderPlus className="h-4 w-4 mr-2" />
        New Folder
      </Button>

      <AuthDialog isOpen={isAuthDialogOpen} onClose={() => setIsAuthDialogOpen(false)} onSuccess={handleAuthSuccess} />

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateDir} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="dirName">Folder Name</Label>
              <Input
                id="dirName"
                value={dirName}
                onChange={(e) => setDirName(e.target.value)}
                placeholder="Enter folder name"
                disabled={isCreating}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Folder"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
