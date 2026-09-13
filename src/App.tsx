import { useCallback, useEffect, useState, type ReactElement } from 'react'
import Lenis from 'lenis'
import { setLenis, getLenis } from './utils/lenis'
import { ShopProvider, useShop } from './store/shop'
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

const routes: Record<string, () => ReactElement> = {
  '/': Home,
  '/about': About,
  '/gallery': Gallery,
  '/faq': Faq,
  '/contact': Contact,
}

function norm(path: string) {
  return path.replace(/\/+$/, '') || '/'
}

function Shell() {
  const { openTrack } = useShop()
  const [path, setPath] = useState(() => norm(window.location.pathname))
  const [pageKey, setPageKey] = useState(0)

  useEffect(() => {
    const lenis = new Lenis({ autoRaf: true, smoothWheel: true, wheelMultiplier: 1 })
    setLenis(lenis)
    return () => { lenis.destroy(); setLenis(undefined) }
  }, [])

  const scrollToTop = useCallback(() => {
    const lenis = getLenis()
    if (lenis) lenis.scrollTo(0, { immediate: true })
    else window.scrollTo(0, 0)
  }, [])

  const navigate = useCallback((href: string) => {
    const target = norm(href.split('#')[0])
    if (target === path) { scrollToTop(); return }
    window.history.pushState({}, '', target)
    setPath(target)
    setPageKey((k) => k + 1)
    scrollToTop()
  }, [path, scrollToTop])

  useEffect(() => {
    const onPop = () => {
      setPath(norm(window.location.pathname))
      setPageKey((k) => k + 1)
      scrollToTop()
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [scrollToTop])

  const Page = routes[path] ?? Home

  return (
    <div className="min-h-screen bg-blush">
      <Navbar activePath={path} onNavigate={navigate} onTrack={openTrack} />
      <main key={pageKey}>
        <Page />
      </main>
      <Footer onNavigate={navigate} />
      <MobileBottomNav onTrack={openTrack} />
      <CartDrawer />
      <SidePanel />
      <Checkout />
      <OrderTracking />
      <OrderSuccess />
      <Invoice />
      <Toast />
    </div>
  )
}

export default function App() {
  return (
    <ShopProvider>
      <Shell />
    </ShopProvider>
  )
}