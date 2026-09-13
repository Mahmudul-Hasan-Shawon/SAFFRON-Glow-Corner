import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react'
import Lenis from 'lenis'
import { setLenis, getLenis } from './utils/lenis'
import { ShopProvider, useShop } from './store/shop'
import { initScrollFx } from './utils/scrollfx'
import { initReveal } from './utils/reveal'
import { motionOK } from './utils/feedback'
import { Navbar } from './components/ui/Navbar'
import { Footer } from './components/ui/Footer'
import { MobileBottomNav } from './components/ui/MobileBottomNav'
import { CartDrawer } from './components/ui/CartDrawer'
import { SidePanel } from './components/ui/SidePanel'
import { Checkout } from './components/ui/Checkout'
import { OrderTracking } from './components/ui/OrderTracking'
import { OrderSuccess } from './components/ui/OrderSuccess'
import { Invoice } from './components/ui/Invoice'
import { Toast } from './components/ui/Toast'
import { Home } from './pages/Home'
import { About } from './pages/About'
import { Gallery } from './pages/Gallery'
import { Faq } from './pages/Faq'
import { Contact } from './pages/Contact'
import { Brands } from './pages/Brands'

interface PageProps { onNavigate: (href: string) => void }

const routes: Record<string, (props: PageProps) => ReactElement> = {
  '/': Home,
  '/about': About,
  '/gallery': Gallery,
  '/faq': Faq,
  '/contact': Contact,
  '/brands': Brands,
}

function norm(path: string) {
  return path.replace(/\/+$/, '') || '/'
}

/* The in-page product view mirrors the vanilla hash routing: opening a
   product sets `#product-N` so Back/Forward and shared links still work. */
