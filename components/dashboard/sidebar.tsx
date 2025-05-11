"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { FileText, FolderOpen, Home, LogOut, Settings, Share2, Upload } from "lucide-react"
import { signOut } from "next-auth/react"

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className={cn("pb-12", className)}>
      <div className="space-y-4 py-4">
        <div className="px-4 py-2">
          <Link href="/dashboard" className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-purple-600" />
            <h2 className="text-lg font-semibold tracking-tight">FluidFiles</h2>
          </Link>
        </div>
        <div className="px-4">
          <h2 className="mb-2 text-xs font-semibold tracking-tight text-muted-foreground">Navigation</h2>
          <div className="space-y-1">
            <Link href="/dashboard">
              <Button
                variant={pathname === "/dashboard" ? "secondary" : "ghost"}
                size="sm"
                className="w-full justify-start"
              >
                <Home className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <Link href="/dashboard/files">
              <Button
                variant={pathname.startsWith("/dashboard/files") ? "secondary" : "ghost"}
                size="sm"
                className="w-full justify-start"
              >
                <FolderOpen className="mr-2 h-4 w-4" />
                My Files
              </Button>
            </Link>
            <Link href="/dashboard/upload">
              <Button
                variant={pathname === "/dashboard/upload" ? "secondary" : "ghost"}
                size="sm"
                className="w-full justify-start"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </Button>
            </Link>
            <Link href="/dashboard/shared">
              <Button
                variant={pathname === "/dashboard/shared" ? "secondary" : "ghost"}
                size="sm"
                className="w-full justify-start"
              >
                <Share2 className="mr-2 h-4 w-4" />
                Shared
              </Button>
            </Link>
          </div>
        </div>
        <div className="px-4">
          <h2 className="mb-2 text-xs font-semibold tracking-tight text-muted-foreground">Settings</h2>
          <div className="space-y-1">
            <Link href="/dashboard/settings">
              <Button
                variant={pathname === "/dashboard/settings" ? "secondary" : "ghost"}
                size="sm"
                className="w-full justify-start"
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
