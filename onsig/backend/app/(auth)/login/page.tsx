import LoginForm from './LoginForm'

export const metadata = { title: 'Giriş yap · OnSig' }
// `LoginForm` reads `?next=` via `useSearchParams()`. Marking the page as
// dynamic skips the static prerender attempt (which would otherwise need a
// Suspense boundary around the form) and matches the runtime behavior — the
// form lives behind auth and is always rendered fresh.
export const dynamic = 'force-dynamic'

export default function LoginPage() {
  return (
    <div>
      <p className="text-2xs uppercase tracking-[0.18em] font-semibold text-ink-7">
        Tekrar hoş geldin
      </p>
      <h1 className="font-display text-3xl font-bold tracking-tightest text-ink-12 mt-1">
        Hesabına giriş yap
      </h1>
      <p className="text-sm text-ink-7 mt-2 max-w-sm leading-relaxed">
        Sözleşme paneline, imza kuyruğuna ve audit zincirine devam etmek için
        oturum aç.
      </p>

      <div className="mt-8">
        <LoginForm />
      </div>
    </div>
  )
}
