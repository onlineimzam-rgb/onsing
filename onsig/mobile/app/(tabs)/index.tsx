/**
 * Dashboard — Phase 1 placeholder that proves the auth flow works end-to-end.
 *
 * The real "Komuta Merkezi" (`stitch_onsig.../dashboard_pro_live`) lands in
 * Phase 2 with live stats, activity feed, and "Kritik Aksiyonlar" cards. For
 * now we just greet the user with their name + tenant and offer a logout
 * affordance so we can validate token + multi-tenant resolution.
 */
import { ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Icon } from '@/components/icon'
import { useAuthStore } from '@/lib/auth'

export default function Dashboard() {
  const insets = useSafeAreaInsets()
  const user = useAuthStore((s) => s.user)

  return (
    <View className="flex-1 bg-background">
      {/* Top app bar */}
      <View
        className="flex-row items-center justify-between px-container-padding-mobile py-3 border-b border-outline-variant/20"
        style={{ paddingTop: insets.top + 12 }}
      >
        <View className="flex-row items-center gap-2">
          <View className="w-8 h-8 bg-primary rounded-lg items-center justify-center">
            <Icon name="auto_graph" size={18} color="#ffffff" />
          </View>
          <Text className="font-inter-bold text-[18px] text-primary tracking-tight">OnSig</Text>
        </View>
        <View className="w-9 h-9 rounded-full bg-secondary-container/10 items-center justify-center border border-outline-variant/30">
          <Icon name="notifications" size={18} color="#191c1d" />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 16, paddingTop: 24 }}
      >
        <Text className="font-geist-semibold text-[11px] text-on-surface-variant/70 uppercase tracking-[0.1em] mb-1">
          Komuta Merkezi
        </Text>
        <Text className="font-inter-bold text-headline-lg-mobile text-primary mb-6">
          {user?.fullName || 'Hoş geldiniz'}
        </Text>

        <View className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-5 gap-3">
          <View className="flex-row items-center gap-2">
            <Icon name="verified_user" size={18} color="#005236" />
            <Text className="font-inter-semibold text-body-lg text-primary">
              Giriş başarılı
            </Text>
          </View>
          <View className="gap-1">
            <Row label="E-posta" value={user?.email ?? '—'} />
            <Row label="Rol" value={user?.role ?? '—'} />
            <Row label="Tenant" value={user?.tenantName ?? '—'} />
          </View>
        </View>

        <Text className="font-inter text-body-sm text-on-surface-variant text-center mt-8 px-6">
          {`Tam dashboard (Komuta Merkezi: canlı akış, kritik aksiyonlar, haftalık performans) Faz 2'de geliyor.`}
        </Text>
      </ScrollView>
    </View>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between items-center">
      <Text className="font-geist-semibold text-[11px] text-on-surface-variant/70 uppercase tracking-wider">
        {label}
      </Text>
      <Text className="font-inter-medium text-body-sm text-primary">{value}</Text>
    </View>
  )
}
