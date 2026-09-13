import { useMemo, useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { useShop } from '../store/shop'
import { ProductCard } from '../components/ui/ProductCard'
import { cn } from '../utils/cn'

export function ShopGrid() {
  const { products, activeCat, setActiveCat, search, setSearch, clearFilter, loadStatus, retry } = useShop()
  const [ddOpen, setDdOpen] = useState(false)

  const hasFilter = !!search || activeCat !== 'All'
  const hasReady = loadStatus === 'ready'

  const categories = useMemo(() => {
    const seen = new Map<string, number>()
    products.forEach((p) => { if (p.category) seen.set(p.category, (seen.get(p.category) ?? 0) + 1) })
    return [{ name: 'All', count: products.length } as const,
      ...Array.from(seen.entries()).map(([name, count]) => ({ name, count }))]
  }, [products])

  const filtered = useMemo(() => {
    let list = products
    if (activeCat !== 'All') list = list.filter((p) => p.category === activeCat)
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter((p) =>
        `${p.title} ${p.brand} ${p.category}`.toLowerCase().includes(q)
      )
    }
    return list
  }, [products, activeCat, search])

  const pick = (name: string) => {
    setActiveCat(name)
    setDdOpen(false)
  }

  return (
    <div id="shop" className="relative mx-auto max-w-[1400px] scroll-mt-24 px-4 py-10 md:px-8 md:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mono-label">The Collection</p>
          <h2 className="mt-2 text-3xl font-extrabold text-ink md:text-4xl">
            Our <span className="display-serif italic text-rose-d">Collection</span>
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={ddOpen}
              onClick={() => setDdOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full border border-bdr bg-white px-4 py-2.5 text-sm font-bold text-ink transition-colors hover:border-rose-m"
            >
              {activeCat === 'All' ? 'All Categories' : activeCat}
              <ChevronDown size={14} className={cn('transition-transform', ddOpen && 'rotate-180')} />
            </button>
            {ddOpen && (
              <div role="listbox" aria-label="Filter by category"
                className="dd-in absolute right-0 top-full z-20 mt-2 w-56 rounded-2xl border border-bdr bg-white p-2 shadow-xl">
                {categories.map((c) => (
                  <button key={c.name} type="button" role="option" aria-selected={activeCat === c.name} onClick={() => pick(c.name)}
                    className={cn('flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors',
                      activeCat === c.name ? 'bg-rose-s font-bold text-rose-d' : 'text-ink hover:bg-rose-s/60')}>
                    <span>{c.name}</span>
                    <span className="text-xs text-slate">{c.count}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <span className="text-xs font-bold text-slate">{filtered.length} product{filtered.length === 1 ? '' : 's'}</span>
        </div>
      </div>

      {/* Search on small screens */}
      <div className="relative mt-5 lg:hidden">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products, brands…"
          className="w-full rounded-full border border-bdr bg-white py-3 pl-5 pr-14 text-sm focus:border-rose-m"
        />
        {hasFilter && (
          <button type="button" onClick={clearFilter} aria-label="Clear filter"
            className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-rose-s text-rose-d">
            <X size={14} />
          </button>
        )}
      </div>
      {hasFilter && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate">Filtering:</span>
          {activeCat !== 'All' && (
            <button type="button" onClick={() => pick('All')}
              className="inline-flex items-center gap-1 rounded-full bg-rose-s px-3 py-1 text-xs font-bold text-rose-d">
              {activeCat} <X size={11} />
            </button>
          )}
          {search && (
            <button type="button" onClick={clearFilter}
              className="inline-flex items-center gap-1 rounded-full bg-rose-s px-3 py-1 text-xs font-bold text-rose-d">
              “{search}” <X size={11} />
            </button>
          )}
        </div>
      )}

      {/* States */}
      {loadStatus === 'error' && (
        <div className="mt-14 flex flex-col items-center rounded-[var(--radius-r-xl)] border border-bdr bg-white py-16 text-center">
          <p className="text-4xl">⚠️</p>
          <p className="mt-4 font-bold text-ink">Could not load products</p>
          <p className="mt-1 text-sm text-slate">Please check the Apps Script connection.</p>
          <button type="button" onClick={retry}
            className="mt-5 rounded-full bg-rose-d px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-rose">
            Retry
          </button>
        </div>
      )}

      {hasReady && filtered.length === 0 && !hasFilter && (
        <div className="mt-14 flex flex-col items-center rounded-[var(--radius-r-xl)] border border-bdr bg-white py-16 text-center">
          <p className="text-4xl">🌿</p>
          <p className="mt-4 font-bold text-ink">Nothing to show yet</p>
          <p className="mt-1 text-sm text-slate">Our collection is being refreshed.</p>
        </div>
      )}

      {hasReady && filtered.length === 0 && hasFilter && (
        <div className="mt-14 flex flex-col items-center rounded-[var(--radius-r-xl)] border border-bdr bg-white py-16 text-center">
          <p className="text-4xl">🔍</p>
          <p className="mt-4 font-bold text-ink">No products found</p>
          <p className="mt-1 text-sm text-slate">Try a different search or category.</p>
        </div>
      )}

      {/* Grid (skeleton shimmer while loading) */}
      {!hasReady && loadStatus === 'loading' && (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-[var(--radius-r-xl)] border border-bdr bg-white p-3">
              <div className="aspect-[4/5] rounded-[var(--radius-r-xl)] bg-blush" />
              <div className="mt-3 h-3 w-1/2 rounded bg-blush" />
              <div className="mt-2 h-4 w-3/4 rounded bg-blush" />
            </div>
          ))}
        </div>
      )}

      {hasReady && (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p, i) => (
            <ProductCard key={p.id} p={p} delay={(i % 8) * 45} />
          ))}
        </div>
      )}
    </div>
  )
}