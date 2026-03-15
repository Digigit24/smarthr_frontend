import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { notificationsService } from '@/services/notifications'
import { formatDateTime, cn } from '@/lib/utils'

const CATEGORY_COLORS: Record<string, string> = {
  APPLICATION: 'bg-blue-100 text-blue-700',
  INTERVIEW: 'bg-indigo-100 text-indigo-700',
  CALL: 'bg-violet-100 text-violet-700',
  SYSTEM: 'bg-gray-100 text-gray-700',
}

export default function NotificationsPage() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsService.list(),
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

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 h-16" />
            </Card>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No notifications</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={cn(
                'cursor-pointer hover:border-border/80 transition-colors',
                !n.is_read && 'border-blue-200 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-900/10'
              )}
              onClick={() => !n.is_read && markReadMutation.mutate(n.id)}
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
          ))}
        </div>
      )}
    </div>
  )
}
