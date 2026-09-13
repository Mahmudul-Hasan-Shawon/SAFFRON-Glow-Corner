import { useEffect, useRef } from 'react'
import type { Product } from '../../lib/types'
import { DEFAULT_IMG, discountPct, fmt, getImg } from '../../lib/format'
import { useShop } from '../../store/shop'
import { flyToCart } from '../../utils/feedback'

function stockInfo(p: Product): { cls: string; label: string } {
  if (!p.inStock) return { cls: 'out', label: 'Out of Stock' }
  if (String(p.stockStatus ?? '').toLowerCase().indexOf('low') !== -1) return { cls: 'low', label: 'Low Stock' }
  return { cls: 'in', label: 'In Stock' }
}

export function ProductCard({ p, delay = 0 }: { p: Product; delay?: number }) {
  const { addToCart, openProduct } = useShop()
  const addBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!delay) return
    const t = window.setTimeout(() => {
      const el = document.querySelector(`[data-pid="${p.id}"]`)
      if (el) el.classList.add('in')
    }, 0)
    return () => window.clearTimeout(t)
  }, [delay, p.id])

  const price = Number(p.displayPrice ?? p.offerPrice ?? p.oldPrice ?? 0) || 0
  const old = Number(p.oldPrice) || 0
  const pct = discountPct(p)
  const si = stockInfo(p)
  const out = si.cls === 'out'
  const imgSrc = getImg(p)

  const quickAdd = (e: React.MouseEvent) => {
    e.stopPropagation()
    flyToCart((addBtnRef.current?.parentElement?.parentElement as HTMLElement) ?? null)
    addToCart(p.id)
  }

  return (
    <article
      className="card reveal in"
      data-delay={delay}
      data-pid={p.id}
      onClick={() => openProduct(p.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openProduct(p.id) }
      }}
    >
      <div className="card-img">
        <img
          src={imgSrc}
          alt={p.title}
          loading="lazy"
          decoding="async"
          onError={(e) => { (e.currentTarget as HTMLImageElement).onerror = null; e.currentTarget.src = DEFAULT_IMG }}
        />
        <div className="card-badges">
          {p.hasDiscount ? (
            <span className="badge badge-sale">-{pct}%</span>
          ) : si.cls === 'low' ? (
            <span className="badge badge-low">Low Stock</span>
          ) : null}
        </div>
        <button
          className="card-quick"
          aria-label="Add to bag"
          type="button"
          onClick={quickAdd}
          disabled={out}
        >
          <i className="fa-solid fa-cart-plus" />
        </button>
      </div>
      <div className="card-body">
        <span className="card-brand">{p.brand}</span>
        <p className="card-name">{p.title}</p>
        <p className="card-size">{p.size}</p>
        <div className="card-pricing">
          <span className="p-new">{fmt(price)}</span>
          {p.hasDiscount && <span className="p-old">{fmt(old)}</span>}
        </div>
        <div className="card-foot">
          <span className={`stock-tag ${si.cls}`}>{si.label}</span>
          <button className="add-btn" aria-label="Add to bag" type="button" onClick={quickAdd} disabled={out} ref={addBtnRef}>
            <i className="fa-solid fa-cart-plus" />
          </button>
        </div>
      </div>
    </article>
  )
}