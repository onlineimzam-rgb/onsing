'use client'

/**
 * Global error boundary — fires when the root layout itself fails to render
 * (e.g. an error inside a Server Component import chain). This component must
 * include its own <html> and <body> tags because the layout above it didn't
 * survive.
 *
 * We keep it deliberately styleless: no Tailwind import, no design system —
 * just inline styles so it works even when the asset graph is broken.
 */

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.error('[onsig] fatal error', error)
    }
  }, [error])

  return (
    <html lang="tr">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0a',
          color: '#fafafa',
          fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 480, padding: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Servis geçici olarak kullanılamıyor
          </h1>
          <p style={{ color: '#a1a1aa', marginBottom: '1.5rem' }}>
            Hatayı kaydettik. Birkaç dakika sonra tekrar dene.
          </p>
          <button
            onClick={reset}
            style={{
              padding: '0.65rem 1.25rem',
              background: '#fafafa',
              color: '#0a0a0a',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Tekrar dene
          </button>
          {error.digest && (
            <div
              style={{
                marginTop: '2rem',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: '0.7rem',
                color: '#52525b',
              }}
            >
              ref: {error.digest}
            </div>
          )}
        </div>
      </body>
    </html>
  )
}
