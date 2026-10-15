/* Upload allowlist. The type is decided from the file's first bytes, never
   from the browser-supplied MIME type or the filename, so a renamed .html or
   .svg can't sneak through as an "image". SVG is deliberately excluded: it can
   carry script. */

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/avif"];
const FILE_TYPES = [...IMAGE_TYPES, "application/pdf", "application/zip"];

function startsWith(buf: Buffer, bytes: number[], offset = 0): boolean {
  return bytes.every((b, i) => buf[offset + i] === b);
}

function ascii(buf: Buffer, start: number, end: number): string {
  return buf.subarray(start, end).toString("latin1");
}

export function sniffType(buf: Buffer): string | null {
  if (startsWith(buf, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (ascii(buf, 0, 6) === "GIF87a" || ascii(buf, 0, 6) === "GIF89a") return "image/gif";
  if (ascii(buf, 0, 4) === "RIFF" && ascii(buf, 8, 12) === "WEBP") return "image/webp";
  if (ascii(buf, 4, 8) === "ftyp" && /^avi[fs]$/.test(ascii(buf, 8, 12))) return "image/avif";
  if (ascii(buf, 0, 5) === "%PDF-") return "application/pdf";
  if (startsWith(buf, [0x50, 0x4b, 0x03, 0x04])) return "application/zip";
  return null;
}

/* Returns the verified MIME type, or an error message for the uploader. */
export function checkUpload(
  buf: Buffer,
  kind: "image" | "hero" | "file"
): { mimeType: string } | { error: string } {
  const type = sniffType(buf);
  const allowed = kind === "file" ? FILE_TYPES : IMAGE_TYPES;
  if (!type || !allowed.includes(type)) {
    return {
      error:
        kind === "file"
          ? "Unsupported file type. Upload a PDF, ZIP, or a JPEG/PNG/GIF/WebP/AVIF image."
          : "Unsupported image type. Upload a JPEG, PNG, GIF, WebP or AVIF image (not SVG).",
    };
  }
  return { mimeType: type };
}

/* Only these types are ever shown inline; everything else is a download. */
export function isInlineSafe(mimeType: string): boolean {
  return IMAGE_TYPES.includes(mimeType);
}

/* A filename safe to put in a Content-Disposition header. */
export function safeFilename(name: string): string {
  const cleaned = (name || "upload")
    .replace(/[\r\n"\\/]/g, "")
    .replace(/[^\x20-\x7e]/g, "_")
    .trim()
    .slice(0, 150);
  return cleaned || "upload";
}
