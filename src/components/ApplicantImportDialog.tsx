import React, { useState, useRef, useCallback } from 'react'
import {
  Upload, FileSpreadsheet, Loader2, CheckCircle, AlertTriangle,
  ArrowRight, ArrowLeft, X, MapPin,
} from 'lucide-react'
import { toast } from 'sonner'
import { extractApiError } from '@/lib/apiErrors'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  applicantsService,
  type ImportPreviewResponse,
  type ImportResponse,
} from '@/services/applicants'

type Step = 'upload' | 'map' | 'result'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportComplete: () => void
}

export function ApplicantImportDialog({ open, onOpenChange, onImportComplete }: Props) {
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [preview, setPreview] = useState<ImportPreviewResponse | null>(null)
  const [fields, setFields] = useState<Record<string, string>>({})
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [result, setResult] = useState<ImportResponse | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setStep('upload')
    setFile(null)
    setPreview(null)
    setFields({})
    setMapping({})
    setResult(null)
    setIsUploading(false)
    setIsImporting(false)
  }

  const handleClose = (open: boolean) => {
    if (!open) reset()
    onOpenChange(open)
  }

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.xlsx')) {
      toast.error('Only .xlsx files are supported')
      return
    }
    setFile(selectedFile)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) handleFileSelect(droppedFile)
  }, [])

  const handleUploadAndPreview = async () => {
    if (!file) return
    setIsUploading(true)
    try {
      const [fieldsRes, previewRes] = await Promise.all([
        applicantsService.importFields(),
        applicantsService.importPreview(file),
      ])
      setFields(fieldsRes.fields)
      setPreview(previewRes)
      // Auto-map columns that exactly match field labels (case-insensitive)
      const autoMapping: Record<string, string> = {}
      const labelToKey: Record<string, string> = {}
      for (const [key, label] of Object.entries(fieldsRes.fields) as [string, string][]) {
        labelToKey[label.toLowerCase()] = key
        labelToKey[key.toLowerCase()] = key
      }
      for (const col of previewRes.columns) {
        const match = labelToKey[col.toLowerCase()]
        if (match) autoMapping[col] = match
      }
      setMapping(autoMapping)
      setStep('map')
    } catch (err) {
      toast.error(extractApiError(err, 'Failed to preview file'))
    } finally {
      setIsUploading(false)
    }
  }

  const handleImport = async () => {
    if (!file) return
    const activeMappings = Object.fromEntries(
      Object.entries(mapping).filter(([, v]) => v && v !== '__skip__')
    ) as Record<string, string>
    if (Object.keys(activeMappings).length === 0) {
      toast.error('Map at least one column before importing')
      return
    }
    setIsImporting(true)
    try {
      const res = await applicantsService.importApplicants(file, activeMappings)
      setResult(res)
      setStep('result')
      onImportComplete()
    } catch (err) {
      toast.error(extractApiError(err, 'Import failed'))
    } finally {
      setIsImporting(false)
    }
  }

  const updateMapping = (column: string, fieldKey: string) => {
    setMapping(prev => {
      const next = { ...prev }
      if (fieldKey === '__skip__' || !fieldKey) {
        delete next[column]
      } else {
        next[column] = fieldKey
      }
      return next
    })
  }

  // Fields already mapped by other columns
  const usedFields = new Set(Object.values(mapping).filter(v => v && v !== '__skip__'))

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={cn(
        'sm:max-w-2xl max-h-[90vh] flex flex-col',
        step === 'map' && 'sm:max-w-3xl',
      )}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-purple-600" />
            Import Applicants
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Upload an Excel (.xlsx) file to import applicants.'}
            {step === 'map' && 'Map your Excel columns to applicant fields.'}
            {step === 'result' && 'Import completed.'}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex items-center gap-2 text-xs">
          {(['upload', 'map', 'result'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              {i > 0 && <div className="w-8 h-px bg-border" />}
              <div className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-full font-medium',
                step === s ? 'bg-primary text-primary-foreground' :
                  (['upload', 'map', 'result'].indexOf(step) > i)
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-muted text-muted-foreground'
              )}>
                <span className="w-4 h-4 rounded-full bg-current/10 flex items-center justify-center text-[10px]">{i + 1}</span>
                {s === 'upload' ? 'Upload' : s === 'map' ? 'Map Columns' : 'Results'}
              </div>
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {/* ── Step 1: Upload ── */}
          {step === 'upload' && (
            <div className="space-y-4 py-2">
              <div
                className={cn(
                  'border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer',
                  isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
                  file && 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-700 dark:bg-emerald-900/10',
                )}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleFileSelect(f)
                  }}
                />
                {file ? (
                  <div className="flex flex-col items-center gap-2">
                    <FileSpreadsheet className="h-10 w-10 text-emerald-600" />
                    <p className="font-medium text-sm">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB — Click or drop to replace
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-10 w-10 text-muted-foreground/50" />
                    <p className="font-medium text-sm">Drop your .xlsx file here</p>
                    <p className="text-xs text-muted-foreground">or click to browse</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Step 2: Map Columns ── */}
          {step === 'map' && preview && (
            <div className="space-y-4 py-2">
              <p className="text-xs text-muted-foreground">
                {preview.columns.length} columns found. Map each Excel column to an applicant field. Unmapped columns will be skipped.
              </p>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="text-left px-3 py-2 font-medium text-xs">Excel Column</th>
                      <th className="text-left px-3 py-2 font-medium text-xs">Sample Data</th>
                      <th className="text-left px-3 py-2 font-medium text-xs">Map To</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {preview.columns.map((col) => {
                      const sampleValues = preview.sample_data
                        .map(row => row[col])
                        .filter(v => v != null && v !== '')
                        .slice(0, 2)
                      const currentMapping = mapping[col] || ''
                      return (
                        <tr key={col} className="hover:bg-muted/30">
                          <td className="px-3 py-2 font-medium text-xs">{col}</td>
                          <td className="px-3 py-2 text-xs text-muted-foreground max-w-[160px]">
                            {sampleValues.length > 0 ? (
                              <span className="truncate block">{sampleValues.map(String).join(', ')}</span>
                            ) : (
                              <span className="italic">empty</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <Select
                              value={currentMapping || '__skip__'}
                              onValueChange={(v) => updateMapping(col, v)}
                            >
                              <SelectTrigger className="h-8 text-xs w-full">
                                <SelectValue placeholder="Skip" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__skip__">
                                  <span className="text-muted-foreground">— Skip —</span>
                                </SelectItem>
                                {Object.entries(fields).map(([key, label]) => (
                                  <SelectItem
                                    key={key}
                                    value={key}
                                    disabled={usedFields.has(key) && currentMapping !== key}
                                  >
                                    {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <p className="text-[11px] text-muted-foreground">
                <MapPin className="h-3 w-3 inline mr-1" />
                {Object.values(mapping).filter(v => v && v !== '__skip__').length} of {preview.columns.length} columns mapped
              </p>
            </div>
          )}

          {/* ── Step 3: Results ── */}
          {step === 'result' && result && (
            <div className="space-y-4 py-2">
              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-600">{result.imported}</p>
                  <p className="text-xs text-muted-foreground">Imported</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-2xl font-bold text-amber-600">{result.skipped}</p>
                  <p className="text-xs text-muted-foreground">Skipped</p>
                </div>
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-2xl font-bold text-red-600">{result.errors.length}</p>
                  <p className="text-xs text-muted-foreground">Errors</p>
                </div>
              </div>

              <div className="rounded-lg border p-4 bg-muted/30">
                <p className="text-sm">
                  <span className="font-medium">{result.total_rows}</span> total rows processed.
                </p>
              </div>

              {/* Error details */}
              {result.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    Row Errors
                  </h4>
                  <div className="border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-muted/50 border-b">
                          <th className="text-left px-3 py-1.5 font-medium">Row</th>
                          <th className="text-left px-3 py-1.5 font-medium">Errors</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {result.errors.map((err) => (
                          <tr key={err.row}>
                            <td className="px-3 py-1.5 font-mono">{err.row}</td>
                            <td className="px-3 py-1.5">
                              {Object.entries(err.errors).map(([field, msgs]) => (
                                <div key={field}>
                                  <span className="font-medium">{field}:</span>{' '}
                                  {(msgs as string[]).join(', ')}
                                </div>
                              ))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="gap-2 sm:gap-0">
          {step === 'upload' && (
            <Button
              onClick={handleUploadAndPreview}
              disabled={!file || isUploading}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4 mr-2" />
              )}
              {isUploading ? 'Uploading...' : 'Preview'}
            </Button>
          )}
          {step === 'map' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={isImporting || Object.values(mapping).filter(v => v && v !== '__skip__').length === 0}
              >
                {isImporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {isImporting ? 'Importing...' : 'Import'}
              </Button>
            </>
          )}
          {step === 'result' && (
            <Button onClick={() => handleClose(false)}>
              <CheckCircle className="h-4 w-4 mr-2" /> Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