function Shell() {
  const shop = useShop()
  const {
    openTrack, openProduct, closeProduct, closePanel,
    setCartOpen, closeSuccess, setInvoiceOpen, closeTrack, closeCheckout,
  } = shop

  const [path, setPath] = useState(() => norm(window.location.pathname))
  const [pageKey, setPageKey] = useState(0)

  useEffect(() => {
    if (!motionOK()) return // Lenis smooth scrolling is motion — skip it.
    const lenis = new Lenis({ autoRaf: true, smoothWheel: true, wheelMultiplier: 1 })
    setLenis(lenis)
    return () => { lenis.destroy(); setLenis(undefined) }
  }, [])

  const scrollToTop = useCallback(() => {
    const lenis = getLenis()
    if (lenis) lenis.scrollTo(0, { immediate: true })
    else window.scrollTo(0, 0)
  }, [])

  /* Vanilla showProductView() scrolls to the top on open and back to the
     shopper's spot on close — mirror that so the page never jumps oddly.
     Opening also pushes `#product-N` so the browser Back button returns to
     the grid instead of leaving the site; closing (✕, Escape, breadcrumb)
     goes back through that entry. Inbound deep links (#product-N in the URL
     on load) close with a plain hash clear, not a spurious history entry. */
  const lastShopY = useRef(0)
  const wasProductOpen = useRef(false)
  const pushedProductHash = useRef(false)

  const smoothTo = useCallback((y: number) => {
    const lenis = getLenis()
    if (lenis) lenis.scrollTo(y, { duration: 1.1 })
    else window.scrollTo({ top: y, behavior: motionOK() ? 'smooth' : 'auto' })
  }, [])

  useEffect(() => {
    const pid = shop.productId
    if (pid !== null) {
      wasProductOpen.current = true
      const hash = window.location.hash || ''
      if (!/^#product-\d+$/.test(hash)) {
        pushedProductHash.current = true
        window.history.pushState({ pid }, '', `#product-${pid}`)
      } else if (hash !== `#product-${pid}`) {
        /* Jumping straight to another product (related grid) — keep the
           same history entry, just retarget the hash. */
        window.history.replaceState({ pid }, '', `#product-${pid}`)
      }
      lastShopY.current = window.scrollY
      smoothTo(0)
      return
    }
    if (!wasProductOpen.current) return
    wasProductOpen.current = false
    if (pushedProductHash.current && /^#product-\d+$/.test(window.location.hash || '')) {
      pushedProductHash.current = false
      window.history.back() // popstate → handleHash → closeProduct is a no-op now.
      return
    }
    if (/^#product-\d+$/.test(window.location.hash || '')) {
      window.history.replaceState({}, '', window.location.pathname)
    }
    smoothTo(lastShopY.current)
  }, [shop.productId, smoothTo])

  const handleHash = useCallback(() => {
    const m = String(window.location.hash || '').match(/^#product-(\d+)$/)
    if (m) {
      openProduct(Number(m[1]))
      return
    }
    if (window.location.hash === '#shop') {
      const el = document.getElementById('shop')
      if (el) el.scrollIntoView({ behavior: motionOK() ? 'smooth' : 'auto' })
    }
    closeProduct()
  }, [openProduct, closeProduct])

  /* Handle `#product-N` deep links once the shop data has arrived. */
  useEffect(() => {
    if (shop.loadStatus !== 'ready') return
    handleHash()
  }, [shop.loadStatus, handleHash])

  useEffect(() => {
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [handleHash])

  /* Escape closes only the topmost overlay (same order as the vanilla site).
     The gallery lightbox sits above everything and owns its own Esc handler —
     skip the chain entirely while it is open so nothing behind it closes. */
  const productId = shop.productId
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      const has = (id: string) => {
        const el = document.getElementById(id)
        return el && el.classList.contains('on')
      }
      if (has('lightbox')) return
      if (has('inv-veil')) { setInvoiceOpen(false); return }
      if (has('track-veil')) { closeTrack(); return }
      if (has('success-veil')) { closeSuccess(); return }
      if (has('checkout-veil')) { closeCheckout(); return }
      if (has('side-panel')) { closePanel(); return }
      if (has('cart')) { setCartOpen(false); return }
      if (productId) closeProduct()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeTrack, closeSuccess, closeCheckout, closePanel, setCartOpen, setInvoiceOpen, productId, closeProduct])

  useEffect(() => { initScrollFx() }, [])

  /* New page = fresh `.reveal` nodes; re-arm the observer. */
  useEffect(() => { initReveal() }, [pageKey])

  const navigate = useCallback((href: string) => {
    const parts = href.split('#')
    const target = norm(parts[0])
    const hash = parts[1] || ''

    if (target === path) {
      if (hash) {
        const el = document.getElementById(hash)
        if (el) el.scrollIntoView({ behavior: 'smooth' })
      } else {
        scrollToTop()
      }
      return
    }

    /* Save the shopper's spot so Back restores it (see onPop). */
    window.history.pushState({ scroll: window.scrollY }, '', target + (hash ? '#' + hash : ''))
    setPath(target)
    setPageKey((k) => k + 1)
    if (target !== '/') closeProduct()
    scrollToTop()
    if (hash) {
      window.setTimeout(() => {
        const el = document.getElementById(hash)
        if (el) el.scrollIntoView({ behavior: motionOK() ? 'smooth' : 'auto' })
      }, 80)
    }
  }, [path, closeProduct, scrollToTop])

  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const nextPath = norm(window.location.pathname)
      handleHash()
      /* Same-route pops (e.g. Back closing #product-N) are handled by the
         product effect / handleHash — only real page changes swap+scroll. */
      if (nextPath === path) return
      setPath(nextPath)
      setPageKey((k) => k + 1)
      const s = e.state as { scroll?: number } | null
      const y = s && typeof s.scroll === 'number' ? s.scroll : 0
      const lenis = getLenis()
      if (lenis) lenis.scrollTo(y, { immediate: true })
      else window.scrollTo(0, y)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [path, handleHash])

  const Page = routes[path] ?? Home

  return (
    <>
      <div id="aura" aria-hidden="true">
        <div className="aura-blob aura-1" />
        <div className="aura-blob aura-2" />
        <div className="aura-blob aura-3" />
      </div>

      <Navbar activePath={path} onNavigate={navigate} onTrack={openTrack} />
      <main key={pageKey}>
        <Page onNavigate={navigate} />
      </main>
      <Footer onNavigate={navigate} onTrack={openTrack} />

      <MobileBottomNav activePath={path} onNavigate={navigate} onTrack={openTrack} />

      <CartDrawer />
      <SidePanel />
      <Checkout />
      <OrderTracking />
      <OrderSuccess />
      <Invoice />
      <Toast />
    </>
  )
}

export default function App() {
  return (
    <ShopProvider>
      <Shell />
    </ShopProvider>
  )
}