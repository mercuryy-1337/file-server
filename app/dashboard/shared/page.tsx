"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileIcon } from "@/components/dashboard/file-icon"
import { Share2, Loader2 } from "lucide-react"
import { formatTimeAgo } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

export default function SharedPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [shares, setShares] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.id) {
      fetchShares()
    }
  }, [session])

  const fetchShares = async () => {
    try {
      const response = await fetch("/api/shares")
      if (!response.ok) {
        throw new Error("Failed to fetch shares")
      }
      const data = await response.json()
      setShares(data.shares)
    } catch (error) {
      console.error("Error fetching shares:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load shared files.",
      })
    } finally {
      setLoading(false)
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

  return (
    <div className="container py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Shared Files</h1>
        <p className="text-muted-foreground">Manage your shared files</p>
      </div>

      {shares.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/30 mb-4">
              <Share2 className="h-8 w-8 text-purple-700 dark:text-purple-300" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No shared files</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">You haven't shared any files yet</p>
            <Link href="/dashboard/files">
              <Button>Go to Files</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {shares.map((share) => {
            const file = share.files[0] // Assuming one file per share for simplicity
            if (!file) return null

            const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || ""}/share/${share.token}`
            const isExpired = share.expiresAt && new Date() > new Date(share.expiresAt)

            return (
              <Card key={share.id} className="overflow-hidden">
                <CardHeader className="bg-muted">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Shared Link</CardTitle>
                    {isExpired ? (
                      <span className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 px-2 py-1 rounded-full">
                        Expired
                      </span>
                    ) : share.expiresAt ? (
                      <span className="text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 px-2 py-1 rounded-full">
                        Expires {formatTimeAgo(share.expiresAt)}
                      </span>
                    ) : (
                      <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 px-2 py-1 rounded-full">
                        Never expires
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <FileIcon type={file.extension} />
                    <div className="flex-1 overflow-hidden">
                      <Link href={`/dashboard/files/${file.id}`}>
                        <div
                          className="truncate-filename font-medium hover:text-purple-600 transition-colors"
                          title={file.name}
                        >
                          {file.name}
                        </div>
                      </Link>
                      <div className="text-xs text-muted-foreground">Shared {formatTimeAgo(share.createdAt)}</div>
                    </div>
                  </div>

                  <div className="p-3 bg-muted/50 rounded-md flex items-center justify-between">
                    <div className="text-sm truncate max-w-[70%]" title={shareUrl}>
                      {shareUrl}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(shareUrl)
                        }}
                      >
                        Copy Link
                      </Button>
                      <Link href={`/dashboard/files/${file.id}/share`}>
                        <Button size="sm">Manage</Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
