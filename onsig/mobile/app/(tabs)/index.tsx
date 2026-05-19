/**
 * Komuta Merkezi (Dashboard).
 *
 * Source design: `stitch_onsig.../dashboard_pro_live`.
 *
 * Sections, top to bottom:
 *   1. Greeting strip (KOMUTA MERKEZİ + name, plus "CANLI SİSTEM" pulse dot)
 *   2. Two operational stat cards (light glass + graphite dark)
 *   3. Live activity feed (sign sessions from last events)
 *   4. Critical actions (active contracts with pending signatures, severity-ranked)
 *   5. Weekly performance chart (7-day signed-contract sparkline)
 *
 * Data comes from a single GET /api/dashboard/summary call (see lib/queries/dashboard.ts).
 */
import { useRouter } from 'expo-router'
import { useEffect, useRef } from 'react'
import { ActivityIndicator, Animated, Easing, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
// useSafeAreaInsets is used inside TopBar below — keep import.

import { Icon } from '@/components/icon'
import { useAuthStore } from '@/lib/auth'
import { relativeTime, weekdayLabels } from '@/lib/format'
import { useDashboardSummary } from '@/lib/queries/dashboard'

export default function Dashboard() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const { data, isLoading, isError, error, refetch, isRefetching } = useDashboardSummary()

  const greetingName =
    data?.me.user?.name?.split(' ')[0] || user?.fullName?.split(' ')[0] || 'Hoş geldiniz'

  return (
    <View className="flex-1 bg-background">
      <TopBar pendingCount={data?.stats.pending ?? 0} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 16, paddingTop: 16 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#6b38d4" />
        }
      >
        {/* Greeting */}
        <View className="mb-5 flex-row justify-between items-end">
          <View>
            <Text className="font-geist-semibold text-[11px] text-on-surface-variant/70 uppercase tracking-[0.1em] mb-0.5">
              Komuta Merkezi
            </Text>
            <Text className="font-inter-bold text-[22px] text-primary">{greetingName}</Text>
          </View>
          <LiveDot />
        </View>

        {isError ? (
          <ErrorCard message={(error as Error)?.message || 'Veri alınamadı'} onRetry={refetch} />
        ) : isLoading && !data ? (
          <View className="py-16 items-center">
            <ActivityIndicator color="#6b38d4" />
          </View>
        ) : data ? (
          <>
            {/* Stat cards */}
            <View className="flex-row gap-3 mb-6">
              <PendingCard pending={data.stats.pending} pendingNew={data.stats.pendingNew} />
              <CompletedCard completed={data.stats.completed} weeklyCompleted={data.stats.weeklyCompleted} />
            </View>

            {/* Live activity feed */}
            <SectionHeading title="Gerçek Zamanlı Akış" badge={`${data.liveFeed.length} olay`} />
            <View className="gap-2 mb-6">
              {data.liveFeed.length === 0 ? (
                <EmptyHint message="Henüz aktivite yok." />
              ) : (
                data.liveFeed.map((f) => (
                  <FeedRow
                    key={f.id}
                    item={f}
                    onPress={() =>
                      router.push({ pathname: '/contract/[id]', params: { id: String(f.contractId) } })
                    }
                  />
                ))
              )}
            </View>

            {/* Critical actions */}
            <SectionHeading
              title="Kritik Aksiyonlar"
              right={
                data.criticalActions.length > 0 ? (
                  <Pressable
                    onPress={() => router.push({ pathname: '/(tabs)/contracts' })}
                    className="active:opacity-60 flex-row items-center gap-1"
                  >
                    <Text className="font-geist-semibold text-[10px] text-secondary uppercase tracking-widest">
                      Tümü
                    </Text>
                    <Icon name="keyboard-double-arrow-right" size={14} color="#6b38d4" />
                  </Pressable>
                ) : null
              }
            />
            <View className="gap-2 mb-6">
              {data.criticalActions.length === 0 ? (
                <EmptyHint message="Bekleyen kritik bir aksiyon yok." />
              ) : (
                data.criticalActions.map((a) => (
                  <CriticalRow
                    key={a.contractId}
                    action={a}
                    onPress={() =>
                      router.push({ pathname: '/contract/[id]', params: { id: String(a.contractId) } })
                    }
                  />
                ))
              )}
            </View>

            {/* Weekly performance */}
            <WeeklyChart values={data.stats.weekly} total={data.stats.weeklyCompleted} />
          </>
        ) : null}
      </ScrollView>
    </View>
  )
}

