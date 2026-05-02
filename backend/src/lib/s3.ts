import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.REGION || 'ap-southeast-2',
  // AWS SDK v3 (>=3.729) injects a CRC32 checksum into presigned URLs by default,
  // which breaks browser PUT uploads (checksum placeholder vs. real content mismatch).
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
  ...(process.env.ACCESS_KEY_AWS && process.env.SECRET_KEY_AWS
    ? {
        credentials: {
          accessKeyId: process.env.ACCESS_KEY_AWS,
          secretAccessKey: process.env.SECRET_KEY_AWS,
        },
      }
    : {}),
});

export async function getPresignedUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
  });

  // URL expires in 1 hour (3600 seconds)
  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  return url;
}

export async function getPresignedUploadUrl(key: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  return url;
}

export async function deleteS3Object(key: string): Promise<void> {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
    })
  );
}

export async function copyS3Object(sourceKey: string, destKey: string): Promise<void> {
  const bucket = process.env.S3_BUCKET_NAME;
  await s3Client.send(
    new CopyObjectCommand({
      Bucket: bucket,
      CopySource: `${bucket}/${encodeURIComponent(sourceKey)}`,
      Key: destKey,
    })
  );
}

export { s3Client };
