/**
 * Settings → Profile.
 *
 * Edits the user's display name. Email is rendered as a locked field so the
 * user understands the identity is bound to that address — changing it
 * requires a separate verification flow (Phase 5+).
 *
 * UX choices:
 *   • The submit button stays disabled until the name actually changes
 *     (Linear-style — never let users no-op-save).
 *   • Success shows a tiny green badge above the button for 2s and pops back.
 *   • Errors map field-level vs. global cleanly (no `Alert.alert` modal).
 */
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Avatar } from '@/components/avatar'
import { Button } from '@/components/button'
import { Card } from '@/components/card'
import { Icon } from '@/components/icon'
import { TextField } from '@/components/text-field'
import { useAuthStore } from '@/lib/auth'
import { haptic } from '@/lib/haptic'
import { useUpdateName } from '@/lib/queries/account'
import { shadows } from '@/lib/shadow'

export default function EditProfile() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const user = useAuthStore((s) => s.user)
  const [name, setName] = useState(user?.fullName ?? '')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutation = useUpdateName()
  const dirty = name.trim().length >= 2 && name.trim() !== user?.fullName
  const submitting = mutation.isPending

  // Auto-dismiss the success badge.
  useEffect(() => {
    if (!success) return
    const t = setTimeout(() => setSuccess(false), 1800)
    return () => clearTimeout(t)
  }, [success])

  async function onSave() {
    setError(null)
    try {
      await mutation.mutateAsync({ name: name.trim() })
      haptic.success()
      setSuccess(true)
    } catch (e) {
      haptic.error()
      setError((e as Error)?.message || 'Kaydedilemedi.')
    }
  }

  return (
    <View className="flex-1 bg-canvas">
      <Header onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar preview — updates as the user types */}
        <View className="items-center mb-7 mt-2">
          <Avatar name={name || user?.email} size="xl" />
          <Text className="font-inter text-[12px] text-ink-400 mt-3">
            Adının baş harfleri otomatik kullanılır
          </Text>
        </View>

        <View className="gap-4">
          <TextField
            label="Ad Soyad"
            iconLeft="person"
            value={name}
            onChangeText={(v) => {
              setName(v)
              setError(null)
            }}
            placeholder="Adınızı girin"
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={120}
            error={error}
          />

          {/* Email — locked */}
          <View>
            <Text className="font-inter-semibold text-[12px] text-ink-700 mb-1.5 ml-1">
              E-posta
            </Text>
            <View className="flex-row items-center gap-2 h-[52px] px-3.5 rounded-xl bg-subtle border border-hairline">
              <Icon name="mail" size={18} color="#9097a3" />
              <Text className="flex-1 font-inter text-[15px] text-ink-500" numberOfLines={1}>
                {user?.email}
              </Text>
              <Icon name="lock" size={14} color="#b9bec6" />
            </View>
            <Text className="font-inter text-[12px] text-ink-400 mt-1.5 ml-1">
              E-posta adresini değiştirmek için destek ile iletişime geç.
            </Text>
          </View>

          {/* Membership info — read-only chip */}
          {user?.tenantName ? (
            <Card padded="md" elevation="flat" tone="subtle">
              <Text className="font-inter text-[11px] text-ink-500 uppercase tracking-wider mb-1">
                Organizasyon
              </Text>
              <View className="flex-row items-center gap-2">
                <Icon name="apartment" size={16} color="#0f0f12" />
                <Text className="font-inter-semibold text-[14px] text-ink-900">
                  {user.tenantName}
                </Text>
              </View>
            </Card>
          ) : null}
        </View>

        {success ? (
          <View
            className="flex-row items-center gap-2 px-3 py-2.5 rounded-xl bg-success-50 border border-success-100 mt-6"
          >
            <Icon name="check-circle" size={16} color="#047857" />
            <Text className="font-inter-semibold text-[13px] text-success-700">
              Değişiklikler kaydedildi.
            </Text>
          </View>
        ) : null}

        <View className="mt-6">
          <Button
            label="Kaydet"
            variant="primary"
            iconLeft="save"
            loading={submitting}
            disabled={!dirty}
            onPress={onSave}
          />
        </View>
      </ScrollView>
    </View>
  )
}

function Header({ onBack }: { onBack: () => void }) {
  const insets = useSafeAreaInsets()
  return (
    <View
      className="px-5 pb-3 flex-row items-center justify-between bg-canvas"
      style={{ paddingTop: insets.top + 10 }}
    >
      <Pressable
        onPress={() => {
          haptic.tap()
          onBack()
        }}
        className="w-10 h-10 rounded-full bg-card border border-hairline items-center justify-center active:opacity-70"
        style={shadows.xs}
      >
        <Icon name="arrow-back" size={20} color="#0f0f12" />
      </Pressable>
      <Text className="font-inter-semibold text-[13px] text-ink-500 uppercase tracking-[1.4px]">
        Profilim
      </Text>
      <View className="w-10" />
    </View>
  )
}
