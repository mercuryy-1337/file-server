"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Loader2, Pencil } from "lucide-react"
import Link from "next/link"

const formSchema = z.object({
  name: z.string().min(1, {
    message: "Name is required.",
  }),
  description: z.string().optional(),
})

export default function RenameFilePage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [file, setFile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const fileId = params.id as string

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  })

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

      form.setValue("name", data.file.name)
      form.setValue("description", data.file.description || "")
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

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setSubmitting(true)
    try {
      const response = await fetch(`/api/files/${fileId}/rename`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: values.name,
          description: values.description,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to rename file")
      }

      toast({
        title: "File updated",
        description: "File name and description have been updated.",
      })

      router.push(`/dashboard/files/${fileId}`)
    } catch (error) {
      console.error("Rename file error:", error)
      toast({
        variant: "destructive",
        title: "Failed to update file",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
      })
    } finally {
      setSubmitting(false)
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
        <h1 className="text-3xl font-bold tracking-tight">Rename File</h1>
        <p className="text-muted-foreground">Update the name and description for this file</p>
      </div>

      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Edit File Details</CardTitle>
          <CardDescription>Update the name and description for "{file.name}"</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>File Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                      <Textarea placeholder="Enter a description for this file" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Pencil className="mr-2 h-4 w-4" />
                      Update File
                    </>
                  )}
                </Button>
                <Link href={`/dashboard/files/${fileId}`}>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
