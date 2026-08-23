import "server-only";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import type { StorageProvider, UploadInput, UploadResult } from "./storage-provider";

/**
 * Development-only storage provider. Writes to public/uploads so files are
 * served by Next.js's static file handling without a dedicated route.
 * Not suitable for serverless/production deployments — use S3Provider there.
 */
export class LocalStorageProvider implements StorageProvider {
  readonly name = "local";

  private uploadsRoot = path.join(process.cwd(), "public", "uploads");

  async upload({ buffer, filename, folder }: UploadInput): Promise<UploadResult> {
    const dir = path.join(this.uploadsRoot, folder);
    await mkdir(dir, { recursive: true });

    const ext = path.extname(filename) || "";
    const key = `${folder}/${randomUUID()}${ext}`;
    const filePath = path.join(this.uploadsRoot, key);

    await writeFile(filePath, buffer);

    return { url: `/uploads/${key}`, key };
  }

  async delete(key: string): Promise<void> {
    try {
      await unlink(path.join(this.uploadsRoot, key));
    } catch {
      // best-effort delete; missing file is not an error for callers
    }
  }
}
