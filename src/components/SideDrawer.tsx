import { useEffect, useRef, useState, useCallback } from 'react'
import { X, ChevronLeft, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

export type DrawerHeaderAction = {
  icon: React.ComponentType<{ className?: string }>
  onClick: () => void
  label: string
  variant?: 'ghost' | 'outline' | 'secondary'
  disabled?: boolean
}

export type DrawerActionButton = {
  label: string
  onClick: () => void
  variant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost' | 'link'
  disabled?: boolean
  loading?: boolean
  icon?: React.ComponentType<{ className?: string }>
  iconPosition?: 'left' | 'right'
  className?: string
}

export interface SideDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  mode?: 'view' | 'edit' | 'create'
  headerActions?: DrawerHeaderAction[]
  isLoading?: boolean
  loadingText?: string
  children: React.ReactNode
  footerButtons?: DrawerActionButton[]
  footerAlignment?: 'left' | 'right' | 'center' | 'between'
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  showBackButton?: boolean
  preventClose?: boolean
  resizable?: boolean
  minWidth?: number
  maxWidth?: number
  storageKey?: string
  onClose?: () => void
  className?: string
  contentClassName?: string
}

const SIZE_PRESETS = { sm: 384, md: 448, lg: 672, xl: 768, '2xl': 896 } as const

const MODE_BADGE_CLASSES = {
  create:
    'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20',
  edit: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20',
  view: 'bg-gray-50 text-gray-600 ring-gray-500/20 dark:bg-gray-500/10 dark:text-gray-400 dark:ring-gray-500/20',
}

const FOOTER_ALIGNMENT = {
  left: 'justify-start',
  right: 'justify-end',
  center: 'justify-center',
  between: 'justify-between',
}

export function SideDrawer({
  open,
  onOpenChange,
  title,
  description,
  mode,
  headerActions,
  isLoading,
  loadingText = 'Loading...',
  children,
  footerButtons,
  footerAlignment = 'right',
  size = 'lg',
  showBackButton,
  preventClose,
  resizable = true,
  minWidth = 320,
  maxWidth = 1200,
  storageKey,
  onClose,
  className,
  contentClassName,
}: SideDrawerProps) {
  const key = storageKey || `sidedrawer-width-${title.toLowerCase().replace(/\s+/g, '-')}`
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)
  const [isResizing, setIsResizing] = useState(false)

  const defaultWidth = SIZE_PRESETS[size]
  const [drawerWidth, setDrawerWidth] = useState(() => {
    const saved = parseInt(localStorage.getItem(key) || '0', 10)
    if (saved && saved >= minWidth && saved <= maxWidth) return saved
    return defaultWidth
  })

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!resizable || isMobile) return
      e.preventDefault()
      setIsResizing(true)
      const startX = e.clientX
      const startWidth = drawerWidth

      const handleMouseMove = (e: MouseEvent) => {
        const delta = startX - e.clientX
        const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidth + delta))
        setDrawerWidth(newWidth)
      }

      const handleMouseUp = () => {
        setIsResizing(false)
        setDrawerWidth((w) => {
          localStorage.setItem(key, String(w))
          return w
        })
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [resizable, isMobile, drawerWidth, minWidth, maxWidth, key]
  )

  const handleClose = () => {
    if (preventClose) return
    onClose?.()
    onOpenChange(false)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o && preventClose) return
        if (!o) { onClose?.() }
        onOpenChange(o)
      }}
    >
      <SheetContent
        side="right"
        className={cn('flex flex-col p-0 [&>button]:hidden', className)}
        style={{
          maxWidth: isMobile ? '100vw' : `${drawerWidth}px`,
          transition: isResizing ? 'none' : 'max-width 0.2s ease-in-out',
        }}
      >
        {/* Resize Handle */}
        {resizable && !isMobile && (
          <div
            className={cn(
              'absolute left-0 top-0 bottom-0 w-1 cursor-col-resize z-50',
              'hover:bg-primary/20 active:bg-primary/30 transition-colors',
              isResizing && 'bg-primary/30'
            )}
            onMouseDown={handleMouseDown}
          >
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-16 bg-primary/50 rounded-r" />
          </div>
        )}

        {/* Header */}
        <div className="flex-shrink-0 border-b border-border/60">
          <div className="px-5 py-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {isMobile && showBackButton && (
                <Button variant="ghost" size="icon" className="h-8 w-8 -ml-1" onClick={handleClose}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              )}
              <SheetTitle className="text-base font-semibold tracking-tight truncate">
                {title}
              </SheetTitle>
              {mode && (
                <span
                  className={cn(
                    'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium shrink-0 ring-1 ring-inset',
                    MODE_BADGE_CLASSES[mode]
                  )}
                >
                  {mode}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {headerActions?.map((action) => (
                <Button
                  key={action.label}
                  variant={action.variant || 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={action.onClick}
                  disabled={action.disabled}
                  title={action.label}
                >
                  <action.icon className="h-4 w-4" />
                </Button>
              ))}
              {headerActions && headerActions.length > 0 && (
                <div className="w-px h-5 bg-border/60 mx-1" />
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {description && (
            <p className="px-5 pb-3 text-xs text-muted-foreground">{description}</p>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="text-sm font-medium">{loadingText}</p>
              </div>
            </div>
          )}
          <ScrollArea className="h-full">
            <div className={cn('px-5 py-5', contentClassName)}>{children}</div>
          </ScrollArea>
        </div>

        {/* Footer */}
        {footerButtons && footerButtons.length > 0 && (
          <div className="flex-shrink-0 border-t border-border/60">
            <div className="px-5 py-3">
              <div
                className={cn(
                  'flex flex-col-reverse sm:flex-row flex-wrap gap-2',
                  FOOTER_ALIGNMENT[footerAlignment]
                )}
              >
                {footerButtons.map((btn) => (
                  <Button
                    key={btn.label}
                    variant={btn.variant || 'default'}
                    onClick={btn.onClick}
                    disabled={btn.disabled || btn.loading}
                    className={cn('w-full sm:w-auto sm:min-w-[100px]', btn.className)}
                  >
                    {btn.loading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      btn.icon &&
                      btn.iconPosition !== 'right' && (
                        <btn.icon className="h-4 w-4 mr-2" />
                      )
                    )}
                    {btn.label}
                    {btn.icon && btn.iconPosition === 'right' && !btn.loading && (
                      <btn.icon className="h-4 w-4 ml-2" />
                    )}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
