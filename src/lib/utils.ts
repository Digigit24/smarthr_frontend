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
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
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
 * Default phone country code and local-length for the strict E.164 normalizer.
 *
 * NOTE: The authoritative source of truth is the backend's
 * `smarthrin/common/phone.py`, which reads DEFAULT_PHONE_COUNTRY_CODE /
 * DEFAULT_PHONE_LOCAL_LENGTH from env. This client-side helper is used only
 * for preview-time warnings during the Excel import flow — if the backend
 * is deployed with different defaults, the preview will drift and the
 * backend's import-time normalization remains authoritative.
 */
const DEFAULT_PHONE_COUNTRY_CODE = '+91'
const DEFAULT_PHONE_LOCAL_LENGTH = 10
const E164_RE = /^\+[1-9]\d{1,14}$/

/**
 * Normalize a phone number to E.164 using the same algorithm as the backend
 * (`smarthrin/common/phone.py`). Returns both the normalized string and a
 * `valid` flag so callers can surface warnings on bad rows without blocking
 * the operation.
 *
 * Rules (must match the backend exactly):
 *   1. Strip whitespace / dashes / parentheses / dots.
 *   2. `00<cc>...` → `+<cc>...`.
 *   3. Already starts with `+` → keep, validate.
 *   4. Strip a single leading `0` (trunk prefix).
 *   5. If length ≥ (country_code_len + local_length) AND starts with the
 *      country code → just prepend `+`.
 *   6. Else prepend `DEFAULT_PHONE_COUNTRY_CODE`.
 *   7. Validate against `/^\+[1-9]\d{1,14}$/`.
 */
export function normalizePhoneE164(
  phone: string | number | null | undefined,
): { normalized: string; valid: boolean } {
  if (phone == null || phone === '') return { normalized: '', valid: false }

  let p = String(phone).trim()
  // Excel float artifact: "5454210258.0" → "5454210258"
  p = p.replace(/\.0+$/, '')
  // Strip whitespace, dashes, parens, dots
  p = p.replace(/[\s\-().]/g, '')
  if (!p) return { normalized: '', valid: false }

  // Already E.164 form
  if (p.startsWith('+')) {
    const cleaned = '+' + p.slice(1).replace(/[^0-9]/g, '')
    return { normalized: cleaned, valid: E164_RE.test(cleaned) }
  }

  const digits = p.replace(/[^0-9]/g, '')
  if (!digits) return { normalized: '', valid: false }

  // "00<cc>..." international prefix → "+<cc>..."
  if (digits.startsWith('00')) {
    const normalized = '+' + digits.slice(2)
    return { normalized, valid: E164_RE.test(normalized) }
  }

  // Strip a single leading 0 (trunk prefix)
  const local = digits.startsWith('0') ? digits.slice(1) : digits

  const cc = DEFAULT_PHONE_COUNTRY_CODE.replace(/^\+/, '')
  if (
    local.length >= DEFAULT_PHONE_LOCAL_LENGTH + cc.length &&
    local.startsWith(cc)
  ) {
    const normalized = '+' + local
    return { normalized, valid: E164_RE.test(normalized) }
  }

  const normalized = DEFAULT_PHONE_COUNTRY_CODE + local
  return { normalized, valid: E164_RE.test(normalized) }
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

export const TERMINAL_CALL_STATUSES = ['COMPLETED', 'FAILED', 'NO_ANSWER', 'BUSY'] as const
export type TerminalCallStatus = (typeof TERMINAL_CALL_STATUSES)[number]

export function isTerminalCallStatus(status: string): status is TerminalCallStatus {
  return (TERMINAL_CALL_STATUSES as readonly string[]).includes(status)
}

export function formatTalkTime(seconds: number | null | undefined): string {
  if (seconds == null || seconds <= 0) return '—'
  const s = Math.floor(seconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const pad = (n: number) => n.toString().padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`
}

/**
 * Defensive talk-time computer for a call record.
 * Prefers `duration` from the server; falls back to ended_at - started_at
 * when both timestamps are present but duration is missing/zero.
 * Returns 0 when no usable signal is available — `formatTalkTime(0)` is "—".
 */
export function getTalkSeconds(record: {
  duration?: number | null
  started_at?: string | null
  ended_at?: string | null
}): number {
  if (record.duration && record.duration > 0) return record.duration
  if (record.started_at && record.ended_at) {
    const ms = new Date(record.ended_at).getTime() - new Date(record.started_at).getTime()
    return ms > 0 ? Math.floor(ms / 1000) : 0
  }
  return 0
}

export function formatTimeHM(iso: string | null | undefined): string {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
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
