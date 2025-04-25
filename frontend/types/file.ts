export interface FileItem {
  name: string
  type: "file" | "directory"
  size: number | null
  mimeType: string | null
  extension: string | null
  path: string
}
