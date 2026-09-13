import { useEffect, useMemo, useRef, useState } from 'react'
import { useShop } from '../store/shop'
import { DEFAULT_IMG, discountPct, esc, fmt, getImg, maxQty, trunc } from '../lib/format'
import { ProductCard } from '../components/ui/ProductCard'
import { observeNew } from '../utils/reveal'
import { flyToCart } from '../utils/feedback'
import type { Product } from '../lib/types'

interface DescSection {
  type: string
  label: string
  lines: string[]
}

function stockInfo(p: Product): { cls: string; label: string } {
  if (!p.inStock) return { cls: 'out', label: 'Out of Stock' }
  if (String(p.stockStatus ?? '').toLowerCase().indexOf('low') !== -1) return { cls: 'low', label: 'Low Stock' }
  return { cls: 'in', label: 'In Stock' }
}

const DESC_SECTIONS = [
  { keys: ['for', 'suitable for'], type: 'pills', label: 'For', icon: 'fa-solid fa-user-check' },
  { keys: ['ingredients', 'key ingredients'], type: 'ingredients', label: 'Ingredients', icon: 'fa-solid fa-leaf' },
  { keys: ['benefits', 'key benefits'], type: 'list', label: 'Benefits', icon: 'fa-solid fa-star' },
  { keys: ['key features', 'features', 'highlights'], type: 'list', label: 'Key Features', icon: 'fa-solid fa-wand-magic-sparkles' },
  { keys: ['how to use', 'usage', 'directions', 'how to apply'], type: 'steps', label: 'How to Use', icon: 'fa-solid fa-hand-sparkles' },
  { keys: ['faq', 'faqs'], type: 'faq', label: 'FAQ', icon: 'fa-solid fa-circle-question' },
]

