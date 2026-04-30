/**
 * Client-side validation for the resume upload field. Server enforces these
 * limits too, but failing fast keeps the user from waiting on an upload.
 */
export const RESUME_MAX_BYTES = 10 * 1024 * 1024 // 10 MB

export const RESUME_ACCEPT =
  '.pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain'

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt']
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
])

export function validateResumeFile(file: File): string | null {
  if (file.size > RESUME_MAX_BYTES) {
    return `Resume must be ≤ 10 MB (got ${(file.size / (1024 * 1024)).toFixed(1)} MB).`
  }
  const lowerName = file.name.toLowerCase()
  const extOk = ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext))
  const mimeOk = file.type ? ALLOWED_MIME_TYPES.has(file.type) : false
  if (!extOk && !mimeOk) {
    return 'Resume must be a PDF, DOC, DOCX, or plain-text file.'
  }
  return null
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
