import axios from 'axios'
import type { UseFormSetError, FieldValues, Path } from 'react-hook-form'

/**
 * Extract a human-readable error message from an API error response.
 * Handles Django REST Framework error shapes:
 * - { detail: "string" }
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

  // { error: "..." }
  if (typeof data.error === 'string') return data.error

  // { message: "..." }
  if (typeof data.message === 'string') return data.message

  // Field-level errors: { field: ["error", ...], ... }
  const messages: string[] = []
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      const fieldName = key.replace(/_/g, ' ')
      messages.push(`${fieldName}: ${value.join(', ')}`)
    } else if (typeof value === 'string') {
      const fieldName = key.replace(/_/g, ' ')
      messages.push(`${fieldName}: ${value}`)
    }
  }

  if (messages.length > 0) return messages.join('. ')

  return fallback
}

/**
 * Extract field-level errors from an API error response.
 * Returns a Record mapping field names to their first error message.
 * Non-field errors (detail, non_field_errors, error, message) are excluded.
 */
export function extractFieldErrors(error: unknown): Record<string, string> {
  const fieldErrors: Record<string, string> = {}

  if (!axios.isAxiosError(error)) return fieldErrors

  const data = error.response?.data
  if (!data || typeof data !== 'object') return fieldErrors

  // Skip if the response is a top-level message shape (not field errors)
  if (data.detail || data.error || data.message) return fieldErrors

  for (const [key, value] of Object.entries(data)) {
    if (key === 'non_field_errors') continue
    if (Array.isArray(value) && value.length > 0) {
      fieldErrors[key] = value[0]
    } else if (typeof value === 'string') {
      fieldErrors[key] = value
    }
  }

  return fieldErrors
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
