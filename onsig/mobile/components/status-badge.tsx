/**
 * StatusBadge — premium pill with a leading status dot.
 *
 * Visual: pale tinted background (~10% of the semantic colour), 1px hairline
 * border matching the tint family, and a 6px dot before the label. Reads
 * cleanly at body-sm size and stays legible on the canvas background.
 *
 * `tone` may be overridden to force a specific colour family; otherwise the
 * status string is matched against the project's known enum values.
 */
import { Text, View } from 'react-native'

type ContractStatus = 'taslak' | 'aktif' | 'tamamlandi' | 'iptal'
type SessionStatus = 'bekliyor' | 'imzalandi' | 'iptal' | 'expired'

type Tone = 'brand' | 'success' | 'warn' | 'danger' | 'neutral'

interface BadgeProps {
  status: ContractStatus | SessionStatus | string
  size?: 'sm' | 'md'
  /** Show the leading colour dot (default true). */
  dot?: boolean
  /** Override the label (e.g. localised text the backend doesn't return). */
  label?: string
}

interface StatusSpec {
  tone: Tone
  label: string
}

const STATUS_MAP: Record<string, StatusSpec> = {
  taslak:      { tone: 'neutral', label: 'Taslak' },
  aktif:       { tone: 'brand',   label: 'İmzaya Açık' },
  bekliyor:    { tone: 'warn',    label: 'Bekliyor' },
  tamamlandi:  { tone: 'success', label: 'Tamamlandı' },
  imzalandi:   { tone: 'success', label: 'İmzalandı' },
  iptal:       { tone: 'danger',  label: 'İptal' },
  expired:     { tone: 'danger',  label: 'Süresi Doldu' },
}

const TONES: Record<Tone, { bg: string; border: string; text: string; dot: string }> = {
  brand:   { bg: 'bg-brand-50',   border: 'border-brand-100',   text: 'text-brand-700',   dot: '#7d5af2' },
  success: { bg: 'bg-success-50', border: 'border-success-100', text: 'text-success-700', dot: '#10b981' },
  warn:    { bg: 'bg-warn-50',    border: 'border-warn-100',    text: 'text-warn-700',    dot: '#f59e0b' },
  danger:  { bg: 'bg-danger-50',  border: 'border-danger-100',  text: 'text-danger-700',  dot: '#dc2626' },
  neutral: { bg: 'bg-subtle',     border: 'border-hairline',    text: 'text-ink-600',     dot: '#9097a3' },
}

export function StatusBadge({ status, size = 'sm', dot = true, label }: BadgeProps) {
  const spec = STATUS_MAP[status] ?? { tone: 'neutral' as Tone, label: status }
  const tone = TONES[spec.tone]
  const text = label ?? spec.label

  const sizing =
    size === 'md'
      ? { container: 'px-3 py-1.5', text: 'text-[12px]', dot: 8, gap: 8 }
      : { container: 'px-2.5 py-1', text: 'text-[11px]', dot: 6, gap: 6 }

  return (
    <View
      className={`flex-row items-center rounded-full self-start border ${tone.bg} ${tone.border} ${sizing.container}`}
      style={{ gap: sizing.gap }}
    >
      {dot ? (
        <View
          style={{
            width: sizing.dot,
            height: sizing.dot,
            borderRadius: sizing.dot / 2,
            backgroundColor: tone.dot,
          }}
        />
      ) : null}
      <Text className={`font-inter-semibold ${sizing.text} ${tone.text}`}>{text}</Text>
    </View>
  )
}
