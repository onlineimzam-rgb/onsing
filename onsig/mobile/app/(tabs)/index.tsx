/**
 * Dashboard — Komuta Merkezi (premium redesign).
 *
 * Layout (top → bottom):
 *   1. Header strip: avatar + greeting + notifications bell with badge.
 *   2. Hero stat card (brand gradient) — bekleyen sözleşme adedi + delta.
 *   3. Secondary stats: tamamlandı (success tone) + haftalık imza adedi.
 *   4. Haftalık performans grafiği — 7 sütun, brand vurgulu son gün.
 *   5. Gerçek zamanlı akış (signed/sent/viewed events).
 *   6. Kritik aksiyonlar (status-coloured cards w/ stronger left rail).
 *
 * Visual rules:
 *   • Background: canvas (#f6f7fb).
 *   • Cards: white, hairline border, soft shadow.
 *   • No glassmorphism, no dark slabs except the hero accent card.
 *   • Skeleton placeholders while loading, never spinners on first paint.
 */
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useEffect, useRef } from 'react'
import {
  Animated,
  Easing,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Avatar } from '@/components/avatar'
import { Card } from '@/components/card'
import { Icon } from '@/components/icon'
import { SectionHeader } from '@/components/section-header'
import { Skeleton } from '@/components/skeleton'
import { useAuthStore } from '@/lib/auth'
import { relativeTime, weekdayLabels } from '@/lib/format'
import { haptic } from '@/lib/haptic'
import { useDashboardSummary } from '@/lib/queries/dashboard'
import { shadows } from '@/lib/shadow'

export default function Dashboard() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const { data, isLoading, isError, error, refetch, isRefetching } = useDashboardSummary()

  const greetingName =
    data?.me.user?.name?.split(' ')[0] || user?.fullName?.split(' ')[0] || ''
  const fullName = data?.me.user?.name || user?.fullName || ''

  const openContract = (id: number) => {
    haptic.tap()
    router.push({ pathname: '/contract/[id]', params: { id: String(id) } })
  }

  return (
    <View className="flex-1 bg-canvas">
      <Header
        name={fullName}
        criticalCount={data?.criticalActions.length ?? 0}
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#7d5af2"
          />
        }
      >
        {/* Greeting */}
        <View className="px-5 pt-2 pb-5">
          <Text className="font-inter text-[13px] text-ink-500">İyi akşamlar,</Text>
          <Text className="font-inter-bold text-h1 text-ink-900 mt-1">
            {greetingName || 'Hoş geldiniz'}
          </Text>
          <View className="mt-1.5">
            <PulseLine />
          </View>
        </View>

        {isError ? (
          <View className="px-5">
            <ErrorCard message={(error as Error)?.message || 'Veri alınamadı'} onRetry={refetch} />
          </View>
        ) : isLoading && !data ? (
          <DashboardSkeleton />
        ) : data ? (
          <>
            {/* Hero stat — pending */}
            <View className="px-5 mb-4">
              <HeroStatCard
                pending={data.stats.pending}
                pendingNew={data.stats.pendingNew}
                onPress={() => router.push({ pathname: '/(tabs)/contracts' })}
              />
            </View>

            {/* Secondary stats */}
            <View className="px-5 flex-row gap-3 mb-6">
              <CompletedStatCard completed={data.stats.completed} />
              <WeeklyStatCard count={data.stats.weeklyCompleted} />
            </View>

            {/* Weekly chart */}
            <View className="px-5 mb-7">
              <WeeklyChart values={data.stats.weekly} total={data.stats.weeklyCompleted} />
            </View>

            {/* Live activity feed */}
            <View className="px-5 mb-7">
              <SectionHeader
                title="Gerçek Zamanlı Akış"
                count={data.liveFeed.length}
                actionLabel={data.liveFeed.length > 0 ? 'Tümü' : undefined}
                onAction={() => router.push({ pathname: '/(tabs)/contracts' })}
              />
              <Card padded="md" elevation="sm">
                {data.liveFeed.length === 0 ? (
                  <EmptyHint
                    icon="bolt"
                    title="Henüz aktivite yok"
                    body="Yeni bir sözleşme oluşturduğunda burada görünecek."
                  />
                ) : (
                  data.liveFeed.map((f, i) => (
                    <FeedRow
                      key={f.id}
                      item={f}
                      isLast={i === data.liveFeed.length - 1}
                      onPress={() => openContract(f.contractId)}
                    />
                  ))
                )}
              </Card>
            </View>

            {/* Critical actions */}
            <View className="px-5">
              <SectionHeader
                title="Kritik Aksiyonlar"
                count={data.criticalActions.length}
              />
              <View className="gap-2.5">
                {data.criticalActions.length === 0 ? (
                  <Card padded="lg" elevation="sm">
                    <EmptyHint
                      icon="check-circle"
                      title="Her şey kontrol altında"
                      body="Bekleyen kritik bir aksiyon yok."
                    />
                  </Card>
                ) : (
                  data.criticalActions.map((a) => (
                    <CriticalRow
                      key={a.contractId}
                      action={a}
                      onPress={() => openContract(a.contractId)}
                    />
                  ))
                )}
              </View>
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  )
}

