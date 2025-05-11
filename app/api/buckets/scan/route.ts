import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { createS3Client } from "@/lib/s3"
import path from "path"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const { bucketId, forceImport = false } = await req.json()

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

    // Create S3 client directly with credentials
    const s3 = createS3Client({
      provider: bucketCredential.provider,
      endpoint: bucketCredential.endpoint || undefined,
      region: bucketCredential.region || undefined,
      accessKey: bucketCredential.accessKey,
      secretKey: bucketCredential.secretKey,
      bucket: bucketCredential.bucket,
    })
    
    // List all objects in the bucket
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
    const errors = []
    const debugInfo = []

    // Process each object
    for (const object of objects) {
      if (!object.Key) continue

      // Skip folders (objects ending with /)
      if (object.Key.endsWith("/")) {
        debugInfo.push(`Skipping folder: ${object.Key}`)
        continue
      }

      // Don't filter by userId prefix - import all files
      // Add debug info
      debugInfo.push(`Processing object: ${object.Key}, Size: ${object.Size}`)

      try {
        // Check if file already exists in database
        const existingFile = await prisma.file.findFirst({
          where: {
            userId,
            objectName: object.Key,
          },
        })

        if (existingFile && !forceImport) {
          skippedCount++
          debugInfo.push(`Skipped existing file: ${object.Key}`)
          continue
        }

        // Extract filename and extension
        const filename = path.basename(object.Key)
        const extension = path.extname(filename).substring(1)

        // Determine path - everything before the filename
        const filePath = object.Key.substring(0, object.Key.length - filename.length)
        const normalizedPath = filePath ? `/${filePath.replace(/\/$/, "")}` : "/"

        debugInfo.push(`Extracted: filename=${filename}, extension=${extension}, path=${normalizedPath}`)

        // Create or update file record in database
        if (existingFile && forceImport) {
          await prisma.file.update({
            where: {
              id: existingFile.id,
            },
            data: {
              name: filename,
              extension,
              size: BigInt(object.Size || 0),
              path: normalizedPath,
            },
          })
        } else {
          await prisma.file.create({
            data: {
              name: filename,
              extension,
              size: BigInt(object.Size || 0),
              objectName: object.Key,
              path: normalizedPath,
              userId,
            },
          })
        }

        importedCount++
        debugInfo.push(`Imported file: ${object.Key}`)
      } catch (error) {
        errors.push(`Error processing ${object.Key}: ${error}`)
        debugInfo.push(`Error with ${object.Key}: ${error}`)
      }
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
      errors: errors.length > 0 ? errors : undefined,
      debug: debugInfo,
    })
  } catch (error) {
    console.error("Bucket scan error:", error)
    return NextResponse.json({ message: "Internal server error", error: String(error) }, { status: 500 })
  }
}
