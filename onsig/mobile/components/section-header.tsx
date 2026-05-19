/**
 * SectionHeader — small, consistent heading rendered above every grouped list
 * on a screen. Picks up the design's pattern of "title + small subdued count"
 * with an optional right-side affordance (link to "Tümü", filter pill, …).
 */
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native'

import { Icon } from '@/components/icon'

interface SectionHeaderProps {
  title: string
  count?: number
  subtitle?: string
  actionLabel?: string
  onAction?: () => void
  style?: StyleProp<ViewStyle>
}

export function SectionHeader({
  title,
  count,
  subtitle,
  actionLabel,
  onAction,
  style,
}: SectionHeaderProps) {
  return (
    <View
      className="flex-row items-center justify-between mb-3 px-1"
      style={style}
    >
      <View className="flex-row items-center gap-2 flex-1">
        <Text className="font-inter-bold text-[16px] text-ink-900 tracking-tight">{title}</Text>
        {typeof count === 'number' && count > 0 ? (
          <View className="px-2 py-0.5 bg-subtle rounded-full">
            <Text className="font-inter-semibold text-[11px] text-ink-500">{count}</Text>
          </View>
        ) : null}
        {subtitle ? (
          <Text
            className="font-inter text-[12px] text-ink-400 ml-1"
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          hitSlop={8}
          className="flex-row items-center gap-1 active:opacity-60"
        >
          <Text className="font-inter-semibold text-[12px] text-brand-600">{actionLabel}</Text>
          <Icon name="chevron-right" size={14} color="#6b3fe6" />
        </Pressable>
      ) : null}
    </View>
  )
}
