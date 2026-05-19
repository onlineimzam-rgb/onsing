/**
 * Skeleton — shimmer placeholder used while initial data is loading.
 *
 * A native-driven looping animation pulses the opacity between `0.45 → 1`
 * over ~1.4s. The element renders as a `View` with `bg-subtle` so it always
 * sits within the surface tone of the screen (no harsh chip outlines).
 *
 * Compose multiple <Skeleton /> instances to mirror the final card shape —
 * see `dashboard/index.tsx` for the canonical pattern.
 */
import { useEffect, useRef } from 'react'
import { Animated, Easing, View, type DimensionValue } from 'react-native'

interface SkeletonProps {
  width?: DimensionValue
  height?: number
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  className?: string
}

const RADII = { sm: 6, md: 10, lg: 14, xl: 18, full: 999 } as const

export function Skeleton({ width = '100%', height = 12, rounded = 'md', className }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.5)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.5,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start()
  }, [opacity])

  return (
    <Animated.View
      className={`bg-subtle ${className ?? ''}`}
      style={{
        width,
        height,
        borderRadius: RADII[rounded],
        opacity,
      }}
    />
  )
}

export function SkeletonCard({ height = 96 }: { height?: number }) {
  return (
    <View
      className="bg-card border border-hairline rounded-2xl p-4 gap-3"
      style={{ minHeight: height }}
    >
      <Skeleton width="55%" height={12} rounded="md" />
      <Skeleton width="80%" height={10} rounded="md" />
      <Skeleton width="40%" height={10} rounded="md" />
    </View>
  )
}
