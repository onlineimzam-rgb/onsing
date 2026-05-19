/**
 * Settings → Change Password.
 *
 * Three inputs: current, new, confirm. We deliberately don't expose a
 * "show/hide everything" toggle — the per-field eye icon (built into
 * TextField) is enough and avoids accidental over-exposure of credentials.
 *
 * Validation (client-side mirrors the Zod schema in /api/auth/change-password):
 *   • new password ≥ 8 chars
 *   • confirm matches new
 *   • new ≠ current
 *
 * Errors from the backend (`invalid_current`, `same_password`, `rate_limited`)
 * are surfaced inline. On success we pop back automatically after a 1.4s
 * confirmation strip.
 */
import { useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Button } from '@/components/button'
import { Icon } from '@/components/icon'
import { TextField } from '@/components/text-field'
import { haptic } from '@/lib/haptic'
import { useChangePassword } from '@/lib/queries/account'
import { shadows } from '@/lib/shadow'

interface FieldErrors {
  current?: string
  next?: string
  confirm?: string
  global?: string
}

export default function ChangePassword() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [success, setSuccess] = useState(false)
  const mutation = useChangePassword()

  // Auto-pop after success.
  useEffect(() => {
    if (!success) return
    const t = setTimeout(() => router.back(), 1400)
    return () => clearTimeout(t)
  }, [success, router])

  const strength = passwordStrength(next)

  const canSubmit = useMemo(
    () =>
      current.length >= 1 &&
      next.length >= 8 &&
      confirm.length >= 1 &&
      !mutation.isPending,
    [current, next, confirm, mutation.isPending]
  )

  function validate(): FieldErrors {
    const e: FieldErrors = {}
    if (current.length === 0) e.current = 'Mevcut şifrenizi girin.'
    if (next.length < 8) e.next = 'En az 8 karakter olmalı.'
    if (next === current && next.length > 0) e.next = 'Yeni şifre eskisinden farklı olmalı.'
    if (confirm !== next) e.confirm = 'Şifreler eşleşmiyor.'
    return e
  }

  async function onSubmit() {
    const e = validate()
    if (Object.keys(e).length > 0) {
      setErrors(e)
      haptic.error()
      return
    }
    setErrors({})
    try {
      await mutation.mutateAsync({ currentPassword: current, newPassword: next })
      haptic.success()
      setSuccess(true)
    } catch (err) {
      haptic.error()
      const msg = (err as Error)?.message || ''
      // ky throws on non-2xx; the body still came through but we don't have
      // direct access without a custom parser, so we map by message keyword.
      if (/mevcut.*hatal/i.test(msg) || /401/.test(msg)) {
        setErrors({ current: 'Mevcut şifre hatalı.' })
      } else if (/same_password|farkl/i.test(msg)) {
        setErrors({ next: 'Yeni şifre eskisinden farklı olmalı.' })
      } else if (/rate_limited|429/i.test(msg)) {
        setErrors({ global: 'Çok fazla deneme. 15 dakika sonra tekrar dene.' })
      } else {
        setErrors({ global: 'Şifre değiştirilemedi. Lütfen tekrar dene.' })
      }
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
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero */}
        <View className="items-center my-6">
          <View
            className="w-16 h-16 rounded-2xl bg-brand-50 items-center justify-center"
            style={shadows.xs}
          >
            <Icon name="lock" size={28} color="#5a30d0" />
          </View>
          <Text className="font-inter-bold text-[20px] text-ink-900 tracking-tight mt-4">
            Şifre Değiştir
          </Text>
          <Text className="font-inter text-[13px] text-ink-500 mt-1.5 text-center max-w-[280px]">
            Güvenliğin için mevcut şifreni doğrulamamız gerekiyor.
          </Text>
        </View>

        <View className="gap-4">
          <TextField
            label="Mevcut Şifre"
            iconLeft="lock"
            value={current}
            onChangeText={(v) => {
              setCurrent(v)
              setErrors((e) => ({ ...e, current: undefined, global: undefined }))
            }}
            placeholder="Mevcut şifreniz"
            secure
            autoComplete="current-password"
            textContentType="password"
            error={errors.current}
          />

          <TextField
            label="Yeni Şifre"
            iconLeft="key"
            value={next}
            onChangeText={(v) => {
              setNext(v)
              setErrors((e) => ({ ...e, next: undefined, global: undefined }))
            }}
            placeholder="En az 8 karakter"
            secure
            autoComplete="new-password"
            textContentType="newPassword"
            error={errors.next}
          />

          {next.length > 0 ? <StrengthMeter strength={strength} /> : null}

          <TextField
            label="Yeni Şifre (Tekrar)"
            iconLeft="lock"
            value={confirm}
            onChangeText={(v) => {
              setConfirm(v)
              setErrors((e) => ({ ...e, confirm: undefined }))
            }}
            placeholder="Yeni şifreyi tekrar girin"
            secure
            autoComplete="new-password"
            textContentType="newPassword"
            error={errors.confirm}
          />
        </View>

        {errors.global ? (
          <View
            className="flex-row items-center gap-2 px-3 py-2.5 rounded-xl bg-danger-50 border border-danger-100 mt-5"
          >
            <Icon name="error-outline" size={16} color="#b91c1c" />
            <Text className="font-inter-semibold text-[13px] text-danger-700 flex-1">
              {errors.global}
            </Text>
          </View>
        ) : null}

        {success ? (
          <View
            className="flex-row items-center gap-2 px-3 py-2.5 rounded-xl bg-success-50 border border-success-100 mt-5"
          >
            <Icon name="check-circle" size={16} color="#047857" />
            <Text className="font-inter-semibold text-[13px] text-success-700 flex-1">
              Şifren başarıyla güncellendi.
            </Text>
          </View>
        ) : null}

        <View className="mt-6">
          <Button
            label="Şifreyi Değiştir"
            variant="primary"
            iconLeft="security"
            loading={mutation.isPending}
            disabled={!canSubmit}
            onPress={onSubmit}
          />
        </View>
      </ScrollView>
    </View>
  )
}

