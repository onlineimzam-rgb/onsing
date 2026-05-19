/**
 * Sözleşme detay — premium redesign.
 *
 * Composition (top → bottom):
 *   1. Translucent header (back + menu, both circular icon buttons).
 *   2. Title hero card — status pill, big title, template label, three
 *      meta stats (oluşturulma / son güncelleme / imza ilerleme bar'ı).
 *   3. İmzacılar — premium row with gradient avatar, name, channel
 *      (email/phone/role) and a status pill + timestamp.
 *   4. Sözleşme metni — rendered text in a white card with monospace-leaning
 *      typography, scrollable selectable text.
 *   5. Sticky bottom CTA bar — primary "İmza Davetiyesi Gönder" + secondary
 *      "PDF". (Phase 3 will wire these to actions.)
 */
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Avatar } from '@/components/avatar'
import { Button } from '@/components/button'
import { Card } from '@/components/card'
import { Icon } from '@/components/icon'
import { SectionHeader } from '@/components/section-header'
import { Skeleton } from '@/components/skeleton'
import { StatusBadge } from '@/components/status-badge'
import { relativeTime, shortDate } from '@/lib/format'
import { haptic } from '@/lib/haptic'
import { useContract, type SignSession } from '@/lib/queries/contracts'
import { shadows } from '@/lib/shadow'

export default function ContractDetail() {
  const { id: idParam } = useLocalSearchParams<{ id: string }>()
  const id = Number(idParam)
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { data, isLoading, isError, error } = useContract(Number.isFinite(id) ? id : null)

  const c = data?.contract
  const sessions = data?.signSessions ?? []
  const signedCount = sessions.filter((s) => s.status === 'imzalandi').length
  const totalSessions = sessions.length
  const progress = totalSessions > 0 ? Math.round((signedCount / totalSessions) * 100) : 0

  return (
    <View className="flex-1 bg-canvas">
      {/* Header */}
      <View
        className="px-5 pb-3 flex-row items-center justify-between bg-canvas"
        style={{ paddingTop: insets.top + 10 }}
      >
        <Pressable
          onPress={() => {
            haptic.tap()
            router.back()
          }}
          className="w-10 h-10 rounded-full bg-card border border-hairline items-center justify-center active:opacity-70"
          style={shadows.xs}
        >
          <Icon name="arrow-back" size={20} color="#0f0f12" />
        </Pressable>
        <Text className="font-inter-semibold text-[13px] text-ink-500 uppercase tracking-[1.4px]">
          Sözleşme Detayı
        </Text>
        <Pressable
          className="w-10 h-10 rounded-full bg-card border border-hairline items-center justify-center active:opacity-70"
          style={shadows.xs}
        >
          <Icon name="more-vert" size={20} color="#0f0f12" />
        </Pressable>
      </View>

      {isError ? (
        <View className="px-5 pt-4">
          <Card padded="lg" elevation="sm">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-xl bg-danger-50 items-center justify-center">
                <Icon name="error-outline" size={20} color="#dc2626" />
              </View>
              <View className="flex-1">
                <Text className="font-inter-semibold text-[14px] text-danger-700">
                  Sözleşme yüklenemedi
                </Text>
                <Text className="font-inter text-[12px] text-ink-500 mt-0.5">
                  {(error as Error)?.message || 'Bağlantı sorunu olabilir.'}
                </Text>
              </View>
            </View>
          </Card>
        </View>
      ) : isLoading || !c ? (
        <DetailSkeleton />
      ) : (
        <>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140, paddingTop: 8 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Hero card */}
            <Card padded="lg" elevation="sm" className="mb-6">
              <View className="flex-row items-center gap-2 mb-4">
                <StatusBadge status={c.status} size="md" />
                {c.template?.label ? (
                  <Text className="font-inter text-[12px] text-ink-500" numberOfLines={1}>
                    · {c.template.label}
                  </Text>
                ) : null}
              </View>
              <Text className="font-inter-bold text-h1 text-ink-900 tracking-tight leading-tight">
                {c.title || c.template?.label || 'Adsız sözleşme'}
              </Text>

              {/* Progress strip */}
              {totalSessions > 0 ? (
                <View className="mt-5">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="font-inter-semibold text-[12px] text-ink-700">
                      İmza ilerlemesi
                    </Text>
                    <Text className="font-inter-bold text-[13px] text-ink-900">
                      {signedCount}/{totalSessions}
                      <Text className="font-inter text-[11px] text-ink-400">  · %{progress}</Text>
                    </Text>
                  </View>
                  <View className="h-2 rounded-full bg-subtle overflow-hidden">
                    <View
                      className="h-full rounded-full bg-success-500"
                      style={{ width: `${progress}%` }}
                    />
                  </View>
                </View>
              ) : null}

              {/* Meta row */}
              <View className="flex-row gap-3 mt-5 pt-5 border-t border-hairline">
                <MetaCell
                  icon="event"
                  value={shortDate(c.createdAt)}
                  label="Oluşturulma"
                />
                <View className="w-px h-10 bg-hairline self-center" />
                <MetaCell
                  icon="update"
                  value={relativeTime(c.updatedAt)}
                  label="Son güncelleme"
                />
              </View>
            </Card>

            {/* Sessions */}
            <SectionHeader title="İmzacılar" count={sessions.length} />
            <View className="gap-2 mb-6">
              {sessions.length === 0 ? (
                <Card padded="lg" elevation="flat" className="items-center py-8">
                  <View className="w-12 h-12 rounded-2xl bg-subtle items-center justify-center mb-3">
                    <Icon name="person-add" size={22} color="#9097a3" />
                  </View>
                  <Text className="font-inter-semibold text-[14px] text-ink-700">
                    Henüz imzacı atanmamış
                  </Text>
                  <Text className="font-inter text-[12px] text-ink-400 mt-1 text-center">
                    Aşağıdaki butondan imza davetiyesi gönderebilirsin.
                  </Text>
                </Card>
              ) : (
                sessions.map((s) => <SessionRow key={s.id} session={s} />)
              )}
            </View>

            {/* Rendered contract preview */}
            <SectionHeader title="Sözleşme Metni" />
            <Card padded="lg" elevation="sm">
              <Text
                className="font-inter text-[13px] text-ink-700"
                style={{ lineHeight: 22 }}
                selectable
              >
                {c.renderedText || 'Sözleşme metni henüz oluşturulmadı.'}
              </Text>
            </Card>
          </ScrollView>

          {/* Sticky bottom CTA */}
          <View
            className="absolute left-0 right-0 bottom-0 bg-canvas border-t border-hairline px-5 pt-3 flex-row gap-2"
            style={{ paddingBottom: insets.bottom + 12 }}
          >
            <Button
              label="PDF"
              variant="outline"
              size="md"
              iconLeft="picture-as-pdf"
              fullWidth={false}
              className="px-4"
              onPress={() => {
                haptic.light()
                // TODO Phase 3: download PDF
              }}
            />
            <View className="flex-1">
              <Button
                label="İmza Davetiyesi Gönder"
                variant="brand"
                size="md"
                iconLeft="send"
                onPress={() => {
                  haptic.medium()
                  // TODO Phase 3: open invite modal
                }}
              />
            </View>
          </View>
        </>
      )}
    </View>
  )
}

