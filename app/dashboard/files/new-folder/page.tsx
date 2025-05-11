"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, FolderPlus, Loader2 } from "lucide-react"
import Link from "next/link"

const formSchema = z.object({
  name: z
    .string()
    .min(1, {
      message: "Folder name is required.",
    })
    .refine((name) => /^[a-zA-Z0-9_\-. ]+$/.test(name), {
      message: "Folder name can only contain letters, numbers, spaces, and the following characters: _ - .",
    }),
})

export default function NewFolderPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)

  const currentPath = searchParams.get("path") || "/"

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setSubmitting(true)
    try {
      const response = await fetch("/api/folders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: values.name,
          path: currentPath,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to create folder")
      }

      toast({
        title: "Folder created",
        description: `Folder "${values.name}" has been created.`,
      })

      // Redirect back to files page with the current path
      router.push(`/dashboard/files${currentPath === "/" ? "" : `?path=${currentPath}`}`)
    } catch (error) {
      console.error("Create folder error:", error)
      toast({
        variant: "destructive",
        title: "Failed to create folder",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container py-6">
      <div className="mb-6">
        <Link
          href={`/dashboard/files${currentPath === "/" ? "" : `?path=${currentPath}`}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to files
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Create New Folder</h1>
        <p className="text-muted-foreground">
          Create a new folder in {currentPath === "/" ? "root directory" : currentPath}
        </p>
      </div>

      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>New Folder</CardTitle>
          <CardDescription>Enter a name for your new folder</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Folder Name</FormLabel>
                    <FormControl>
                      <Input placeholder="My Folder" {...field} />
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
                      Creating...
                    </>
                  ) : (
                    <>
                      <FolderPlus className="mr-2 h-4 w-4" />
                      Create Folder
                    </>
                  )}
                </Button>
                <Link href={`/dashboard/files${currentPath === "/" ? "" : `?path=${currentPath}`}`}>
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
