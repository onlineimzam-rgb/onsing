/**
 * Status pill — maps the backend's lowercase Turkish enum values to themed
 * background + text colours per DESIGN.md's "Status indicators" guidance
 * (10% opacity background with the matching semantic colour).
 */
import { Text, View } from 'react-native'

type ContractStatus = 'taslak' | 'aktif' | 'tamamlandi' | 'iptal'
type SessionStatus = 'bekliyor' | 'imzalandi' | 'iptal' | 'expired'

interface BadgeProps {
  status: ContractStatus | SessionStatus | string
  size?: 'sm' | 'md'
}

interface StatusStyle {
  bg: string
  text: string
  label: string
}

const STYLES: Record<string, StatusStyle> = {
  taslak: { bg: 'bg-surface-container-high', text: 'text-on-surface-variant', label: 'Taslak' },
  aktif: { bg: 'bg-secondary/10', text: 'text-secondary', label: 'İmzaya Açık' },
  bekliyor: { bg: 'bg-secondary/10', text: 'text-secondary', label: 'Bekliyor' },
  tamamlandi: { bg: 'bg-tertiary-fixed-dim/20', text: 'text-on-tertiary-fixed-variant', label: 'Tamamlandı' },
  imzalandi: { bg: 'bg-tertiary-fixed-dim/20', text: 'text-on-tertiary-fixed-variant', label: 'İmzalandı' },
  iptal: { bg: 'bg-error/10', text: 'text-error', label: 'İptal' },
  expired: { bg: 'bg-error/10', text: 'text-error', label: 'Süresi Doldu' },
}

const FALLBACK: StatusStyle = {
  bg: 'bg-surface-container-high',
  text: 'text-on-surface-variant',
  label: '—',
}

export function StatusBadge({ status, size = 'sm' }: BadgeProps) {
  const style = STYLES[status] ?? { ...FALLBACK, label: status }
  const sizing =
    size === 'md'
      ? 'px-3 py-1 text-[11px]'
      : 'px-2 py-0.5 text-[9px]'

  return (
    <View className={`rounded-md self-start ${style.bg}`}>
      <Text className={`font-geist-semibold uppercase tracking-wider ${style.text} ${sizing}`}>
        {style.label}
      </Text>
    </View>
  )
}
