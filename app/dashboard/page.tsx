import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { formatBytes } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, FolderOpen, Share2, Upload } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard")
  }

  const userId = session.user.id

  // Get user stats
  const fileCount = await prisma.file.count({
    where: {
      userId,
      isFolder: false,
    },
  })

  const folderCount = await prisma.file.count({
    where: {
      userId,
      isFolder: true,
    },
  })

  const shareCount = await prisma.share.count({
    where: {
      userId,
    },
  })

  // Calculate total storage used
  const files = await prisma.file.findMany({
    where: {
      userId,
      isFolder: false,
    },
    select: {
      size: true,
    },
  })

  const totalStorage = files.reduce((acc, file) => acc + Number(file.size), 0)

  // Get recent files
  const recentFiles = await prisma.file.findMany({
    where: {
      userId,
      isFolder: false,
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: 5,
  })

  return (
    <div className="container py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {session.user.name}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fileCount}</div>
            <p className="text-xs text-muted-foreground">Files stored in your account</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Folders</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{folderCount}</div>
            <p className="text-xs text-muted-foreground">Folders created</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(totalStorage)}</div>
            <p className="text-xs text-muted-foreground">Total storage space used</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shared Files</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{shareCount}</div>
            <p className="text-xs text-muted-foreground">Files shared with others</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Files</h2>
          <Link href="/dashboard/files">
            <Button variant="outline" size="sm">
              View all files
            </Button>
          </Link>
        </div>

        {recentFiles.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentFiles.map((file) => (
              <Link key={file.id} href={`/dashboard/files/${file.id}`}>
                <Card className="file-card cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900/30">
                        <FileText className="h-5 w-5 text-purple-700 dark:text-purple-300" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="truncate-filename font-medium" title={file.name}>
                          {file.name}
                        </div>
                        <div className="text-xs text-muted-foreground">{formatBytes(Number(file.size))}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <CardDescription>No files uploaded yet</CardDescription>
              <Link href="/dashboard/upload" className="mt-4">
                <Button>Upload your first file</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
