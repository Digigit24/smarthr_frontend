import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Bell, CheckCheck, ChevronLeft, ChevronRight, Search, Loader2,
  FileText, Calendar, Phone, Settings, ExternalLink, Mail, MessageSquare,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { notificationsService } from '@/services/notifications'
import type { Notification, NotificationCategory } from '@/types'
import { formatDateTime, cn } from '@/lib/utils'

const CATEGORY_CONFIG: Record<NotificationCategory, { label: string; icon: typeof Bell; color: string; gradient: string; dot: string; bg: string }> = {
  APPLICATION: { label: 'Application', icon: FileText, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', gradient: 'from-blue-500 to-indigo-500', dot: 'bg-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  INTERVIEW: { label: 'Interview', icon: Calendar, color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400', gradient: 'from-indigo-500 to-purple-500', dot: 'bg-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
  CALL: { label: 'Call', icon: Phone, color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400', gradient: 'from-violet-500 to-purple-500', dot: 'bg-violet-500', bg: 'bg-violet-50 dark:bg-violet-900/20' },
  SYSTEM: { label: 'System', icon: Settings, color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', gradient: 'from-gray-400 to-gray-500', dot: 'bg-gray-400', bg: 'bg-gray-50 dark:bg-gray-800/50' },
}

const CATEGORY_TABS: { label: string; value: string }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Application', value: 'APPLICATION' },
  { label: 'Interview', value: 'INTERVIEW' },
  { label: 'Call', value: 'CALL' },
  { label: 'System', value: 'SYSTEM' },
]

function getNotificationRoute(data: Record<string, unknown>): string | null {
  if (data.application_id) return `/applications/${data.application_id}`
  if (data.job_id) return `/jobs/${data.job_id}`
  if (data.interview_id) return `/interviews/${data.interview_id}`
  if (data.call_record_id) return `/calls/${data.call_record_id}`
  return null
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDateTime(dateStr)
}

function NotificationCard({
  n,
  onMarkRead,
  onClick,
}: {
  n: Notification
  onMarkRead: (id: string) => void
  onClick: (n: Notification) => void
}) {
  const cfg = CATEGORY_CONFIG[n.category] || CATEGORY_CONFIG.SYSTEM
  const CatIcon = cfg.icon
  const route = getNotificationRoute(n.data)

  return (
    <div
      className={cn(
        'group rounded-xl border overflow-hidden transition-all duration-200',
        route && 'cursor-pointer hover:shadow-md',
        !n.is_read
          ? 'border-blue-200 dark:border-blue-800/50 bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-950/20'
          : 'bg-card hover:border-border/80'
      )}
      onClick={() => onClick(n)}
    >
      <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5">
        {/* Icon */}
        <div className={cn(
          'h-10 w-10 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105',
          !n.is_read ? `bg-gradient-to-br ${cfg.gradient} text-white` : cfg.bg
        )}>
          <CatIcon className={cn('h-5 w-5', n.is_read && cfg.color.split(' ').pop())} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium', cfg.color)}>
              <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
              {cfg.label}
            </span>
            {!n.is_read && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                New
              </span>
            )}
            <span className="text-[11px] text-muted-foreground ml-auto shrink-0">{getTimeAgo(n.sent_at)}</span>
          </div>
          <p className={cn('text-sm font-medium', !n.is_read && 'text-foreground')}>{n.title}</p>
          <p className="text-[13px] text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>

          {/* Footer */}
          <div className="flex items-center gap-3 mt-2">
            {n.notification_type && (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                {n.notification_type === 'EMAIL' && <Mail className="h-3 w-3" />}
                {n.notification_type === 'WHATSAPP' && <MessageSquare className="h-3 w-3" />}
                {n.notification_type === 'IN_APP' && <Bell className="h-3 w-3" />}
                {n.notification_type.replace(/_/g, ' ')}
              </span>
            )}
            {route && (
              <span className="inline-flex items-center gap-1 text-[11px] text-primary opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                View details <ExternalLink className="h-3 w-3" />
              </span>
            )}
          </div>
        </div>

        {/* Mark read button */}
        {!n.is_read && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => { e.stopPropagation(); onMarkRead(n.id) }}
          >
            Mark read
          </Button>
        )}
      </div>
    </div>
  )
}

export default function NotificationsPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')
  const [readFilter, setReadFilter] = useState<string>('ALL')
  const [page, setPage] = useState(1)

  const params: Record<string, string> = { page: String(page) }
  if (categoryFilter !== 'ALL') params.category = categoryFilter
  if (readFilter === 'UNREAD') params.is_read = 'false'
  if (readFilter === 'READ') params.is_read = 'true'
  if (searchQuery) params.search = searchQuery

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', categoryFilter, readFilter, searchQuery, page],
    queryFn: () => notificationsService.list(params),
  })

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsService.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      toast.success(`${res.marked_read} notifications marked as read`)
    },
  })

  const notifications = data?.results || []
  const unreadCount = notifications.filter((n) => !n.is_read).length

  const handleCardClick = (n: Notification) => {
    if (!n.is_read) markReadMutation.mutate(n.id)
    const route = getNotificationRoute(n.data)
    if (route) navigate(route)
    else navigate(`/notifications/${n.id}`)
  }

  // Category counts
  const categoryCounts = notifications.reduce((acc, n) => { acc[n.category] = (acc[n.category] || 0) + 1; return acc }, {} as Record<string, number>)

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white shrink-0">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Notifications</h1>
            <p className="text-sm text-muted-foreground">
              {data?.count ?? 0} total · {unreadCount} unread
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="w-full sm:w-auto"
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* Read filter pills */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notifications..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
          />
        </div>
        <div className="flex gap-1.5 bg-muted/50 rounded-lg p-1">
          {['ALL', 'UNREAD', 'READ'].map((v) => (
            <button
              key={v}
              onClick={() => { setReadFilter(v); setPage(1) }}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                readFilter === v
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {v === 'ALL' ? `All` : v === 'UNREAD' ? `Unread (${unreadCount})` : 'Read'}
            </button>
          ))}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-px border-b border-border scrollbar-none">
        {CATEGORY_TABS.map((tab) => {
          const count = tab.value === 'ALL' ? notifications.length : (categoryCounts[tab.value] || 0)
          const cfg = tab.value !== 'ALL' ? CATEGORY_CONFIG[tab.value as NotificationCategory] : null
          return (
            <button
              key={tab.value}
              onClick={() => { setCategoryFilter(tab.value); setPage(1) }}
              className={cn(
                'flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-xs font-medium transition-all border-b-2 -mb-px whitespace-nowrap',
                categoryFilter === tab.value
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              )}
            >
              {cfg && <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />}
              {tab.label}
              {count > 0 && (
                <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full">{count}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground mt-3">Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20">
          <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Bell className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <p className="font-semibold text-sm">No notifications</p>
          <p className="text-sm text-muted-foreground mt-1">
            {readFilter === 'UNREAD' ? "You're all caught up!" : 'Nothing to show here yet'}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2 sm:space-y-3">
            {notifications.map((n) => (
              <NotificationCard
                key={n.id}
                n={n}
                onMarkRead={(id) => markReadMutation.mutate(id)}
                onClick={handleCardClick}
              />
            ))}
          </div>

          {/* Pagination */}
          {(data?.next || data?.previous) && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <p className="text-sm text-muted-foreground">{data?.count} total · Page {page}</p>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!data?.previous}
                  onClick={() => setPage((p) => p - 1)}
                  className="flex-1 sm:flex-none"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!data?.next}
                  onClick={() => setPage((p) => p + 1)}
                  className="flex-1 sm:flex-none"
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
