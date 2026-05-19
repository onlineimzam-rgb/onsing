'use client'

import * as React from 'react'
import * as DropdownPrimitive from '@radix-ui/react-dropdown-menu'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import { Check, ChevronRight } from 'lucide-react'
import { cn } from './cn'

// ── Dropdown menu ────────────────────────────────────────────────────────────
export const DropdownMenu = DropdownPrimitive.Root
export const DropdownMenuTrigger = DropdownPrimitive.Trigger

export function DropdownMenuContent({
  children,
  className,
  align = 'end',
  sideOffset = 6,
}: {
  children: React.ReactNode
  className?: string
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
}) {
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          // Portal mounts outside of `.admin-shell`; re-scope variables here.
          'admin-shell',
          'z-50 min-w-[180px] py-1 rounded-[8px]',
          'bg-[#0F1424] ring-1 ring-[var(--a-line-2)] shadow-[0_12px_32px_-8px_rgba(0,0,0,0.6)]',
          'data-[state=open]:animate-fade-in outline-none',
          className
        )}
      >
        {children}
      </DropdownPrimitive.Content>
    </DropdownPrimitive.Portal>
  )
}

export function DropdownMenuItem({
  children,
  onSelect,
  destructive,
  icon,
  shortcut,
  className,
  disabled,
}: {
  children: React.ReactNode
  onSelect?: () => void
  destructive?: boolean
  icon?: React.ReactNode
  shortcut?: string
  className?: string
  disabled?: boolean
}) {
  return (
    <DropdownPrimitive.Item
      onSelect={onSelect}
      disabled={disabled}
      className={cn(
        'flex items-center gap-2.5 px-2.5 py-1.5 text-[12.5px] cursor-pointer outline-none rounded-[5px] mx-1',
        'data-[highlighted]:bg-white/[0.06]',
        destructive
          ? 'text-[var(--a-danger)] data-[highlighted]:bg-[#2A0F15]'
          : 'text-[var(--a-text-2)] data-[highlighted]:text-[var(--a-text-1)]',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {icon && (
        <span className="w-3.5 h-3.5 grid place-items-center text-[var(--a-text-3)]">
          {icon}
        </span>
      )}
      <span className="flex-1">{children}</span>
      {shortcut && (
        <span className="text-[10.5px] font-mono text-[var(--a-text-4)] num">
          {shortcut}
        </span>
      )}
    </DropdownPrimitive.Item>
  )
}

export function DropdownMenuLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-2.5 py-1 text-[10.5px] uppercase tracking-[0.14em] font-semibold text-[var(--a-text-4)]">
      {children}
    </div>
  )
}

export function DropdownMenuSeparator() {
  return <DropdownPrimitive.Separator className="h-px my-1 bg-[var(--a-line)]" />
}

// ── Tooltip ──────────────────────────────────────────────────────────────────
export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <TooltipPrimitive.Provider delayDuration={250}>{children}</TooltipPrimitive.Provider>
}

export const Tooltip = TooltipPrimitive.Root
export const TooltipTrigger = TooltipPrimitive.Trigger

export function TooltipContent({
  children,
  side = 'top',
  className,
}: {
  children: React.ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  className?: string
}) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        side={side}
        sideOffset={6}
        className={cn(
          'admin-shell',
          'z-50 px-2 py-1 rounded-md text-[11px] font-medium',
          'bg-[#0F1424] text-[var(--a-text-1)] ring-1 ring-[var(--a-line-2)] shadow-md',
          'data-[state=delayed-open]:animate-fade-in',
          className
        )}
      >
        {children}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

// ── Switch ───────────────────────────────────────────────────────────────────
export function AdminSwitch({
  checked,
  onCheckedChange,
  disabled,
  className,
}: {
  checked: boolean
  onCheckedChange: (v: boolean) => void
  disabled?: boolean
  className?: string
}) {
  return (
    <SwitchPrimitive.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={cn(
        'relative inline-flex h-[18px] w-[32px] shrink-0 cursor-pointer items-center rounded-full',
        'transition-colors duration-180 outline-none',
        'data-[state=checked]:bg-[var(--a-accent-2)] data-[state=unchecked]:bg-white/10',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      <SwitchPrimitive.Thumb className="block w-3.5 h-3.5 bg-white rounded-full shadow-md transform transition-transform duration-180 data-[state=checked]:translate-x-[15px] data-[state=unchecked]:translate-x-[1.5px]" />
    </SwitchPrimitive.Root>
  )
}
