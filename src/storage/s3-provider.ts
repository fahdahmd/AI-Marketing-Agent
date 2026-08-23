import "server-only";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import path from "path";
import type { StorageProvider, UploadInput, UploadResult } from "./storage-provider";

export class S3StorageProvider implements StorageProvider {
  readonly name = "s3";

  private client: S3Client;
  private bucket: string;
  private publicUrlBase: string;

  constructor() {
    const endpoint = process.env.S3_ENDPOINT;
    const region = process.env.S3_REGION || "auto";
    const accessKeyId = process.env.S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
    this.bucket = process.env.S3_BUCKET || "";

    if (!endpoint || !accessKeyId || !secretAccessKey || !this.bucket) {
      throw new Error("S3 storage is not fully configured. Set S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET.");
    }

    this.client = new S3Client({
      region,
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    });

    this.publicUrlBase = process.env.S3_PUBLIC_URL || `${endpoint}/${this.bucket}`;
  }

  async upload({ buffer, filename, contentType, folder }: UploadInput): Promise<UploadResult> {
    const ext = path.extname(filename) || "";
    const key = `${folder}/${randomUUID()}${ext}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );

    return { url: `${this.publicUrlBase}/${key}`, key };
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}
