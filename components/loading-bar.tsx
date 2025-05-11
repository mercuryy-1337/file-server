"use client"

import { useEffect, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"

export function LoadingBar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [prevPathname, setPrevPathname] = useState("")

  useEffect(() => {
    let interval: NodeJS.Timeout

    // When pathname changes, start loading
    if (pathname !== prevPathname) {
      setLoading(true)
      setProgress(0)

      // Simulate progress
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval)
            return prev
          }
          return prev + 10
        })
      }, 100)

      // Complete loading after a short delay
      setTimeout(() => {
        setProgress(100)
        setTimeout(() => {
          setLoading(false)
          setProgress(0)
        }, 200)
      }, 500)

      setPrevPathname(pathname)
    }

    return () => clearInterval(interval)
  }, [pathname, searchParams, prevPathname])

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 h-1 bg-purple-600 z-50 transition-all duration-300",
        loading ? "opacity-100" : "opacity-0",
      )}
      style={{ width: `${progress}%` }}
    />
  )
}
