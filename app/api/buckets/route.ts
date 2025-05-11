import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { createS3Client } from "@/lib/s3"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // Get all buckets for the user
    const buckets = await prisma.bucketCredential.findMany({
      where: {
        userId,
      },
      orderBy: {
        isDefault: "desc",
      },
    })

    return NextResponse.json({
      buckets: buckets.map((bucket) => ({
        id: bucket.id,
        name: bucket.name,
        provider: bucket.provider,
        endpoint: bucket.endpoint,
        region: bucket.region,
        bucket: bucket.bucket,
        isDefault: bucket.isDefault,
      })),
    })
  } catch (error) {
    console.error("Get buckets error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const { name, provider, endpoint, region, accessKey, secretKey, bucket, isDefault } = await req.json()

    // Validate inputs
    if (!name || !provider || !accessKey || !secretKey || !bucket) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    // Test connection to the bucket
    try {
      const s3 = createS3Client({
        provider,
        endpoint,
        region,
        accessKey,
        secretKey,
        bucket,
      })

      // Try to list objects to verify credentials
      await s3.listFiles()
    } catch (error) {
      console.error("S3 connection test error:", error)
      return NextResponse.json(
        { message: "Failed to connect to the bucket. Please check your credentials." },
        { status: 400 },
      )
    }

    // If setting as default, unset any existing default
    if (isDefault) {
      await prisma.bucketCredential.updateMany({
        where: {
          userId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      })
    }

    // Create bucket credential
    const bucketCredential = await prisma.bucketCredential.create({
      data: {
        name,
        provider,
        endpoint,
        region,
        accessKey,
        secretKey,
        bucket,
        isDefault,
        userId,
      },
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "bucket_add",
        details: `Added bucket: ${name}`,
        userId,
      },
    })

    return NextResponse.json({
      message: "Bucket added successfully",
      bucketId: bucketCredential.id,
    })
  } catch (error) {
    console.error("Add bucket error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
