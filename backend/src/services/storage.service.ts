import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { env } from "../config/env";
import { AppError } from "../utils/errors";

export interface StoredObjectRef {
  storageKey: string;
  publicOrInternalUrl: string;
}

export interface StorageProvider {
  saveResume(userId: string, filename: string, buffer: Buffer, mimeType: string): Promise<StoredObjectRef>;
  readResumeBuffer(storageKey: string): Promise<Buffer>;
  deleteResume(storageKey: string): Promise<void>;
}

class LocalDiskStorageProvider implements StorageProvider {
  private readonly baseDir = path.resolve(process.cwd(), env.STORAGE_DIR, "resumes");

  async saveResume(
    userId: string,
    filename: string,
    buffer: Buffer,
    _mimeType: string
  ): Promise<StoredObjectRef> {
    const safeExt = path.extname(filename).toLowerCase() === ".docx" ? ".docx" : ".pdf";
    const userDir = path.join(this.baseDir, userId);
    await fs.mkdir(userDir, { recursive: true });

    const objectName = `${crypto.randomUUID()}${safeExt}`;
    const storageKey = path.posix.join("local", userId, objectName);
    const fullPath = path.join(userDir, objectName);

    await fs.writeFile(fullPath, buffer);
    return {
      storageKey,
      publicOrInternalUrl: storageKey,
    };
  }

  async readResumeBuffer(storageKey: string): Promise<Buffer> {
    const normalized = storageKey.replace(/^local\//, "");
    const resolved = path.resolve(this.baseDir, normalized);

    if (!resolved.startsWith(this.baseDir)) {
      throw new AppError(403, "FORBIDDEN_PATH", "Invalid storage path access");
    }

    return fs.readFile(resolved);
  }

  async deleteResume(storageKey: string): Promise<void> {
    const normalized = storageKey.replace(/^local\//, "");
    const resolved = path.resolve(this.baseDir, normalized);

    if (!resolved.startsWith(this.baseDir)) return;
    try {
      await fs.unlink(resolved);
    } catch {
      // Ignore if file was already removed from disk
    }
  }
}

class CloudinaryAuthenticatedStorageProvider implements StorageProvider {
  private readonly cloudName = env.CLOUDINARY_CLOUD_NAME;
  private readonly apiKey = env.CLOUDINARY_API_KEY;
  private readonly apiSecret = env.CLOUDINARY_API_SECRET;

  private signParams(params: Record<string, string | number>): string {
    const sorted = Object.keys(params)
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join("&");
    return crypto.createHash("sha1").update(`${sorted}${this.apiSecret}`).digest("hex");
  }

  async saveResume(
    userId: string,
    filename: string,
    buffer: Buffer,
    mimeType: string
  ): Promise<StoredObjectRef> {
    const timestamp = Math.floor(Date.now() / 1000);
    const publicId = `careerpilot/resumes/${userId}/${crypto.randomUUID()}_${path.basename(filename, path.extname(filename)).replace(/[^a-zA-Z0-9_-]/g, "")}`;
    const signature = this.signParams({
      public_id: publicId,
      timestamp,
      type: "authenticated",
    });

    const form = new FormData();
    const blob = new Blob([new Uint8Array(buffer)], { type: mimeType });
    form.append("file", blob, filename);
    form.append("api_key", this.apiKey);
    form.append("timestamp", String(timestamp));
    form.append("public_id", publicId);
    form.append("type", "authenticated");
    form.append("signature", signature);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${this.cloudName}/raw/upload`,
      { method: "POST", body: form }
    );

    if (!res.ok) {
      const errText = await res.text();
      throw new AppError(502, "STORAGE_UPLOAD_FAILED", `Cloudinary upload failed: ${errText}`);
    }

    const json = (await res.json()) as { public_id: string; secure_url: string };
    return {
      storageKey: `cloudinary:${json.public_id}`,
      publicOrInternalUrl: `cloudinary:${json.public_id}`,
    };
  }

  async readResumeBuffer(storageKey: string): Promise<Buffer> {
    const publicId = storageKey.replace(/^cloudinary:/, "");
    const timestamp = Math.floor(Date.now() / 1000);
    const expiresAt = timestamp + 120;
    const signature = this.signParams({
      expires_at: expiresAt,
      public_id: publicId,
      timestamp,
    });

    const url = `https://api.cloudinary.com/v1_1/${this.cloudName}/raw/download?public_id=${encodeURIComponent(
      publicId
    )}&api_key=${encodeURIComponent(this.apiKey)}&timestamp=${timestamp}&expires_at=${expiresAt}&signature=${signature}`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new AppError(502, "STORAGE_READ_FAILED", "Could not download file from Cloudinary");
    }
    const arrBuf = await res.arrayBuffer();
    return Buffer.from(arrBuf);
  }

  async deleteResume(storageKey: string): Promise<void> {
    const publicId = storageKey.replace(/^cloudinary:/, "");
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = this.signParams({
      public_id: publicId,
      timestamp,
      type: "authenticated",
    });

    const form = new FormData();
    form.append("public_id", publicId);
    form.append("api_key", this.apiKey);
    form.append("timestamp", String(timestamp));
    form.append("type", "authenticated");
    form.append("signature", signature);

    await fetch(`https://api.cloudinary.com/v1_1/${this.cloudName}/raw/destroy`, {
      method: "POST",
      body: form,
    });
  }
}

export const storageProvider: StorageProvider =
  env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET
    ? new CloudinaryAuthenticatedStorageProvider()
    : new LocalDiskStorageProvider();
