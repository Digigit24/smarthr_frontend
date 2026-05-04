import { AlertTriangle, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  /** "destructive" colours the confirm button red and shows a warning icon. */
  tone?: 'default' | 'destructive'
  /** Called when the user confirms. Promise → button shows a spinner. */
  onConfirm: () => void | Promise<void>
  loading?: boolean
}

/**
 * Lightweight confirmation modal. Replaces window.confirm() calls with a
 * proper themed dialog so destructive actions (bulk delete, etc.) get
 * obvious affordances and a loading state during the request.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
  onConfirm,
  loading = false,
}: ConfirmDialogProps) {
  const isDestructive = tone === 'destructive'
  return (
    <Dialog open={open} onOpenChange={(o) => !loading && onOpenChange(o)}>
      <DialogContent className="w-[calc(100vw-1.5rem)] sm:max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-3">
            {isDestructive && (
              <div className="h-9 w-9 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base sm:text-lg">{title}</DialogTitle>
              {description && (
                <DialogDescription className="mt-1.5 text-sm text-muted-foreground">
                  {description}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {cancelLabel}
          </Button>
          <Button
            variant={isDestructive ? 'destructive' : 'default'}
            onClick={() => {
              const result = onConfirm()
              if (result instanceof Promise) result.catch(() => undefined)
            }}
            disabled={loading}
            className={cn('w-full sm:w-auto', isDestructive && 'focus-visible:ring-red-500')}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
