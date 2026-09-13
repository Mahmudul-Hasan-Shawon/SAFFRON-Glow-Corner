import { useEffect, useMemo, useRef, useState } from 'react'
import { useShop } from '../store/shop'
import { ProductCard } from '../components/ui/ProductCard'
import { observeNew } from '../utils/reveal'
import { enableMenuScroll } from '../utils/menuScroll'

export function ShopGrid() {
  const { products, activeCat, setActiveCat, loadStatus, retry } = useShop()
  const gridRef = useRef<HTMLDivElement>(null)
  const ddMenuRef = useRef<HTMLDivElement>(null)
  const [ddOpen, setDdOpen] = useState(false)

  useEffect(() => enableMenuScroll(ddMenuRef.current), [])

  const categories = useMemo(() => {
    const seen = new Map<string, number>()
    products.forEach((p) => { if (p.category) seen.set(p.category, (seen.get(p.category) ?? 0) + 1) })
    return [
      { name: 'All', count: products.length },
      ...Array.from(seen.entries()).map(([name, count]) => ({ name, count })),
    ]
  }, [products])

  const filtered = useMemo(() => {
    if (activeCat === 'All') return products
    return products.filter((p) => p.category === activeCat)
  }, [products, activeCat])

  /* Cards mount after data arrives; arm the reveal observer on the grid. */
  useEffect(() => {
    if (!gridRef.current || filtered.length === 0) return
    const nodes = Array.from(gridRef.current.querySelectorAll('.card'))
    observeNew(nodes)
  }, [filtered])

  const ready = loadStatus === 'ready'
  const loading = loadStatus === 'loading'

  return (
    <div className="page" id="shop">
      <div className="section-head reveal in">
        <h2 className="section-title">Our <span>Collection</span></h2>
        <div className="shop-tools">
          <div className="cat-dd" id="cat-dd">
            <button
              className={ddOpen ? 'cat-dd-btn open' : 'cat-dd-btn'}
              id="cat-dd-btn"
              type="button"
              aria-haspopup="listbox"
              aria-expanded={ddOpen}
              onClick={() => setDdOpen((v) => !v)}
            >
              <span id="cat-dd-label">{activeCat === 'All' ? 'All Categories' : activeCat}</span>
              <i className="fa-solid fa-chevron-down" />
            </button>
            <div className={ddOpen ? 'cat-dd-menu' : 'cat-dd-menu hidden'} id="cat-dd-menu" ref={ddMenuRef} role="listbox" aria-label="Filter by category">
              {categories.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  role="option"
                  aria-selected={activeCat === c.name}
                  className={activeCat === c.name ? 'cat-dd-opt on' : 'cat-dd-opt'}
                  data-cat={c.name}
                  onClick={() => { setActiveCat(c.name); setDdOpen(false) }}
                >
                  <span>{c.name}</span><span className="cat-dd-count">{c.count}</span>
                </button>
              ))}
            </div>
          </div>
          <span className="section-count" id="prod-count">
            {ready && `${filtered.length} product${filtered.length === 1 ? '' : 's'}`}
          </span>
        </div>
      </div>

      <div id="loading-state" className={loading ? 'loading-box' : 'loading-box hidden'}>
        <div className="spin" />
        <p style={{ color: 'var(--slate)', fontSize: 14, letterSpacing: '.4px' }}>Loading live products…</p>
      </div>

      <div id="error-state" className={loadStatus === 'error' ? 'loading-box' : 'loading-box hidden'}>
        <div className="state-icon">⚠️</div>
        <p className="state-title">Could not load products</p>
        <p className="state-sub" id="err-msg">Please check the Apps Script URL.</p>
        <button className="btn-retry" type="button" onClick={retry}>Retry</button>
      </div>

      <div id="empty-state" className={ready && filtered.length === 0 ? 'loading-box' : 'loading-box hidden'}>
        <div className="state-icon">🔍</div>
        <p className="state-title">No products found</p>
        <p className="state-sub">Try a different search or category.</p>
      </div>

      <div id="product-grid" className={ready && filtered.length > 0 ? '' : 'hidden'} ref={gridRef}>
        {filtered.map((p, i) => (
          <ProductCard key={p.id} p={p} delay={Math.min(i, 11) * 55} />
        ))}
      </div>
    </div>
  )
}