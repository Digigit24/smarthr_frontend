import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Bell, Loader2, AlertTriangle, FileText, Calendar, Phone,
  Settings, CheckCircle, Clock, Mail, MessageSquare, ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { notificationsService } from '@/services/notifications'
import type { NotificationCategory } from '@/types'
import { formatDateTime, cn } from '@/lib/utils'

const CATEGORY_CONFIG: Record<NotificationCategory, { label: string; icon: typeof Bell; color: string; gradient: string; dot: string; bg: string }> = {
  APPLICATION: { label: 'Application', icon: FileText, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', gradient: 'from-blue-500 to-indigo-500', dot: 'bg-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  INTERVIEW: { label: 'Interview', icon: Calendar, color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400', gradient: 'from-indigo-500 to-purple-500', dot: 'bg-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
  CALL: { label: 'Call', icon: Phone, color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400', gradient: 'from-violet-500 to-purple-500', dot: 'bg-violet-500', bg: 'bg-violet-50 dark:bg-violet-900/20' },
  SYSTEM: { label: 'System', icon: Settings, color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', gradient: 'from-gray-400 to-gray-500', dot: 'bg-gray-400', bg: 'bg-gray-50 dark:bg-gray-800/50' },
}

const TYPE_ICONS: Record<string, typeof Bell> = {
  EMAIL: Mail,
  WHATSAPP: MessageSquare,
  IN_APP: Bell,
}

function getRelatedRoute(data: Record<string, unknown>): { label: string; path: string } | null {
  if (data.application_id) return { label: 'View Application', path: `/applications/${data.application_id}` }
  if (data.job_id) return { label: 'View Job', path: `/jobs/${data.job_id}` }
  if (data.interview_id) return { label: 'View Interview', path: `/interviews/${data.interview_id}` }
  if (data.call_record_id) return { label: 'View Call Record', path: `/calls/${data.call_record_id}` }
  return null
}

export default function NotificationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: notification, isLoading } = useQuery({
    queryKey: ['notification-detail', id],
    queryFn: () => notificationsService.get(id!),
    enabled: !!id,
  })

  const markReadMutation = useMutation({
    mutationFn: () => notificationsService.markRead(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['notification-detail', id] })
    },
  })

  // Auto-mark as read
  if (notification && !notification.is_read && !markReadMutation.isPending) {
    markReadMutation.mutate()
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground mt-3">Loading notification...</p>
      </div>
    )
  }

  if (!notification) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <AlertTriangle className="h-10 w-10 text-amber-500 mb-3" />
        <p className="text-sm text-muted-foreground">Notification not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/notifications')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Notifications
        </Button>
      </div>
    )
  }

  const cfg = CATEGORY_CONFIG[notification.category] || CATEGORY_CONFIG.SYSTEM
  const CatIcon = cfg.icon
  const TypeIcon = TYPE_ICONS[notification.notification_type] || Bell
  const relatedRoute = getRelatedRoute(notification.data)

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-4 sm:space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/notifications')} className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Notifications
      </Button>

      {/* Hero */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className={cn('h-2 bg-gradient-to-r', cfg.gradient)} />
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className={cn('h-14 w-14 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shrink-0', cfg.gradient)}>
              <CatIcon className="h-7 w-7" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium', cfg.color)}>
                  <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
                  {cfg.label}
                </span>
                <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground')}>
                  <TypeIcon className="h-3 w-3" />
                  {notification.notification_type.replace(/_/g, ' ')}
                </span>
                {notification.is_read ? (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                    <CheckCircle className="h-3.5 w-3.5" /> Read
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" /> Unread
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold">{notification.title}</h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <Clock className="h-3.5 w-3.5" />
                <span>Sent {formatDateTime(notification.sent_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-5">
          {/* Message */}
          <div className="rounded-xl border bg-card p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className={cn('h-7 w-7 rounded-lg flex items-center justify-center', cfg.bg)}>
                <MessageSquare className={cn('h-4 w-4', cfg.color.split(' ').pop())} />
              </div>
              <h3 className="font-semibold text-sm">Message</h3>
            </div>
            <div className="p-4 rounded-lg bg-muted/30">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{notification.message}</p>
            </div>
          </div>

          {/* Related Data */}
          {Object.keys(notification.data || {}).length > 0 && (
            <div className="rounded-xl border bg-card p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-7 w-7 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="font-semibold text-sm">Related Data</h3>
              </div>
              <div className="space-y-2">
                {Object.entries(notification.data).map(([key, value]) => (
                  <div key={key} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                    <span className="text-xs text-muted-foreground font-medium min-w-[100px] shrink-0">{key.replace(/_/g, ' ')}</span>
                    <span className="text-sm font-medium break-all">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Navigate to related */}
          {relatedRoute && (
            <button
              onClick={() => navigate(relatedRoute.path)}
              className="w-full rounded-xl border bg-card p-4 hover:border-primary/50 transition-colors group text-left"
            >
              <div className="flex items-center gap-3">
                <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', cfg.bg)}>
                  <CatIcon className={cn('h-5 w-5', cfg.color.split(' ').pop())} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm group-hover:text-primary transition-colors">{relatedRoute.label}</p>
                  <p className="text-xs text-muted-foreground">Navigate to resource</p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </div>
            </button>
          )}

          {/* Details */}
          <div className="rounded-xl border bg-card p-4 sm:p-5 space-y-3">
            <h3 className="font-semibold text-sm">Details</h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Category</span>
                <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium', cfg.color)}>
                  {cfg.label}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Channel</span>
                <span className="font-medium inline-flex items-center gap-1">
                  <TypeIcon className="h-3.5 w-3.5" />
                  {notification.notification_type.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className={cn('font-medium', notification.is_read ? 'text-emerald-600' : 'text-blue-600')}>
                  {notification.is_read ? 'Read' : 'Unread'}
                </span>
              </div>
              {notification.read_at && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Read at</span>
                  <span className="font-medium text-xs">{formatDateTime(notification.read_at)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Sent</span>
                <span className="font-medium text-xs">{formatDateTime(notification.sent_at)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium text-xs">{formatDateTime(notification.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
