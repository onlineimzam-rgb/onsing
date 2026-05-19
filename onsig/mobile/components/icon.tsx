/**
 * Icon — thin wrapper around MaterialIcons from @expo/vector-icons.
 *
 * The Stitch design uses Material Symbols (M3) names like `arrow_back`,
 * `verified_user`, `pending_actions`. Most have direct equivalents in
 * MaterialIcons (kebab-case). For the few that differ, we map them here so
 * screen code stays readable.
 */
import MaterialIcons from '@expo/vector-icons/MaterialIcons'

type MaterialIconName = React.ComponentProps<typeof MaterialIcons>['name']

const ALIASES: Record<string, MaterialIconName> = {
  // Design uses Material Symbols (snake_case) — Vector Icons uses kebab-case.
  // We accept both forms via this map so screens can copy/paste from the HTML.
  account_circle: 'account-circle',
  arrow_back: 'arrow-back',
  arrow_forward: 'arrow-forward',
  arrow_outward: 'arrow-outward',
  auto_graph: 'auto-graph',
  chevron_right: 'chevron-right',
  edit_document: 'edit-note',
  edit_square: 'edit-square',
  grid_view: 'grid-view',
  history_edu: 'history-edu',
  pending_actions: 'pending-actions',
  priority_high: 'priority-high',
  query_stats: 'query-stats',
  task_alt: 'task-alt',
  verified_user: 'verified-user',
}

interface IconProps {
  name: MaterialIconName | keyof typeof ALIASES | string
  size?: number
  color?: string
  className?: string
}

export function Icon({ name, size = 24, color = '#191c1d', className }: IconProps) {
  const resolved = (ALIASES[name as keyof typeof ALIASES] ?? name) as MaterialIconName
  return <MaterialIcons name={resolved} size={size} color={color} className={className} />
}

export type { MaterialIconName }
