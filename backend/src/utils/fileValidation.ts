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
