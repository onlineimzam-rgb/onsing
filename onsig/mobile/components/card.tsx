/**
 * Card — primary surface for grouping content.
 *
 * Replaces the old `bg-surface-container-lowest border border-outline-variant`
 * pattern. By default cards have a 1px hairline border + soft shadow which
 * reads as "lifted" without tipping into glassmorphism.
 *
 * Use `elevation="flat"` when nesting cards inside cards, or for sections that
 * are already inside a surface-toned container.
 */
import { View, type ViewProps } from 'react-native'

import { shadows, type ShadowLevel } from '@/lib/shadow'

interface CardProps extends ViewProps {
  elevation?: 'flat' | ShadowLevel
  padded?: boolean | 'sm' | 'md' | 'lg'
  className?: string
  tone?: 'default' | 'subtle' | 'inverse'
}

const PADDING_MAP = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
} as const

export function Card({
  children,
  elevation = 'sm',
  padded,
  tone = 'default',
  className,
  style,
  ...rest
}: CardProps) {
  const pad =
    padded === true ? PADDING_MAP.md : padded ? PADDING_MAP[padded] : ''
  const toneClass =
    tone === 'inverse'
      ? 'bg-ink-900 border border-ink-800'
      : tone === 'subtle'
        ? 'bg-subtle border border-hairline'
        : 'bg-card border border-hairline'

  return (
    <View
      {...rest}
      className={`rounded-2xl ${toneClass} ${pad} ${className ?? ''}`}
      style={[elevation !== 'flat' ? shadows[elevation] : undefined, style]}
    >
      {children}
    </View>
  )
}