// ─── Header ──────────────────────────────────────────────────────────────

function Header({ name, criticalCount }: { name: string; criticalCount: number }) {
  const insets = useSafeAreaInsets()
  return (
    <View
      className="px-5 pb-3 flex-row items-center justify-between bg-canvas"
      style={{ paddingTop: insets.top + 10 }}
    >
      <View className="flex-row items-center gap-3 flex-1">
        <Avatar name={name} size="md" />
        <View className="flex-1">
          <Text className="font-inter text-[11px] text-ink-400 uppercase tracking-[1.4px]">
            OnSig
          </Text>
          <Text
            className="font-inter-semibold text-[13px] text-ink-700 mt-0.5"
            numberOfLines={1}
          >
            Komuta Merkezi
          </Text>
        </View>
      </View>
      <Pressable
        className="w-10 h-10 rounded-full bg-card border border-hairline items-center justify-center active:opacity-70"
        style={shadows.xs}
      >
        <Icon name="notifications-none" size={20} color="#2a2d33" />
        {criticalCount > 0 ? (
          <View
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-danger-500 rounded-full items-center justify-center border-2 border-canvas"
          >
            <Text className="font-inter-bold text-[10px] text-white">{criticalCount}</Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  )
}

function PulseLine() {
  const pulse = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start()
  }, [pulse])
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] })
  return (
    <View className="flex-row items-center gap-2">
      <Animated.View
        className="w-1.5 h-1.5 rounded-full bg-success-500"
        style={{ opacity }}
      />
      <Text className="font-inter text-[12px] text-ink-500">
        Sistem aktif · Otomatik senkronizasyon açık
      </Text>
    </View>
  )
}

// ─── Stat cards ──────────────────────────────────────────────────────────

function HeroStatCard({
  pending,
  pendingNew,
  onPress,
}: {
  pending: number
  pendingNew: number
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress} className="active:opacity-95">
      <LinearGradient
        colors={['#7d5af2', '#5a30d0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          { borderRadius: 24, padding: 22, overflow: 'hidden' },
          shadows.brand,
        ]}
      >
        <View className="flex-row items-center justify-between mb-5">
          <View className="flex-row items-center gap-2 px-2.5 py-1 bg-white/15 rounded-full">
            <Icon name="pending-actions" size={13} color="#ffffff" />
            <Text className="font-inter-semibold text-[11px] text-white tracking-wide">
              BEKLEYEN
            </Text>
          </View>
          <Icon name="north-east" size={18} color="rgba(255,255,255,0.85)" />
        </View>
        <View className="flex-row items-baseline gap-2">
          <Text className="font-inter-bold text-white" style={{ fontSize: 44, lineHeight: 48, letterSpacing: -1.5 }}>
            {pending}
          </Text>
          <Text className="font-inter text-white/70 text-[15px]">sözleşme</Text>
        </View>
        <View className="flex-row items-center gap-2 mt-2">
          {pendingNew > 0 ? (
            <View className="flex-row items-center gap-1 px-2 py-0.5 bg-white/20 rounded-full">
              <Icon name="arrow-upward" size={11} color="#ffffff" />
              <Text className="font-inter-semibold text-[11px] text-white">
                {pendingNew} yeni · bu hafta
              </Text>
            </View>
          ) : (
            <Text className="font-inter text-white/60 text-[12px]">Bu hafta yeni yok</Text>
          )}
        </View>
      </LinearGradient>
    </Pressable>
  )
}

