"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Loader2, Trash } from "lucide-react"
import Link from "next/link"

export default function DeleteFilePage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [file, setFile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  const fileId = params.id as string

  useEffect(() => {
    fetchFile()
  }, [fileId])

  const fetchFile = async () => {
    try {
      const response = await fetch(`/api/files/${fileId}`)
      if (!response.ok) {
        throw new Error("Failed to fetch file")
      }
      const data = await response.json()
      setFile(data.file)
    } catch (error) {
      console.error("Error fetching file:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load file details.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete file")
      }

      toast({
        title: "File deleted",
        description: `${file.name} has been deleted.`,
      })

      router.push("/dashboard/files")
    } catch (error) {
      console.error("Delete error:", error)
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: "There was an error deleting the file.",
      })
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="container py-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (!file) {
    return (
      <div className="container py-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">File not found.</p>
          <Link href="/dashboard/files" className="mt-4 inline-block">
            <Button>Back to Files</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-6">
      <div className="mb-6">
        <Link
          href={`/dashboard/files/${fileId}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to file
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Delete File</h1>
        <p className="text-muted-foreground">Permanently delete this file</p>
      </div>

      <Card className="max-w-md mx-auto border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle className="text-red-600 dark:text-red-400">Delete File</CardTitle>
          <CardDescription>This action cannot be undone</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Are you sure you want to delete <strong>{file.name}</strong>? This file will be permanently removed and
            cannot be recovered.
          </p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Link href={`/dashboard/files/${fileId}`}>
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash className="mr-2 h-4 w-4" />
                Delete File
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
