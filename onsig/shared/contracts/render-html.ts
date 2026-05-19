/**
 * Minimal HTML envelope for contract text.
 *
 * - Server-rendered text body is wrapped into A4-ish paginated HTML.
 * - Optional signature columns are rendered at the bottom when supplied.
 * - The output is print-friendly (`@media print` rules) and can be embedded
 *   directly inside a Next.js Server Component or fed to puppeteer for PDF.
 *
 * For richer typography we'll move to `@react-pdf/renderer` in `pdf.ts` later;
 * this HTML render is the canonical "what the signer sees on screen".
 */

import { buildContractText, contractTitle } from './templates'
import type { ContractFormState, SignerRole, RealEstateTemplateKey } from './types'
import { SIGNER_ROLE_LABELS } from './types'
import type { ContractRenderContext } from './context'

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export interface SignatureMark {
  role: SignerRole
  signedName?: string | null
  signedAt?: string | Date | null
  signaturePng?: string | null // base64 (data URL or raw)
}

export interface RenderHtmlOptions {
  form: ContractFormState
  ctx: ContractRenderContext
  /** When provided, drawn signature blocks render at the bottom. */
  signatures?: SignatureMark[]
  /** When true, page is fixed A4 width; otherwise responsive. */
  printMode?: boolean
  /** Header watermark / preview banner. */
  watermark?: string | null
}

function formatDate(d: string | Date | null | undefined): string {
  if (!d) return ''
  try {
    return new Date(d).toLocaleString('tr-TR')
  } catch {
    return String(d)
  }
}

function signatureBlock(sig: SignatureMark): string {
  const role = SIGNER_ROLE_LABELS[sig.role] ?? sig.role
  const png = sig.signaturePng
    ? sig.signaturePng.startsWith('data:')
      ? sig.signaturePng
      : `data:image/png;base64,${sig.signaturePng}`
    : null
  return `
    <div class="sig-col">
      <div class="sig-role">${escapeHtml(role)}</div>
      <div class="sig-box">
        ${png ? `<img alt="imza" src="${png}" />` : '<span class="sig-empty">İmza bekleniyor</span>'}
      </div>
      <div class="sig-meta">
        ${sig.signedName ? `<div>${escapeHtml(sig.signedName)}</div>` : ''}
        ${sig.signedAt ? `<div class="sig-time">${escapeHtml(formatDate(sig.signedAt))}</div>` : ''}
      </div>
    </div>
  `
}

export function renderContractHtml(opts: RenderHtmlOptions): string {
  const { form, ctx, signatures = [], printMode = false, watermark } = opts
  const body = buildContractText(form, ctx)
  const title = contractTitle(form.templateKey as RealEstateTemplateKey)
  const sigHtml = signatures.length
    ? `<section class="signatures">${signatures.map(signatureBlock).join('')}</section>`
    : ''

  return `<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>${contractStyleTag(printMode)}</style>
</head>
<body>
  ${watermark ? `<div class="watermark">${escapeHtml(watermark)}</div>` : ''}
  <main class="page">
    <header class="head">
      <div class="brand">${escapeHtml(ctx.brokerName || 'OnSig')}</div>
      <h1>${escapeHtml(title)}</h1>
    </header>
    <pre class="body">${escapeHtml(body)}</pre>
    ${sigHtml}
    <footer class="foot">OnSig · ${escapeHtml(formatDate(new Date()))}</footer>
  </main>
</body>
</html>`
}

export function contractStyleTag(printMode = false): string {
  return `
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body {
      font-family: ui-monospace, "JetBrains Mono", "Cascadia Mono", Menlo, Consolas, monospace;
      font-size: 12.5px;
      line-height: 1.55;
      color: #0f172a;
      background: #f8fafc;
      margin: 0;
      padding: ${printMode ? '0' : '24px 12px'};
    }
    .page {
      max-width: ${printMode ? '210mm' : '900px'};
      margin: 0 auto;
      background: #fff;
      padding: ${printMode ? '20mm 18mm' : '32px 28px'};
      border-radius: ${printMode ? '0' : '16px'};
      box-shadow: ${printMode ? 'none' : '0 1px 2px rgba(15,23,42,.06), 0 8px 24px rgba(15,23,42,.06)'};
    }
    .head { border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 18px; }
    .brand {
      font-family: "Plus Jakarta Sans", system-ui, sans-serif;
      font-weight: 700; font-size: 14px; color: #5A3DF5; letter-spacing: .02em;
      margin-bottom: 4px;
    }
    .head h1 {
      font-family: "Plus Jakarta Sans", system-ui, sans-serif;
      font-size: 18px; margin: 0; color: #0f172a;
    }
    .body { white-space: pre-wrap; word-break: break-word; margin: 0; font-size: 12.5px; }
    .signatures {
      margin-top: 28px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
    }
    .sig-col {
      border: 1px dashed #cbd5e1;
      border-radius: 12px;
      padding: 10px;
      text-align: center;
      background: #fafafa;
    }
    .sig-role { font-weight: 600; font-size: 11px; color: #64748B; text-transform: uppercase; letter-spacing: .04em; }
    .sig-box {
      margin: 8px 0;
      min-height: 70px;
      display: flex; align-items: center; justify-content: center;
      background: #fff;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    .sig-box img { max-width: 100%; max-height: 80px; object-fit: contain; }
    .sig-empty { color: #94a3b8; font-size: 11px; }
    .sig-meta { font-size: 11px; color: #475569; }
    .sig-time { color: #94a3b8; }
    .foot { margin-top: 24px; text-align: right; color: #94a3b8; font-size: 10px; }
    .watermark {
      position: fixed; inset: 0;
      display: grid; place-items: center;
      pointer-events: none; z-index: 0;
      color: rgba(15,23,42,0.06);
      font-size: 80px; font-weight: 800;
      transform: rotate(-30deg);
      font-family: "Plus Jakarta Sans", system-ui, sans-serif;
      letter-spacing: .15em;
    }
    @media print {
      body { background: #fff; padding: 0; }
      .page { box-shadow: none; border-radius: 0; padding: 18mm 16mm; }
    }
  `.trim()
}
