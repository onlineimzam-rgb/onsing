/**
 * Sözleşme detay (Contract detail).
 *
 * Source design: `stitch_onsig.../s_zle_me_detay_premium`.
 *
 * Top-level layout:
 *   - Custom header with back + share/options
 *   - Title + template label + status badge
 *   - Rendered contract text in a scrollable card (read-only here; the editor
 *     is Phase 3+ work)
 *   - Sign sessions list (recipients) with status + signed-at timestamp
 *   - Bottom CTA reserved for Phase 3 ("Yeni İmza Davetiyesi Gönder")
 */
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Icon } from '@/components/icon'
import { StatusBadge } from '@/components/status-badge'
import { relativeTime, shortDate } from '@/lib/format'
import { useContract, type SignSession } from '@/lib/queries/contracts'

export default function ContractDetail() {
  const { id: idParam } = useLocalSearchParams<{ id: string }>()
  const id = Number(idParam)
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { data, isLoading, isError, error } = useContract(Number.isFinite(id) ? id : null)

  const c = data?.contract
  const sessions = data?.signSessions ?? []

  const signedCount = sessions.filter((s) => s.status === 'imzalandi').length

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View
        className="px-container-padding-mobile pb-3 border-b border-outline-variant/20 bg-background flex-row items-center gap-2"
        style={{ paddingTop: insets.top + 12 }}
      >
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center active:opacity-70 -ml-2"
        >
          <Icon name="arrow_back" size={22} color="#191c1d" />
        </Pressable>
        <Text className="flex-1 font-inter-bold text-[16px] text-primary tracking-tight" numberOfLines={1}>
          {c?.title || c?.template?.label || 'Sözleşme'}
        </Text>
        <Pressable className="w-10 h-10 items-center justify-center active:opacity-70">
          <Icon name="more-vert" size={22} color="#191c1d" />
        </Pressable>
      </View>

      {isError ? (
        <View className="p-4">
          <Text className="font-inter text-body-sm text-error">
            {(error as Error)?.message || 'Sözleşme yüklenemedi.'}
          </Text>
        </View>
      ) : isLoading || !c ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#6b38d4" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140 }}>
          {/* Title block */}
          <View className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 mb-4">
            <View className="flex-row items-center gap-2 mb-2">
              <StatusBadge status={c.status} size="md" />
              {c.template?.label ? (
                <Text className="font-geist-semibold text-[11px] text-on-surface-variant/70 uppercase tracking-wider">
                  · {c.template.label}
                </Text>
              ) : null}
            </View>
            <Text className="font-inter-bold text-[20px] text-primary tracking-tight">
              {c.title || c.template?.label || 'Adsız sözleşme'}
            </Text>
            <View className="flex-row items-center gap-3 mt-3">
              <Stat icon="event" value={shortDate(c.createdAt)} label="Oluşturulma" />
              <View className="w-px h-8 bg-outline-variant/40" />
              <Stat icon="update" value={relativeTime(c.updatedAt)} label="Son güncelleme" />
              <View className="w-px h-8 bg-outline-variant/40" />
              <Stat
                icon="task_alt"
                value={`${signedCount}/${sessions.length || '—'}`}
                label="İmza"
              />
            </View>
          </View>

          {/* Sign sessions */}
          <SectionHeading title="İmza Oturumları" count={sessions.length} />
          <View className="gap-2 mb-6">
            {sessions.length === 0 ? (
              <View className="bg-surface-container-lowest/50 border border-dashed border-outline-variant/40 rounded-xl py-6 px-4 items-center">
                <Icon name="person-add" size={22} color="#9ca3af" />
                <Text className="font-inter text-body-sm text-on-surface-variant/70 mt-2 text-center">
                  Henüz imzacı atanmamış.
                </Text>
              </View>
            ) : (
              sessions.map((s) => <SessionRow key={s.id} session={s} />)
            )}
          </View>

          {/* Rendered contract preview */}
          <SectionHeading title="Sözleşme Metni" />
          <View className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4">
            <Text className="font-inter text-body-sm text-on-surface leading-relaxed" selectable>
              {c.renderedText || 'Sözleşme metni henüz oluşturulmadı.'}
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  )
}

function SectionHeading({ title, count }: { title: string; count?: number }) {
  return (
    <View className="flex-row items-center gap-2 mb-3">
      <Text className="font-inter-semibold text-[15px] text-primary tracking-tight">{title}</Text>
      {typeof count === 'number' && count > 0 ? (
        <View className="px-2 py-0.5 bg-secondary/10 rounded-full">
          <Text className="font-geist-semibold text-[9px] text-secondary uppercase">{count}</Text>
        </View>
      ) : null}
    </View>
  )
}

function Stat({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <View className="flex-1">
      <View className="flex-row items-center gap-1">
        <Icon name={icon} size={14} color="#4c4546" />
        <Text className="font-inter-semibold text-[12px] text-primary" numberOfLines={1}>
          {value}
        </Text>
      </View>
      <Text className="font-geist text-[9px] text-on-surface-variant/60 uppercase tracking-wider mt-0.5">
        {label}
      </Text>
    </View>
  )
}

function SessionRow({ session }: { session: SignSession }) {
  const initials = (session.recipientName || '?').trim().slice(0, 1).toUpperCase()
  const isDone = session.status === 'imzalandi'
  return (
    <View className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-3.5 py-3 flex-row items-center gap-3">
      <View
        className="w-10 h-10 rounded-2xl items-center justify-center"
        style={{ backgroundColor: isDone ? '#4edea322' : '#8455ef22' }}
      >
        <Text
          className="font-inter-bold text-[14px]"
          style={{ color: isDone ? '#005236' : '#6b38d4' }}
        >
          {initials}
        </Text>
      </View>
      <View className="flex-1">
        <Text className="font-inter-semibold text-[13px] text-primary" numberOfLines={1}>
          {session.recipientName || 'İsimsiz'}
        </Text>
        <Text className="font-inter text-[11px] text-on-surface-variant/70" numberOfLines={1}>
          {session.recipientEmail || session.recipientPhone || session.role}
        </Text>
      </View>
      <View className="items-end">
        <StatusBadge status={session.status} />
        {session.signedAt ? (
          <Text className="font-geist text-[10px] text-on-surface-variant/60 mt-1">
            {relativeTime(session.signedAt)}
          </Text>
        ) : null}
      </View>
    </View>
  )
}
