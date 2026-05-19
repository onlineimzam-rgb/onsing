/**
 * Sözleşme listesi (Contract list).
 *
 * Source design: `stitch_onsig.../s_zle_me_listesi_premium` (interpreted; the
 * mock has fancy hover micro-interactions we can't faithfully port to RN, so
 * we keep the row shape but lean on press-state instead).
 *
 * Filters are local (no backend round-trip per change) since the dataset is
 * bounded by the existing /api/contracts limit of 500.
 */
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Icon } from '@/components/icon'
import { StatusBadge } from '@/components/status-badge'
import { relativeTime } from '@/lib/format'
import {
  useContractsList,
  type ContractListItem,
  type ContractStatus,
} from '@/lib/queries/contracts'

type Filter = 'all' | ContractStatus

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Tümü' },
  { id: 'taslak', label: 'Taslak' },
  { id: 'aktif', label: 'Bekleyen' },
  { id: 'tamamlandi', label: 'Tamamlandı' },
]

export default function ContractsList() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const { data, isLoading, isError, error, refetch, isRefetching } = useContractsList()

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

  return (
    <View className="flex-1 bg-background">
      <View
        className="px-container-padding-mobile pb-3 border-b border-outline-variant/20 bg-background"
        style={{ paddingTop: insets.top + 12 }}
      >
        <View className="flex-row items-center justify-between mb-3">
          <Text className="font-inter-bold text-[20px] text-primary tracking-tight">Sözleşmeler</Text>
          <Pressable
            onPress={() => {
              /* TODO Phase 3: navigate to new-contract picker */
            }}
            className="w-9 h-9 rounded-full bg-secondary-container items-center justify-center active:opacity-80"
          >
            <Icon name="add" size={20} color="#ffffff" />
          </Pressable>
        </View>

        {/* Search */}
        <View className="flex-row items-center gap-2 h-11 px-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/40">
          <Icon name="search" size={18} color="#9ca3af" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Sözleşme ara..."
            placeholderTextColor="#9ca3af"
            className="flex-1 font-inter text-body-sm text-on-surface"
            style={{ height: 44 }}
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Icon name="close" size={18} color="#9ca3af" />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}
      >
        {FILTERS.map((f) => {
          const active = f.id === filter
          return (
            <Pressable
              key={f.id}
              onPress={() => setFilter(f.id)}
              className={`px-3.5 py-1.5 rounded-full border ${
                active
                  ? 'bg-primary border-primary'
                  : 'bg-surface-container-lowest border-outline-variant/40'
              } active:opacity-80`}
            >
              <Text
                className={`font-inter-semibold text-[12px] ${
                  active ? 'text-on-primary' : 'text-on-surface-variant'
                }`}
              >
                {f.label}
              </Text>
            </Pressable>
          )
        })}
      </ScrollView>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120, gap: 8 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#6b38d4" />
        }
      >
        {isError ? (
          <Text className="font-inter text-body-sm text-error text-center mt-8">
            {(error as Error)?.message || 'Liste yüklenemedi.'}
          </Text>
        ) : isLoading && !data ? (
          <View className="py-16 items-center">
            <ActivityIndicator color="#6b38d4" />
          </View>
        ) : filtered.length === 0 ? (
          <View className="py-16 items-center">
            <View className="w-14 h-14 rounded-2xl bg-surface-container items-center justify-center mb-3">
              <Icon name="description" size={26} color="#9ca3af" />
            </View>
            <Text className="font-inter-semibold text-body-lg text-on-surface mb-1">
              {query ? 'Eşleşen sözleşme yok' : 'Henüz sözleşme yok'}
            </Text>
            <Text className="font-inter text-body-sm text-on-surface-variant/70 text-center max-w-[260px]">
              {query
                ? 'Arama kriterlerini değiştirip tekrar dene.'
                : 'Yeni sözleşme oluşturmak için sağ üstteki + butonunu kullan.'}
            </Text>
          </View>
        ) : (
          filtered.map((c) => (
            <ContractRow
              key={c.id}
              contract={c}
              onPress={() =>
                router.push({ pathname: '/contract/[id]', params: { id: String(c.id) } })
              }
            />
          ))
        )}
      </ScrollView>
    </View>
  )
}

function ContractRow({
  contract,
  onPress,
}: {
  contract: ContractListItem
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 active:opacity-80"
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text
            className="font-inter-semibold text-body-lg text-primary leading-snug"
            numberOfLines={2}
          >
            {contract.title || contract.templateLabel || 'Adsız sözleşme'}
          </Text>
          {contract.templateLabel ? (
            <Text className="font-inter text-[11px] text-on-surface-variant/60 mt-1" numberOfLines={1}>
              {contract.templateLabel}
            </Text>
          ) : null}
          <View className="flex-row items-center gap-2 mt-2">
            <StatusBadge status={contract.status} />
            <Text className="font-geist text-[10px] text-on-surface-variant/60 uppercase tracking-wider">
              {relativeTime(contract.updatedAt)}
            </Text>
          </View>
        </View>
        <View className="w-9 h-9 rounded-xl bg-secondary-container/10 items-center justify-center">
          <Icon name="chevron_right" size={20} color="#4c4546" />
        </View>
      </View>
    </Pressable>
  )
}
