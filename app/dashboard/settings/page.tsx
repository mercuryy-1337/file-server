"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, RefreshCw } from "lucide-react"

const bucketFormSchema = z.object({
  name: z.string().min(1, {
    message: "Name is required.",
  }),
  provider: z.string().min(1, {
    message: "Provider is required.",
  }),
  endpoint: z.string().optional(),
  region: z.string().optional(),
  accessKey: z.string().min(1, {
    message: "Access key is required.",
  }),
  secretKey: z.string().min(1, {
    message: "Secret key is required.",
  }),
  bucket: z.string().min(1, {
    message: "Bucket name is required.",
  }),
  isDefault: z.boolean().default(false).optional(),
})

export default function SettingsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [buckets, setBuckets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [scanning, setScanning] = useState(false)

  const form = useForm<z.infer<typeof bucketFormSchema>>({
    resolver: zodResolver(bucketFormSchema),
    defaultValues: {
      name: "",
      provider: "aws",
      endpoint: "",
      region: "",
      accessKey: "",
      secretKey: "",
      bucket: "",
      isDefault: false,
    },
  })

  useEffect(() => {
    fetchBuckets()
  }, [])

  const fetchBuckets = async () => {
    try {
      const response = await fetch("/api/buckets")
      if (!response.ok) {
        throw new Error("Failed to fetch buckets")
      }
      const data = await response.json()
      setBuckets(data.buckets)
    } catch (error) {
      console.error("Error fetching buckets:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load bucket settings.",
      })
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (values: z.infer<typeof bucketFormSchema>) => {
    setSubmitting(true)
    try {
      const response = await fetch("/api/buckets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to add bucket")
      }

      toast({
        title: "Bucket added",
        description: "Your bucket has been added successfully.",
      })

      form.reset()
      fetchBuckets()
    } catch (error) {
      console.error("Add bucket error:", error)
      toast({
        variant: "destructive",
        title: "Failed to add bucket",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteBucket = async (id: string) => {
    try {
      const response = await fetch(`/api/buckets/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to delete bucket")
      }

      toast({
        title: "Bucket deleted",
        description: "The bucket has been removed from your account.",
      })

      fetchBuckets()
    } catch (error) {
      console.error("Delete bucket error:", error)
      toast({
        variant: "destructive",
        title: "Failed to delete bucket",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
      })
    }
  }

  const handleSetDefaultBucket = async (id: string) => {
    try {
      const response = await fetch(`/api/buckets/${id}/default`, {
        method: "PUT",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to set default bucket")
      }

      toast({
        title: "Default bucket updated",
        description: "Your default bucket has been updated.",
      })

      fetchBuckets()
    } catch (error) {
      console.error("Set default bucket error:", error)
      toast({
        variant: "destructive",
        title: "Failed to update default bucket",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
      })
    }
  }

  const handleScanBucket = async (id: string) => {
    setScanning(true)
    try {
      const response = await fetch("/api/buckets/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bucketId: id }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to scan bucket")
      }

      const data = await response.json()

      toast({
        title: "Bucket scan completed",
        description: `Imported ${data.importedCount} files, skipped ${data.skippedCount} files.`,
      })
    } catch (error) {
      console.error("Scan bucket error:", error)
      toast({
        variant: "destructive",
        title: "Failed to scan bucket",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
      })
    } finally {
      setScanning(false)
    }
  }

  return (
    <div className="container py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <Tabs defaultValue="storage">
        <TabsList className="mb-6">
          <TabsTrigger value="storage">Storage</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        <TabsContent value="storage">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Storage Buckets</CardTitle>
                <CardDescription>Manage your S3-compatible storage buckets</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : buckets.length > 0 ? (
                  <div className="space-y-4">
                    {buckets.map((bucket) => (
                      <Card key={bucket.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium">{bucket.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {bucket.provider} • {bucket.bucket}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleScanBucket(bucket.id)}
                                disabled={scanning}
                              >
                                {scanning ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <RefreshCw className="mr-2 h-4 w-4" />
                                )}
                                Scan Bucket
                              </Button>
                              {bucket.isDefault ? (
                                <span className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 px-2 py-1 rounded-full">
                                  Default
                                </span>
                              ) : (
                                <Button variant="outline" size="sm" onClick={() => handleSetDefaultBucket(bucket.id)}>
                                  Set as Default
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                                onClick={() => handleDeleteBucket(bucket.id)}
                                disabled={bucket.isDefault}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">No storage buckets configured yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Add New Bucket</CardTitle>
                <CardDescription>Connect to an S3-compatible storage bucket</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bucket Name</FormLabel>
                          <FormControl>
                            <Input placeholder="My S3 Bucket" {...field} />
                          </FormControl>
                          <FormDescription>A friendly name to identify this bucket</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="provider"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Provider</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a provider" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="aws">Amazon S3</SelectItem>
                              <SelectItem value="minio">MinIO</SelectItem>
                              <SelectItem value="digitalocean">DigitalOcean Spaces</SelectItem>
                              <SelectItem value="backblaze">Backblaze B2</SelectItem>
                              <SelectItem value="other">Other S3-Compatible</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="endpoint"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Endpoint URL (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="https://s3.example.com" {...field} />
                            </FormControl>
                            <FormDescription>Required for non-AWS providers</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="region"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Region (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="us-east-1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="accessKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Access Key</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="secretKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Secret Key</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="bucket"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bucket Name</FormLabel>
                          <FormControl>
                            <Input placeholder="my-bucket" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="isDefault"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Set as Default</FormLabel>
                            <FormDescription>Use this bucket as the default storage location</FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        "Add Bucket"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Update your account information</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Account settings will be implemented in a future update.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>Customize the look and feel of the application</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Appearance settings will be implemented in a future update.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
