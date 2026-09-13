import { useEffect, useMemo, useRef, useState } from 'react'
import { site } from '../../data/site'
import { useShop } from '../../store/shop'
import { syncOverlayLock } from '../../utils/overlay'
import { mountFocusTrap } from '../../utils/focusTrap'
import { motionOK } from '../../utils/feedback'

interface MobileBottomNavProps {
  activePath: string
  onNavigate: (href: string) => void
  onTrack: () => void
}

export function MobileBottomNav({ activePath, onNavigate, onTrack }: MobileBottomNavProps) {
  const { cartCount, setCartOpen, products, activeCat, setActiveCat, productId, closeProduct } = useShop()
  const isHome = activePath === '/'
  const [catOpen, setCatOpen] = useState(false)
  const catPageRef = useRef<HTMLDivElement>(null)

  const go = (href: string) => onNavigate(href)

  /* Home must leave any open product view (when a product is open the home
     body is replaced entirely, so navigate('/') alone looks like a no-op). */
  const goHome = () => {
    if (productId !== null) closeProduct()
    go('/')
  }

  /* Same list (and counts) the shop's category dropdown builds. */
  const categories = useMemo(() => {
    const seen = new Map<string, number>()
    products.forEach((p) => { if (p.category) seen.set(p.category, (seen.get(p.category) ?? 0) + 1) })
    return [
      { name: 'All', count: products.length },
      ...Array.from(seen.entries()).map(([name, count]) => ({ name, count })),
    ]
  }, [products])

  const pickCategory = (name: string) => {
    setActiveCat(name)
    setCatOpen(false)
    if (isHome) {
      const el = document.getElementById('shop')
      if (el) el.scrollIntoView({ behavior: motionOK() ? 'smooth' : 'auto' })
    } else {
      go('/#shop')
    }
  }

  /* Escape closes the overlay; scroll locks and focus is trapped while open. */
  useEffect(() => {
    if (!catOpen) return
    syncOverlayLock()
    const untrap = mountFocusTrap(catPageRef.current)
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setCatOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      untrap?.()
      syncOverlayLock()
    }
  }, [catOpen])

  const keyAct = (fn: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn() }
  }

  return (
    <>
      <nav className="mbn" id="mbn" role="navigation" aria-label="Mobile">
        {isHome ? (
          <>
            <div className="mbn-item" role="button" tabIndex={0} aria-label="Go to top"
              onClick={goHome} onKeyDown={keyAct(goHome)}>
              <i className="fa fa-house" />
              <span className="mbn-label">Home</span>
            </div>
            <div className="mbn-item" role="button" tabIndex={0} aria-label="Browse categories" aria-expanded={catOpen}
              onClick={() => setCatOpen(true)} onKeyDown={keyAct(() => setCatOpen(true))}>
              <i className="fa fa-bag-shopping" />
              <span className="mbn-label">Categories</span>
            </div>
            <div className="mbn-item" role="button" tabIndex={0} id="mbn-cart" aria-label="Open cart"
              onClick={() => setCartOpen(true)} onKeyDown={keyAct(() => setCartOpen(true))}>
              <i className="fa fa-cart-shopping" />
              {cartCount > 0 && <span className="mbn-cart-count" id="mbn-cart-cnt">{cartCount}</span>}
              <span className="mbn-label">Cart</span>
            </div>
            <div className="mbn-item" role="button" tabIndex={0} aria-label="Track your order"
              onClick={onTrack} onKeyDown={keyAct(onTrack)}>
              <i className="fa fa-truck-fast" />
              <span className="mbn-label">Track</span>
            </div>
            <a href={site.whatsapp} target="_blank" rel="noopener" className="mbn-item" aria-label="Chat on WhatsApp">
              <i className="fa-brands fa-whatsapp" />
              <span className="mbn-label">Chat</span>
            </a>
          </>
        ) : (
          <>
            <a href="/" className={activePath === '/' ? 'mbn-item act' : 'mbn-item'}
              aria-current={activePath === '/' ? 'page' : undefined}
              onClick={(e) => { e.preventDefault(); goHome() }}>
              <i className="fa fa-house" />
              <span className="mbn-label">Home</span>
            </a>
            <div className="mbn-item" role="button" tabIndex={0} aria-label="Go to the shop"
              onClick={() => onNavigate('/#shop')} onKeyDown={keyAct(() => onNavigate('/#shop'))}>
              <i className="fa fa-bag-shopping" />
              <span className="mbn-label">Shop</span>
            </div>
            <div className="mbn-item" role="button" tabIndex={0} id="mbn-cart" aria-label="Open cart"
              onClick={() => setCartOpen(true)} onKeyDown={keyAct(() => setCartOpen(true))}>
              <i className="fa fa-cart-shopping" />
              {cartCount > 0 && <span className="mbn-cart-count" id="mbn-cart-cnt">{cartCount}</span>}
              <span className="mbn-label">Cart</span>
            </div>
            <div className="mbn-item" role="button" tabIndex={0} aria-label="Track your order"
              onClick={onTrack} onKeyDown={keyAct(onTrack)}>
              <i className="fa fa-truck-fast" />
              <span className="mbn-label">Track</span>
            </div>
            <a href={site.whatsapp} target="_blank" rel="noopener" className="mbn-item" aria-label="Chat on WhatsApp">
              <i className="fa-brands fa-whatsapp" />
              <span className="mbn-label">Chat</span>
            </a>
          </>
        )}
      </nav>

      {/* All-categories full page, opened from the Categories tab. */}
      <div
        className={catOpen ? 'mbn-cat-veil on' : 'mbn-cat-veil'}
        aria-hidden="true"
        onClick={() => setCatOpen(false)}
      />
      <div
        className={catOpen ? 'mbn-cat-page on' : 'mbn-cat-page'}
        id="mbn-cat-page"
        ref={catPageRef}
        role="dialog"
        aria-modal="true"
        aria-label="All categories"
      >
        <div className="mbn-cat-head">
          <span>Browse Categories</span>
          <button type="button" className="mbn-cat-close" aria-label="Close categories"
            onClick={() => setCatOpen(false)}>
            <i className="fa fa-xmark" />
          </button>
        </div>
        <div className="mbn-cat-pills" role="listbox" aria-label="Filter by category">
          {categories.map((c) => (
            <button
              key={c.name}
              type="button"
              role="option"
              aria-selected={activeCat === c.name}
              className={activeCat === c.name ? 'sp-pill on' : 'sp-pill'}
              onClick={() => pickCategory(c.name)}
            >
              {c.name}
              {c.name !== 'All' && ` (${c.count})`}
            </button>
          ))}
          {categories.length <= 1 && <p className="sp-empty">No categories yet.</p>}
        </div>
      </div>
    </>
  )
}
