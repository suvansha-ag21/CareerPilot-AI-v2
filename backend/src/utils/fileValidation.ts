import path from "path";
import { BadRequestError } from "./errors";

export const MAX_RESUME_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export type VerifiedResumeType = "PDF" | "DOCX";

/**
 * Inspects file size, extension, and leading binary magic bytes so spoofed uploads are rejected.
 */
export function validateResumeBinary(
  buffer: Buffer,
  originalName: string,
  mimeType: string
): VerifiedResumeType {
  if (!buffer || buffer.length === 0) {
    throw new BadRequestError("Uploaded resume file is empty");
  }

  if (buffer.length > MAX_RESUME_SIZE_BYTES) {
    throw new BadRequestError("Resume file exceeds maximum allowed size of 10 MB");
  }

  const ext = path.extname(originalName).toLowerCase();
  const isPdfHeader = buffer.subarray(0, 5).toString("ascii") === "%PDF-";
  const isZipHeader =
    buffer.length >= 4 &&
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    buffer[2] === 0x03 &&
    buffer[3] === 0x04;

  if (ext === ".pdf" || mimeType === "application/pdf") {
    if (!isPdfHeader) {
      throw new BadRequestError("File extension indicates PDF, but binary header is not a valid PDF document");
    }
    return "PDF";
  }

  if (
    ext === ".docx" ||
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    // DOCX is a ZIP container containing XML entries under word/
    const containsWordEntry = buffer.includes(Buffer.from("word/"));
    if (!isZipHeader || !containsWordEntry) {
      throw new BadRequestError("File does not appear to be a valid DOCX document");
    }
    return "DOCX";
  }

  throw new BadRequestError("Unsupported file format. Please upload a PDF or DOCX resume.");
}

export function validateJobDescriptionFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string
): { ext: ".pdf" | ".docx" | ".txt"; mime: string } {
  if (!buffer || buffer.length === 0) {
    throw new BadRequestError("Uploaded job description file is empty");
  }
  if (buffer.length > 5 * 1024 * 1024) {
    throw new BadRequestError("Job description file exceeds 5 MB limit");
  }

  const ext = path.extname(originalName).toLowerCase();
  if (ext === ".txt" || mimeType === "text/plain") {
    return { ext: ".txt", mime: "text/plain" };
  }

  const type = validateResumeBinary(buffer, originalName, mimeType);
  if (type === "PDF") {
    return { ext: ".pdf", mime: "application/pdf" };
  }
  return {
    ext: ".docx",
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };
}

export const MAX_VOICE_AUDIO_BYTES = 15 * 1024 * 1024; // 15 MB

const ALLOWED_AUDIO_MIME_MAP: Record<string, string> = {
  ".webm": "audio/webm",
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".mp4": "audio/mp4",
  ".ogg": "audio/ogg",
};

export function validateVoiceAudioFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string
): { mime: string; ext: string } {
  if (!buffer || buffer.length === 0) {
    throw new BadRequestError("Recorded audio payload is empty");
  }
  if (buffer.length > MAX_VOICE_AUDIO_BYTES) {
    throw new BadRequestError("Audio recording exceeds maximum 15 MB limit");
  }

  const ext = path.extname(originalName).toLowerCase();
  const baseMime = mimeType.split(";")[0].trim().toLowerCase();

  if (ext in ALLOWED_AUDIO_MIME_MAP) {
    return { ext, mime: baseMime.startsWith("audio/") ? baseMime : ALLOWED_AUDIO_MIME_MAP[ext] };
  }

  if (baseMime.startsWith("audio/") || baseMime === "video/webm") {
    const cleanMime = baseMime === "video/webm" ? "audio/webm" : baseMime;
    return { ext: ".webm", mime: cleanMime };
  }

  throw new BadRequestError("Unsupported audio format. Expected WebM, WAV, MP3, MP4, or OGG.");
}
