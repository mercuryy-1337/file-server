import { getServerSession } from "next-auth/next"
import Link from "next/link"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { formatBytes, formatTimeAgo } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FileActions } from "@/components/dashboard/file-actions"
import { FileIcon } from "@/components/dashboard/file-icon"
import { FolderPlus, Upload } from "lucide-react"
import { redirect } from "next/navigation"

export default async function FilesPage({
  searchParams,
}: {
  searchParams: { path?: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard/files")
  }

  const userId = session.user.id
  const currentPath = searchParams.path || "/"

  // Get folders at current path
  const folders = await prisma.file.findMany({
    where: {
      userId,
      isFolder: true,
      path: currentPath,
    },
    orderBy: {
      name: "asc",
    },
  })

  // Get files at current path
  const files = await prisma.file.findMany({
    where: {
      userId,
      isFolder: false,
      path: currentPath,
    },
    orderBy: {
      updatedAt: "desc",
    },
  })

  // Build breadcrumb paths
  const breadcrumbs = [{ name: "Home", path: "/" }]
  if (currentPath !== "/") {
    const pathParts = currentPath.split("/").filter(Boolean)
    let accPath = ""

    for (const part of pathParts) {
      accPath += `/${part}`
      breadcrumbs.push({
        name: part,
        path: accPath,
      })
    }
  }

  return (
    <div className="container py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Files</h1>
          <nav className="flex items-center gap-1 text-sm text-muted-foreground">
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.path} className="flex items-center">
                {index > 0 && <span className="mx-1">/</span>}
                <Link
                  href={`/dashboard/files${crumb.path === "/" ? "" : `?path=${crumb.path}`}`}
                  className={`hover:text-foreground ${
                    index === breadcrumbs.length - 1 ? "text-foreground font-medium" : ""
                  }`}
                >
                  {crumb.name}
                </Link>
              </div>
            ))}
          </nav>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/files/new-folder?path=${currentPath}`}>
            <Button variant="outline" size="sm">
              <FolderPlus className="mr-2 h-4 w-4" />
              New Folder
            </Button>
          </Link>
          <Link href="/dashboard/upload">
            <Button size="sm">
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </Button>
          </Link>
        </div>
      </div>

      {folders.length === 0 && files.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/30 mb-4">
              <FolderPlus className="h-8 w-8 text-purple-700 dark:text-purple-300" />
            </div>
            <h3 className="text-xl font-semibold mb-2">This folder is empty</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Upload files or create folders to organize your content
            </p>
            <div className="flex gap-2">
              <Link href={`/dashboard/files/new-folder?path=${currentPath}`}>
                <Button variant="outline">
                  <FolderPlus className="mr-2 h-4 w-4" />
                  New Folder
                </Button>
              </Link>
              <Link href="/dashboard/upload">
                <Button>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Files
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {folders.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Folders</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {folders.map((folder) => (
                  <Link
                    key={folder.id}
                    href={`/dashboard/files?path=${currentPath === "/" ? "" : currentPath}/${folder.name}`}
                  >
                    <Card className="file-card cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <FileIcon type="folder" />
                          <div className="flex-1 overflow-hidden">
                            <div className="truncate-filename font-medium" title={folder.name}>
                              {folder.name}
                            </div>
                            <div className="text-xs text-muted-foreground">{formatTimeAgo(folder.createdAt)}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {files.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Files</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {files.map((file) => (
                  <Card key={file.id} className="file-card group">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
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
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-muted-foreground">{formatBytes(Number(file.size))}</div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <FileActions file={file} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
