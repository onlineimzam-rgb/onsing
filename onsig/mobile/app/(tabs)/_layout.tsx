/**
 * Tabs layout — floating glass bottom navigation as per DESIGN.md
 * "Floating Navigation" section.
 *
 * Phase 1 keeps just two tabs (Özet + Profil); the rest land in Phase 2.
 */
import { Tabs } from 'expo-router'
import { Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Icon } from '@/components/icon'

const TABS: { name: string; icon: string; label: string }[] = [
  { name: 'index', icon: 'grid-view', label: 'Özet' },
  { name: 'contracts', icon: 'description', label: 'Sözleşmeler' },
  { name: 'profile', icon: 'account-circle', label: 'Profil' },
]

export default function TabsLayout() {
  const insets = useSafeAreaInsets()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
      tabBar={({ state, navigation }) => (
        <View
          className="absolute left-5 right-5 flex-row items-center justify-around bg-surface-container-lowest/90 border border-outline-variant/30 rounded-3xl shadow-floating"
          style={{ bottom: insets.bottom + 12, height: 64 }}
        >
          {state.routes.map((route, i) => {
            const meta = TABS.find((t) => t.name === route.name)
            if (!meta) return null
            const focused = state.index === i
            return (
              <Pressable
                key={route.key}
                onPress={() => navigation.navigate(route.name)}
                className="flex-1 items-center justify-center active:opacity-70"
              >
                <Icon name={meta.icon} size={24} color={focused ? '#6b38d4' : '#9ca3af'} />
                <Text
                  className={`font-geist-semibold text-[9px] tracking-widest uppercase mt-1 ${
                    focused ? 'text-secondary' : 'text-on-surface-variant/50'
                  }`}
                >
                  {meta.label}
                </Text>
              </Pressable>
            )
          })}
        </View>
      )}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="contracts" />
      <Tabs.Screen name="profile" />
    </Tabs>
  )
}
