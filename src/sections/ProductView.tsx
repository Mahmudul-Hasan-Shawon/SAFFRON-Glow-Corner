import { useMemo, useState } from 'react'
import { ArrowLeft, Minus, Plus, ShoppingBag, ChevronRight } from 'lucide-react'
import { useShop } from '../store/shop'
import { discountPct, fmt, getImg } from '../lib/format'
import { cn } from '../utils/cn'

const DESC_SECTIONS = [
  { keys: ['what is it', 'description', 'overview'], type: 'para' as const },
  { keys: ['key benefits', 'benefits'], type: 'bullets' as const },
  { keys: ['key ingredients', 'ingredients', 'hero ingredients'], type: 'bullets' as const },
  { keys: ['for', 'suitable for'], type: 'bullets' as const, label: 'For' },
  { keys: ['how to use', 'usage'], type: 'bullets' as const },
  { keys: ['full list of ingredients', 'full ingredient list', 'ingredient list'], type: 'bullets' as const },
]

function matchHeading(line: string): string | null {
  const clean = line.toLowerCase().replace(/[:_-]*\s*$/, '')
  const hit = DESC_SECTIONS.find((s) => s.keys.some((k) => clean === k || clean.startsWith(k + ' ') || clean.startsWith(k + ':')))
  return hit ? hit.type : null
}

