import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { site } from '../../data/site'
import { useShop } from '../../store/shop'
import { REDUCED_MOTION } from '../../utils/feedback'
import { enableMenuScroll } from '../../utils/menuScroll'
import { syncOverlayLock } from '../../utils/overlay'
import { mountFocusTrap } from '../../utils/focusTrap'

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
  const drawerRef = useRef<HTMLDivElement>(null)
  const [megaOpen, setMegaOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
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

  /* Hamburger drawer: scroll lock, focus trap, Escape to close. */
  useEffect(() => {
    if (!menuOpen) return
    syncOverlayLock()
    const untrap = mountFocusTrap(drawerRef.current)
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      untrap?.()
      syncOverlayLock()
    }
  }, [menuOpen])

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

  const goMenuHome = () => {
    setMenuOpen(false)
    if (productId) { closeProduct(); goShop(360); return }
    if (!isHome) onNavigate('/')
  }

  const goMenuShop = () => {
    setMenuOpen(false)
    if (productId) { closeProduct(); goShop(360); return }
    if (isHome) goShop(0)
    else onNavigate('/#shop')
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

        {/* Hamburger — touch/tablet only (hidden ≥1025px in CSS). */}
        <button
          type="button"
          className={menuOpen ? 'nav-hamburger open' : 'nav-hamburger'}
          id="nav-hamburger"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="nav-drawer"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span className="nav-hamburger-bar" />
          <span className="nav-hamburger-bar" />
        </button>
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

      {/* Full-screen menu overlay — touch/tablet only (hidden ≥1025px in CSS).
          Portaled to the body so #navbar's backdrop-filter (a fixed-position
          containing block) can't trap the overlay inside the header. */}
      {createPortal(
        <div
          className={menuOpen ? 'nav-drawer on' : 'nav-drawer'}
          id="nav-drawer"
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          aria-hidden={!menuOpen}
          data-lenis-prevent
        >
        <div className="nav-drawer-head">
          <span className="display-logo text-lg font-bold tracking-wide text-rose-d md:text-xl">SAFFRON<span className="text-gold">.</span></span>
          <button type="button" className="nav-drawer-close" aria-label="Close menu" onClick={() => setMenuOpen(false)}>
            <i className="fa fa-xmark" />
          </button>
        </div>

        <nav className="nav-drawer-links" aria-label="Menu">
          <button type="button" className="nav-drawer-link" onClick={goMenuHome}>
            Home
          </button>
          <button type="button" className="nav-drawer-link" onClick={goMenuShop}>
            Shop
          </button>
          {PAGES.map((l) => (
            <button
              key={l.href}
              type="button"
              className={activePath === l.href ? 'nav-drawer-link on' : 'nav-drawer-link'}
              onClick={() => { setMenuOpen(false); onNavigate(l.href) }}
            >
              {l.label}
            </button>
          ))}
        </nav>

        <div className="nav-drawer-foot">
          <div className="nav-drawer-contact">
            <a href={`mailto:${site.email}`} className="nav-drawer-contact-link">
              <i className="fa-regular fa-envelope" aria-hidden="true" />{site.email}
            </a>
            <a href={site.phoneHref} className="nav-drawer-contact-link">
              <i className="fa-solid fa-phone" aria-hidden="true" />{site.phone}
            </a>
          </div>
          <div className="nav-drawer-social">
            <a href="https://www.instagram.com/glowsaffron7" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="nav-drawer-social-btn">
              <i className="fa-brands fa-instagram" aria-hidden="true" />
            </a>
            <a href="https://www.facebook.com/glowsaffron7" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="nav-drawer-social-btn">
              <i className="fa-brands fa-facebook-f" aria-hidden="true" />
            </a>
            <a href="https://x.com/glowsaffron7" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="nav-drawer-social-btn">
              <i className="fa-brands fa-x-twitter" aria-hidden="true" />
            </a>
            <a href="https://www.linkedin.com/company/saffron-glow-corner" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="nav-drawer-social-btn">
              <i className="fa-brands fa-linkedin-in" aria-hidden="true" />
            </a>
          </div>
          <div className="nav-drawer-legal">
            <button type="button" className="nav-drawer-legal-link">Privacy Policy</button>
            <button type="button" className="nav-drawer-legal-link">Terms of Service</button>
            <button type="button" className="nav-drawer-legal-link">Cookie Policy</button>
            <span className="nav-drawer-copy">© 2026 {site.name}</span>
          </div>
        </div>
        </div>,
        document.body,
      )}
    </nav>
  )
}
