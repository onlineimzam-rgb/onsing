/**
 * PDF generator — produces a printable A4 PDF for a contract using
 * `@react-pdf/renderer`. Pure-JS PDF assembly works on Vercel & local dev.
 *
 * Highlights (v0.2):
 *   - Inter (Turkish-supported) font is registered from `@fontsource/inter`
 *     so characters like Ç, Ğ, İ, Ö, Ş, Ü render correctly (the standard
 *     PostScript fonts only ship Latin-1 glyphs).
 *   - The plain-text body is parsed into a small block AST (`title`,
 *     `heading`, `kv`, `numbered`, `paragraph`, `space`) and rendered with
 *     real PDF primitives — proper headings, two-column tables for key/value
 *     rows, indented numbered clauses, etc.  Box-drawing characters used in
 *     the source text (`═`, `─`) are stripped because they are not designed
 *     for body copy in a serif/sans face.
 *   - Signature blocks are rendered at the bottom with the actual signature
 *     PNG (data URL) plus signer name, masked TC, signed timestamp.
 *   - Footer carries page numbers and the OnSig identifier.
 */
import path from 'path'
import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
  renderToBuffer,
} from '@react-pdf/renderer'

// ---------------------------------------------------------------------------
// Font registration — Noto Sans (full Turkish coverage, TTF for reliability)
// ---------------------------------------------------------------------------
let fontRegistered = false
function registerFontsOnce() {
  if (fontRegistered) return
  try {
    const base = path.resolve(process.cwd(), 'fonts')
    Font.register({
      family: 'NotoSans',
      fonts: [
        { src: path.join(base, 'NotoSans-Regular.ttf'), fontWeight: 400 },
        { src: path.join(base, 'NotoSans-Medium.ttf'), fontWeight: 500 },
        { src: path.join(base, 'NotoSans-Bold.ttf'), fontWeight: 700 },
      ],
    })
    // Don't hyphenate Turkish words — react-pdf's default splitter doesn't
    // know about TR morphology and produces ugly breaks.
    Font.registerHyphenationCallback((word: string) => [word])
    fontRegistered = true
  } catch (err) {
    console.warn('[onsig/pdf] font registration failed, falling back to Helvetica', err)
  }
}

// ---------------------------------------------------------------------------
// Body parsing
// ---------------------------------------------------------------------------
type Block =
  | { kind: 'title'; text: string }
  | { kind: 'heading'; text: string }
  | { kind: 'kv'; key: string; value: string }
  | { kind: 'numbered'; n: string; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'space' }

const RE_BOX = /^[═━─│┌┐└┘├┤┬┴┼]+$/
const RE_THICK = /^═+$/
const RE_THIN = /^─+$/
const RE_NUMBERED = /^\s*(\d+)\)\s*(.*)$/
const RE_KV = /^([^:]{2,80}?)\s*:\s*(.+)$/

function parseBlocks(body: string): Block[] {
  const lines = body.split(/\r?\n/)
  const out: Block[] = []
  let i = 0
  while (i < lines.length) {
    const raw = lines[i] ?? ''
    const trimmed = raw.trim()

    // ── ═══ title block ═══
    if (RE_THICK.test(trimmed)) {
      // pattern: ═══ \n TITLE \n ═══
      const next = (lines[i + 1] ?? '').trim()
      const after = (lines[i + 2] ?? '').trim()
      if (next && RE_THICK.test(after)) {
        out.push({ kind: 'title', text: next })
        i += 3
        continue
      }
      i += 1
      continue
    }

    // ── lonely ─── separator: previous line was a heading caption
    if (RE_THIN.test(trimmed)) {
      // If the previous non-space block is a paragraph, upgrade to heading
      for (let j = out.length - 1; j >= 0; j--) {
        const b = out[j]!
        if (b.kind === 'space') continue
        if (b.kind === 'paragraph') {
          out[j] = { kind: 'heading', text: b.text }
        }
        break
      }
      i += 1
      continue
    }

    // ── empty line
    if (trimmed === '') {
      // collapse multiple blanks into a single space block
      if (out[out.length - 1]?.kind !== 'space') out.push({ kind: 'space' })
      i += 1
      continue
    }

    // ── any other box-art line — drop
    if (RE_BOX.test(trimmed)) {
      i += 1
      continue
    }

    // ── numbered clause "1) ..."
    const numMatch = trimmed.match(RE_NUMBERED)
    if (numMatch) {
      out.push({ kind: 'numbered', n: numMatch[1]!, text: numMatch[2]! })
      i += 1
      continue
    }

    // ── key : value row (only if the value has no further ':')
    const kvMatch = trimmed.match(RE_KV)
    if (kvMatch) {
      const key = kvMatch[1]!.trim()
      const value = kvMatch[2]!.trim()
      // multi-colon lines like "KİRAYA VEREN: X    KİRACI: Y" must stay
      // as paragraphs, otherwise the second pair is swallowed.
      const colonCount = (trimmed.match(/:/g) ?? []).length
      if (colonCount === 1 && !/^\d+\)/.test(trimmed)) {
        out.push({ kind: 'kv', key, value })
        i += 1
        continue
      }
    }

    // ── default: paragraph
    out.push({ kind: 'paragraph', text: trimmed })
    i += 1
  }

  // trim leading/trailing space blocks
  while (out[0]?.kind === 'space') out.shift()
  while (out[out.length - 1]?.kind === 'space') out.pop()
  return out
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function asDataUrl(png: string | null): string | null {
  if (!png) return null
  return png.startsWith('data:') ? png : `data:image/png;base64,${png}`
}