export function ProductView() {
  const { productId, products, addToCart, config, setActiveCat, openProduct, closeProduct } = useShop()
  const [qty, setQty] = useState(1)

  const p = useMemo(() => (productId !== null ? products.find((x) => x.id === productId) : null), [productId, products])

  if (!p) return null
  const sym = config.currencySymbol || '৳'
  const price = Number(p.displayPrice ?? p.offerPrice ?? p.oldPrice ?? 0) || 0
  const old = Number(p.oldPrice) || 0
  const pct = discountPct(p)
  const out = p.inStock === false || (typeof p.stockQty === 'number' && p.stockQty <= 0)

  const related = products.filter((x) => x.category === p.category && x.id !== p.id).slice(0, 4)

  const parseDesc = () => {
    const text = String(p.description ?? '')
    if (!text.trim()) return null
    const lines = text.split('. ').join('.\n').split('\n').map((s) => s.trim()).filter(Boolean)
    const sections: Array<{ type: string; label?: string; items: string[] }> = []
    let current: { type: string; label?: string; items: string[] } | null = null

    lines.forEach((raw) => {
      const stripped = raw.replace(/^[-*•]\s*/, '')
      const heading = matchHeading(raw)
      if (heading) {
        current = { type: heading, items: [] }
        sections.push(current)
        // the heading may carry a leading label like "How to use:"
        const label = raw.split(/[:]/)[0]
        if (heading === 'bullets') current.label = label.includes(' ') ? label : undefined
        // text after the first colon on the heading line belongs to the body
        const rest = raw.split(/:(.+)/)[1]
        if (rest && rest.trim()) current.items.push(rest.trim())
        return
      }
      if (!current) {
        current = { type: 'para', items: [] }
        sections.push(current)
      }
      current.items.push(stripped)
    })
    return sections.filter((s) => s.items.length)
      .map((s) => {
        if (s.type === 'bullets' || s.items.length > 1) return { ...s, items: s.items }
        return { ...s, items: s.items }
      })
  }

  const sections = parseDesc()

  const goCategory = () => {
    setActiveCat(p.category || 'All')
    closeProduct()
  }

  const add = () => { addToCart(p.id, qty); closeProduct() }

  return (
    <section className="mx-auto max-w-[1200px] px-4 pt-28 pb-14 md:px-8" aria-live="polite" id="product-view">
      <button type="button" onClick={closeProduct}
        className="inline-flex items-center gap-2 text-sm font-bold text-slate transition-colors hover:text-rose-d">
        <ArrowLeft size={15} /> Back to Shop
      </button>

      {/* Breadcrumb */}
      <nav className="mt-4 flex flex-wrap items-center gap-1.5 text-xs text-slate" aria-label="Breadcrumb">
        <span className="cursor-pointer font-bold hover:text-rose-d" onClick={closeProduct}>Shop</span>
        <ChevronRight size={11} />
        <span className="cursor-pointer font-bold hover:text-rose-d" onClick={goCategory}>{p.category || 'All'}</span>
        <ChevronRight size={11} />
        <strong className="text-ink">{p.title}</strong>
      </nav>

      <div className="mt-6 grid gap-8 md:grid-cols-2">
        <div className="relative">
          {pct > 0 && (
            <span className="absolute left-4 top-4 z-10 rounded-full bg-rose px-3 py-1 text-xs font-extrabold text-white shadow">
              −{pct}%
            </span>
          )}
          <img src={getImg(p)} alt={p.title} className={cn('aspect-[4/5] w-full rounded-[var(--radius-r-xl)] object-cover shadow-lg', out && 'opacity-60 saturate-50')} />
        </div>

        <div>
          {p.brand && <p className="text-xs font-bold uppercase tracking-widest text-gold">{p.brand}</p>}
          <h1 className="mt-2 text-3xl font-extrabold text-ink">{p.title}</h1>
          {p.sku && <p className="mt-1 text-xs text-slate">SKU: {p.sku}</p>}

          <div className="mt-4 flex items-baseline gap-3">
            <span className={cn('text-2xl font-extrabold', old > price ? 'text-rose-d' : 'text-ink')}>{fmt(price, sym)}</span>
            {old > price && <span className="text-base text-slate line-through">{fmt(old, sym)}</span>}
          </div>

          <p className={cn('mt-2 text-sm font-bold', out ? 'text-rose' : 'text-green')}>
            {out ? 'Currently out of stock' : p.stockQty && p.stockQty <= 8 ? `Only ${p.stockQty} left in stock` : 'In stock'}
          </p>

          <div className="mt-6 flex max-w-md items-center gap-3">
            <div className="flex items-center gap-1 rounded-full border border-bdr bg-white">
              <button type="button" aria-label="Decrease quantity" onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="flex h-11 w-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-rose-s hover:text-rose-d">
                <Minus size={15} />
              </button>
              <span className="w-8 text-center text-base font-bold">{qty}</span>
              <button type="button" aria-label="Increase quantity" onClick={() => setQty((q) => q + 1)}
                className="flex h-11 w-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-rose-s hover:text-rose-d">
                <Plus size={15} />
              </button>
            </div>
            <button type="button" onClick={add} disabled={out}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-rose-d py-3.5 text-sm font-bold text-white shadow-lg transition-colors hover:bg-rose disabled:cursor-not-allowed disabled:opacity-40">
              <ShoppingBag size={15} /> {out ? 'Sold Out' : 'Add to Bag'}
            </button>
          </div>

          {/* Short desc */}
          {sections && sections[0] && (
            <div className="mt-6 rounded-2xl border border-bdr bg-white p-5 text-sm leading-relaxed text-slate">
              {sections.filter((s) => s.type === 'para').slice(0, 1)[0]?.items.join(' ') || ''}
            </div>
          )}

          <table className="mt-6 w-full max-w-md text-sm">
            <tbody>
              {[['Brand', p.brand || '—'], ['Category', p.category || '—'], ['Size', p.size || '—'], ['SKU', p.sku || '—']].map(([k, v]) => (
                <tr key={k} className="border-b border-bdr last:border-0">
                  <td className="py-2.5 font-bold text-slate">{k}</td>
                  <td className="py-2.5 text-right font-semibold text-ink">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail sections */}
      {sections && sections.length > 0 && (
        <div className="mt-14">
          <h2 className="text-2xl font-extrabold text-ink">
            Product <span className="display-serif italic text-rose-d">Details</span>
          </h2>
          <div className="mt-5 space-y-5">
            {sections.filter((s) => s.type !== 'para' || s.items.length).map((s, i) => (
              <div key={i} className="rounded-[var(--radius-r-lg)] border border-bdr bg-white p-6">
                {s.label && <h3 className="text-sm font-extrabold uppercase tracking-wider text-rose-d">{s.label}</h3>}
                {s.type === 'bullets' ? (
                  <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate">
                    {s.items.map((it, j) => <li key={j} className="flex gap-2"><span className="text-rose-d">•</span>{it}</li>)}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm leading-relaxed text-slate">{s.items.join(' ')}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related */}
      {related.length > 0 && (
        <div className="mt-14">
          <h2 className="text-2xl font-extrabold text-ink">
            You May Also <span className="display-serif italic text-rose-d">Like</span>
          </h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((r) => (
              <div key={r.id} onClick={() => { setQty(1); openProduct(r.id) }}
                className="card-hover cursor-pointer rounded-[var(--radius-r-xl)] border border-bdr bg-white p-3">
                <img src={getImg(r)} alt={r.title} loading="lazy" className="aspect-[4/5] w-full rounded-[var(--radius-r-lg)] object-cover" />
                <p className="mt-2 truncate text-xs font-bold text-ink">{r.title}</p>
                <p className="mt-0.5 text-sm font-extrabold text-rose-d">{fmt(Number(r.displayPrice ?? r.offerPrice ?? 0), sym)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}