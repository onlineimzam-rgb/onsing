import RegisterForm from './RegisterForm'

export const metadata = { title: 'Kayıt ol · OnSig' }
// Same reason as `/login` — the form reads `?next=` and `?invite=` via
// `useSearchParams()`. Force-dynamic avoids the prerender suspense dance.
export const dynamic = 'force-dynamic'

export default function RegisterPage() {
  return (
    <div>
      <p className="text-2xs uppercase tracking-[0.18em] font-semibold text-ink-7">
        14 günlük ücretsiz başlangıç
      </p>
      <h1 className="font-display text-3xl font-bold tracking-tightest text-ink-12 mt-1">
        Firmanı OnSig'de aç
      </h1>
      <p className="text-sm text-ink-7 mt-2 max-w-sm leading-relaxed">
        İlk kullanıcı otomatik olarak firma sahibi olur. Ekip arkadaşlarını
        sonradan davet edebilirsin.
      </p>

      <div className="mt-8">
        <RegisterForm />
      </div>
    </div>
  )
}
