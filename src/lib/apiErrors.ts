import axios from 'axios'
import type { UseFormSetError, FieldValues, Path } from 'react-hook-form'

/**
 * Parse a flat field-error object from various response shapes.
 * Handles:
 * - { field: ["err", ...], ... }           (DRF default)
 * - { details: { field: ["err", ...] } }   (custom backend wrapper)
 */
function parseFieldMap(obj: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (key === 'non_field_errors') continue
    if (Array.isArray(value) && value.length > 0) {
      out[key] = String(value[0])
    } else if (typeof value === 'string') {
      out[key] = value
    }
  }
  return out
}

/**
 * Extract a human-readable error message from an API error response.
 * Handles Django REST Framework error shapes:
 * - { detail: "string" }
 * - { error: "...", code: "...", details: { field: [...] } }
 * - { field_name: ["error1", "error2"] }
 * - { non_field_errors: ["error"] }
 * - Plain string responses
 */
export function extractApiError(error: unknown, fallback = 'Something went wrong'): string {
  if (!axios.isAxiosError(error)) {
    if (error instanceof Error) return error.message
    return fallback
  }

  const data = error.response?.data
  if (!data) {
    if (error.message) return error.message
    return fallback
  }

  // String response
  if (typeof data === 'string') return data

  // { detail: "..." }
  if (typeof data.detail === 'string') return data.detail

  // { detail: [...] }
  if (Array.isArray(data.detail)) return data.detail.join('. ')

  // { non_field_errors: [...] }
  if (Array.isArray(data.non_field_errors)) return data.non_field_errors.join('. ')

  // { error: "...", code: "...", details: { ... } }
  if (typeof data.error === 'string') {
    if (data.details && typeof data.details === 'object') {
      const fieldErrors = parseFieldMap(data.details as Record<string, unknown>)
      const fieldMessages = Object.entries(fieldErrors).map(
        ([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`,
      )
      if (fieldMessages.length > 0) {
        return `${data.error}: ${fieldMessages.join('; ')}`
      }
    }
    return data.error
  }

  // { message: "..." }
  if (typeof data.message === 'string') return data.message

  // Field-level errors: { field: ["error", ...], ... }
  const messages: string[] = []
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      messages.push(`${key.replace(/_/g, ' ')}: ${(value as string[]).join(', ')}`)
    } else if (typeof value === 'string') {
      messages.push(`${key.replace(/_/g, ' ')}: ${value}`)
    }
  }

  if (messages.length > 0) return messages.join('. ')

  return fallback
}

/**
 * Extract field-level errors from an API error response.
 * Returns a Record mapping field names to their first error message.
 *
 * Handles:
 * - { field: ["err"], ... }                          (DRF flat)
 * - { error: "...", code: "...", details: { ... } }  (backend wrapper)
 */
export function extractFieldErrors(error: unknown): Record<string, string> {
  if (!axios.isAxiosError(error)) return {}

  const data = error.response?.data
  if (!data || typeof data !== 'object') return {}

  // Backend wrapper: { error, code, details: { field: [...] } }
  if (data.details && typeof data.details === 'object') {
    return parseFieldMap(data.details as Record<string, unknown>)
  }

  // Skip if the response is a top-level message shape (not field errors)
  if (data.detail || data.error || data.message) return {}

  // DRF flat field errors: { field: ["err"], ... }
  return parseFieldMap(data as Record<string, unknown>)
}

/**
 * Extract a non-field error message from the API error (detail, non_field_errors, etc.)
 * Returns null if only field-level errors are present.
 */
function extractNonFieldError(error: unknown): string | null {
  if (!axios.isAxiosError(error)) return null

  const data = error.response?.data
  if (!data || typeof data !== 'object') return null

  if (typeof data.detail === 'string') return data.detail
  if (Array.isArray(data.detail)) return data.detail.join('. ')
  if (Array.isArray(data.non_field_errors)) return data.non_field_errors.join('. ')

  // { error: "...", code: "..." } — return the error string as the non-field message
  if (typeof data.error === 'string') return data.error

  if (typeof data.message === 'string') return data.message

  return null
}

/**
 * Apply API field-level errors to a react-hook-form instance.
 * Sets inline errors on matching form fields and returns a toast message
 * for any non-field errors or a generic summary if field errors were applied.
 *
 * Usage:
 *   onError: (err) => {
 *     const msg = applyFieldErrors(err, setError, 'Failed to create')
 *     if (msg) toast.error(msg)
 *   }
 */
export function applyFieldErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fallback = 'Something went wrong',
): string | null {
  const fieldErrors = extractFieldErrors(error)
  const nonFieldMsg = extractNonFieldError(error)

  // Apply field-level errors to the form
  let appliedCount = 0
  for (const [field, message] of Object.entries(fieldErrors)) {
    setError(field as Path<T>, { type: 'server', message })
    appliedCount++
  }

  // Return non-field error for toast, or a summary if only field errors
  if (nonFieldMsg) return nonFieldMsg
  if (appliedCount > 0) return 'Please fix the highlighted errors'

  // No field errors found — fall back to generic extraction
  return extractApiError(error, fallback)
}
