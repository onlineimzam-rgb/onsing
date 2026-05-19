import '../global.css'
import 'react-native-reanimated'

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter'
import { Geist_500Medium, Geist_600SemiBold } from '@expo-google-fonts/geist'
import { DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { QueryClientProvider } from '@tanstack/react-query'
import { useFonts } from 'expo-font'
import { Stack, useRouter, useSegments, usePathname } from 'expo-router'
import type { Href } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect, type PropsWithChildren } from 'react'

import { useAuthStore } from '@/lib/auth'
import { queryClient } from '@/lib/queryClient'

SplashScreen.preventAutoHideAsync().catch(() => {
  // already hidden; ignore
})

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Geist_500Medium,
    Geist_600SemiBold,
  })

  const hydrated = useAuthStore((s) => s.hydrated)
  const hydrate = useAuthStore((s) => s.hydrate)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    if (fontsLoaded && hydrated) {
      SplashScreen.hideAsync().catch(() => {})
    }
  }, [fontsLoaded, hydrated])

  if (!fontsLoaded || !hydrated) return null

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={DefaultTheme}>
        <AuthGate>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#f6f7fb' }, animation: 'fade' }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="contract/[id]" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
          </Stack>
        </AuthGate>
        <StatusBar style="dark" />
      </ThemeProvider>
    </QueryClientProvider>
  )
}

/**
 * AuthGate — redirects between auth and protected groups based on token presence.
 *
 * Mounted inside the root Stack so `useSegments` / `useRouter` are available.
 * Also stores the "intended" deep-link route so that hitting `onsig://contract/123`
 * while logged out lands the user on `/contract/123` after a successful login
 * (instead of dumping them on `/(tabs)`).
 */
function AuthGate({ children }: PropsWithChildren) {
  const router = useRouter()
  const segments = useSegments()
  const pathname = usePathname()
  const token = useAuthStore((s) => s.token)
  const onboardingSeen = useAuthStore((s) => s.onboardingSeen)
  const pendingRoute = useAuthStore((s) => s.pendingRoute)
  const setPendingRoute = useAuthStore((s) => s.setPendingRoute)

  useEffect(() => {
    const group = segments[0] as string | undefined
    const inAuth = group === '(auth)'
    const atRoot = group === undefined

    if (!token) {
      if (!inAuth) {
        // Remember where the user was trying to go (skip noisy root paths so
        // a cold launch from the home screen doesn't queue `/index`).
        if (pathname && pathname !== '/' && pathname !== '/index' && !pendingRoute) {
          setPendingRoute(pathname)
        }
        router.replace(onboardingSeen ? '/(auth)/login' : '/(auth)/welcome')
      }
    } else if (inAuth || atRoot) {
      // Post-login: prefer the saved deep-link route if any.
      const next = pendingRoute
      if (next) setPendingRoute(null)
      router.replace((next ?? '/(tabs)') as Href)
    }
  }, [token, onboardingSeen, segments, pathname, pendingRoute, router, setPendingRoute])

  return <>{children}</>
}
