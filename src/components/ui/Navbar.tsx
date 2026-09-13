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
  { href: '/brands', label: 'Brands' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
]

export function Navbar({ activePath, onNavigate, onTrack }: NavbarProps) {
  const {
    products, search, setSearch, clearFilter, activeCat, setActiveCat,
    cartCount, setCartOpen, productId, closeProduct,
  } = useShop()
  const navRef = useRef<HTMLElement>(null)
  const megaMenuRef = useRef<HTMLDivElement>(null)
  const [megaOpen, setMegaOpen] = useState(false)
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

  const catActive = activeCat !== 'All'

  /* Outside click anywhere outside the bar closes the mega menu; the panel
     itself scrolls independently of Lenis. */
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setMegaOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMegaOpen(false) }
    document.addEventListener('click', onClick)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('click', onClick)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  useEffect(() => enableMenuScroll(megaMenuRef.current), [])

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
    setMegaOpen(false)
    setActiveCat(name)
    if (productId) { closeProduct(); goShop(360); return }
    if (isHome) goShop(0)
    else onNavigate('/')
  }

  const hasFilter = !!search || catActive

  return (
    <nav id="navbar" ref={navRef}>
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
            <span className="display-logo text-lg font-bold tracking-wide text-rose-d md:text-xl">SAFFRON<span className="text-gold">.</span></span>
          </div>
        ) : (
          <a href="/" className="nav-logo" id="site-logo" onClick={(e) => { e.preventDefault(); onNavigate('/') }}>
            <span className="display-logo text-lg font-bold tracking-wide text-rose-d md:text-xl">SAFFRON<span className="text-gold">.</span></span>
          </a>
        )}

        {/* Phone/tablet keeps the wide under-logo search; desktop gets the
            compact pill inside the action cluster instead. */}
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
          <button
            className={megaOpen ? 'nav-page-link nav-shop-link open' : 'nav-page-link nav-shop-link'}
            type="button"
            aria-haspopup="true"
            aria-expanded={megaOpen}
            onClick={() => setMegaOpen((v) => !v)}
          >
            Shop
            {catActive && <span className="nav-shop-dot" title={`Filtered: ${activeCat}`} />}
            <i className={megaOpen ? 'fa-solid fa-chevron-down nav-dd-caret open' : 'fa-solid fa-chevron-down nav-dd-caret'} />
          </button>
          <a
            href="/"
            className={isHome ? 'nav-page-link is-active' : 'nav-page-link'}
            aria-current={isHome ? 'page' : undefined}
            onClick={(e) => { e.preventDefault(); onNavigate('/') }}
          >
            Home
          </a>
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
          {/* Desktop compact search — always visible so the nav layout
              (and centered links) never shift between pages. */}
          <div className="nav-search-anchor">
            <div className={search ? 'nav-search filled' : 'nav-search'}>
              <i className="fa fa-magnifying-glass" />
              <input
                type="search"
                aria-label="Search products and brands"
                placeholder="Search…"
                value={search}
                onChange={(e) => {
                  if (productId) closeProduct()
                  setSearch(e.target.value)
                }}
              />
              {search && (
                <button type="button" className="nav-search-x" aria-label="Clear search" onClick={() => clearFilter()}>
                  <i className="fa fa-xmark" />
                </button>
              )}
            </div>
          </div>
          {/* Filters set on the shop would otherwise persist invisibly on
              subpages — surface them here with a one-tap clear. */}
          {!isHome && hasFilter && (
            <button className="nav-filter-chip" type="button"
              title="Clear the active search/category filter" onClick={() => clearFilter()}>
              <i className="fa fa-filter" /> Filter on
              <i className="fa fa-xmark" />
            </button>
          )}
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

      {/* Full-width mega menu — desktop only (hidden below 1025px in CSS). */}
      <div
        className={megaOpen ? 'nav-mega on' : 'nav-mega'}
        id="nav-mega"
        ref={megaMenuRef}
        role="region"
        aria-label="Shop categories"
        aria-hidden={!megaOpen}
        data-lenis-prevent
      >
        <div className="nav-mega-inner" key={megaOpen ? 'open' : 'closed'}>
          <div className="nav-mega-head">
            <span className="nav-mega-title"><i className="fa-solid fa-grip" /> Browse the Collection</span>
            <span className="nav-mega-count">{products.length} products</span>
          </div>
          <div className="nav-mega-pills">
            {cats.map((c, i) => (
              <button
                key={c.name}
                type="button"
                className={activeCat === c.name ? 'sp-pill on' : 'sp-pill'}
                style={{ animationDelay: `${Math.min(i * 40 + 60, 400)}ms` }}
                onClick={() => goCategory(c.name)}
              >
                {c.name === 'All' ? '✦ All Products' : c.name}
                {` (${c.count})`}
              </button>
            ))}
          </div>
          <div className="nav-mega-foot">
            <button type="button" className="nav-mega-viewall" onClick={() => goCategory('All')}>
              <i className="fa fa-bag-shopping" /> View all products
            </button>
            <a href={site.whatsapp} target="_blank" rel="noopener" className="nav-mega-note">
              <i className="fa-brands fa-whatsapp" /> Can't find it? We'll source it for you
            </a>
          </div>
        </div>
      </div>
    </nav>
  )
}