function fmtDate(d: Date | string | null): string {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return String(d)
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface SignatureBlock {
  role: string
  roleLabel: string
  signerName: string | null
  signerTcLast4: string | null
  signedAt: Date | string | null
  signaturePng: string | null // raw base64 or data URL
}

export interface PdfInput {
  contractId: number
  title: string
  body: string
  tenantName: string
  signatures: SignatureBlock[]
  /** Optional verification URL printed in footer. */
  verificationUrl?: string | null
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const COLOR = {
  ink: '#0F172A',
  muted: '#64748B',
  rule: '#CBD5E1',
  ruleLight: '#E2E8F0',
  brand: '#5A3DF5',
  paperBg: '#FFFFFF',
  zebra: '#F8FAFC',
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 56,
    paddingBottom: 64,
    paddingLeft: 52,
    paddingRight: 52,
    fontFamily: 'NotoSans',
    fontSize: 10,
    color: COLOR.ink,
    lineHeight: 1.45,
  },

  // ── Brand header (fixed on each page)
  headerBar: {
    position: 'absolute',
    top: 24,
    left: 52,
    right: 52,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLOR.ruleLight,
    borderBottomStyle: 'solid',
  },
  brand: {
    color: COLOR.brand,
    fontSize: 9.5,
    fontWeight: 700,
    letterSpacing: 1.2,
  },
  contractTag: {
    color: COLOR.muted,
    fontSize: 8.5,
    fontWeight: 500,
    letterSpacing: 0.5,
  },

  // ── Document title
  titleBlock: { marginTop: 6, marginBottom: 14 },
  title: {
    fontSize: 17,
    fontWeight: 700,
    textAlign: 'center',
    color: COLOR.ink,
    letterSpacing: 0.3,
  },
  titleRule: {
    marginTop: 6,
    height: 2,
    backgroundColor: COLOR.brand,
    width: 64,
    alignSelf: 'center',
  },

  // ── Section heading
  heading: {
    marginTop: 14,
    marginBottom: 6,
    fontSize: 10.5,
    fontWeight: 700,
    color: COLOR.brand,
    letterSpacing: 0.8,
    borderBottomWidth: 0.7,
    borderBottomColor: COLOR.rule,
    borderBottomStyle: 'solid',
    paddingBottom: 3,
  },

  // ── Key/value table row
  kvRow: {
    flexDirection: 'row',
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderBottomWidth: 0.4,
    borderBottomColor: COLOR.ruleLight,
    borderBottomStyle: 'solid',
  },
  kvRowZebra: {
    flexDirection: 'row',
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderBottomWidth: 0.4,
    borderBottomColor: COLOR.ruleLight,
    borderBottomStyle: 'solid',
    backgroundColor: COLOR.zebra,
  },
  kvKey: {
    width: '38%',
    color: COLOR.muted,
    fontWeight: 500,
    fontSize: 9.5,
  },
  kvValue: {
    width: '62%',
    color: COLOR.ink,
    fontSize: 9.5,
  },

  // ── Numbered clause
  numberedRow: {
    flexDirection: 'row',
    marginTop: 4,
    marginBottom: 2,
  },
  numberedIdx: {
    width: 22,
    fontWeight: 700,
    color: COLOR.brand,
  },
  numberedText: {
    flex: 1,
    textAlign: 'justify',
  },

  // ── Paragraph
  paragraph: {
    marginTop: 4,
    marginBottom: 4,
    textAlign: 'justify',
  },
  spacer: { height: 6 },

  // ── Signature grid
  sigSection: { marginTop: 22 },
  sigSectionTitle: {
    fontSize: 10.5,
    fontWeight: 700,
    color: COLOR.brand,
    letterSpacing: 0.8,
    borderBottomWidth: 0.7,
    borderBottomColor: COLOR.rule,
    borderBottomStyle: 'solid',
    paddingBottom: 3,
    marginBottom: 10,
  },
  sigGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sigCol: {
    width: '48%',
    borderWidth: 1,
    borderColor: COLOR.rule,
    borderStyle: 'solid',
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
    backgroundColor: COLOR.paperBg,
  },
  sigLabel: {
    color: COLOR.muted,
    fontSize: 8,
    letterSpacing: 1.2,
    marginBottom: 4,
    fontWeight: 700,
  },
  sigBox: {
    height: 70,
    borderWidth: 0.6,
    borderColor: COLOR.ruleLight,
    borderStyle: 'solid',
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    padding: 4,
  },
  sigBoxEmpty: {
    height: 70,
    borderWidth: 0.8,
    borderColor: COLOR.rule,
    borderStyle: 'dashed',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  sigImg: { maxWidth: '100%', maxHeight: 60, objectFit: 'contain' },
  sigName: { fontSize: 9.5, fontWeight: 700 },
  sigMeta: { fontSize: 8.5, color: COLOR.muted, marginTop: 1 },

  // ── Footer (fixed)
  footer: {
    position: 'absolute',
    left: 52,
    right: 52,
    bottom: 28,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: COLOR.ruleLight,
    borderTopStyle: 'solid',
    fontSize: 8.5,
    color: COLOR.muted,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
})

// ---------------------------------------------------------------------------
// Block renderer
// ---------------------------------------------------------------------------
function renderBlocks(blocks: Block[]): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  let kvIndex = 0

  blocks.forEach((b, idx) => {
    switch (b.kind) {
      case 'title': {
        // The contract title is rendered manually above the body — skip any
        // title blocks the parser picks up from inside the text.
        kvIndex = 0
        return
      }
      case 'heading': {
        kvIndex = 0
        nodes.push(
          <Text key={idx} style={styles.heading} wrap={false}>
            {b.text.toUpperCase()}
          </Text>
        )
        return
      }
      case 'kv': {
        const rowStyle = kvIndex % 2 === 0 ? styles.kvRow : styles.kvRowZebra
        kvIndex += 1
        nodes.push(
          <View key={idx} style={rowStyle} wrap={false}>
            <Text style={styles.kvKey}>{b.key}</Text>
            <Text style={styles.kvValue}>{b.value}</Text>
          </View>
        )
        return
      }
      case 'numbered': {
        kvIndex = 0
        nodes.push(
          <View key={idx} style={styles.numberedRow}>
            <Text style={styles.numberedIdx}>{b.n})</Text>
            <Text style={styles.numberedText}>{b.text}</Text>
          </View>
        )
        return
      }
      case 'paragraph': {
        kvIndex = 0
        nodes.push(
          <Text key={idx} style={styles.paragraph}>
            {b.text}
          </Text>
        )
        return
      }
      case 'space': {
        kvIndex = 0
        nodes.push(<View key={idx} style={styles.spacer} />)
        return
      }
    }
  })
  return nodes
}

