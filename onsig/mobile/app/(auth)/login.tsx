/**
 * Login — email + password, posts to `/api/auth/login`.
 *
 * The Stitch design only provides an OTP-verify screen (sms-style). For
 * email/password login we keep the same visual idiom (deep obsidian
 * background, glass-card form, vivid purple CTA, banking-grade SSL badge)
 * so the screen feels native to the rest of the brand.
 */
import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Button } from '@/components/button'
import { Icon } from '@/components/icon'
import { api, readError } from '@/lib/api'
import { useAuthStore, type AuthUser } from '@/lib/auth'

interface LoginResponse {
  ok: boolean
  accessToken: string
  refreshToken: string
  user: { id: number; name: string; email: string; phone: string | null }
  tenant: { id: number; name: string | null; slug: string | null; role: AuthUser['role'] }
}

export default function Login() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const login = useAuthStore((s) => s.login)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!email || !password) {
      setError('E-posta ve şifre gerekli')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await api
        .post('auth/login', { json: { email: email.trim().toLowerCase(), password } })
        .json<LoginResponse>()

      if (!res.accessToken) {
        throw new Error('Sunucu token döndürmedi')
      }

      const authUser: AuthUser = {
        id: res.user.id,
        email: res.user.email,
        fullName: res.user.name,
        role: res.tenant.role,
        tenantId: res.tenant.id,
        tenantName: res.tenant.name ?? '',
        tenantSlug: res.tenant.slug ?? '',
      }
      await login(res.accessToken, authUser)
      // Root layout's AuthGate handles the redirect.
    } catch (err) {
      const msg = await readError(err)
      setError(msg || 'Giriş başarısız')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-[#0f1115]"
    >
      {/* Ambient glow swatches */}
      <View className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-secondary/10" />
      <View className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-secondary/10" />

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 16,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top bar with back button */}
        <View className="flex-row items-center justify-between mb-12">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center active:opacity-70"
          >
            <Icon name="arrow_back" size={24} color="#ffffff" />
          </Pressable>
          <Text className="font-inter-bold text-headline-lg-mobile text-white">OnSig</Text>
          <View className="w-10" />
        </View>

        {/* Lock badge */}
        <View className="items-center mb-8">
          <View className="w-20 h-20 rounded-2xl bg-secondary-container/20 border border-white/10 items-center justify-center">
            <Icon name="lock" size={36} color="#d0bcff" />
          </View>
        </View>

        {/* Title */}
        <View className="items-center gap-2 mb-10">
          <Text className="font-inter-bold text-[26px] text-white tracking-tight">
            Hesabınıza giriş yapın
          </Text>
          <Text className="font-inter text-body-sm text-white/50 text-center max-w-[280px]">
            E-postanız ve şifrenizle güvenli giriş.
          </Text>
        </View>

        {/* Form */}
        <View className="gap-4 mb-6">
          <Field
            label="E-POSTA"
            value={email}
            onChangeText={(t) => {
              setEmail(t)
              if (error) setError(null)
            }}
            placeholder="ornek@firma.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            iconLeft="mail-outline"
          />
          <Field
            label="ŞİFRE"
            value={password}
            onChangeText={(t) => {
              setPassword(t)
              if (error) setError(null)
            }}
            placeholder="••••••••"
            secureTextEntry={!showPassword}
            iconLeft="lock-outline"
            rightAction={{
              icon: showPassword ? 'visibility-off' : 'visibility',
              onPress: () => setShowPassword((v) => !v),
            }}
          />

          {error ? (
            <View className="flex-row items-center gap-2 bg-error/10 border border-error/30 rounded-xl px-3 py-2.5">
              <Icon name="error-outline" size={18} color="#ff6b6b" />
              <Text className="flex-1 font-inter text-body-sm text-error">{error}</Text>
            </View>
          ) : null}
        </View>

        <Button label="Giriş Yap" variant="dark" loading={loading} onPress={handleSubmit} />

        <View className="items-center mt-8 gap-3">
          <View className="flex-row items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
            <Icon name="verified_user" size={14} color="#d0bcff" />
            <Text className="font-geist-semibold text-[10px] text-white/70 uppercase tracking-widest">
              Uçtan uca şifreli güvenlik
            </Text>
          </View>
          <View className="flex-row items-center gap-1.5 opacity-40">
            <Icon name="lock" size={10} color="#ffffff" />
            <Text className="font-geist-semibold text-[9px] text-white uppercase tracking-tight">
              Banking-Grade SSL Protection
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

interface FieldProps {
  label: string
  value: string
  onChangeText: (t: string) => void
  placeholder?: string
  secureTextEntry?: boolean
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
  autoComplete?: 'email' | 'password' | 'off'
  keyboardType?: 'default' | 'email-address'
  iconLeft?: string
  rightAction?: { icon: string; onPress: () => void }
}

function Field(props: FieldProps) {
  const [focused, setFocused] = useState(false)
  return (
    <View>
      <Text className="font-geist-semibold text-[10px] tracking-[0.15em] text-white/40 uppercase mb-2">
        {props.label}
      </Text>
      <View
        className={`flex-row items-center gap-3 h-14 rounded-2xl border bg-white/5 px-4 ${
          focused ? 'border-secondary-container' : 'border-white/10'
        }`}
      >
        {props.iconLeft ? <Icon name={props.iconLeft} size={20} color="#9ca3af" /> : null}
        <TextInput
          value={props.value}
          onChangeText={props.onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={props.placeholder}
          placeholderTextColor="#6b7280"
          secureTextEntry={props.secureTextEntry}
          autoCapitalize={props.autoCapitalize}
          autoComplete={props.autoComplete}
          keyboardType={props.keyboardType}
          className="flex-1 font-inter text-body-lg text-white"
          style={{ height: 56 }}
        />
        {props.rightAction ? (
          <Pressable onPress={props.rightAction.onPress} hitSlop={8} className="active:opacity-60">
            <Icon name={props.rightAction.icon} size={20} color="#9ca3af" />
          </Pressable>
        ) : null}
      </View>
    </View>
  )
}