function CompletedStatCard({ completed }: { completed: number }) {
  return (
    <Card padded="md" elevation="sm" className="flex-1">
      <View className="flex-row items-center gap-2 mb-3">
        <View className="w-7 h-7 rounded-lg bg-success-50 items-center justify-center">
          <Icon name="task-alt" size={15} color="#047857" />
        </View>
        <Text className="font-inter-semibold text-[11px] text-ink-500 uppercase tracking-wide">
          Tamamlanan
        </Text>
      </View>
      <Text className="font-inter-bold text-ink-900" style={{ fontSize: 26, lineHeight: 30, letterSpacing: -0.6 }}>
        {completed}
      </Text>
      <Text className="font-inter text-[12px] text-ink-400 mt-1">Toplam imzalanan</Text>
    </Card>
  )
}

function WeeklyStatCard({ count }: { count: number }) {
  return (
    <Card padded="md" elevation="sm" className="flex-1">
      <View className="flex-row items-center gap-2 mb-3">
        <View className="w-7 h-7 rounded-lg bg-brand-50 items-center justify-center">
          <Icon name="trending-up" size={15} color="#5a30d0" />
        </View>
        <Text className="font-inter-semibold text-[11px] text-ink-500 uppercase tracking-wide">
          Bu Hafta
        </Text>
      </View>
      <Text className="font-inter-bold text-ink-900" style={{ fontSize: 26, lineHeight: 30, letterSpacing: -0.6 }}>
        {count}
      </Text>
      <Text className="font-inter text-[12px] text-ink-400 mt-1">Yeni imza</Text>
    </Card>
  )
}

// ─── Weekly chart ────────────────────────────────────────────────────────

function WeeklyChart({ values, total }: { values: number[]; total: number }) {
  const max = Math.max(...values, 1)
  const labels = weekdayLabels()
  return (
    <Card padded="lg" elevation="sm">
      <View className="flex-row items-start justify-between mb-4">
        <View>
          <Text className="font-inter-semibold text-[11px] text-ink-500 uppercase tracking-wide">
            Haftalık Performans
          </Text>
          <View className="flex-row items-baseline gap-1.5 mt-1.5">
            <Text className="font-inter-bold text-ink-900" style={{ fontSize: 24, letterSpacing: -0.6 }}>
              {total}
            </Text>
            <Text className="font-inter text-[12px] text-ink-500">imza · son 7 gün</Text>
          </View>
        </View>
        <View className="w-9 h-9 rounded-xl bg-subtle items-center justify-center">
          <Icon name="bar-chart" size={18} color="#6b7280" />
        </View>
      </View>
      <View className="h-20 flex-row items-end justify-between gap-1.5">
        {values.map((v, i) => {
          const isLast = i === values.length - 1
          const heightPct = v === 0 ? 6 : Math.max(12, Math.round((v / max) * 100))
          return (
            <View key={i} className="flex-1 items-center justify-end" style={{ height: '100%' }}>
              <View
                style={{
                  width: '100%',
                  height: `${heightPct}%`,
                  borderRadius: 6,
                  backgroundColor: isLast ? '#7d5af2' : '#e7e9f0',
                }}
              />
            </View>
          )
        })}
      </View>
      <View className="flex-row justify-between mt-2 px-0.5">
        {labels.map((label, i) => (
          <Text
            key={i}
            className={`font-inter-semibold text-[10px] flex-1 text-center ${
              i === labels.length - 1 ? 'text-brand-600' : 'text-ink-400'
            }`}
          >
            {label}
          </Text>
        ))}
      </View>
    </Card>
  )
}

// ─── Feed row ────────────────────────────────────────────────────────────

const FEED_META = {
  signed:  { icon: 'check-circle' as const, color: '#10b981', tint: 'bg-success-50', label: 'imzaladı' },
  sent:    { icon: 'send' as const,         color: '#7d5af2', tint: 'bg-brand-50',   label: 'gönderildi' },
  viewed:  { icon: 'visibility' as const,   color: '#f59e0b', tint: 'bg-warn-50',    label: 'görüntülendi' },
} as const

