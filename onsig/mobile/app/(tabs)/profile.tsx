/**
 * Profile — premium redesign matching the dashboard/contracts visual system.
 *
 * Composition:
 *   1. Page header with title + settings icon-button.
 *   2. Identity hero card — xl gradient avatar, name, email, tenant chip.
 *   3. Account info card — two rows (tenant, role) with subtle icons.
 *   4. Preferences card — three rows (notifications, security, language)
 *      stubbed for now; right chevrons hint at coming detail pages.
 *   5. Footer: app version + destructive logout in `danger` button variant.
 */
import { useRouter } from 'expo-router'
import { Alert, Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Avatar } from '@/components/avatar'
import { Button } from '@/components/button'
import { Card } from '@/components/card'
import { Icon } from '@/components/icon'
import { useAuthStore } from '@/lib/auth'
import { haptic } from '@/lib/haptic'
import { shadows } from '@/lib/shadow'

type ListRoute = '/settings/profile' | '/settings/password'

const ROLE_LABELS: Record<string, string> = {
  owner: 'Sahip',
  admin: 'Yönetici',
  member: 'Üye',
  viewer: 'Görüntüleyici',
}

export default function Profile() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const go = (pathname: ListRoute) => {
    haptic.tap()
    router.push({ pathname })
  }

  function confirmLogout() {
    haptic.warning()
    Alert.alert('Çıkış yap', 'Hesabınızdan çıkmak istediğinize emin misiniz?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Çıkış yap', style: 'destructive', onPress: () => logout() },
    ])
  }

  return (
    <View className="flex-1 bg-canvas">
      {/* Header */}
      <View
        className="px-5 pb-3 flex-row items-center justify-between bg-canvas"
        style={{ paddingTop: insets.top + 10 }}
      >
        <View>
          <Text className="font-inter text-[11px] text-ink-400 uppercase tracking-[1.4px]">
            OnSig
          </Text>
          <Text className="font-inter-bold text-h1 text-ink-900 mt-0.5 tracking-tight">
            Profil
          </Text>
        </View>
        <Pressable
          onPress={() => go('/settings/profile')}
          className="w-10 h-10 rounded-full bg-card border border-hairline items-center justify-center active:opacity-70"
          style={shadows.xs}
        >
          <Icon name="settings" size={20} color="#0f0f12" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 160 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Identity hero */}
        <Card padded="lg" elevation="sm" className="items-center mb-6 py-8">
          <Avatar name={user?.fullName || user?.email} size="xl" />
          <Text className="font-inter-bold text-[20px] text-ink-900 tracking-tight mt-4">
            {user?.fullName || '—'}
          </Text>
          <Text className="font-inter text-[13px] text-ink-500 mt-1">{user?.email || '—'}</Text>
          {user?.tenantName ? (
            <View className="flex-row items-center gap-1.5 px-3 py-1.5 mt-4 bg-brand-50 rounded-full">
              <Icon name="apartment" size={13} color="#5a30d0" />
              <Text className="font-inter-semibold text-[12px] text-brand-700">
                {user.tenantName}
              </Text>
            </View>
          ) : null}
        </Card>

        {/* Account info */}
        <Text className="font-inter-semibold text-[11px] text-ink-500 uppercase tracking-wide mb-2 px-1">
          Hesap
        </Text>
        <Card padded={false} elevation="sm" className="mb-6">
          <ListRow
            icon="person"
            label="Profilim"
            value={user?.fullName || '—'}
            chevron
            onPress={() => go('/settings/profile')}
          />
          <View className="h-px bg-hairline mx-4" />
          <ListRow
            icon="apartment"
            label="Organizasyon"
            value={user?.tenantName || '—'}
          />
          <View className="h-px bg-hairline mx-4" />
          <ListRow
            icon="badge"
            label="Rol"
            value={ROLE_LABELS[user?.role ?? ''] || user?.role || '—'}
          />
        </Card>

        {/* Preferences */}
        <Text className="font-inter-semibold text-[11px] text-ink-500 uppercase tracking-wide mb-2 px-1">
          Güvenlik ve Tercihler
        </Text>
        <Card padded={false} elevation="sm" className="mb-8">
          <ListRow
            icon="lock"
            label="Şifre"
            value="Değiştir"
            chevron
            onPress={() => go('/settings/password')}
          />
          <View className="h-px bg-hairline mx-4" />
          <ListRow icon="notifications" label="Bildirimler" value="Yakında" />
          <View className="h-px bg-hairline mx-4" />
          <ListRow icon="language" label="Dil" value="Türkçe" />
        </Card>

        {/* Footer */}
        <Button
          label="Çıkış Yap"
          variant="outline"
          iconLeft="logout"
          onPress={confirmLogout}
        />
        <Text className="font-inter text-[11px] text-ink-400 text-center mt-5">
          OnSig Mobile · 0.1.0
        </Text>
      </ScrollView>
    </View>
  )
}

// ─── Row ─────────────────────────────────────────────────────────────────

function ListRow({
  icon,
  label,
  value,
  chevron,
  onPress,
}: {
  icon: string
  label: string
  value: string
  chevron?: boolean
  onPress?: () => void
}) {
  const Body = (
    <View className="flex-row items-center gap-3 px-4 py-3.5">
      <View className="w-9 h-9 rounded-xl bg-subtle items-center justify-center">
        <Icon name={icon} size={17} color="#2a2d33" />
      </View>
      <View className="flex-1">
        <Text className="font-inter text-[11px] text-ink-400 uppercase tracking-wider">
          {label}
        </Text>
        <Text className="font-inter-semibold text-[14px] text-ink-900 mt-0.5" numberOfLines={1}>
          {value}
        </Text>
      </View>
      {chevron ? <Icon name="chevron-right" size={18} color="#b9bec6" /> : null}
    </View>
  )
  if (onPress) {
    return (
      <Pressable onPress={onPress} className="active:opacity-70">
        {Body}
      </Pressable>
    )
  }
  return Body
}
