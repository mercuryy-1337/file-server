"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Copy, Loader2, Share2 } from "lucide-react"
import Link from "next/link"

const formSchema = z.object({
  expiresAt: z.string().optional(),
  hasExpiration: z.boolean().default(false),
})

export default function ShareFilePage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [file, setFile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)

  const fileId = params.id as string

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      expiresAt: "",
      hasExpiration: false,
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

      // Check if file already has a share
      if (data.file.shares && data.file.shares.length > 0) {
        const share = data.file.shares[0]
        const shareLink = `${window.location.origin}/share/${share.token}`
        setShareUrl(shareLink)

        if (share.expiresAt) {
          const expiresAt = new Date(share.expiresAt)
          form.setValue("hasExpiration", true)
          form.setValue("expiresAt", expiresAt.toISOString().split("T")[0])
        }
      }
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
      const expiresAt = values.hasExpiration && values.expiresAt ? new Date(values.expiresAt).toISOString() : null

      const response = await fetch(`/api/files/${fileId}/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          expiresAt,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to share file")
      }

      const data = await response.json()
      const shareLink = `${window.location.origin}/share/${data.token}`
      setShareUrl(shareLink)

      toast({
        title: "File shared",
        description: "Share link has been created.",
      })
    } catch (error) {
      console.error("Share file error:", error)
      toast({
        variant: "destructive",
        title: "Failed to share file",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const copyToClipboard = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl)
      toast({
        title: "Copied to clipboard",
        description: "Share link has been copied to your clipboard.",
      })
    }
  }

  const deleteShare = async () => {
    try {
      const response = await fetch(`/api/files/${fileId}/share`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to delete share")
      }

      setShareUrl(null)
      form.reset()

      toast({
        title: "Share deleted",
        description: "Share link has been removed.",
      })
    } catch (error) {
      console.error("Delete share error:", error)
      toast({
        variant: "destructive",
        title: "Failed to delete share",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
      })
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
        <h1 className="text-3xl font-bold tracking-tight">Share File</h1>
        <p className="text-muted-foreground">Create a shareable link for "{file.name}"</p>
      </div>

      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Share File</CardTitle>
          <CardDescription>Generate a link to share this file with others</CardDescription>
        </CardHeader>
        <CardContent>
          {shareUrl ? (
            <div className="space-y-4">
              <div className="p-4 border rounded-md bg-muted/50">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium truncate">{shareUrl}</p>
                  <Button variant="ghost" size="icon" onClick={copyToClipboard}>
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">Copy link</span>
                  </Button>
                </div>
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={deleteShare}>
                  Delete Share Link
                </Button>
                <Button onClick={copyToClipboard}>Copy Link</Button>
              </div>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="hasExpiration"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Set Expiration</FormLabel>
                        <FormDescription>Link will expire after the specified date</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                {form.watch("hasExpiration") && (
                  <FormField
                    control={form.control}
                    name="expiresAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expiration Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Share Link...
                    </>
                  ) : (
                    <>
                      <Share2 className="mr-2 h-4 w-4" />
                      Create Share Link
                    </>
                  )}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