// ─── Subcomponents ───────────────────────────────────────────────────────

function MetaCell({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <View className="flex-1">
      <View className="flex-row items-center gap-1.5">
        <Icon name={icon} size={14} color="#6b7280" />
        <Text className="font-inter-semibold text-[12px] text-ink-900" numberOfLines={1}>
          {value}
        </Text>
      </View>
      <Text className="font-inter text-[10px] text-ink-400 mt-1 uppercase tracking-wider">
        {label}
      </Text>
    </View>
  )
}

function SessionRow({ session }: { session: SignSession }) {
  const subline =
    session.recipientEmail ||
    session.recipientPhone ||
    (session.role ? session.role.toUpperCase() : 'İmzacı')
  return (
    <View
      className="bg-card border border-hairline rounded-2xl p-3.5 flex-row items-center gap-3"
      style={shadows.sm}
    >
      <Avatar
        name={session.recipientName || session.role}
        size="md"
        status={
          session.status === 'imzalandi'
            ? 'signed'
            : session.status === 'bekliyor'
              ? 'pending'
              : null
        }
      />
      <View className="flex-1">
        <Text className="font-inter-semibold text-[14px] text-ink-900" numberOfLines={1}>
          {session.recipientName || 'İsimsiz alıcı'}
        </Text>
        <Text className="font-inter text-[12px] text-ink-500 mt-0.5" numberOfLines={1}>
          {subline}
        </Text>
      </View>
      <View className="items-end gap-1">
        <StatusBadge status={session.status} />
        {session.signedAt ? (
          <Text className="font-inter text-[10px] text-ink-400">
            {relativeTime(session.signedAt)}
          </Text>
        ) : null}
      </View>
    </View>
  )
}

function DetailSkeleton() {
  return (
    <View className="px-5 pt-2 gap-4">
      <View
        className="bg-card border border-hairline rounded-2xl p-5 gap-3"
        style={shadows.sm}
      >
        <Skeleton width="35%" height={20} rounded="full" />
        <Skeleton width="80%" height={20} rounded="md" />
        <Skeleton width="60%" height={14} rounded="md" />
        <View className="h-4" />
        <Skeleton width="100%" height={8} rounded="full" />
        <View className="flex-row gap-4 mt-3">
          <Skeleton width="40%" height={32} rounded="md" />
          <Skeleton width="40%" height={32} rounded="md" />
        </View>
      </View>
      <Skeleton width="40%" height={14} rounded="md" />
      <View className="gap-2">
        <Skeleton width="100%" height={68} rounded="xl" />
        <Skeleton width="100%" height={68} rounded="xl" />
      </View>
    </View>
  )
}
