import axios from 'axios'

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
