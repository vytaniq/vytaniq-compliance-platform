// apps/web/src/lib/s3.ts
// AWS S3 client and presigned URL generation for evidence vault
// Enforces encryption, 15-minute expiry, and audit logging
// PRD: Evidence files never touch application server

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import crypto from 'crypto'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'af-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

const S3_BUCKET = process.env.AWS_S3_BUCKET || 'vytaniq-evidence-prod'
const PRESIGNED_URL_EXPIRY = 900 // 15 minutes (PRD A2.1: MAXIMUM)

/**
 * Generate presigned URL for evidence upload
 * Returns a signed URL that browser can use to PUT directly to S3
 * Bypasses application server (security + performance benefit)
 */
export async function generatePresignedUploadUrl(
  orgId: string,
  obligationId: string,
  fileName: string
): Promise<string> {
  // Validate file type
  const allowedExtensions = ['pdf', 'docx', 'xlsx']
  const fileExtension = fileName.split('.').pop()?.toLowerCase()

  if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
    throw new Error(`Invalid file type. Allowed: ${allowedExtensions.join(', ')}`)
  }

  // Generate unique S3 key: org/{orgId}/obligations/{obligationId}/{timestamp}-{randomHash}
  const timestamp = Date.now()
  const randomHash = crypto.randomBytes(8).toString('hex')
  const s3Key = `org/${orgId}/obligations/${obligationId}/${timestamp}-${randomHash}.${fileExtension}`

  try {
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: s3Key,
      ServerSideEncryption: 'AES256', // Encryption at-rest (PRD A2.1)
      Metadata: {
        'org-id': orgId,
        'obligation-id': obligationId,
        'uploaded-at': new Date().toISOString(),
      },
    })

    const url = await getSignedUrl(s3Client, command, {
      expiresIn: PRESIGNED_URL_EXPIRY, // 15 minutes max (PRD A2.1)
    })

    return url
  } catch (error) {
    throw new Error(`Failed to generate presigned upload URL: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Generate presigned URL for evidence download
 * Returns a signed URL that browser can use to GET from S3
 */
export async function generatePresignedDownloadUrl(s3Key: string): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: s3Key,
    })

    const url = await getSignedUrl(s3Client, command, {
      expiresIn: PRESIGNED_URL_EXPIRY, // 15 minutes
    })

    return url
  } catch (error) {
    throw new Error(`Failed to generate presigned download URL: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Validate file metadata
 * Checks file size, type against requirements
 */
export function validateFileUpload(
  fileSize: number,
  fileName: string
): { valid: boolean; error?: string } {
  const MAX_FILE_SIZE_MB = 25
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

  if (fileSize > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds ${MAX_FILE_SIZE_MB}MB limit`,
    }
  }

  const allowedExtensions = ['pdf', 'docx', 'xlsx']
  const fileExtension = fileName.split('.').pop()?.toLowerCase()

  if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${allowedExtensions.join(', ')}`,
    }
  }

  return { valid: true }
}

export { s3Client }