// ─── Header & strength meter ─────────────────────────────────────────────

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
        Güvenlik
      </Text>
      <View className="w-10" />
    </View>
  )
}

interface StrengthMeta {
  score: 0 | 1 | 2 | 3 | 4
  label: string
  color: string
}

const STRENGTH_LEVELS: StrengthMeta[] = [
  { score: 0, label: 'Çok zayıf',  color: '#dc2626' },
  { score: 1, label: 'Zayıf',      color: '#f59e0b' },
  { score: 2, label: 'Orta',       color: '#f59e0b' },
  { score: 3, label: 'Güçlü',      color: '#10b981' },
  { score: 4, label: 'Çok güçlü',  color: '#047857' },
]

function passwordStrength(pw: string): StrengthMeta {
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  const s = Math.min(4, score) as 0 | 1 | 2 | 3 | 4
  return STRENGTH_LEVELS[s]!
}

function StrengthMeter({ strength }: { strength: StrengthMeta }) {
  const segments = [0, 1, 2, 3]
  return (
    <View className="ml-1 mt-0.5">
      <View className="flex-row gap-1 h-1">
        {segments.map((i) => (
          <View
            key={i}
            className="flex-1 rounded-full bg-subtle overflow-hidden"
          >
            <View
              className="h-full rounded-full"
              style={{
                width: i < strength.score ? '100%' : 0,
                backgroundColor: strength.color,
              }}
            />
          </View>
        ))}
      </View>
      <Text
        className="font-inter-semibold text-[11px] mt-1"
        style={{ color: strength.color }}
      >
        Güvenlik: {strength.label}
      </Text>
    </View>
  )
}
