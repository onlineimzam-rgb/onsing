/**
 * TextField — labeled input matching the premium token system.
 *
 * Renders as: optional caps label → 52px high card-toned input box with
 * a 1px hairline that brightens to brand-500 on focus. Error text appears
 * under the field in danger-700 with a 2px danger border around the input.
 *
 * Supports an optional trailing slot for "show password" toggles, currency
 * affixes, etc. Pass `secure` for password inputs (text masking + autoFill).
 */
import { useState, type ReactNode } from 'react'
import {
  Pressable,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native'

import { Icon } from '@/components/icon'

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label?: string
  hint?: string
  error?: string | null
  iconLeft?: string
  secure?: boolean
  trailing?: ReactNode
}

export function TextField({
  label,
  hint,
  error,
  iconLeft,
  secure,
  trailing,
  ...input
}: TextFieldProps) {
  const [focused, setFocused] = useState(false)
  const [revealed, setRevealed] = useState(false)

  const borderClass = error
    ? 'border-danger-500'
    : focused
      ? 'border-brand-500'
      : 'border-hairline'

  return (
    <View>
      {label ? (
        <Text className="font-inter-semibold text-[12px] text-ink-700 mb-1.5 ml-1">{label}</Text>
      ) : null}
      <View
        className={`flex-row items-center gap-2 h-[52px] px-3.5 rounded-xl bg-card border ${borderClass}`}
      >
        {iconLeft ? <Icon name={iconLeft} size={18} color={focused ? '#5a30d0' : '#9097a3'} /> : null}
        <TextInput
          {...input}
          onFocus={(e) => {
            setFocused(true)
            input.onFocus?.(e)
          }}
          onBlur={(e) => {
            setFocused(false)
            input.onBlur?.(e)
          }}
          secureTextEntry={secure && !revealed}
          placeholderTextColor="#9097a3"
          className="flex-1 font-inter text-[15px] text-ink-900"
          style={{ height: 52, paddingVertical: 0 }}
        />
        {secure ? (
          <Pressable
            onPress={() => setRevealed((v) => !v)}
            hitSlop={8}
            className="active:opacity-60"
          >
            <Icon
              name={revealed ? 'visibility-off' : 'visibility'}
              size={18}
              color="#6b7280"
            />
          </Pressable>
        ) : null}
        {trailing}
      </View>
      {error ? (
        <View className="flex-row items-center gap-1 mt-1.5 ml-1">
          <Icon name="error-outline" size={12} color="#b91c1c" />
          <Text className="font-inter text-[12px] text-danger-700">{error}</Text>
        </View>
      ) : hint ? (
        <Text className="font-inter text-[12px] text-ink-400 mt-1.5 ml-1">{hint}</Text>
      ) : null}
    </View>
  )
}