// ─── Subcomponents ───────────────────────────────────────────────────────

function TopBar({ pendingCount }: { pendingCount: number }) {
  const insets = useSafeAreaInsets()
  return (
    <View
      className="flex-row items-center justify-between px-container-padding-mobile py-3 border-b border-outline-variant/20 bg-background"
      style={{ paddingTop: insets.top + 12 }}
    >
      <View className="flex-row items-center gap-2">
        <View className="w-8 h-8 bg-primary rounded-lg items-center justify-center">
          <Icon name="auto_graph" size={18} color="#ffffff" />
        </View>
        <Text className="font-inter-bold text-[18px] text-primary tracking-tight">OnSig</Text>
      </View>
      <View className="flex-row items-center gap-2">
        {pendingCount > 0 ? (
          <View className="flex-row items-center gap-1.5 px-2 py-1 rounded-full bg-secondary/10">
            <View className="w-1.5 h-1.5 rounded-full bg-secondary" />
            <Text className="font-geist-semibold text-[10px] text-secondary uppercase tracking-wide">
              {pendingCount} bekleyen
            </Text>
          </View>
        ) : null}
        <View className="w-9 h-9 rounded-full bg-surface-container-low items-center justify-center border border-outline-variant/30">
          <Icon name="notifications" size={18} color="#191c1d" />
        </View>
      </View>
    </View>
  )
}

function LiveDot() {
  const pulse = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start()
  }, [pulse])
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] })

  return (
    <View className="flex-row items-center gap-2 bg-surface-container-lowest/60 px-2 py-1 rounded-full border border-outline-variant/30">
      <Animated.View style={{ opacity }} className="w-1.5 h-1.5 bg-tertiary-fixed-dim rounded-full" />
      <Text className="font-geist-semibold text-[10px] text-on-surface-variant uppercase tracking-wider">
        Canlı Sistem
      </Text>
    </View>
  )
}

function PendingCard({ pending, pendingNew }: { pending: number; pendingNew: number }) {
  return (
    <View className="flex-1 bg-surface-container-lowest border border-outline-variant/40 p-4 rounded-2xl h-28 justify-between">
      <View className="flex-row items-center justify-between">
        <Icon name="pending_actions" size={18} color="#8455ef" />
        <Sparkline heights={[40, 60, 80, 50]} color="rgba(132,85,239," accentLast />
      </View>
      <View>
        <View className="flex-row items-baseline gap-1">
          <Text className="font-inter-bold text-2xl text-primary leading-none">{pending}</Text>
          {pendingNew > 0 ? (
            <Text className="font-geist-semibold text-[9px] text-secondary uppercase">
              +{pendingNew} YENİ
            </Text>
          ) : null}
        </View>
        <Text className="font-geist-semibold text-[9px] text-on-surface-variant/60 uppercase tracking-widest mt-1">
          Bekleyen Sözleşme
        </Text>
      </View>
    </View>
  )
}

function CompletedCard({
  completed,
  weeklyCompleted,
}: {
  completed: number
  weeklyCompleted: number
}) {
  return (
    <View className="flex-1 bg-primary-container p-4 rounded-2xl h-28 justify-between">
      <View className="flex-row items-center justify-between">
        <Icon name="task_alt" size={18} color="#4edea3" />
        <Sparkline heights={[30, 50, 80, 70]} color="rgba(255,255,255," accentLast accentColor="#4edea3" />
      </View>
      <View>
        <Text className="font-inter-bold text-2xl text-white leading-none">{completed}</Text>
        <Text className="font-geist-semibold text-[9px] text-white/40 uppercase tracking-widest mt-1">
          Tamamlanan
          {weeklyCompleted > 0 ? ` · +${weeklyCompleted} BU HAFTA` : ''}
        </Text>
      </View>
    </View>
  )
}

