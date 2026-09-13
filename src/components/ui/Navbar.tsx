import { useEffect, useMemo, useRef, useState } from 'react'
import { site } from '../../data/site'
import { useShop } from '../../store/shop'
import { REDUCED_MOTION } from '../../utils/feedback'
import { enableMenuScroll } from '../../utils/menuScroll'

interface NavbarProps {
  activePath: string
  onNavigate: (href: string) => void
  onTrack: () => void
}

const PAGES = [
  { href: '/about', label: 'About' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
]

export function Navbar({ activePath, onNavigate, onTrack }: NavbarProps) {
  const {
    products, search, setSearch, clearFilter, activeCat, setActiveCat,
    cartCount, setCartOpen, productId, closeProduct,
  } = useShop()
  const navDDRef = useRef<HTMLDivElement>(null)
  const navMenuRef = useRef<HTMLDivElement>(null)
  const [navOpen, setNavOpen] = useState(false)
  const isHome = activePath === '/'

  const cats = useMemo(() => {
    const seen = new Map<string, number>()
    products.forEach((p) => {
      if (p.category) seen.set(p.category, (seen.get(p.category) ?? 0) + 1)
    })
    return [
      { name: 'All', count: products.length },
      ...Array.from(seen.entries()).map(([name, count]) => ({ name, count })),
    ]
  }, [products])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (navDDRef.current && !navDDRef.current.contains(e.target as Node)) setNavOpen(false)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  useEffect(() => enableMenuScroll(navMenuRef.current), [])

  const goShop = (delay = 0) => {
    window.setTimeout(() => {
      const shop = document.getElementById('shop')
      if (shop) shop.scrollIntoView({ behavior: REDUCED_MOTION ? 'auto' : 'smooth' })
    }, delay)
  }

  const logoClick = () => {
    if (productId) { closeProduct(); goShop(360); return }
    if (isHome) goShop(0)
    else onNavigate('/')
  }

  const goCategory = (name: string) => {
    setNavOpen(false)
    setActiveCat(name)
    if (productId) { closeProduct(); goShop(360); return }
    if (isHome) goShop(0)
    else onNavigate('/')
  }

  const hasFilter = !!search || activeCat !== 'All'

  return (
    <nav id="navbar">
      <div className="nav-main">
        {isHome ? (
          <div
            className="nav-logo"
            id="site-logo"
            role="button"
            tabIndex={0}
            onClick={logoClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); logoClick() }
            }}
          >
            <img src="/logo/saffron_1.svg" alt="Saffron" style={{ width: 100, height: 'auto' }} />
          </div>
        ) : (
          <a href="/" className="nav-logo" id="site-logo" onClick={(e) => { e.preventDefault(); onNavigate('/') }}>
            <img src="/logo/saffron_1.svg" alt="Saffron" style={{ width: 100, height: 'auto' }} />
          </a>
        )}

        {isHome && (
          <div className={hasFilter ? 'search-wrap has-filter' : 'search-wrap'} id="search-wrap">
            <div className="search-input-box">
              <input
                type="search"
                id="search-inp"
                aria-label="Search products and brands"
                placeholder="Search products, brands…"
                value={search}
                onChange={(e) => {
                  if (productId) closeProduct()
                  setSearch(e.target.value)
                }}
              />
              <i className="fa fa-magnifying-glass" />
            </div>
            <button className="clear-filter-btn" id="clear-filter-btn" onClick={() => clearFilter()}>
              <i className="fa fa-xmark" />Clear Filter
            </button>
          </div>
        )}

        <nav className="nav-links" aria-label="Primary">
          {!isHome && (
            <a href="/" className="nav-page-link" onClick={(e) => { e.preventDefault(); onNavigate('/') }}>Home</a>
          )}
          <div className={navOpen ? 'nav-dd open' : 'nav-dd'} id="nav-cat-dd" ref={navDDRef}>
            <button
              className="nav-dd-btn"
              id="nav-cat-dd-btn"
              type="button"
              aria-haspopup="listbox"
              aria-expanded={navOpen}
              onClick={() => setNavOpen((v) => !v)}
            >
              <i className="fa-solid fa-grip" />Categories
              <i className="fa-solid fa-chevron-down nav-dd-caret" />
            </button>
            <div
              className={navOpen ? 'nav-dd-menu' : 'nav-dd-menu hidden'}
              id="nav-cat-dd-menu"
              ref={navMenuRef}
              role="listbox"
              aria-label="Shop by category"
            >
              {cats.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  className={activeCat === c.name ? 'cat-dd-opt on' : 'cat-dd-opt'}
                  data-cat={c.name}
                  onClick={() => goCategory(c.name)}
                >
                  <span>{c.name}</span><span className="cat-dd-count">{c.count}</span>
                </button>
              ))}
            </div>
          </div>
          {PAGES.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={activePath === l.href ? 'nav-page-link is-active' : 'nav-page-link'}
              aria-current={activePath === l.href ? 'page' : undefined}
              onClick={(e) => { e.preventDefault(); onNavigate(l.href) }}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="nav-actions">
          <button className="nav-track-btn" onClick={onTrack}>
            <i className="fa-solid fa-truck-fast" /><span>Track Order</span>
          </button>
          <button className="nav-icon-btn" id="cart-btn" title="Cart" aria-label="Open cart" onClick={() => setCartOpen(true)}>
            <i className="fa fa-bag-shopping" />
            <span className={cartCount > 0 ? 'cart-count' : 'cart-count hidden'} id="cart-cnt">{cartCount}</span>
          </button>
          <a href={site.whatsapp} id="wa-btn" target="_blank" rel="noopener" className="nav-icon-btn"
            title="WhatsApp" aria-label="Chat on WhatsApp" style={{ color: '#22C55E' }}>
            <i className="fa-brands fa-whatsapp" />
          </a>
        </div>
      </div>
    </nav>
  )
}