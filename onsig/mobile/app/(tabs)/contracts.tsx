/**
 * Sözleşmeler — premium list view.
 *
 * Composition:
 *   • Header: title + new-contract FAB-style button (top-right, sticky).
 *   • Sticky search bar (always rendered, focusable; clears with one tap).
 *   • Horizontal filter chips with counts pulled live from the dataset.
 *   • List of rich rows: avatar (template-derived gradient), title, template
 *     label, status badge, and a right-aligned timestamp.
 *
 * Filtering is client-side (the list is capped at 500 rows on the server).
 * Refresh-on-focus is handled by TanStack Query's window/focus refetch in
 * Phase 0 setup, so we don't need to wire that here.
 */
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Avatar } from '@/components/avatar'
import { Card } from '@/components/card'
import { Icon } from '@/components/icon'
import { Skeleton } from '@/components/skeleton'
import { StatusBadge } from '@/components/status-badge'
import { relativeTime } from '@/lib/format'
import { haptic } from '@/lib/haptic'
import {
  useContractsList,
  type ContractListItem,
  type ContractStatus,
} from '@/lib/queries/contracts'
import { shadows } from '@/lib/shadow'

type Filter = 'all' | ContractStatus

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all',         label: 'Tümü' },
  { id: 'taslak',      label: 'Taslak' },
  { id: 'aktif',       label: 'Bekleyen' },
  { id: 'tamamlandi',  label: 'Tamamlandı' },
]

export default function ContractsList() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const { data, isLoading, isError, error, refetch, isRefetching } = useContractsList()

  const counts = useMemo(() => {
    const out: Record<Filter, number> = { all: 0, taslak: 0, aktif: 0, tamamlandi: 0, iptal: 0 }
    for (const c of data?.items ?? []) {
      out.all++
      const k = c.status as Filter
      if (k in out) out[k]++
    }
    return out
  }, [data])

  const filtered = useMemo(() => {
    if (!data?.items) return []
    let items = data.items
    if (filter !== 'all') items = items.filter((c) => c.status === filter)
    if (query.trim()) {
      const q = query.trim().toLocaleLowerCase('tr-TR')
      items = items.filter((c) => {
        const t = (c.title || c.templateLabel || '').toLocaleLowerCase('tr-TR')
        return t.includes(q)
      })
    }
    return items
  }, [data, filter, query])

  const openContract = (id: number) => {
    haptic.tap()
    router.push({ pathname: '/contract/[id]', params: { id: String(id) } })
  }

  return (
    <View className="flex-1 bg-canvas">
      {/* Header */}
      <View
        className="px-5 pb-3 bg-canvas"
        style={{ paddingTop: insets.top + 10 }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="font-inter text-[11px] text-ink-400 uppercase tracking-[1.4px]">
              OnSig
            </Text>
            <Text className="font-inter-bold text-h1 text-ink-900 mt-0.5 tracking-tight">
              Sözleşmeler
            </Text>
          </View>
          <Pressable
            onPress={() => {
              haptic.light()
              // TODO Phase 3: open new-contract picker
            }}
            className="w-11 h-11 rounded-2xl bg-ink-900 items-center justify-center active:opacity-90"
            style={shadows.md}
          >
            <Icon name="add" size={22} color="#ffffff" />
          </Pressable>
        </View>

        {/* Search */}
        <View
          className="flex-row items-center gap-2 h-11 px-3.5 rounded-xl bg-card border border-hairline"
          style={shadows.xs}
        >
          <Icon name="search" size={18} color="#9097a3" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Sözleşme veya alıcı ara..."
            placeholderTextColor="#9097a3"
            className="flex-1 font-inter text-[14px] text-ink-900"
            style={{ height: 44, paddingVertical: 0 }}
          />
          {query ? (
            <Pressable
              onPress={() => setQuery('')}
              hitSlop={8}
              className="w-5 h-5 rounded-full bg-subtle items-center justify-center"
            >
              <Icon name="close" size={12} color="#6b7280" />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, gap: 8 }}
      >
        {FILTERS.map((f) => {
          const active = f.id === filter
          const count = counts[f.id]
          return (
            <Pressable
              key={f.id}
              onPress={() => {
                haptic.tap()
                setFilter(f.id)
              }}
              className={`flex-row items-center gap-2 px-3.5 py-1.5 rounded-full active:opacity-80 ${
                active
                  ? 'bg-ink-900'
                  : 'bg-card border border-hairline'
              }`}
              style={active ? shadows.sm : undefined}
            >
              <Text
                className={`font-inter-semibold text-[12px] ${
                  active ? 'text-white' : 'text-ink-700'
                }`}
              >
                {f.label}
              </Text>
              <View
                className={`px-1.5 rounded-full ${
                  active ? 'bg-white/15' : 'bg-subtle'
                }`}
                style={{ minWidth: 22, alignItems: 'center' }}
              >
                <Text
                  className={`font-inter-semibold text-[10px] ${
                    active ? 'text-white' : 'text-ink-500'
                  }`}
                >
                  {count}
                </Text>
              </View>
            </Pressable>
          )
        })}
      </ScrollView>

      {/* List */}
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140, gap: 10 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#7d5af2"
          />
        }
      >
        {isError ? (
          <Card padded="lg" elevation="sm">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-xl bg-danger-50 items-center justify-center">
                <Icon name="error-outline" size={20} color="#dc2626" />
              </View>
              <View className="flex-1">
                <Text className="font-inter-semibold text-[14px] text-danger-700">
                  Liste yüklenemedi
                </Text>
                <Text className="font-inter text-[12px] text-ink-500 mt-0.5">
                  {(error as Error)?.message || 'Bağlantı sorunu olabilir.'}
                </Text>
              </View>
            </View>
          </Card>
        ) : isLoading && !data ? (
          <View className="gap-2.5">
            {[0, 1, 2, 3].map((i) => (
              <SkeletonRow key={i} />
            ))}
          </View>
        ) : filtered.length === 0 ? (
          <EmptyState
            hasQuery={!!query}
            filterLabel={FILTERS.find((f) => f.id === filter)?.label}
          />
        ) : (
          filtered.map((c) => (
            <ContractRow key={c.id} contract={c} onPress={() => openContract(c.id)} />
          ))
        )}
      </ScrollView>
    </View>
  )
}