function Sparkline({
  heights,
  color,
  accentLast,
  accentColor = '#8455ef',
}: {
  heights: number[]
  color: string
  accentLast?: boolean
  accentColor?: string
}) {
  return (
    <View className="flex-row items-end gap-0.5 h-5">
      {heights.map((h, i) => {
        const isLast = i === heights.length - 1
        return (
          <View
            key={i}
            style={{
              width: 3,
              height: `${h}%`,
              backgroundColor: accentLast && isLast ? accentColor : `${color}${0.15 + i * 0.15})`,
              borderRadius: 1,
            }}
          />
        )
      })}
    </View>
  )
}

function SectionHeading({
  title,
  badge,
  right,
}: {
  title: string
  badge?: string
  right?: React.ReactNode
}) {
  return (
    <View className="flex-row items-center justify-between mb-3">
      <View className="flex-row items-center gap-2">
        <Text className="font-inter-semibold text-[15px] text-primary tracking-tight">{title}</Text>
        {badge ? (
          <View className="px-2 py-0.5 bg-secondary/10 rounded-full">
            <Text className="font-geist-semibold text-[9px] text-secondary uppercase">{badge}</Text>
          </View>
        ) : null}
      </View>
      {right}
    </View>
  )
}

function FeedRow({
  item,
  onPress,
}: {
  item: {
    kind: 'signed' | 'sent' | 'viewed'
    actor: string | null
    contractTitle: string
    at: string
  }
  onPress: () => void
}) {
  const meta = {
    signed: { icon: 'edit-note' as const, color: '#4edea3', label: 'imzaladı' },
    sent: { icon: 'send' as const, color: '#8455ef', label: 'gönderildi' },
    viewed: { icon: 'visibility' as const, color: '#f59e0b', label: 'görüntülendi' },
  }[item.kind]

  return (
    <Pressable
      onPress={onPress}
      className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-3.5 py-3 flex-row items-center justify-between active:opacity-80"
    >
      <View className="flex-row items-center gap-3 flex-1">
        <View
          className="w-9 h-9 rounded-full items-center justify-center"
          style={{ backgroundColor: `${meta.color}22` }}
        >
          <Icon name={meta.icon} size={18} color={meta.color} />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center gap-1.5">
            <Text className="font-inter-semibold text-[13px] text-primary" numberOfLines={1}>
              {item.actor || 'Alıcı'}
            </Text>
            <Text className="font-inter text-[11px] text-on-surface-variant">{meta.label}</Text>
            <View className="w-1 h-1 rounded-full bg-outline-variant" />
            <Text className="font-inter text-[11px] text-secondary">{relativeTime(item.at)}</Text>
          </View>
          <Text
            className="font-inter text-[11px] text-on-surface-variant/70 mt-0.5"
            numberOfLines={1}
          >
            {item.contractTitle}
          </Text>
        </View>
      </View>
      <Icon name="arrow_outward" size={16} color="#cfc4c5" />
    </Pressable>
  )
}

