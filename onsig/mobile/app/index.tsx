import { View } from 'react-native'

/**
 * Entry route. The AuthGate in the root layout owns the redirect logic, so this
 * just renders a flash of brand-correct background while the gate decides.
 */
export default function Index() {
  return <View className="flex-1 bg-canvas" />
}
