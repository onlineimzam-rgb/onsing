'use client'

import * as React from 'react'
import * as RadixAccordion from '@radix-ui/react-accordion'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/components/ui/onsig-design-system'

/**
 * FAQ-grade accordion built on @radix-ui/react-accordion.
 *
 * Keyboard, screen-reader, focus management all come from Radix; we only style
 * the chrome (dividers, chevron rotation, smooth height transition).
 */

export function Accordion({
  items,
  defaultValue,
  className,
}: {
  items: { id: string; question: React.ReactNode; answer: React.ReactNode }[]
  defaultValue?: string
  className?: string
}) {
  return (
    <RadixAccordion.Root
      type="single"
      collapsible
      defaultValue={defaultValue}
      className={cn('divide-y divide-divider', className)}
    >
      {items.map((it) => (
        <RadixAccordion.Item key={it.id} value={it.id} className="group">
          <RadixAccordion.Header className="flex">
            <RadixAccordion.Trigger
              className={cn(
                'group flex items-center justify-between w-full text-left',
                'py-5 gap-6 text-base font-semibold tracking-tight text-ink-12',
                'hover:text-iris-10 transition-colors duration-180 outline-none',
                'focus-visible:text-iris-10'
              )}
            >
              <span>{it.question}</span>
              <span
                aria-hidden
                className="grid place-items-center w-7 h-7 rounded-full bg-ink-2 text-ink-9 transition-all duration-220 group-data-[state=open]:bg-iris-1 group-data-[state=open]:text-iris-10 group-data-[state=open]:rotate-180"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </span>
            </RadixAccordion.Trigger>
          </RadixAccordion.Header>
          <RadixAccordion.Content
            className={cn(
              'overflow-hidden text-sm text-ink-8 leading-relaxed',
              'data-[state=open]:animate-accordion-down',
              'data-[state=closed]:animate-accordion-up'
            )}
          >
            <div className="pb-5 pr-10">{it.answer}</div>
          </RadixAccordion.Content>
        </RadixAccordion.Item>
      ))}
    </RadixAccordion.Root>
  )
}
