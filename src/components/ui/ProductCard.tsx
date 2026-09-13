import { ShoppingBag } from 'lucide-react'
import type { Product } from '../../lib/types'
import { discountPct, fmt, getImg } from '../../lib/format'
import { useShop } from '../../store/shop'
import { cn } from '../../utils/cn'

export function ProductCard({ p, delay = 0 }: { p: Product; delay?: number }) {
  const { addToCart, openProduct, config } = useShop()
  const sym = config.currencySymbol || '৳'
  const price = Number(p.displayPrice ?? p.offerPrice ?? p.oldPrice ?? 0) || 0
  const old = Number(p.oldPrice) || 0
  const pct = discountPct(p)
  const out = p.inStock === false
  const soldOut = typeof p.stockQty === 'number' && p.stockQty <= 0

  const quickAdd = (e: React.MouseEvent) => {
    e.stopPropagation()
    addToCart(p.id)
  }

  return (
    <article
      data-delay={delay}
      onClick={() => openProduct(p.id)}
      className="card-hover group cursor-pointer rounded-[var(--radius-r-xl)] border border-bdr bg-white p-3 shadow-sm"
    >
      <div className="relative overflow-hidden rounded-[var(--radius-r-xl)]">
        <img
          src={getImg(p)}
          alt={p.title}
          loading="lazy"
          className={cn('aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-105',
            (out || soldOut) && 'opacity-60 saturate-50')}
        />
        {pct > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-rose px-2.5 py-1 text-[11px] font-extrabold text-white shadow">
            −{pct}%
          </span>
        )}
        {(out || soldOut) && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/70">
            <span className="rounded-full bg-ink px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white">Sold out</span>
          </span>
        )}
        <button
          type="button"
          onClick={quickAdd}
          disabled={out || soldOut}
          aria-label="Add to bag"
          className="absolute bottom-3 right-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-rose-d shadow-lg transition-all hover:bg-rose-d hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ShoppingBag size={16} />
        </button>
      </div>
      <div className="px-1.5 pb-1.5 pt-3">
        <p className="truncate text-[11px] font-bold uppercase tracking-wider text-gold">{p.brand || p.category}</p>
        <h3 className="mt-1 line-clamp-2 min-h-[2.6em] text-sm font-bold leading-snug text-ink">{p.title}</h3>
        <div className="mt-2 flex items-baseline gap-2">
          <span className={cn('text-base font-extrabold', old > price ? 'text-rose-d' : 'text-ink')}>{fmt(price, sym)}</span>
          {old > price && <span className="text-xs text-slate line-through">{fmt(old, sym)}</span>}
        </div>
        <p className="mt-0.5 text-[11px] text-slate">{p.size || ''}</p>
      </div>
    </article>
  )
}