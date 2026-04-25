import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Inputs from a CallRecord to render a stale-at countdown.
 *
 * Prefer `staleAt` (absolute ISO timestamp) — it lets us compute the exact
 * remaining time from the client clock without depending on when the API
 * response was received.
 *
 * Fall back to `initialSecondsUntilStale` + a capture timestamp if the server
 * only provided a relative count.
 */
export interface StaleCallCountdownProps {
  staleAt: string | null
  initialSecondsUntilStale: number | null
  /** When the above values were fetched from the server (Date.now()). */
  fetchedAt: number
  /** Called exactly once when the countdown reaches zero. */
  onExpire?: () => void
  className?: string
}

function formatMMSS(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
}

/**
 * Compute the current seconds-remaining based on server-provided info.
 * Prefers absolute `staleAt`; otherwise uses the relative seconds + fetch
 * timestamp to avoid clock-skew assumptions.
 */
export function secondsLeft(
  staleAt: string | null,
  initialSecondsUntilStale: number | null,
  fetchedAt: number,
): number {
  if (staleAt) {
    const remaining = (new Date(staleAt).getTime() - Date.now()) / 1000
    return Math.max(0, Math.floor(remaining))
  }
  if (initialSecondsUntilStale == null) return 0
  const elapsed = (Date.now() - fetchedAt) / 1000
  return Math.max(0, Math.floor(initialSecondsUntilStale - elapsed))
}

/**
 * Compact "Auto-failing in MM:SS" countdown pill for in-flight call records.
 *
 * Decrements client-side every second using the backend's `stale_at` —
 * no polling required. Invokes `onExpire` exactly once when the timer
 * reaches zero so the parent can re-enable the Trigger AI Call button.
 */
export function StaleCallCountdown({
  staleAt,
  initialSecondsUntilStale,
  fetchedAt,
  onExpire,
  className,
}: StaleCallCountdownProps) {
  const [remaining, setRemaining] = useState(() =>
    secondsLeft(staleAt, initialSecondsUntilStale, fetchedAt),
  )
  const expiredFiredRef = useRef(false)

  // Reset when inputs change (e.g., after a refetch).
  useEffect(() => {
    expiredFiredRef.current = false
    setRemaining(secondsLeft(staleAt, initialSecondsUntilStale, fetchedAt))
  }, [staleAt, initialSecondsUntilStale, fetchedAt])

  // Drive a 1s interval while the timer is running.
  useEffect(() => {
    const interval = window.setInterval(() => {
      setRemaining(secondsLeft(staleAt, initialSecondsUntilStale, fetchedAt))
    }, 1000)
    return () => window.clearInterval(interval)
  }, [staleAt, initialSecondsUntilStale, fetchedAt])

  // Fire onExpire exactly once when we cross zero.
  useEffect(() => {
    if (remaining <= 0 && !expiredFiredRef.current) {
      expiredFiredRef.current = true
      onExpire?.()
    }
  }, [remaining, onExpire])

  const expired = remaining <= 0
  const Icon = expired ? AlertTriangle : Clock

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium',
        expired
          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        className,
      )}
      title={
        staleAt
          ? `Auto-fails at ${new Date(staleAt).toLocaleString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            })}`
          : undefined
      }
    >
      <Icon className="h-3 w-3" />
      {expired ? 'Auto-failing…' : `Auto-failing in ${formatMMSS(remaining)}`}
    </span>
  )
}
