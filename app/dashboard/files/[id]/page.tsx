import { getServerSession } from "next-auth/next"
import { notFound, redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { getS3Client } from "@/lib/s3"
import { formatBytes, formatTimeAgo, getFilePreviewType } from "@/lib/utils"
import { FilePreview } from "@/components/dashboard/file-preview"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileIcon } from "@/components/dashboard/file-icon"
import { ArrowLeft, Download, Pencil, Share2, Trash } from "lucide-react"
import Link from "next/link"

export default async function FilePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard/files")
  }

  const userId = session.user.id
  const fileId = params.id

  // Get file details
  const file = await prisma.file.findUnique({
    where: {
      id: fileId,
      userId,
    },
  })

  if (!file) {
    notFound()
  }

  // Get signed URL for file
  const s3 = await getS3Client(userId)
  const fileUrl = await s3.getFileUrl(file.objectName)

  // Determine preview type
  const previewType = getFilePreviewType(file.extension)

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <FileIcon type={file.extension} size="lg" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{file.name}</h1>
              <p className="text-muted-foreground">
                {formatBytes(Number(file.size))} • Uploaded {formatTimeAgo(file.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/api/files/${file.id}/download`} target="_blank">
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </Link>
            <Link href={`/dashboard/files/${file.id}/share`}>
              <Button variant="outline" size="sm">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </Link>
            <Link href={`/dashboard/files/${file.id}/rename`}>
              <Button variant="outline" size="sm">
                <Pencil className="mr-2 h-4 w-4" />
                Rename
              </Button>
            </Link>
            <Link href={`/dashboard/files/${file.id}/delete`}>
              <Button
                variant="outline"
                size="sm"
                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="overflow-hidden">
            <CardHeader className="bg-muted">
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <FilePreview
                fileUrl={fileUrl}
                fileName={file.name}
                fileType={previewType}
                fileExtension={file.extension}
              />
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle>File Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Name</h3>
                <p>{file.name}</p>
              </div>
              {file.description && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
                  <p>{file.description}</p>
                </div>
              )}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Type</h3>
                <p>{file.extension.toUpperCase()} file</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Size</h3>
                <p>{formatBytes(Number(file.size))}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Uploaded</h3>
                <p>{file.createdAt.toLocaleString()}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Last Modified</h3>
                <p>{file.updatedAt.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
