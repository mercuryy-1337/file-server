import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="container py-6">
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <p className="text-sm text-muted-foreground">Loading upload page...</p>
        </div>
      </div>
    </div>
  )
}
