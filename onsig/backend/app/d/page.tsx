import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'

export const metadata = { title: 'Sözleşme doğrula' }
// Public verify portal — no caching benefit, and prerendering against a
// Server Component that owns a tiny inline script just slows the build.
export const dynamic = 'force-dynamic'

export default function VerifyIndexPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand text-white grid place-items-center font-bold">S</div>
            <span className="font-display font-bold">OnSig</span>
          </Link>
          <span className="text-xs text-ink-muted ml-2">Sözleşme doğrulama</span>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12 text-center">
        <ShieldCheck className="w-14 h-14 mx-auto text-brand" />
        <h1 className="mt-3 font-display text-2xl font-bold">Sözleşme doğrulama</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Bir sözleşmenin orijinalliğini doğrulamak için PDF'in <strong>SHA-256</strong> parmak izini girin.
        </p>
        <form action="/d" method="get" className="mt-6 flex gap-2">
          <input
            name="h"
            placeholder="64 karakterlik SHA-256 hash..."
            className="input font-mono text-xs"
            pattern="[a-fA-F0-9]{64}"
            required
          />
        </form>
        <SubmitHelper />
      </main>
    </div>
  )
}

function SubmitHelper() {
  // Use a tiny client-side router to navigate to /d/<hash>
  return (
    <>
      <script
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: `
            document.currentScript?.previousElementSibling?.querySelector('form')?.addEventListener('submit', function(e){
              e.preventDefault();
              var h = (e.target.elements.h.value || '').trim();
              if (/^[a-f0-9]{64}$/i.test(h)) location.href = '/d/' + h.toLowerCase();
              else alert('Geçerli bir 64 karakter SHA-256 hash girin.');
            });
          `,
        }}
      />
      <p className="mt-3 text-xs text-ink-muted">Hash dahil link biçimi: <code>/d/&lt;hash&gt;</code></p>
    </>
  )
}
