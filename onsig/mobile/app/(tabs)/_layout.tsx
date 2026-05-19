/**
 * Tabs layout — modern enterprise bottom navigation.
 *
 * Look: white floating pill with a soft elevation, active tab gets a pale
 * brand pill behind it (Linear-style), inactive tabs render as icon-only.
 * No glassmorphism — the bar stays opaque so labels never compete with the
 * content underneath.
 *
 * Layout choices:
 *   • Sits 18px above the safe-area bottom inset.
 *   • Each tab is the same width (`flex: 1`) so the pill aligns to the tab
 *     centre regardless of label length.
 *   • Tapping triggers a subtle haptic "selection" pulse.
 */
import { Tabs } from 'expo-router'
import { Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Icon, type MaterialIconName } from '@/components/icon'
import { haptic } from '@/lib/haptic'
import { shadows } from '@/lib/shadow'

interface TabMeta {
  name: string
  icon: MaterialIconName
  label: string
}

const TABS: TabMeta[] = [
  { name: 'index',     icon: 'space-dashboard', label: 'Özet' },
  { name: 'contracts', icon: 'description',     label: 'Sözleşmeler' },
  { name: 'profile',   icon: 'person',          label: 'Profil' },
]

export default function TabsLayout() {
  const insets = useSafeAreaInsets()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
        sceneStyle: { backgroundColor: '#f6f7fb' },
      }}
      tabBar={({ state, navigation }) => (
        <View
          className="absolute left-5 right-5 flex-row items-center bg-card border border-hairline rounded-full px-1.5"
          style={[
            shadows.lg,
            { bottom: insets.bottom + 14, height: 64 },
          ]}
        >
          {state.routes.map((route, i) => {
            const meta = TABS.find((t) => t.name === route.name)
            if (!meta) return null
            const focused = state.index === i
            return (
              <Pressable
                key={route.key}
                onPress={() => {
                  if (!focused) {
                    haptic.tap()
                    navigation.navigate(route.name)
                  }
                }}
                className="flex-1 items-center justify-center active:opacity-80"
                style={{ height: '100%' }}
              >
                <View
                  className={`flex-row items-center justify-center rounded-full ${
                    focused ? 'bg-ink-900 px-3.5 py-2' : 'p-2'
                  }`}
                  style={{ gap: focused ? 6 : 0 }}
                >
                  <Icon
                    name={meta.icon}
                    size={focused ? 18 : 22}
                    color={focused ? '#ffffff' : '#9097a3'}
                  />
                  {focused ? (
                    <Text className="font-inter-semibold text-[13px] text-white tracking-tight">
                      {meta.label}
                    </Text>
                  ) : null}
                </View>
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
