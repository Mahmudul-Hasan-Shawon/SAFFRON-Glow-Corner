import { useEffect, useMemo } from 'react'
import { useShop } from '../../store/shop'
import { syncOverlayLock } from '../../utils/overlay'

export function SidePanel() {
  const { panelMode, closePanel, products, search, setSearch, activeCat, setActiveCat } = useShop()
  const isBrand = panelMode === 'brand'

  const options = useMemo(() => {
    if (isBrand) {
      const m = new Map<string, number>()
      products.forEach((p) => { if (p.brand) m.set(p.brand, (m.get(p.brand) ?? 0) + 1) })
      return Array.from(m.entries()).map(([name, count]) => ({ name, count }))
    }
    const m = new Map<string, number>()
    products.forEach((p) => { if (p.category) m.set(p.category, (m.get(p.category) ?? 0) + 1) })
    return [
      { name: 'All', count: products.length },
      ...Array.from(m.entries()).map(([name, count]) => ({ name, count })),
    ]
  }, [products, isBrand])

  useEffect(() => {
    syncOverlayLock()
  }, [panelMode])

  if (!panelMode) return null

  const pick = (name: string) => {
    if (isBrand) setSearch(name === 'All' ? '' : name)
    else setActiveCat(name)
    closePanel()
  }

  const isOn = (name: string) => (isBrand ? (name === 'All' ? search === '' : search === name) : activeCat === name)

  return (
    <>
      <div id="sp-veil" className="on" onClick={closePanel} />
      <aside id="side-panel" className="on" aria-label="Filters">
        <div className="sp-head">
          <h3 id="sp-title">{isBrand ? 'Brands' : 'Categories'}</h3>
          <button className="icon-btn" type="button" aria-label="Close panel" onClick={closePanel}>
            <i className="fa fa-xmark" />
          </button>
        </div>
        <div className="sp-body" id="sp-body">
          {options.map((o) => (
            <button
              key={o.name}
              type="button"
              className={isOn(o.name) ? 'sp-pill on' : 'sp-pill'}
              onClick={() => pick(o.name)}
            >
              {o.name}
              {typeof o.count === 'number' && o.name !== 'All' && ` (${o.count})`}
            </button>
          ))}
          {options.length === 0 && <p className="sp-empty">No {isBrand ? 'brands' : 'categories'} yet.</p>}
        </div>
      </aside>
    </>
  )
}