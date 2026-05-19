'use client'

import { useEffect, useRef, useState } from 'react'
import { Eraser, Pencil } from 'lucide-react'

/**
 * SignatureCanvas — React-bağımsız SVG sketch pad.
 *
 * SVG elementi React JSX ağacına dahil değildir; useEffect içinde
 * createElementNS + appendChild ile manuel oluşturulup container div'e
 * eklenir. Böylece React her re-render'da DOM'a hiç dokunmaz ve
 * yapılan çizimler garantili olarak kalır.
 *
 * `hasInk` React state'i yalnızca placeholder göstergesini gizlemek
 * ve Temizle butonunu aktive etmek için tutulur.
 */

export interface SignatureCanvasProps {
  onChange: (dataUrl: string | null) => void
  disabled?: boolean
  hint?: string
}

const STROKE_WIDTH = 2.4
const STROKE_COLOR = '#0F172A'
const SVG_NS = 'http://www.w3.org/2000/svg'

export default function SignatureCanvas({ onChange, disabled, hint }: SignatureCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const onChangeRef = useRef(onChange)
  const disabledRef = useRef(!!disabled)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [hasInk, setHasInk] = useState(false)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])
  useEffect(() => {
    disabledRef.current = !!disabled
  }, [disabled])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    // Version banner so we know the latest code is loaded.
    // eslint-disable-next-line no-console
    console.info('[OnSig SignatureCanvas v4 — DOM-managed SVG]')

    // ----- Build SVG (outside of React's reach) -----
    const svg = document.createElementNS(SVG_NS, 'svg') as SVGSVGElement
    svg.style.position = 'absolute'
    svg.style.inset = '0'
    svg.style.width = '100%'
    svg.style.height = '100%'
    svg.style.display = 'block'
    svg.style.touchAction = 'none'
    svg.style.cursor = 'crosshair'
    svg.setAttribute('preserveAspectRatio', 'none')
    svg.dataset.onsigSc = 'v4'

    function applyViewBox() {
      const w = container!.clientWidth
      const h = container!.clientHeight
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`)
      svg.setAttribute('width', String(w))
      svg.setAttribute('height', String(h))
    }
    applyViewBox()
    container.appendChild(svg)
    svgRef.current = svg

    // ----- Drawing state -----
    let drawing = false
    let currentPath: SVGPathElement | null = null
    let points: { x: number; y: number }[] = []

    function getPos(e: PointerEvent): { x: number; y: number } {
      const rect = svg.getBoundingClientRect()
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    function ptsToD(pts: { x: number; y: number }[]): string {
      if (pts.length === 0) return ''
      if (pts.length === 1) {
        const p = pts[0]!
        return `M ${p.x - 0.6} ${p.y} a 0.6 0.6 0 1 0 1.2 0 a 0.6 0.6 0 1 0 -1.2 0`
      }
      if (pts.length === 2) {
        const a = pts[0]!
        const b = pts[1]!
        return `M ${a.x} ${a.y} L ${b.x} ${b.y}`
      }
      let d = `M ${pts[0]!.x} ${pts[0]!.y}`
      for (let i = 1; i < pts.length - 1; i++) {
        const cur = pts[i]!
        const next = pts[i + 1]!
        const mx = (cur.x + next.x) / 2
        const my = (cur.y + next.y) / 2
        d += ` Q ${cur.x} ${cur.y} ${mx} ${my}`
      }
      const tail = pts[pts.length - 1]!
      d += ` L ${tail.x} ${tail.y}`
      return d
    }

    function newPath(): SVGPathElement {
      const p = document.createElementNS(SVG_NS, 'path') as SVGPathElement
      p.setAttribute('fill', 'none')
      p.setAttribute('stroke', STROKE_COLOR)
      p.setAttribute('stroke-width', String(STROKE_WIDTH))
      p.setAttribute('stroke-linecap', 'round')
      p.setAttribute('stroke-linejoin', 'round')
      p.setAttribute('data-onsig-ink', '1')
      svg.appendChild(p)
      return p
    }

    function onDown(e: PointerEvent) {
      if (disabledRef.current) return
      e.preventDefault()
      try {
        svg.setPointerCapture(e.pointerId)
      } catch {
        // capture optional
      }
      drawing = true
      points = [getPos(e)]
      currentPath = newPath()
      currentPath.setAttribute('d', ptsToD(points))
      setHasInk(true)
    }

    function onMove(e: PointerEvent) {
      if (!drawing || !currentPath) return
      e.preventDefault()
      points.push(getPos(e))
      currentPath.setAttribute('d', ptsToD(points))
    }

    function onUp(e: PointerEvent) {
      if (!drawing) return
      drawing = false
      try {
        svg.releasePointerCapture(e.pointerId)
      } catch {
        // ignore — may already be released
      }
      currentPath = null
      points = []
      rasterize().then((url) => {
        if (url) onChangeRef.current(url)
      })
    }

    function rasterize(): Promise<string | null> {
      return new Promise((resolve) => {
        const rect = svg.getBoundingClientRect()
        const w = Math.max(rect.width, 100)
        const h = Math.max(rect.height, 60)
        const clone = svg.cloneNode(true) as SVGSVGElement
        clone.setAttribute('xmlns', SVG_NS)
        clone.setAttribute('width', String(w))
        clone.setAttribute('height', String(h))
        const xml = new XMLSerializer().serializeToString(clone)
        const dataUrl = `data:image/svg+xml;base64,${window.btoa(unescape(encodeURIComponent(xml)))}`
        const img = new Image()
        img.onload = () => {
          const c = document.createElement('canvas')
          const ratio = Math.max(window.devicePixelRatio || 1, 1)
          c.width = Math.floor(w * ratio)
          c.height = Math.floor(h * ratio)
          const ctx = c.getContext('2d')
          if (!ctx) return resolve(null)
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, c.width, c.height)
          ctx.drawImage(img, 0, 0, c.width, c.height)
          resolve(c.toDataURL('image/png'))
        }
        img.onerror = () => resolve(null)
        img.src = dataUrl
      })
    }

    svg.addEventListener('pointerdown', onDown)
    svg.addEventListener('pointermove', onMove)
    svg.addEventListener('pointerup', onUp)
    svg.addEventListener('pointercancel', onUp)
    window.addEventListener('resize', applyViewBox)

    return () => {
      window.removeEventListener('resize', applyViewBox)
      // Remove SVG entirely (listeners go with it).
      if (svg.parentNode) svg.parentNode.removeChild(svg)
      svgRef.current = null
    }
  }, [])

  function clearAll() {
    const svg = svgRef.current
    if (svg) {
      const inks = svg.querySelectorAll('[data-onsig-ink="1"]')
      inks.forEach((n) => n.parentNode?.removeChild(n))
    }
    setHasInk(false)
    onChange(null)
  }

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className={`relative w-full h-44 sm:h-52 rounded-2xl border-2 ${
          disabled ? 'border-slate-200 bg-slate-50' : 'border-dashed border-brand/40 bg-white'
        } overflow-hidden touch-none select-none`}
      >
        {/* SVG is appended here imperatively in useEffect — React doesn't manage it. */}
        {!hasInk && !disabled && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-ink-muted/60 text-sm gap-1 z-10">
            <Pencil className="w-5 h-5" />
            <span>Parmağınız veya farenizle imzalayın</span>
          </div>
        )}
        {disabled && (
          <div className="absolute inset-0 grid place-items-center text-sm text-ink-muted z-10">
            Önce doğrulama kodunu girin.
          </div>
        )}
      </div>
      <div className="flex items-center justify-between text-xs text-ink-muted">
        <span>{hint || 'Tek seferlik kullanım; tekrar imzalayabilirsiniz.'}</span>
        <button
          type="button"
          onClick={clearAll}
          className="inline-flex items-center gap-1 text-ink-muted hover:text-danger disabled:opacity-50"
          disabled={disabled || !hasInk}
        >
          <Eraser className="w-3.5 h-3.5" />
          Temizle
        </button>
      </div>
    </div>
  )
}
