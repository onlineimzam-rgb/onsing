'use client'

/**
 * Route-level error boundary.
 *
 * Catches uncaught render errors inside the (app), (admin) and (marketing)
 * route trees. We deliberately keep the visual minimal: it's the last thing
 * the user sees when something is wrong, so it must always render even if our
 * design system fails to load.
 *
 * Stack traces are NEVER shown in production — Next.js strips them server-
 * side, but we also hide the `digest` from the visible UI. The digest IS
 * surfaced as a small monospace tag because it's the only handle support has
 * to find the corresponding App Insights exception.
 */

import { useEffect } from 'react'

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'console' in window) {
      console.error('[onsig] route error', error)
    }
  }, [error])

  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
      }}
    >
      <div style={{ maxWidth: 480, textAlign: 'center' }}>
        <h1
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            marginBottom: '0.5rem',
            letterSpacing: '-0.02em',
          }}
        >
          Bir şeyler ters gitti
        </h1>
        <p style={{ color: '#6b7280', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
          Bu hatayı kaydettik, ekibimiz inceliyor. Sayfayı yeniden yükleyebilir
          veya birkaç dakika sonra tekrar deneyebilirsin.
        </p>
        <button
          onClick={reset}
          style={{
            padding: '0.6rem 1.1rem',
            background: '#111827',
            color: '#fff',
            borderRadius: '8px',
            border: 'none',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Tekrar dene
        </button>
        {error.digest && (
          <div
            style={{
              marginTop: '1.5rem',
              fontSize: '0.7rem',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              color: '#9ca3af',
            }}
          >
            ref: {error.digest}
          </div>
        )}
      </div>
    </div>
  )
}