function CriticalRow({
  action,
  onPress,
}: {
  action: {
    title: string
    recipientName: string | null
    severity: 'high' | 'medium' | 'low'
    createdAt: string
  }
  onPress: () => void
}) {
  const severityMeta = {
    high: { color: '#ba1a1a', label: 'Acil İmza Gerekli', border: 'border-l-error' },
    medium: { color: '#f59e0b', label: 'Yakın Aksiyon', border: 'border-l-[#f59e0b]' },
    low: { color: '#6b38d4', label: 'Bekliyor', border: 'border-l-secondary' },
  }[action.severity]

  return (
    <Pressable
      onPress={onPress}
      className={`bg-surface-container-lowest border border-outline-variant/30 border-l-4 ${severityMeta.border} rounded-xl px-3.5 py-3.5 flex-row items-center justify-between active:opacity-80`}
    >
      <View className="flex-row items-center gap-3 flex-1">
        <View
          className="w-10 h-10 rounded-xl items-center justify-center border"
          style={{ backgroundColor: `${severityMeta.color}10`, borderColor: `${severityMeta.color}30` }}
        >
          <Icon name="priority_high" size={18} color={severityMeta.color} />
        </View>
        <View className="flex-1">
          <Text className="font-inter-semibold text-[13px] text-primary" numberOfLines={1}>
            {action.title}
          </Text>
          <View className="flex-row items-center gap-2 mt-0.5">
            <Text className="font-inter text-[11px] text-on-surface-variant/70" numberOfLines={1}>
              {action.recipientName || 'Alıcı atanmamış'}
            </Text>
            <View className="w-0.5 h-0.5 rounded-full bg-outline-variant" />
            <Text
              className="font-geist-semibold text-[10px] uppercase"
              style={{ color: severityMeta.color }}
            >
              {severityMeta.label}
            </Text>
          </View>
        </View>
      </View>
      <Icon name="chevron_right" size={20} color="#cfc4c5" />
    </Pressable>
  )
}

function WeeklyChart({ values, total }: { values: number[]; total: number }) {
  const max = Math.max(...values, 1)
  const labels = weekdayLabels()
  return (
    <View className="bg-primary-container p-4 rounded-3xl mt-2">
      <View className="flex-row items-start justify-between mb-4">
        <View>
          <Text className="font-geist-semibold text-[10px] text-white/80 uppercase tracking-widest">
            Haftalık Performans
          </Text>
          <Text className="font-inter-bold text-2xl text-white mt-1">
            {total}
            <Text className="font-inter text-[11px] text-tertiary-fixed-dim">  imza</Text>
          </Text>
        </View>
        <View className="w-10 h-10 rounded-full bg-white/5 items-center justify-center">
          <Icon name="query_stats" size={18} color="#9ca3af" />
        </View>
      </View>
      <View className="h-16 flex-row items-end justify-between gap-1">
        {values.map((v, i) => {
          const heightPct = Math.max(8, Math.round((v / max) * 100))
          const isLast = i === values.length - 1
          return (
            <View key={i} className="flex-1 items-center" style={{ height: '100%' }}>
              <View style={{ flex: 1 }} />
              <View
                className="w-full rounded-t"
                style={{
                  height: `${heightPct}%`,
                  backgroundColor: isLast ? '#8455ef' : 'rgba(255,255,255,0.15)',
                  shadowColor: isLast ? '#8455ef' : 'transparent',
                  shadowOpacity: isLast ? 0.4 : 0,
                  shadowRadius: 8,
                }}
              />
            </View>
          )
        })}
      </View>
      <View className="flex-row justify-between mt-2">
        {labels.map((label, i) => (
          <Text key={i} className="font-geist text-[8px] text-white/30 uppercase">
            {label}
          </Text>
        ))}
      </View>
    </View>
  )
}

function EmptyHint({ message }: { message: string }) {
  return (
    <View className="bg-surface-container-lowest/50 border border-dashed border-outline-variant/40 rounded-xl py-6 items-center">
      <Text className="font-inter text-body-sm text-on-surface-variant/60">{message}</Text>
    </View>
  )
}

function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View className="bg-error/10 border border-error/30 rounded-2xl p-4 flex-row items-center gap-3">
      <Icon name="error-outline" size={24} color="#ba1a1a" />
      <View className="flex-1">
        <Text className="font-inter-semibold text-body-sm text-error">Veri alınamadı</Text>
        <Text className="font-inter text-[11px] text-on-surface-variant/70 mt-0.5" numberOfLines={2}>
          {message}
        </Text>
      </View>
      <Pressable onPress={onRetry} className="active:opacity-60">
        <Icon name="refresh" size={20} color="#ba1a1a" />
      </Pressable>
    </View>
  )
}
