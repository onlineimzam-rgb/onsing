/**
 * Welcome / brand splash — mirrors `stitch_onsig.../a_l_ekran_premium`.
 *
 * Deep obsidian background (#0a0a0a → radial glow), circular brand mark with
 * the `draw` icon, "OnSig" wordmark, subtitle, and a single CTA that pushes
 * the user into the onboarding deck (or login if they've already seen it).
 */
import { useRouter } from 'expo-router'
import { useEffect, useRef } from 'react'
import { Animated, Easing, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Button } from '@/components/button'
import { Icon } from '@/components/icon'
import { useAuthStore } from '@/lib/auth'

export default function Welcome() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const onboardingSeen = useAuthStore((s) => s.onboardingSeen)

  const pulse = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start()
  }, [pulse])

  const glow = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] })
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] })

  return (
    <View className="flex-1 bg-[#0a0a0a]" style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 24 }}>
      {/* Soft radial glow approximated with overlapping low-opacity discs */}
      <View className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-secondary/10" />
      <View className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-secondary/10" />

      <View className="flex-1 items-center justify-center gap-6 px-container-padding-mobile">
        <Animated.View style={{ opacity: glow, transform: [{ scale }] }} className="w-32 h-32 rounded-full border-2 border-white items-center justify-center">
          <Icon name="draw" size={48} color="#ffffff" />
          <View className="flex-row gap-1 mt-2 absolute bottom-6">
            <View className="w-1 h-1 rounded-full bg-white/50" />
            <View className="w-1 h-1 rounded-full bg-white/50" />
            <View className="w-1 h-1 rounded-full bg-white/50" />
          </View>
        </Animated.View>

        <View className="items-center gap-1 mt-2">
          <Text className="font-inter-bold text-[32px] text-white tracking-tight">OnSig</Text>
          <Text className="font-inter text-body-sm text-white/50 tracking-wider">
            Güvenli Dijital İmza Platformu
          </Text>
        </View>
      </View>

      <View className="px-container-padding-mobile gap-4">
        <Button
          variant="dark"
          label="Başlayalım"
          iconRight="arrow_forward"
          onPress={() => router.push(onboardingSeen ? '/(auth)/login' : '/(auth)/onboarding')}
        />
        <View className="flex-row items-center justify-center gap-1.5 opacity-60">
          <Icon name="lock" size={14} color="#ffffff" />
          <Text className="font-geist text-label-caps text-white/60 uppercase tracking-wider">
            Banking-Grade SSL Protection
          </Text>
        </View>
      </View>
    </View>
  )
}
