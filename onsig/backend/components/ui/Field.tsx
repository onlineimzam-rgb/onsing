/**
 * Tiny form field primitives used across login/register/contract forms.
 * Server-render friendly (no client hooks).
 */

import type { ReactNode } from 'react'

export interface FieldProps {
  label: string
  htmlFor?: string
  hint?: string
  error?: string | null
  required?: boolean
  children: ReactNode
}

export function Field({ label, htmlFor, hint, error, required, children }: FieldProps) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="text-xs font-semibold text-ink-11 flex items-center gap-1 tracking-tight">
        {label}
        {required && <span className="text-danger">*</span>}
      </span>
      <div className="mt-1.5">{children}</div>
      {hint && !error && (
        <p className="mt-1.5 text-2xs text-ink-7 leading-relaxed">{hint}</p>
      )}
      {error && <p className="mt-1.5 text-2xs text-danger-deep font-medium">{error}</p>}
    </label>
  )
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div className="flex items-start gap-2 rounded-md bg-danger-soft text-danger-deep text-sm px-3 py-2.5 ring-1 ring-inset ring-danger/20">
      <span
        aria-hidden
        className="mt-1 inline-block w-1.5 h-1.5 rounded-full bg-danger shrink-0"
      />
      <span className="leading-relaxed">{message}</span>
    </div>
  )
}
