/**
 * Soft elevation ramps. NativeWind 4 can drive shadows via Tailwind classes,
 * but RN's shadow rendering on Android is still flaky once you cross the
 * shadow-offset / elevation gap. Defining the four primary elevations here as
 * plain `ViewStyle`s gives us predictable depth on both platforms.
 *
 * Values are tuned to a #0f0f12 ink (RGB 15,15,18) so the colour cast of the
 * shadow matches our deep-grey text. This keeps cards feeling "lifted" without
 * tinting the surrounding canvas (a problem with pure-black shadows).
 */
import type { ViewStyle } from 'react-native'

const inkBase = 'rgba(15, 15, 18, 1)'

export const shadows = {
  xs: {
    shadowColor: inkBase,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  } satisfies ViewStyle,

  sm: {
    shadowColor: inkBase,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  } satisfies ViewStyle,

  md: {
    shadowColor: inkBase,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
  } satisfies ViewStyle,

  lg: {
    shadowColor: inkBase,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 10,
  } satisfies ViewStyle,

  brand: {
    shadowColor: '#7d5af2',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 8,
  } satisfies ViewStyle,
} as const

export type ShadowLevel = keyof typeof shadows
