/**
 * OnSig Design System — public surface.
 *
 * Pages should reach for these primitives instead of hand-rolling
 * cards/buttons/badges. Custom subclasses are welcome (composition over
 * prop-explosion) but the look-and-feel of every primitive is owned here.
 */

export { cn } from './cn'
export type { ClassValue } from './cn'

export * from './tokens'
export * from './motion'

export { Card, CardList, CardHeader } from './Card'
export type { CardProps, CardVariant, CardPadding } from './Card'

export { Button, IconButton, ButtonGroup } from './Button'
export type {
  ButtonProps,
  ButtonVariant,
  ButtonSize,
  IconButtonProps,
} from './Button'

export { Badge, Pill, StatusDot } from './Badge'
export type { BadgeProps, BadgeTone, BadgeSize } from './Badge'

export { Stat, StatStrip, Sparkline } from './Stat'
export type { StatProps } from './Stat'

export { EmptyState } from './EmptyState'
export type { EmptyStateProps } from './EmptyState'

export { Section } from './Section'
export type { SectionProps } from './Section'

export { Skeleton, SkeletonText } from './Skeleton'

export { Surface, Divider } from './Surface'
export type { SurfaceProps, SurfaceVariant } from './Surface'

export { Avatar, AvatarStack, initialsOf, avatarGradient } from './Avatar'
export type { AvatarProps, AvatarSize } from './Avatar'

export { Kbd, Shortcut } from './Kbd'

export {
  PageWatermark,
  HashChip,
  SignerRow,
  Timeline,
} from './LegalDoc'
export type { SignerRowProps, TimelineItem } from './LegalDoc'
