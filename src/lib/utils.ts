import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(dateString: string): string {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDuration(seconds: number): string {
  if (!seconds) return '0s'
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (minutes === 0) return `${secs}s`
  return `${minutes}m ${secs}s`
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function getTimeBasedGreeting(): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'Good Morning'
  if (hour >= 12 && hour < 17) return 'Good Afternoon'
  if (hour >= 17 && hour < 21) return 'Good Evening'
  return 'Good Night'
}

/**
 * Normalize a phone number:
 * - Strip trailing ".0" (Excel float artifact)
 * - Strip non-digit characters except leading +
 * - Prepend +91 if no country code present
 */
export function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return ''
  let p = String(phone).trim()
  // Remove Excel float suffix like ".0"
  p = p.replace(/\.0$/, '')
  // If it already starts with +, keep it as-is after cleaning
  if (p.startsWith('+')) {
    return '+' + p.slice(1).replace(/[^0-9]/g, '')
  }
  // Strip all non-digits
  p = p.replace(/[^0-9]/g, '')
  if (!p) return ''
  // If it already has country code (starts with 91 and is 12 digits), add +
  if (p.startsWith('91') && p.length === 12) {
    return '+' + p
  }
  // Otherwise prepend +91
  return '+91' + p
}

/**
 * Format phone for WhatsApp wa.me link (digits only, with country code).
 */
export function phoneForWhatsApp(phone: string | null | undefined): string {
  const normalized = normalizePhone(phone)
  // Strip the + for wa.me URL
  return normalized.replace(/^\+/, '')
}

/**
 * Call statuses for which the backend tracks a stale_at timestamp and will
 * reap the record after CALL_STALE_THRESHOLD_MINUTES. Terminal statuses
 * (COMPLETED/FAILED/NO_ANSWER/BUSY) are intentionally excluded.
 */
export const ACTIVE_CALL_STATUSES = ['QUEUED', 'INITIATED', 'RINGING', 'IN_PROGRESS'] as const
export type ActiveCallStatus = (typeof ACTIVE_CALL_STATUSES)[number]

export function isActiveCallStatus(status: string): status is ActiveCallStatus {
  return (ACTIVE_CALL_STATUSES as readonly string[]).includes(status)
}

export function extractCursor(url: string | null): string | null {
  if (!url) return null
  try {
    const parsed = new URL(url, 'http://placeholder')
    return parsed.searchParams.get('cursor')
  } catch {
    return null
  }
}
