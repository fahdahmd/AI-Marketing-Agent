import "server-only";
import type { StorageProvider } from "./storage-provider";
import { LocalStorageProvider } from "./local-provider";

let cached: StorageProvider | undefined;

export function getStorageProvider(): StorageProvider {
  if (cached) return cached;

  const provider = process.env.STORAGE_PROVIDER || "local";

  if (provider === "s3") {
    // Lazily required so the @aws-sdk dependency and its env validation
    // only run when S3 is actually selected.
    const { S3StorageProvider } = require("./s3-provider") as typeof import("./s3-provider");
    cached = new S3StorageProvider();
  } else {
    cached = new LocalStorageProvider();
  }

  return cached;
}

export * from "./storage-provider";