// ─── Row ─────────────────────────────────────────────────────────────────

function ContractRow({
  contract,
  onPress,
}: {
  contract: ContractListItem
  onPress: () => void
}) {
  const headline = contract.title || contract.templateLabel || 'Adsız sözleşme'
  // We don't have a recipient name on the list endpoint yet — derive a stable
  // initials disc from the contract title so each row still has a visual
  // anchor and rows feel personalised.
  return (
    <Pressable onPress={onPress} className="active:opacity-95">
      <View
        className="bg-card border border-hairline rounded-2xl p-4 flex-row items-center gap-3"
        style={shadows.sm}
      >
        <Avatar name={headline} size="md" variant="gradient" />
        <View className="flex-1">
          <Text
            className="font-inter-semibold text-[15px] text-ink-900 leading-snug"
            numberOfLines={1}
          >
            {headline}
          </Text>
          {contract.templateLabel ? (
            <Text className="font-inter text-[12px] text-ink-500 mt-0.5" numberOfLines={1}>
              {contract.templateLabel}
            </Text>
          ) : null}
          <View className="flex-row items-center gap-2 mt-2">
            <StatusBadge status={contract.status} />
            <View className="w-0.5 h-0.5 rounded-full bg-ink-300" />
            <Text className="font-inter text-[11px] text-ink-400">
              {relativeTime(contract.updatedAt)}
            </Text>
          </View>
        </View>
        <Icon name="chevron-right" size={18} color="#b9bec6" />
      </View>
    </Pressable>
  )
}

// ─── Skeleton row ────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <View
      className="bg-card border border-hairline rounded-2xl p-4 flex-row items-center gap-3"
      style={shadows.sm}
    >
      <Skeleton width={40} height={40} rounded="full" />
      <View className="flex-1 gap-2">
        <Skeleton width="70%" height={12} rounded="md" />
        <Skeleton width="45%" height={10} rounded="md" />
        <Skeleton width="55%" height={14} rounded="full" />
      </View>
    </View>
  )
}

// ─── Empty state ─────────────────────────────────────────────────────────

function EmptyState({ hasQuery, filterLabel }: { hasQuery: boolean; filterLabel?: string }) {
  return (
    <Card padded="lg" elevation="flat" className="items-center py-10">
      <View
        className="w-16 h-16 rounded-3xl bg-subtle items-center justify-center mb-4"
      >
        <Icon name={hasQuery ? 'search-off' : 'description'} size={28} color="#9097a3" />
      </View>
      <Text className="font-inter-bold text-[18px] text-ink-900 tracking-tight">
        {hasQuery ? 'Sonuç bulunamadı' : 'Henüz sözleşme yok'}
      </Text>
      <Text
        className="font-inter text-[13px] text-ink-500 mt-1.5 text-center max-w-[280px] leading-relaxed"
      >
        {hasQuery
          ? `"${filterLabel}" filtresinde aramaya uyan kayıt yok. Filtreyi değiştirip tekrar deneyebilirsin.`
          : 'Yeni sözleşme oluşturmak için sağ üstteki + butonunu kullan.'}
      </Text>
    </Card>
  )
}
