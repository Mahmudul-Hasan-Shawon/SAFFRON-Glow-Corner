import { X, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useShop } from '../../store/shop'
import { cn } from '../../utils/cn'
import { getLenis } from '../../utils/lenis'

export function SidePanel() {
  const { panelMode, closePanel, products, setActiveCat, search, setSearch, activeCat } = useShop()
  const [q, setQ] = useState('')

  const isBrand = panelMode === 'brand'

  const options = useMemo(() => {
    if (isBrand) {
      const m = new Map<string, number>()
      products.forEach((p) => { if (p.brand) m.set(p.brand, (m.get(p.brand) ?? 0) + 1) })
      return Array.from(m.entries()).map(([name, count]) => ({ name, count }))
    }
    const m = new Map<string, number>()
    products.forEach((p) => { if (p.category) m.set(p.category, (m.get(p.category) ?? 0) + 1) })
    return [{ name: 'All' as const }, ...Array.from(m.entries()).map(([name, count]) => ({ name, count }))] as Array<{ name: string; count?: number }>
  }, [products, isBrand])

  useEffect(() => {
    if (panelMode) getLenis()?.stop()
    else getLenis()?.start()
  }, [panelMode])

  if (!panelMode) return null

  const filtered = options.filter((o) => o.name.toLowerCase().includes(q.toLowerCase()))

  const pick = (name: string) => {
    if (isBrand) {
      setSearch(name)
    } else {
      setActiveCat(name)
    }
    closePanel()
  }

  const title = isBrand ? 'Brands' : 'Categories'

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/45" onClick={closePanel} />
      <div className="dd-in fixed right-0 top-0 z-[70] flex h-full w-full max-w-sm flex-col rounded-l-3xl bg-chalk shadow-2xl">
        <div className="flex items-center justify-between border-b border-bdr px-5 py-4">
          <h3 className="text-lg font-bold text-ink">{title}</h3>
          <button type="button" aria-label="Close panel" onClick={closePanel}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate transition-colors hover:bg-rose-s hover:text-rose-d">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-4 px-5 py-4" data-lenis-prevent>
          <div className="relative">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={`Search ${title.toLowerCase()}…`}
              className="w-full rounded-full border border-bdr bg-white py-2.5 pl-10 pr-4 text-sm focus:border-rose-m"
            />
          </div>
          <div className="space-y-2">
            {filtered.map((o) => (
              <button
                type="button"
                key={o.name}
                onClick={() => pick(o.name)}
                className={cn(
                  'flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm transition-colors',
                  (isBrand ? search === o.name : activeCat === o.name)
                    ? 'bg-rose-s font-bold text-rose-d'
                    : 'text-ink hover:bg-rose-s/60 hover:text-rose-d'
                )}
              >
                <span>{o.name}</span>
                {typeof o.count === 'number' && <span className="text-xs text-slate">{o.count}</span>}
              </button>
            ))}
            {filtered.length === 0 && <p className="px-2 py-6 text-center text-sm text-slate">No matches found.</p>}
          </div>
        </div>
      </div>
    </>
  )
}