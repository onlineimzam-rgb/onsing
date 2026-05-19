/**
 * Auth store — zustand + expo-secure-store.
 *
 * The token lives in the OS secure storage (Keychain on iOS, EncryptedSharedPreferences
 * on Android). We rehydrate it once at app boot before rendering any route so the
 * initial redirect decision (auth vs. tabs) is synchronous.
 */
import * as SecureStore from 'expo-secure-store'
import { create } from 'zustand'

export interface AuthUser {
  id: number
  email: string
  fullName: string
  /**
   * Tenant-scoped role. `super_admin` is a platform-level role on the user
   * record and is queried separately when needed (not surfaced by /api/auth/login).
   */
  role: 'owner' | 'admin' | 'member'
  tenantId: number
  tenantName: string
  tenantSlug: string
}

interface AuthState {
  token: string | null
  user: AuthUser | null
  hydrated: boolean

  hydrate: () => Promise<void>
  login: (token: string, user: AuthUser) => Promise<void>
  logout: () => Promise<void>
  setOnboardingSeen: () => Promise<void>
  onboardingSeen: boolean
}

const TOKEN_KEY = 'onsig.token'
const USER_KEY = 'onsig.user'
const ONBOARDING_KEY = 'onsig.onboardingSeen'

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  hydrated: false,
  onboardingSeen: false,

  hydrate: async () => {
    try {
      const [token, userRaw, onboardingRaw] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        SecureStore.getItemAsync(USER_KEY),
        SecureStore.getItemAsync(ONBOARDING_KEY),
      ])
      const user = userRaw ? (JSON.parse(userRaw) as AuthUser) : null
      set({
        token,
        user,
        onboardingSeen: onboardingRaw === '1',
        hydrated: true,
      })
    } catch {
      set({ hydrated: true })
    }
  },

  login: async (token, user) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token)
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user))
    set({ token, user })
  },

  logout: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
    ])
    set({ token: null, user: null })
  },

  setOnboardingSeen: async () => {
    await SecureStore.setItemAsync(ONBOARDING_KEY, '1')
    set({ onboardingSeen: true })
  },
}))