function matchHeading(line: string): { def: { type: string; label: string; icon: string } | null; label: string; inline: string } | null {
  const m = line.match(/^([A-Za-z][A-Za-z /&'-]{0,40})\s*:\s*(.*)$/)
  if (!m) return null
  const label = m[1].trim()
  const inline = m[2].trim()
  const low = label.toLowerCase()
  if (low === 'answer' || low === 'a' || low === 'q' || low === 'question') return null
  for (const s of DESC_SECTIONS) {
    if (s.keys.includes(low)) return { def: s, label: s.label, inline }
  }
  if (!inline && label.split(/\s+/).length <= 5) return { def: null, label, inline: '' }
  return null
}

function parseDescription(text: string): { intro: string[]; sections: DescSection[] } {
  const lines = String(text ?? '').replace(/\r/g, '').split('\n')
  const intro: string[] = []
  const sections: DescSection[] = []
  let cur: DescSection | null = null

  const pushLine = (line: string) => {
    if (cur) cur.lines.push(line)
    else intro.push(line)
  }

  lines.forEach((raw) => {
    const line = raw.trim()
    if (!line) { pushLine(''); return }
    const h = matchHeading(line)
    if (h) {
      cur = { type: h.def ? h.def.type : 'text', label: h.label, lines: [] }
      sections.push(cur)
      if (h.inline) cur.lines.push(h.inline)
    } else {
      pushLine(line)
    }
  })

  const paras: string[] = []
  let buf: string[] = []
  intro.forEach((l) => {
    if (l === '') { if (buf.length) { paras.push(buf.join(' ')); buf = [] } }
    else buf.push(l)
  })
  if (buf.length) paras.push(buf.join(' '))

  const kept = sections.filter((s) => s.lines.some((l) => l !== ''))
  return { intro: paras, sections: kept }
}

function descItems(lines: string[], splitCommas: boolean): string[] {
  const items: string[] = []
  lines.forEach((l) => {
    if (!l) return
    l = l.replace(/^[-•*\u2022]\s*/, '')
    if (splitCommas && l.indexOf(',') !== -1) {
      l.split(',').forEach((x) => { x = x.trim(); if (x) items.push(x) })
    } else if (l) items.push(l)
  })
  return items
}

function descFaqPairs(lines: string[]): Array<{ q: string; a: string }> {
  const pairs: Array<{ q: string; a: string }> = []
  let q: string | null = null
  let a: string[] = []
  const flush = () => { if (q !== null) pairs.push({ q, a: a.join(' ').trim() }); q = null; a = [] }
  lines.forEach((l) => {
    if (!l) return
    const am = l.match(/^(?:answer|a)\s*:\s*(.*)$/i)
    const qm = l.match(/^(?:question|q)\s*:\s*(.*)$/i)
    if (am) { a.push(am[1]); return }
    if (qm) { flush(); q = qm[1]; return }
    if (q === null) { q = l } else if (a.length) { flush(); q = l } else { a.push(l) }
  })
  flush()
  return pairs.filter((p) => p.q && p.a)
}

interface RenderedSec {
  label: string
  icon: string
  body: React.ReactNode
}

function renderDescription(p: Product): RenderedSec[] {
  const parsed = parseDescription(p.description ?? '')
  const out: RenderedSec[] = []

  parsed.sections.forEach((s) => {
    if (s.label && s.label.toLowerCase() === 'title') return
    const def = DESC_SECTIONS.find((d) => d.label === s.label)
    const icon = def ? def.icon : 'fa-solid fa-circle-info'
    const type = s.type

    let body: React.ReactNode = null

    if (type === 'pills') {
      const pills = descItems(s.lines, true)
      if (!pills.length) return
      body = <div className="pd-pills">{pills.map((x, i) => <span key={i} className="pd-pill">{x}</span>)}</div>
    } else if (type === 'ingredients') {
      const ingredients = s.lines.filter((l) => !!l)
      if (!ingredients.length) return
      body = ingredients.map((l, i) => <p key={i} className="pd-para">{l}</p>)
    } else if (type === 'list') {
      const items = descItems(s.lines, false)
      if (!items.length) return
      body = (
        <ul className="pd-list">
          {items.map((x, i) => (
            <li key={i}><i className="fa-solid fa-circle-check" /><span>{x}</span></li>
          ))}
        </ul>
      )
    } else if (type === 'steps') {
      const steps = descItems(s.lines, false)
      if (!steps.length) return
      body = (
        <ol className="pd-steps">
          {steps.map((x, i) => <li key={i}><span>{x}</span></li>)}
        </ol>
      )
    } else if (type === 'faq') {
      const pairs = descFaqPairs(s.lines)
      if (!pairs.length) return
      body = (
        <div className="pd-faq">
          {pairs.map((x, i) => <PdFaqItem key={i} q={x.q} a={x.a} />)}
        </div>
      )
    } else {
      const txt = s.lines.filter((l) => !!l)
      if (!txt.length) return
      body = txt.map((l, i) => <p key={i} className="pd-para">{l}</p>)
    }

    out.push({
      label: s.label,
      icon,
      body: (
        <div className="pd-section">
          <h3 className="pd-title"><i className={icon} /> {s.label}</h3>
          {body}
        </div>
      ),
    })
  })

  return out
}

/* Accessible accordion item for the product-description FAQ section —
   replaces the old click-only div that mutated classList outside React. */
function PdFaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={open ? 'pd-faq-item open' : 'pd-faq-item'}>
      <button type="button" className="pd-faq-q" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span>{q}</span>
        <i className="fa-solid fa-chevron-down" />
      </button>
      <div className="pd-faq-a"><p>{a}</p></div>
    </div>
  )
}

export function ProductView() {
  const { productId, products, addToCart, setActiveCat, closeProduct } = useShop()
  const [qty, setQty] = useState(1)
  const addRef = useRef<HTMLButtonElement>(null)
  const relatedRef = useRef<HTMLDivElement>(null)

  const p = useMemo(
    () => (productId !== null ? products.find((x) => x.id === productId) ?? null : null),
    [productId, products],
  )

  const sections = useMemo(() => (p ? renderDescription(p) : []), [p])

  const related = useMemo(() => {
    if (!p) return []
    const rel: Product[] = products.filter((x) => x.id !== p.id && x.category === p.category)
    if (rel.length < 4) {
      products.forEach((x) => {
        if (x.id === p.id || rel.includes(x) || rel.length >= 4) return
        if (x.brand === p.brand) rel.push(x)
      })
    }
    if (rel.length < 4) {
      products.forEach((x) => {
        if (x.id === p.id || rel.includes(x) || rel.length >= 4) return
        if (x.inStock) rel.push(x)
      })
    }
    return rel.slice(0, 4)
  }, [p, products])

  useEffect(() => {
    if (!relatedRef.current || !related.length) return
    observeNew(Array.from(relatedRef.current.querySelectorAll('.card')))
  }, [related])

  if (!p) return null

  const si = stockInfo(p)
  const out = si.cls === 'out'
  const price = Number(p.displayPrice ?? p.offerPrice ?? p.oldPrice ?? 0) || 0
  const old = Number(p.oldPrice) || 0
  const pct = discountPct(p)
  const img = getImg(p)

  const stockText = out
    ? 'Out of Stock'
    : `${si.label}${Number(p.stockQty) > 0 ? ` (${Number(p.stockQty)} units)` : ''}`
  const stockIcon = out ? 'fa-solid fa-circle-xmark' : 'fa-solid fa-circle-check'
  const stockColor = out ? 'var(--red)' : si.cls === 'low' ? 'var(--amber)' : 'var(--green)'

  const ppQty = (d: number) => setQty((q) => Math.max(1, Math.min(q + d, maxQty(p))))

  const add = () => {
    flyToCart(addRef.current)
    addToCart(p.id, qty)
  }

  const goCategory = () => {
    setActiveCat(p.category || 'All')
    closeProduct()
  }

  const fallbackDesc =
    `${p.brand} ${p.title}${p.size ? ` — ${p.size}` : ''}. Message us on WhatsApp for full product details.`

  return (
    <section id="product-page">
      <div className="pp-inner">
        <nav className="pp-crumb" aria-label="Breadcrumb">
          <button type="button" className="pp-crumb-link" onClick={closeProduct}>Shop</button>
          <i className="fa-solid fa-angle-right" />
          <button type="button" className="pp-crumb-link" onClick={goCategory}>{p.category ?? 'All'}</button>
          <i className="fa-solid fa-angle-right" />
          <strong>{trunc(p.title, 40)}</strong>
        </nav>

        <div className="pp-grid">
          <div className="pp-media">
            <span className={pct > 0 ? 'pp-disc' : 'pp-disc hidden'} id="pp-disc">-{pct}%</span>
            <img id="pp-img" src={img} alt={p.title} onError={(e) => { (e.currentTarget as HTMLImageElement).onerror = null; e.currentTarget.src = DEFAULT_IMG }} />
          </div>

          <div className="pp-info">
            <p className="pp-brand" id="pp-brand">{p.brand}{p.category ? ` · ${p.category}` : ''}</p>
            <h1 className="pp-name" id="pp-name">{p.title}</h1>
            <p className="pp-sku" id="pp-sku">{p.sku ? `SKU: ${p.sku}` : ''}</p>
            <div className="pp-price-row">
              <span className="pp-price" id="pp-price">{fmt(price)}</span>
              <span className="pp-price-old" id="pp-old">{p.hasDiscount ? fmt(old) : ''}</span>
            </div>

            <p className={`pp-stock ${si.cls}`} id="pp-stock">
              <i className={stockIcon} style={{ color: stockColor, marginRight: 6 }} /> {stockText}
            </p>

            <div className="pp-actions">
              <div className="qty-ctrl pp-qty-ctrl">
                <button type="button" aria-label="Decrease quantity" onClick={() => ppQty(-1)}>−</button>
                <span id="pp-qty">{qty}</span>
                <button type="button" aria-label="Increase quantity" onClick={() => ppQty(1)}>+</button>
              </div>
              <button className="pp-add" id="pp-add" type="button" onClick={add} disabled={out} ref={addRef}>
                <i className="fa fa-bag-shopping" /> Add to Bag
              </button>
            </div>

            <table className="pp-meta">
              <tbody>
                <tr><td>Brand</td><td id="pp-meta-brand">{p.brand || '—'}</td></tr>
                <tr><td>Category</td><td id="pp-meta-cat">{p.category || '—'}</td></tr>
                <tr><td>Size</td><td id="pp-meta-size">{p.size || '—'}</td></tr>
                <tr><td>SKU</td><td id="pp-meta-sku">{p.sku || '—'}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="pp-desc-wrap" id="pp-desc-wrap">
          <h2 className="section-title pp-h2">Product <span>Details</span></h2>
          <div className="pp-desc" id="pp-desc">
            {sections.length === 0 && <p className="pd-para">{esc(fallbackDesc)}</p>}
            {sections.map((s, i) => <div key={i}>{s.body}</div>)}
          </div>
        </div>

        {related.length > 0 && (
          <div className="pp-related-wrap" id="pp-related-wrap">
            <h2 className="section-title pp-h2">You May Also <span>Like</span></h2>
            <div id="pp-related" ref={relatedRef}>
              {related.map((r, i) => (
                <ProductCard key={r.id} p={r} delay={Math.min(i, 4) * 55} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}