// ---------------------------------------------------------------------------
// Document component
// ---------------------------------------------------------------------------
function ContractPdf(props: PdfInput) {
  const blocks = parseBlocks(props.body)

  return (
    <Document title={props.title} author={props.tenantName} producer="OnSig">
      <Page size="A4" style={styles.page} wrap>
        {/* fixed header bar shown on every page */}
        <View style={styles.headerBar} fixed>
          <Text style={styles.brand}>{props.tenantName.toUpperCase()}</Text>
          <Text style={styles.contractTag}>SÖZLEŞME #{props.contractId}</Text>
        </View>

        {/* primary title */}
        <View style={styles.titleBlock} wrap={false}>
          <Text style={styles.title}>{props.title}</Text>
          <View style={styles.titleRule} />
        </View>

        {/* body */}
        {renderBlocks(blocks)}

        {/* signatures */}
        {props.signatures.length > 0 && (
          <View style={styles.sigSection} wrap={false}>
            <Text style={styles.sigSectionTitle}>İMZALAR</Text>
            <View style={styles.sigGrid}>
              {props.signatures.map((s, i) => {
                const url = asDataUrl(s.signaturePng)
                return (
                  <View key={i} style={styles.sigCol}>
                    <Text style={styles.sigLabel}>{s.roleLabel.toUpperCase()}</Text>
                    {url ? (
                      <View style={styles.sigBox}>
                        <Image src={url} style={styles.sigImg} />
                      </View>
                    ) : (
                      <View style={styles.sigBoxEmpty}>
                        <Text style={styles.sigMeta}>İmza bekleniyor</Text>
                      </View>
                    )}
                    {s.signerName ? <Text style={styles.sigName}>{s.signerName}</Text> : null}
                    {s.signerTcLast4 ? (
                      <Text style={styles.sigMeta}>T.C. son 4: ****{s.signerTcLast4}</Text>
                    ) : null}
                    {s.signedAt ? (
                      <Text style={styles.sigMeta}>İmza tarihi: {fmtDate(s.signedAt)}</Text>
                    ) : null}
                  </View>
                )
              })}
            </View>
          </View>
        )}

        {/* footer (fixed) */}
        <View style={styles.footer} fixed>
          <Text>OnSig · Sözleşme #{props.contractId}</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `${pageNumber} / ${totalPages}${
                props.verificationUrl ? `  ·  ${props.verificationUrl}` : ''
              }`
            }
          />
        </View>
      </Page>
    </Document>
  )
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export async function generateContractPdf(input: PdfInput): Promise<Buffer> {
  registerFontsOnce()
  const buf = await renderToBuffer(<ContractPdf {...input} />)
  return buf
}
