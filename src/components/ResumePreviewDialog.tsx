import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, Loader2, AlertTriangle, FileText, ExternalLink } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { applicantsService } from '@/services/applicants'

interface ResumePreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  applicantId: string
  applicantName?: string
}

/**
 * Inline preview of an applicant's uploaded resume. Fetches the file with
 * the authenticated axios instance (so the Bearer token is attached),
 * caches it under a React-Query key, and renders inline for PDFs / plain
 * text. For DOC/DOCX (browsers can't render them) it offers a download.
 */
export function ResumePreviewDialog({
  open,
  onOpenChange,
  applicantId,
  applicantName,
}: ResumePreviewDialogProps) {
  const blobUrlRef = useRef<string | null>(null)
  const [blobUrl, setBlobUrl] = useState<string | null>(null)

  const fallbackFilename = `${(applicantName || 'resume').replace(/\s+/g, '_')}_resume`

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['resume-preview', applicantId],
    queryFn: () => applicantsService.fetchResumeBlob(applicantId, fallbackFilename),
    enabled: open && !!applicantId,
    // Keep the blob cached briefly so reopening the dialog is instant.
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  })

  // Mint a fresh object URL each time the blob changes, and revoke the
  // previous one. The cleanup also runs when the dialog unmounts.
  useEffect(() => {
    if (!data?.blob) return
    const url = URL.createObjectURL(data.blob)
    blobUrlRef.current = url
    setBlobUrl(url)
    return () => {
      URL.revokeObjectURL(url)
      blobUrlRef.current = null
    }
  }, [data?.blob])

  const handleDownload = () => {
    if (!blobUrl || !data) return
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = data.filename
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  const isPdf = data?.contentType?.includes('pdf')
  const isText =
    data?.contentType?.startsWith('text/') ||
    data?.contentType?.includes('plain')
  const isOffice =
    data?.contentType?.includes('msword') ||
    data?.contentType?.includes('officedocument')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1.5rem)] sm:max-w-4xl p-0 gap-0 max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader className="px-4 sm:px-5 py-3 border-b shrink-0">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="text-sm sm:text-base flex items-center gap-2 min-w-0">
              <FileText className="h-4 w-4 shrink-0 text-blue-500" />
              <span className="truncate">{data?.filename || 'Resume preview'}</span>
            </DialogTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownload}
              disabled={!blobUrl || isLoading || isError}
              className="shrink-0 h-8"
            >
              <Download className="h-3.5 w-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Download</span>
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 bg-muted/30 overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-[60vh] sm:h-[70vh] text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-3" />
              <p className="text-sm">Loading resume…</p>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center h-[60vh] sm:h-[70vh] text-center p-6">
              <AlertTriangle className="h-10 w-10 text-amber-500 mb-3" />
              <p className="font-semibold text-sm">Couldn't load the resume</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                {(error as Error)?.message || 'The file may have been moved or you may not have access.'}
              </p>
            </div>
          ) : !blobUrl ? null : isPdf ? (
            <iframe
              src={blobUrl}
              title="Resume preview"
              className="w-full h-[60vh] sm:h-[78vh] bg-white"
            />
          ) : isText ? (
            <TextPreview blobUrl={blobUrl} />
          ) : isOffice ? (
            <div className="flex flex-col items-center justify-center h-[60vh] sm:h-[70vh] text-center p-6">
              <FileText className="h-10 w-10 text-muted-foreground/60 mb-3" />
              <p className="font-semibold text-sm">Word documents can't be previewed inline</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Browsers don't render .doc / .docx files. Download to view it locally.
              </p>
              <Button size="sm" className="mt-4" onClick={handleDownload}>
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Download Resume
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[60vh] sm:h-[70vh] text-center p-6">
              <ExternalLink className="h-10 w-10 text-muted-foreground/60 mb-3" />
              <p className="font-semibold text-sm">Preview not supported for this file type</p>
              <Button size="sm" className="mt-4" onClick={handleDownload}>
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Download Resume
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function TextPreview({ blobUrl }: { blobUrl: string }) {
  const [text, setText] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    fetch(blobUrl)
      .then((r) => r.text())
      .then((t) => {
        if (!cancelled) setText(t)
      })
      .catch(() => {
        if (!cancelled) setText('')
      })
    return () => {
      cancelled = true
    }
  }, [blobUrl])
  if (text === null) {
    return (
      <div className="flex items-center justify-center h-[60vh] sm:h-[70vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }
  return (
    <pre className="h-[60vh] sm:h-[78vh] overflow-auto p-4 sm:p-5 bg-white text-xs sm:text-sm font-mono whitespace-pre-wrap break-words">
      {text}
    </pre>
  )
}
