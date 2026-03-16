import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, ChevronLeft, ChevronRight, Search, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { notificationsService } from '@/services/notifications'
import type { NotificationCategory } from '@/types'
import { formatDateTime, cn } from '@/lib/utils'

const CATEGORY_COLORS: Record<string, string> = {
  APPLICATION: 'bg-blue-100 text-blue-700',
  INTERVIEW: 'bg-indigo-100 text-indigo-700',
  CALL: 'bg-violet-100 text-violet-700',
  SYSTEM: 'bg-gray-100 text-gray-700',
}

const CATEGORY_TABS: { label: string; value: string }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Application', value: 'APPLICATION' },
  { label: 'Interview', value: 'INTERVIEW' },
  { label: 'Call', value: 'CALL' },
  { label: 'System', value: 'SYSTEM' },
]

function getNotificationRoute(data: Record<string, unknown>): string | null {
  if (data.application_id) return '/applications'
  if (data.job_id) return '/jobs'
  if (data.interview_id) return '/interviews'
  if (data.call_record_id) return '/calls'
  return null
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
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

  const handleCardClick = (n: { is_read: boolean; id: string; data: Record<string, unknown>; category: NotificationCategory }) => {
    if (!n.is_read) {
      markReadMutation.mutate(n.id)
    }
    const route = getNotificationRoute(n.data)
    if (route) navigate(route)
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Notifications</h1>
          <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Search & Read Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notifications..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
          />
        </div>
        <div className="flex gap-1">
          {['ALL', 'UNREAD', 'READ'].map((v) => (
            <button
              key={v}
              onClick={() => { setReadFilter(v); setPage(1) }}
              className={cn(
                'px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors',
                readFilter === v
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              {v === 'ALL' ? 'All' : v === 'UNREAD' ? 'Unread' : 'Read'}
            </button>
          ))}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1 border-b border-border">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setCategoryFilter(tab.value); setPage(1) }}
            className={cn(
              'px-3 py-2 text-[13px] font-medium transition-colors border-b-2 -mb-px',
              categoryFilter === tab.value
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground mt-3">Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No notifications</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {notifications.map((n) => {
              const route = getNotificationRoute(n.data)
              return (
                <Card
                  key={n.id}
                  className={cn(
                    'transition-colors',
                    route && 'cursor-pointer hover:border-border/80',
                    !n.is_read && 'border-blue-200 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-900/10'
                  )}
                  onClick={() => handleCardClick(n as typeof n & { data: Record<string, unknown> })}
                >
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={cn('px-1.5 py-0.5 rounded text-[11px] font-medium', CATEGORY_COLORS[n.category])}>
                          {n.category}
                        </span>
                        {!n.is_read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        )}
                        {route && (
                          <span className="text-[11px] text-muted-foreground ml-auto">click to navigate →</span>
                        )}
                      </div>
                      <p className="font-medium text-sm">{n.title}</p>
                      <p className="text-[13px] text-muted-foreground mt-0.5">{n.message}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">{formatDateTime(n.sent_at)}</p>
                    </div>
                    {!n.is_read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 shrink-0"
                        onClick={(e) => { e.stopPropagation(); markReadMutation.mutate(n.id) }}
                      >
                        Mark read
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Pagination */}
          {(data?.next || data?.previous) && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">{data?.count} total</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!data?.previous}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!data?.next}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
