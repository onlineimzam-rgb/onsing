/**
 * Tiny fetch wrapper shared by client components.
 *
 * - Always `credentials: 'include'` so httpOnly auth cookies travel.
 * - Throws `ApiError` carrying the structured `{ code, message }` payload.
 * - Returns parsed JSON for success responses.
 */

export interface ApiErrorBody {
  code?: string
  message?: string
}

export class ApiError extends Error {
  status: number
  code?: string
  constructor(status: number, body: ApiErrorBody | null) {
    super(body?.message || `API error ${status}`)
    this.status = status
    this.code = body?.code
  }
}

export interface ApiRequestInit extends Omit<RequestInit, 'body'> {
  json?: unknown
}

export async function api<T = unknown>(path: string, init: ApiRequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers || {})
  let body: BodyInit | undefined
  if (init.json !== undefined) {
    headers.set('content-type', 'application/json')
    body = JSON.stringify(init.json)
  }
  const res = await fetch(path, {
    ...init,
    headers,
    body,
    credentials: 'include',
  })
  const isJson = res.headers.get('content-type')?.includes('application/json')
  const parsed = isJson ? await res.json().catch(() => null) : null

  if (!res.ok) {
    const errBody = (parsed && typeof parsed === 'object' && 'error' in parsed
      ? (parsed as { error?: ApiErrorBody }).error
      : null) || null
    throw new ApiError(res.status, errBody)
  }

  return (parsed as T) ?? (undefined as unknown as T)
}
