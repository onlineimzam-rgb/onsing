/**
 * Profile — Phase 1 minimal version. Final design lands in Phase 4.
 *
 * We keep this lean because what matters first is verifying the logout flow
 * cleanly resets the auth state and routes back into (auth).
 */
import { Alert, Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Icon } from '@/components/icon'
import { useAuthStore } from '@/lib/auth'

export default function Profile() {
  const insets = useSafeAreaInsets()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  function confirmLogout() {
    Alert.alert('Çıkış yap', 'Hesabınızdan çıkmak istediğinize emin misiniz?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Çıkış yap', style: 'destructive', onPress: () => logout() },
    ])
  }

  return (
    <View className="flex-1 bg-background">
      <View
        className="flex-row items-center justify-center px-container-padding-mobile py-3 border-b border-outline-variant/20"
        style={{ paddingTop: insets.top + 12 }}
      >
        <Text className="font-inter-bold text-[18px] text-primary tracking-tight">Profil</Text>
      </View>

      <View className="px-container-padding-mobile pt-8">
        <View className="items-center gap-3 mb-8">
          <View className="w-20 h-20 rounded-3xl bg-secondary-container items-center justify-center">
            <Text className="font-inter-bold text-2xl text-white">
              {(user?.fullName || user?.email || '?').slice(0, 1).toUpperCase()}
            </Text>
          </View>
          <Text className="font-inter-bold text-title-md text-primary">{user?.fullName ?? '—'}</Text>
          <Text className="font-inter text-body-sm text-on-surface-variant">{user?.email ?? '—'}</Text>
        </View>

        <View className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl divide-y divide-outline-variant/30">
          <Row icon="business" label="Tenant" value={user?.tenantName ?? '—'} />
          <Row icon="badge" label="Rol" value={user?.role ?? '—'} />
        </View>

        <Pressable
          onPress={confirmLogout}
          className="mt-8 flex-row items-center justify-center gap-2 h-14 rounded-2xl border border-error/30 bg-error/5 active:opacity-80"
        >
          <Icon name="logout" size={20} color="#ba1a1a" />
          <Text className="font-inter-semibold text-body-lg text-error">Çıkış Yap</Text>
        </Pressable>
      </View>
    </View>
  )
}

function Row({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View className="flex-row items-center gap-3 px-4 py-3.5">
      <View className="w-9 h-9 rounded-xl bg-surface-container items-center justify-center">
        <Icon name={icon} size={18} color="#4c4546" />
      </View>
      <View className="flex-1">
        <Text className="font-geist-semibold text-[10px] tracking-wider text-on-surface-variant/70 uppercase">
          {label}
        </Text>
        <Text className="font-inter-medium text-body-sm text-primary">{value}</Text>
      </View>
    </View>
  )
}
