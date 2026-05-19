'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from './cn'

/**
 * Sheet — right-side slide-over panel for detail / edit flows. Wraps Radix
 * Dialog and applies admin styling (dark, glass, max-w-[480px]).
 */

export const Sheet = DialogPrimitive.Root
export const SheetTrigger = DialogPrimitive.Trigger
export const SheetClose = DialogPrimitive.Close

export function SheetContent({
  children,
  side = 'right',
  className,
}: {
  children: React.ReactNode
  side?: 'right' | 'left'
  className?: string
}) {
  // CSS transition + Radix's `data-state` instead of @keyframes (keyframes with
  // `backwards`/`both` fill-mode race with HMR and trap Content at opacity 0).
  //
  // We use inline styles for the transform so that we never depend on Tailwind
  // generating a `data-[state=open]:translate-x-0` variant — that variant
  // sometimes loses the cascade race against the base `translate-x-full` and
  // the sheet stays parked off-screen on the right edge.
  const isLeft = side === 'left'
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className={cn(
          'admin-shell',
          'fixed inset-0 z-40 bg-black/55 backdrop-blur-[2px]',
          'transition-opacity duration-200 ease-out',
          'data-[state=closed]:opacity-0'
        )}
      />
      <DialogPrimitive.Content
        style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
        className={cn(
          // The portal mounts outside of `.admin-shell`, so we re-apply it here
          // to bring our CSS variables (--a-bg, --a-line, etc.) back into scope.
          'admin-shell',
          'group fixed top-0 z-50 h-full w-[480px] max-w-[92vw]',
          'bg-[var(--a-bg-elev)] text-[var(--a-text-1)]',
          isLeft
            ? 'left-0 border-r border-[var(--a-line-2)] shadow-[24px_0_64px_-24px_rgba(0,0,0,0.65)]'
            : 'right-0 border-l border-[var(--a-line-2)] shadow-[-24px_0_64px_-24px_rgba(0,0,0,0.65)]',
          'flex flex-col outline-none will-change-transform',
          'transition-transform duration-[220ms]',
          // Open is the default; closed pushes the sheet back off-screen.
          'translate-x-0',
          isLeft
            ? 'data-[state=closed]:-translate-x-full'
            : 'data-[state=closed]:translate-x-full',
          className
        )}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

export function SheetHeader({
  title,
  description,
  className,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4 px-5 py-4 border-b border-[var(--a-line)]',
        className
      )}
    >
      <div className="min-w-0">
        <DialogPrimitive.Title className="font-display text-[15px] font-semibold tracking-tight text-[var(--a-text-1)]">
          {title}
        </DialogPrimitive.Title>
        {description && (
          <DialogPrimitive.Description className="mt-0.5 text-[12px] text-[var(--a-text-3)]">
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
  )
}

export function SheetBody({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex-1 overflow-y-auto px-5 py-5 space-y-5',
        className
      )}
    >
      {children}
    </div>
  )
}

export function SheetFooter({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-2 px-5 py-3 border-t border-[var(--a-line)] bg-[var(--a-bg)]',
        className
      )}
    >
      {children}
    </div>
  )
}
