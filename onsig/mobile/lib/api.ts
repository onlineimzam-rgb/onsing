/**
 * API client — ky wrapping the backend at `EXPO_PUBLIC_API_URL`.
 *
 * - Reads JWT from the auth store on every request (no stale closure).
 * - On 401, clears the local session so the AuthGate redirects to /(auth)/login.
 */
import ky, { type HTTPError } from 'ky'

import { useAuthStore } from './auth'

const DEFAULT_BASE = 'https://onsig-prod.fly.dev/api'

const baseUrl = (process.env.EXPO_PUBLIC_API_URL || DEFAULT_BASE).replace(/\/$/, '')

export const api = ky.create({
  prefix: baseUrl,
  timeout: 20_000,
  retry: { limit: 1, methods: ['get'] },
  hooks: {
    beforeRequest: [
      ({ request }) => {
        const { token } = useAuthStore.getState()
        if (token) request.headers.set('Authorization', `Bearer ${token}`)
      },
    ],
    afterResponse: [
      async ({ response }) => {
        if (response.status === 401) {
          await useAuthStore.getState().logout()
        }
        return response
      },
    ],
  },
})

/** Type used by API routes for structured error responses. */
export interface ApiErrorBody {
  ok: false
  error: { code: string; message?: string; details?: unknown }
}

/** Pulls a friendly message out of a thrown ky HTTPError. */
export async function readError(err: unknown): Promise<string> {
  const httpErr = err as HTTPError
  if (httpErr?.response) {
    try {
      const body = (await httpErr.response.json()) as ApiErrorBody
      return body?.error?.message || body?.error?.code || `HTTP ${httpErr.response.status}`
    } catch {
      return `HTTP ${httpErr.response.status}`
    }
  }
  return (err as Error)?.message || 'Bilinmeyen hata'
}
