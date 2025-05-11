"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Loader2, Upload } from "lucide-react"
import Link from "next/link"

const formSchema = z.object({
  objectName: z.string().min(1, {
    message: "Object key is required.",
  }),
  name: z.string().min(1, {
    message: "File name is required.",
  }),
  description: z.string().optional(),
  size: z.string().min(1, {
    message: "File size is required.",
  }),
  path: z.string().default("/"),
})

export default function ImportPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      objectName: "",
      name: "",
      description: "",
      size: "0",
      path: "/",
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setSubmitting(true)
    try {
      const response = await fetch("/api/files/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          objectName: values.objectName,
          name: values.name,
          description: values.description,
          size: Number.parseInt(values.size),
          path: values.path,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to import file")
      }

      const data = await response.json()

      toast({
        title: "File imported",
        description: "The file has been imported successfully.",
      })

      router.push(`/dashboard/files/${data.fileId}`)
    } catch (error) {
      console.error("Import error:", error)
      toast({
        variant: "destructive",
        title: "Import failed",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Update name when objectName changes
  const handleObjectNameChange = (value: string) => {
    const filename = value.split("/").pop() || ""
    if (filename && !form.getValues("name")) {
      form.setValue("name", filename)
    }
  }

  return (
    <div className="container py-6">
      <div className="mb-6">
        <Link
          href="/dashboard/files"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to files
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Import Existing File</h1>
        <p className="text-muted-foreground">Import a file that already exists in your bucket</p>
      </div>

      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Import File</CardTitle>
          <CardDescription>Enter the details of the file you want to import</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="objectName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Object Key</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="path/to/your/file.jpg"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e)
                          handleObjectNameChange(e.target.value)
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>File Name</FormLabel>
                    <FormControl>
                      <Input placeholder="My File" {...field} />
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
              <FormField
                control={form.control}
                name="size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>File Size (bytes)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="path"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Path</FormLabel>
                    <FormControl>
                      <Input placeholder="/" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Import File
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
