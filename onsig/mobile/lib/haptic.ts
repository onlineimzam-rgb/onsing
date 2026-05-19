/**
 * Haptic helpers — tap (selection-level), press (light impact), success/error.
 *
 * Wrapped in a thin abstraction so screens don't need to import
 * `expo-haptics` directly; we can also no-op these on platforms that don't
 * support haptics (web preview) without sprinkling try/catches everywhere.
 */
import * as Haptics from 'expo-haptics'

export const haptic = {
  tap: () => {
    Haptics.selectionAsync().catch(() => {})
  },
  light: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
  },
  medium: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})
  },
  heavy: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {})
  },
  success: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
  },
  warning: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {})
  },
  error: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {})
  },
}
