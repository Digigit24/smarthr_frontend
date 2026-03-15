import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Activity, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { activitiesService } from '@/services/activities'
import { formatDateTime, cn } from '@/lib/utils'

const VERB_COLORS: Record<string, string> = {
  CREATED: 'bg-emerald-100 text-emerald-700',
  UPDATED: 'bg-blue-100 text-blue-700',
  DELETED: 'bg-red-100 text-red-700',
  STATUS_CHANGED: 'bg-amber-100 text-amber-700',
  PUBLISHED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-700',
  TRIGGERED_CALL: 'bg-violet-100 text-violet-700',
  CALL_COMPLETED: 'bg-cyan-100 text-cyan-700',
  CALL_FAILED: 'bg-red-100 text-red-700',
  INTERVIEW_SCHEDULED: 'bg-indigo-100 text-indigo-700',
  INTERVIEW_COMPLETED: 'bg-teal-100 text-teal-700',
  INTERVIEW_CANCELLED: 'bg-orange-100 text-orange-700',
  SCORECARD_CREATED: 'bg-purple-100 text-purple-700',
  NOTE_ADDED: 'bg-yellow-100 text-yellow-700',
  BULK_ACTION: 'bg-gray-100 text-gray-700',
}

export default function ActivitiesPage() {
  const [actorFilter, setActorFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['activities', actorFilter],
    queryFn: () => activitiesService.list(),
  })

  const activities = data?.results || []

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-lg font-semibold">Activity Log</h1>
        <p className="text-xs text-muted-foreground">Audit trail for your tenant</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Filter by actor email..."
          className="pl-9"
          value={actorFilter}
          onChange={(e) => setActorFilter(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 h-14" />
            </Card>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No activity yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activities
            .filter((a) =>
              actorFilter ? a.actor_email.includes(actorFilter) : true
            )
            .map((activity) => (
              <Card key={activity.id}>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className={cn('px-1.5 py-0.5 rounded text-[11px] font-medium shrink-0', VERB_COLORS[activity.verb] || 'bg-gray-100 text-gray-700')}>
                        {activity.verb.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[12px] text-muted-foreground">{activity.resource_type}</span>
                    </div>
                    <p className="text-[13px] font-medium">{activity.resource_label}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-[12px] text-muted-foreground">
                      <span>{activity.actor_email}</span>
                      <span>·</span>
                      <span>{formatDateTime(activity.created_at)}</span>
                    </div>
                    {(Object.keys(activity.before).length > 0 || Object.keys(activity.after).length > 0) && (
                      <div className="mt-1.5 flex items-center gap-2 text-[12px]">
                        {Object.keys(activity.before).length > 0 && (
                          <span className="text-muted-foreground">
                            {JSON.stringify(activity.before)} →
                          </span>
                        )}
                        {Object.keys(activity.after).length > 0 && (
                          <span className="text-foreground font-medium">
                            {JSON.stringify(activity.after)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  )
}
