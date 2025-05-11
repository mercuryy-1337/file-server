import { notFound } from "next/navigation"
import prisma from "@/lib/prisma"
import { getS3Client } from "@/lib/s3"
import { formatBytes, getFilePreviewType } from "@/lib/utils"
import { FilePreview } from "@/components/dashboard/file-preview"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileIcon } from "@/components/dashboard/file-icon"
import { Download, FileText } from "lucide-react"
import Link from "next/link"

export default async function SharePage({ params }: { params: { token: string } }) {
  const token = params.token

  // Get share details
  const share = await prisma.share.findUnique({
    where: {
      token,
    },
    include: {
      files: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  })

  if (!share || share.files.length === 0) {
    notFound()
  }

  // Check if share has expired
  if (share.expiresAt && new Date() > new Date(share.expiresAt)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Link Expired</CardTitle>
            <CardDescription className="text-center">
              This shared link has expired and is no longer available.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <Link href="/">
              <Button>Go to Homepage</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const file = share.files[0]

  // Get signed URL for file
  const s3 = await getS3Client(share.userId)
  const fileUrl = await s3.getFileUrl(file.objectName)

  // Determine preview type
  const previewType = getFilePreviewType(file.extension)

  // Log activity
  await prisma.activityLog.create({
    data: {
      action: "share_view",
      details: `Shared file viewed: ${file.name}`,
      userId: share.userId,
    },
  })

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-purple-600" />
            <span className="text-xl font-bold">FluidFiles</span>
          </div>
          <Link href={`/api/share/${token}/download`} target="_blank">
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 container py-6">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <FileIcon type={file.extension} size="lg" />
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{file.name}</h1>
                <p className="text-muted-foreground">
                  {formatBytes(Number(file.size))} • Shared by {share.user.firstName} {share.user.lastName}
                </p>
              </div>
            </div>
          </div>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="bg-muted">
            <CardTitle>File Preview</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <FilePreview fileUrl={fileUrl} fileName={file.name} fileType={previewType} fileExtension={file.extension} />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
