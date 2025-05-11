import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { Upload } from "@aws-sdk/lib-storage"
import prisma from "@/lib/prisma"

export type BucketCredentials = {
  provider: string
  endpoint?: string
  region?: string
  accessKey: string
  secretKey: string
  bucket: string
}

export async function getS3Client(userId: string) {
  const defaultCredentials = await prisma.bucketCredential.findFirst({
    where: {
      userId,
      isDefault: true,
    },
  })

  if (!defaultCredentials) {
    throw new Error("No default bucket credentials found")
  }

  return createS3Client({
    provider: defaultCredentials.provider,
    endpoint: defaultCredentials.endpoint || undefined,
    region: defaultCredentials.region || undefined,
    accessKey: defaultCredentials.accessKey,
    secretKey: defaultCredentials.secretKey,
    bucket: defaultCredentials.bucket,
  })
}

export function createS3Client(credentials: BucketCredentials) {
  const { provider, endpoint, region, accessKey, secretKey, bucket } = credentials

  const clientOptions: any = {
    region: region || "us-east-1",
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
  }

  // For non-AWS S3 compatible services like MinIO
  if (endpoint) {
    clientOptions.endpoint = endpoint
    clientOptions.forcePathStyle = true
  }

  const client = new S3Client(clientOptions)

  return {
    client,
    bucket,
    async uploadFile(key: string, file: Buffer | Blob | ReadableStream) {
      let body: any = file

      // Convert ReadableStream to Buffer if needed
      if (file instanceof ReadableStream) {
        const reader = file.getReader()
        const chunks: Uint8Array[] = []

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          chunks.push(value)
        }

        body = Buffer.concat(chunks)
      }

      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
      })

      return client.send(command)
    },

    async uploadLargeFile(key: string, file: Buffer | Blob | ReadableStream, onProgress?: (progress: number) => void) {
      let body: any = file

      // Convert ReadableStream to Buffer if needed
      if (file instanceof ReadableStream) {
        const reader = file.getReader()
        const chunks: Uint8Array[] = []

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          chunks.push(value)
        }

        body = Buffer.concat(chunks)
      }

      const upload = new Upload({
        client,
        params: {
          Bucket: bucket,
          Key: key,
          Body: body,
        },
      })

      if (onProgress) {
        upload.on("httpUploadProgress", (progress) => {
          if (progress.loaded && progress.total) {
            onProgress(progress.loaded / progress.total)
          }
        })
      }

      return upload.done()
    },

    async getFileUrl(key: string, expiresIn = 3600) {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      })

      return getSignedUrl(client, command, { expiresIn })
    },

    async deleteFile(key: string) {
      const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      })

      return client.send(command)
    },

    async listFiles(prefix = "") {
      const command = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        Delimiter: "/",
      })

      return client.send(command)
    },
  }
}
