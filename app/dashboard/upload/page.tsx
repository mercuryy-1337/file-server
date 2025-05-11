"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"
import { FileUploader } from "@/components/dashboard/file-uploader"
import { formatBytes } from "@/lib/utils"
import { Loader2, Upload } from "lucide-react"

const formSchema = z.object({
  name: z.string().min(1, {
    message: "File name is required.",
  }),
  description: z.string().optional(),
})

export default function UploadPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const abortControllerRef = useRef<AbortController | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  })

  const onFileSelect = (selectedFile: File | null) => {
    setFile(selectedFile)
    if (selectedFile) {
      form.setValue("name", selectedFile.name)
    }
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!file || !session?.user?.id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a file to upload.",
      })
      return
    }

    setUploading(true)
    setUploadProgress(0)
    abortControllerRef.current = new AbortController()

    try {
      // Create a FormData object to send the file
      const formData = new FormData()
      formData.append("file", file)
      formData.append("name", values.name)
      formData.append("description", values.description || "")

      // For files larger than 1GB, use chunked upload
      if (file.size > 1024 * 1024 * 1024) {
        await uploadLargeFile(file, values)
      } else {
        // Regular upload for smaller files
        const response = await fetch("/api/files/upload", {
          method: "POST",
          body: formData,
          signal: abortControllerRef.current.signal,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || "Failed to upload file")
        }

        const data = await response.json()

        toast({
          title: "Upload successful",
          description: "Your file has been uploaded.",
        })

        router.push(`/dashboard/files/${data.fileId}`)
      }
    } catch (error) {
      console.error("Upload error:", error)
      if (error instanceof Error && error.name !== "AbortError") {
        toast({
          variant: "destructive",
          title: "Upload failed",
          description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        })
      }
    } finally {
      setUploading(false)
      abortControllerRef.current = null
    }
  }

  const uploadLargeFile = async (file: File, values: z.infer<typeof formSchema>) => {
    const CHUNK_SIZE = 5 * 1024 * 1024 // 5MB chunks
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
    let uploadedChunks = 0

    // First, create the file record and get upload URLs
    const initResponse = await fetch("/api/files/init-chunked-upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: values.name,
        description: values.description || "",
        size: file.size,
        totalChunks,
      }),
      signal: abortControllerRef.current?.signal,
    })

    if (!initResponse.ok) {
      const error = await initResponse.json()
      throw new Error(error.message || "Failed to initialize upload")
    }

    const { uploadId, fileId } = await initResponse.json()

    // Upload each chunk
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * CHUNK_SIZE
      const end = Math.min(start + CHUNK_SIZE, file.size)
      const chunk = file.slice(start, end)

      const formData = new FormData()
      formData.append("chunk", chunk)
      formData.append("uploadId", uploadId)
      formData.append("chunkIndex", chunkIndex.toString())
      formData.append("totalChunks", totalChunks.toString())

      const chunkResponse = await fetch("/api/files/upload-chunk", {
        method: "POST",
        body: formData,
        signal: abortControllerRef.current?.signal,
      })

      if (!chunkResponse.ok) {
        const error = await chunkResponse.json()
        throw new Error(error.message || "Failed to upload chunk")
      }

      uploadedChunks++
      setUploadProgress((uploadedChunks / totalChunks) * 100)
    }

    // Complete the upload
    const completeResponse = await fetch("/api/files/complete-chunked-upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uploadId,
        fileId,
      }),
      signal: abortControllerRef.current?.signal,
    })

    if (!completeResponse.ok) {
      const error = await completeResponse.json()
      throw new Error(error.message || "Failed to complete upload")
    }

    toast({
      title: "Upload successful",
      description: "Your file has been uploaded.",
    })

    router.push(`/dashboard/files/${fileId}`)
  }

  const cancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setUploading(false)
      toast({
        title: "Upload cancelled",
        description: "Your file upload has been cancelled.",
      })
    }
  }

  return (
    <div className="container py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Upload File</h1>
        <p className="text-muted-foreground">Upload a new file to your storage</p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Upload File</CardTitle>
          <CardDescription>Select a file to upload to your storage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <FileUploader onFileSelect={onFileSelect} disabled={uploading} />

            {file && (
              <div className="p-4 border rounded-md bg-muted/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">{formatBytes(file.size)}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => onFileSelect(null)} disabled={uploading}>
                    Remove
                  </Button>
                </div>
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>File Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter file name" {...field} disabled={uploading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter a description for this file" {...field} disabled={uploading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {uploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading...</span>
                      <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1" disabled={!file || uploading}>
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload File
                      </>
                    )}
                  </Button>
                  {uploading && (
                    <Button type="button" variant="outline" onClick={cancelUpload}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