function FeedRow({
  item,
  isLast,
  onPress,
}: {
  item: {
    kind: 'signed' | 'sent' | 'viewed'
    actor: string | null
    contractTitle: string
    at: string
  }
  isLast: boolean
  onPress: () => void
}) {
  const meta = FEED_META[item.kind]
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-3 py-3 active:opacity-70 ${
        isLast ? '' : 'border-b border-hairline'
      }`}
    >
      <Avatar name={item.actor} size="sm" />
      <View className="flex-1">
        <Text className="font-inter text-[13px] text-ink-700" numberOfLines={1}>
          <Text className="font-inter-semibold text-ink-900">{item.actor || 'Alıcı'}</Text>{' '}
          <Text className="text-ink-500">{meta.label}</Text>
        </Text>
        <Text className="font-inter text-[12px] text-ink-400 mt-0.5" numberOfLines={1}>
          {item.contractTitle}
        </Text>
      </View>
      <View className="items-end gap-1">
        <View className={`w-6 h-6 rounded-full ${meta.tint} items-center justify-center`}>
          <Icon name={meta.icon} size={13} color={meta.color} />
        </View>
        <Text className="font-inter text-[10px] text-ink-400">{relativeTime(item.at)}</Text>
      </View>
    </Pressable>
  )
}

// ─── Critical action row ─────────────────────────────────────────────────

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
    high:   { rail: 'bg-danger-500',  tint: 'bg-danger-50',  text: 'text-danger-700', dot: '#dc2626', label: 'Acil İmza Gerekli' },
    medium: { rail: 'bg-warn-500',    tint: 'bg-warn-50',    text: 'text-warn-700',   dot: '#f59e0b', label: 'Yakın Aksiyon' },
    low:    { rail: 'bg-brand-500',   tint: 'bg-brand-50',   text: 'text-brand-700',  dot: '#7d5af2', label: 'Bekliyor' },
  }[action.severity]

  return (
    <Pressable onPress={onPress} className="active:opacity-95">
      <View className="bg-card border border-hairline rounded-2xl overflow-hidden flex-row" style={shadows.sm}>
        <View className={`w-1 ${severityMeta.rail}`} />
        <View className="flex-1 p-4 flex-row items-center gap-3">
          <View className={`w-10 h-10 rounded-xl ${severityMeta.tint} items-center justify-center`}>
            <Icon name="priority-high" size={18} color={severityMeta.dot} />
          </View>
          <View className="flex-1">
            <Text className="font-inter-semibold text-[14px] text-ink-900" numberOfLines={1}>
              {action.title}
            </Text>
            <View className="flex-row items-center gap-2 mt-1">
              <Text
                className={`font-inter-semibold text-[10px] uppercase tracking-wide ${severityMeta.text}`}
              >
                {severityMeta.label}
              </Text>
              {action.recipientName ? (
                <>
                  <View className="w-0.5 h-0.5 rounded-full bg-ink-300" />
                  <Text className="font-inter text-[12px] text-ink-500" numberOfLines={1}>
                    {action.recipientName}
                  </Text>
                </>
              ) : null}
            </View>
          </View>
          <Icon name="chevron-right" size={18} color="#b9bec6" />
        </View>
      </View>
    </Pressable>
  )
}

// ─── Skeletons & empty/error ─────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <View className="gap-4">
      <View className="px-5">
        <View className="bg-subtle rounded-3xl p-5 h-[140px]" />
      </View>
      <View className="px-5 flex-row gap-3">
        <Skeleton width="100%" height={104} rounded="xl" />
      </View>
      <View className="px-5">
        <Skeleton width="100%" height={180} rounded="xl" />
      </View>
      <View className="px-5">
        <Skeleton width="40%" height={14} rounded="md" />
        <View className="h-3" />
        <Skeleton width="100%" height={64} rounded="xl" />
      </View>
    </View>
  )
}

function EmptyHint({
  icon,
  title,
  body,
}: {
  icon: string
  title: string
  body: string
}) {
  return (
    <View className="py-4 items-center">
      <View className="w-10 h-10 rounded-full bg-subtle items-center justify-center mb-2">
        <Icon name={icon} size={18} color="#6b7280" />
      </View>
      <Text className="font-inter-semibold text-[14px] text-ink-700">{title}</Text>
      <Text className="font-inter text-[12px] text-ink-400 mt-0.5 text-center">{body}</Text>
    </View>
  )
}

function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View className="bg-danger-50 border border-danger-100 rounded-2xl p-4 flex-row items-center gap-3">
      <View className="w-10 h-10 rounded-xl bg-white items-center justify-center" style={shadows.xs}>
        <Icon name="error-outline" size={20} color="#dc2626" />
      </View>
      <View className="flex-1">
        <Text className="font-inter-semibold text-[14px] text-danger-700">Veri alınamadı</Text>
        <Text className="font-inter text-[12px] text-ink-500 mt-0.5" numberOfLines={2}>
          {message}
        </Text>
      </View>
      <Pressable
        onPress={onRetry}
        className="w-10 h-10 rounded-xl bg-white items-center justify-center active:opacity-70"
        style={shadows.xs}
      >
        <Icon name="refresh" size={18} color="#dc2626" />
      </Pressable>
    </View>
  )
}
