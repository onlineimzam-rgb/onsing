import { SettingsTabs } from './Tabs'

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-4">
        <h1 className="font-display text-2xl font-bold tracking-tight">Ayarlar</h1>
        <p className="text-sm text-ink-muted mt-0.5">
          Firma kimliği, şubeler ve ekip üyeleri buradan yönetilir.
        </p>
      </div>
      <SettingsTabs />
      {children}
    </div>
  )
}
