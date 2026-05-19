/**
 * Onboarding deck — currently single-slide.
 *
 * Mirrors `stitch_onsig.../onboarding_sayfas_premium`: glass document card with
 * a dashed signature field + a floating AES-256 badge. Light surface, accent
 * color reserved for the keyword highlight and the CTA.
 *
 * TODO: expand to 3 slides (paginated horizontal scroll) — kept single-slide
 * for the first release to ship the auth flow end-to-end.
 */
import { useRouter } from 'expo-router'
import { Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Button } from '@/components/button'
import { Icon } from '@/components/icon'
import { useAuthStore } from '@/lib/auth'

export default function Onboarding() {
  const router = useRouter()
  const setOnboardingSeen = useAuthStore((s) => s.setOnboardingSeen)
  const insets = useSafeAreaInsets()

  async function handleContinue() {
    await setOnboardingSeen()
    router.replace('/(auth)/login')
  }

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}
    >
      {/* Dynamic background swatches */}
      <View className="absolute -top-10 -left-10 w-72 h-72 rounded-full bg-secondary-fixed/40" />
      <View className="absolute -bottom-10 -right-10 w-72 h-72 rounded-full bg-tertiary-fixed/30" />

      {/* Document card visualization */}
      <View className="flex-1 items-center justify-center px-container-padding-mobile">
        <View className="relative">
          {/* Card */}
          <View
            className="w-64 bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-6"
            style={{ transform: [{ rotate: '1deg' }], shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 24, shadowOffset: { width: 0, height: 16 } }}
          >
            <View className="flex-row items-center gap-3 mb-8">
              <View className="w-11 h-11 rounded-xl bg-secondary-container items-center justify-center">
                <Icon name="description" size={22} color="#ffffff" />
              </View>
              <View className="flex-1 gap-2">
                <View className="w-28 h-2.5 bg-on-surface/10 rounded-full" />
                <View className="w-16 h-2 bg-on-surface/5 rounded-full" />
              </View>
            </View>
            <View className="gap-3 mb-6">
              <View className="w-full h-2 bg-on-surface/5 rounded-full" />
              <View className="w-full h-2 bg-on-surface/5 rounded-full" />
              <View className="w-5/6 h-2 bg-on-surface/5 rounded-full" />
              <View className="w-full h-2 bg-on-surface/5 rounded-full" />
              <View className="w-4/6 h-2 bg-on-surface/5 rounded-full" />
            </View>
            <View className="border-t border-outline-variant/40 pt-4">
              <View className="w-full h-16 border-2 border-dashed border-secondary/30 bg-secondary/5 rounded-xl items-center justify-center">
                <Icon name="edit_square" size={28} color="#6b38d4" />
              </View>
              <Text className="font-geist-semibold text-label-caps text-secondary text-center mt-2 uppercase tracking-widest">
                Dijital Onay Alanı
              </Text>
            </View>
          </View>

          {/* Floating security badge */}
          <View
            className="absolute -bottom-4 -right-2 bg-surface-container-lowest rounded-xl border border-tertiary-fixed-dim/40 p-2.5 flex-row items-center gap-1.5"
            style={{ transform: [{ rotate: '3deg' }], shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } }}
          >
            <Icon name="verified_user" size={16} color="#005236" />
            <Text className="font-geist-semibold text-[10px] text-on-tertiary-fixed-variant uppercase">
              AES-256
            </Text>
          </View>
        </View>
      </View>

      {/* Copy + CTA */}
      <View className="px-container-padding-mobile gap-8">
        <View className="items-center gap-3">
          <Text className="font-inter-semibold text-headline-lg-mobile text-on-surface text-center px-2">
            Sözleşmelerinizi <Text className="text-secondary">Saniyeler</Text> İçinde İmzalayın
          </Text>
          <Text className="font-inter text-body-lg text-on-surface-variant text-center px-4">
            Yasal geçerliliği olan dijital imzalarla iş süreçlerinizi hızlandırın. Her an, her yerden güvenle yönetin.
          </Text>
        </View>

        {/* Pagination dots — keep visual rhythm even though we have one slide */}
        <View className="flex-row items-center justify-center gap-2">
          <View className="w-6 h-1.5 rounded-full bg-secondary" />
          <View className="w-1.5 h-1.5 rounded-full bg-surface-container-highest" />
          <View className="w-1.5 h-1.5 rounded-full bg-surface-container-highest" />
        </View>

        <Button label="Devam Et" variant="accent" iconRight="arrow_forward" onPress={handleContinue} />

        <View className="flex-row items-center justify-center gap-1.5">
          <Icon name="lock" size={12} color="#9ca3af" />
          <Text className="font-geist text-label-caps text-on-surface-variant/60 uppercase tracking-wider">
            OnSig Güvenlik Standartları ile korunmaktadır
          </Text>
        </View>
      </View>
    </View>
  )
}
