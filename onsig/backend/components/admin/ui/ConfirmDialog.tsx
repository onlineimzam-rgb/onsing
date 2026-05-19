'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { AlertTriangle, Info, ShieldAlert, X } from 'lucide-react'
import { cn } from './cn'
import { AdminButton } from './Button'

/**
 * ConfirmDialog — small, centered modal for destructive / state-changing
 * actions. Built on Radix Dialog so it inherits focus trap + ESC + portal.
 *
 * Three intents:
 *   - info     (neutral, primary CTA)
 *   - warning  (orange accent)
 *   - danger   (red accent, requires typing the confirm phrase if provided)
 */

export type ConfirmIntent = 'info' | 'warning' | 'danger'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  description?: React.ReactNode
  intent?: ConfirmIntent
  confirmLabel?: string
  cancelLabel?: string
  /** When provided, the user must type this phrase to enable confirm. */
  confirmPhrase?: string
  children?: React.ReactNode
  loading?: boolean
  onConfirm: () => void | Promise<void>
}

const intentIcon: Record<ConfirmIntent, React.ComponentType<{ className?: string }>> = {
  info: Info,
  warning: AlertTriangle,
  danger: ShieldAlert,
}

const intentRing: Record<ConfirmIntent, string> = {
  info: 'bg-[color:var(--a-iris-12)] text-[color:var(--a-iris-50)] ring-1 ring-[color:var(--a-iris-30)]',
  warning: 'bg-orange-500/10 text-orange-300 ring-1 ring-orange-500/30',
  danger: 'bg-red-500/10 text-red-300 ring-1 ring-red-500/30',
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  intent = 'info',
  confirmLabel = 'Onayla',
  cancelLabel = 'Vazgeç',
  confirmPhrase,
  children,
  loading = false,
  onConfirm,
}: ConfirmDialogProps) {
  const [typed, setTyped] = React.useState('')
  const Icon = intentIcon[intent]
  const phraseOk = !confirmPhrase || typed.trim() === confirmPhrase

  React.useEffect(() => {
    if (!open) setTyped('')
  }, [open])

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            'admin-shell',
            'fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px]',
            'transition-opacity duration-200 ease-out',
            'data-[state=open]:opacity-100 data-[state=closed]:opacity-0'
          )}
        />
        <DialogPrimitive.Content
          // Open is the default state (opacity-100, scale-100). Closed state
          // explicitly hides + scales down, so the cascade never traps us in
          // an invisible state. See Sheet.tsx for the same rationale.
          //
          // The Portal mounts outside of `.admin-shell`, so we re-apply it here
          // to bring our CSS variables (--a-bg, --a-line, etc.) back into scope.
          style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
          className={cn(
            'admin-shell',
            'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
            'w-[440px] max-w-[92vw]',
            'bg-[var(--a-bg-elev)] text-[var(--a-text-1)]',
            'rounded-xl border border-[var(--a-line-2)] shadow-[0_24px_72px_-24px_rgba(0,0,0,0.65)]',
            'flex flex-col outline-none will-change-transform',
            'transition-all duration-[180ms]',
            'opacity-100 scale-100',
            'data-[state=closed]:opacity-0 data-[state=closed]:scale-[0.96]'
          )}
        >
          <div className="flex items-start gap-3 px-5 pt-5">
            <div className={cn('grid place-items-center w-9 h-9 rounded-lg shrink-0', intentRing[intent])}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogPrimitive.Title className="font-display text-[15px] font-semibold tracking-tight text-[var(--a-text-1)]">
                {title}
              </DialogPrimitive.Title>
              {description && (
                <DialogPrimitive.Description className="mt-1 text-[12.5px] leading-relaxed text-[var(--a-text-3)]">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close
              className="grid place-items-center w-7 h-7 rounded-md text-[var(--a-text-3)] hover:text-[var(--a-text-1)] hover:bg-white/5 transition-colors"
              aria-label="Kapat"
            >
              <X className="w-3.5 h-3.5" />
            </DialogPrimitive.Close>
          </div>

          {children && <div className="px-5 pt-4">{children}</div>}

          {confirmPhrase && (
            <div className="px-5 pt-4">
              <label className="block text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--a-text-3)] mb-1.5">
                Onaylamak için yaz:{' '}
                <span className="font-mono normal-case text-[var(--a-text-1)]">{confirmPhrase}</span>
              </label>
              <input
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder={confirmPhrase}
                autoFocus
                className={cn(
                  'w-full h-9 px-3 rounded-md font-mono text-[12.5px]',
                  'bg-[var(--a-bg)] text-[var(--a-text-1)]',
                  'border border-[var(--a-line-2)] focus:border-[var(--a-iris-40)]',
                  'outline-none transition-colors'
                )}
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 px-5 py-4 mt-5 border-t border-[var(--a-line)] bg-[var(--a-bg)] rounded-b-xl">
            <AdminButton
              variant="secondary"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {cancelLabel}
            </AdminButton>
            <AdminButton
              variant={intent === 'danger' ? 'danger' : 'primary'}
              size="sm"
              onClick={() => void onConfirm()}
              disabled={loading || !phraseOk}
              loading={loading}
            >
              {confirmLabel}
            </AdminButton>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
