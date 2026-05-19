/**
 * Settings stack — header-less so each screen can render its own bespoke
 * header (matches the dashboard/contracts/detail pattern). Animations are
 * `slide_from_right` for the iOS-like sense of going deeper.
 */
import { Stack } from 'expo-router'

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#f6f7fb' },
      }}
    >
      <Stack.Screen name="profile" />
      <Stack.Screen name="password" />
    </Stack>
  )
}
