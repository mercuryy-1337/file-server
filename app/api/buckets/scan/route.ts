import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { getS3Client } from "@/lib/s3"
import { extractFilenameFromObjectName, extractPathFromObjectName } from "@/lib/utils"
import path from "path"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const { bucketId } = await req.json()

    // Get bucket credentials
    const bucketCredential = bucketId
      ? await prisma.bucketCredential.findUnique({
          where: {
            id: bucketId,
            userId,
          },
        })
      : await prisma.bucketCredential.findFirst({
          where: {
            userId,
            isDefault: true,
          },
        })

    if (!bucketCredential) {
      return NextResponse.json({ message: "Bucket not found" }, { status: 404 })
    }

    // Create S3 client
    const s3 = await getS3Client(userId)

    // List all objects in the bucket
    const { ListObjectsV2Command } = await import("@aws-sdk/client-s3")
    const listResult = await s3.client.send(
      new ListObjectsV2Command({
        Bucket: s3.bucket,
      })
    )

    const objects = listResult.Contents || []
    let importedCount = 0
    let skippedCount = 0

    // Process each object
    for (const object of objects) {
      if (!object.Key) continue

      // Skip folders (objects ending with /)
      if (object.Key.endsWith("/")) continue

      // Skip objects that don't belong to this user
      if (!object.Key.startsWith(userId)) continue

      // Check if file already exists in database
      const existingFile = await prisma.file.findFirst({
        where: {
          userId,
          objectName: object.Key,
        },
      })

      if (existingFile) {
        skippedCount++
        continue
      }

      // Extract filename and path
      const filename = extractFilenameFromObjectName(object.Key)
      const filePath = extractPathFromObjectName(object.Key)
      const extension = path.extname(filename).substring(1)

      // Create file record in database
      await prisma.file.create({
        data: {
          name: filename,
          extension,
          size: BigInt(object.Size || 0),
          objectName: object.Key,
          path: filePath,
          userId,
        },
      })

      importedCount++
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "bucket_scan",
        details: `Scanned bucket: ${bucketCredential.name}. Imported ${importedCount} files, skipped ${skippedCount} files.`,
        userId,
      },
    })

    return NextResponse.json({
      message: "Bucket scan completed",
      importedCount,
      skippedCount,
    })
  } catch (error) {
    console.error("Bucket scan error:", error)
    return NextResponse.json({ message: "Internal server error", error: String(error) }, { status: 500 })
  }
}
