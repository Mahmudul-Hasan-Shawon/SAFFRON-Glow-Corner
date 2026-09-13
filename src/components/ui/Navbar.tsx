import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, ShoppingBag, Truck, Phone, ChevronDown, Grip } from 'lucide-react'
import { cn } from '../../utils/cn'
import { navigation } from '../../data/navigation'
import { site } from '../../data/site'
import { useShop } from '../../store/shop'

interface NavbarProps {
  activePath: string
  onNavigate: (href: string) => void
  onTrack: () => void
}

export function Navbar({ activePath, onNavigate, onTrack }: NavbarProps) {
  const { cartCount, openPanel, setCartOpen, search, setSearch, products, activeCat, setActiveCat } = useShop()
  const [scrolled, setScrolled] = useState(false)
  const [catOpen, setCatOpen] = useState(false)
  const catRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (catRef.current && !catRef.current.contains(e.target as Node)) setCatOpen(false)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  const categories = useMemo(() => {
    const seen = new Map<string, number>()
    products.forEach((p) => {
      if (p.category) seen.set(p.category, (seen.get(p.category) ?? 0) + 1)
    })
    return [{ name: 'All', count: products.length, isActive: activeCat === 'All' } as const,
      ...Array.from(seen.entries()).map(([name, count]) => ({
        name, count, isActive: activeCat === name,
      }))]
  }, [products, activeCat])

  const pickCategory = (name: string) => {
    if (activePath !== '/') {
      onNavigate('/')
      window.setTimeout(() => setActiveCat(name), 520)
    } else {
      setActiveCat(name)
    }
    setCatOpen(false)
  }

  const isActive = (href: string) => {
    const base = href.split('#')[0]
    return base === '/' ? activePath === '/' : activePath.startsWith(base)
  }

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
        scrolled ? 'glass shadow-[0_8px_30px_-12px_rgba(159,18,57,0.15)]' : 'bg-transparent'
      )}
    >
      <div className="mx-auto flex h-16 md:h-20 max-w-[1400px] items-center justify-between gap-4 px-4 md:px-8">
        <a onClick={() => onNavigate('/')} className="shrink-0 cursor-pointer" aria-label="Saffron Glow Corner, home">
          <span className="display-logo text-lg font-bold tracking-wide text-rose-d md:text-xl">
            SAFFRON<span className="text-gold">.</span>
          </span>
        </a>

        <div className="hidden flex-1 max-w-md items-center lg:flex">
          <div className="relative w-full">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products, brands…"
              aria-label="Search products and brands"
              className="w-full rounded-full border border-bdr bg-white/70 py-2.5 pl-11 pr-4 text-sm placeholder:text-slate focus:border-rose-m"
            />
          </div>
        </div>

        <nav className="hidden items-center gap-1.5 md:flex" aria-label="Primary">
          <div className="relative" ref={catRef}>
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={catOpen}
              onClick={() => setCatOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-ink transition-colors hover:bg-rose-s hover:text-rose-d"
            >
              <Grip size={14} className="text-rose-d" />
              Categories
              <ChevronDown size={13} className={cn('transition-transform duration-300', catOpen && 'rotate-180')} />
            </button>
            {catOpen && (
              <div
                role="listbox"
                aria-label="Shop by category"
                className="dd-in absolute left-1/2 top-full mt-2 w-60 -translate-x-1/2 rounded-2xl border border-bdr bg-white p-2 shadow-xl"
              >
                {categories.map((c) => (
                  <button
                    type="button"
                    key={c.name}
                    role="option"
                    aria-selected={c.isActive}
                    onClick={() => pickCategory(c.name)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors',
                      c.isActive ? 'bg-rose-s font-bold text-rose-d' : 'text-ink hover:bg-rose-s/60 hover:text-rose-d'
                    )}
                  >
                    <span>{c.name}</span>
                    <span className="text-xs text-slate">{c.count}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {navigation.slice(1).map((link) => (
            <a
              key={link.href}
              onClick={() => onNavigate(link.href)}
              className={cn(
                'cursor-pointer rounded-full px-3 py-2 text-sm font-semibold transition-colors',
                isActive(link.href) ? 'bg-rose-s text-rose-d' : 'text-ink hover:bg-rose-s/60 hover:text-rose-d'
              )}
              aria-current={isActive(link.href) ? 'page' : undefined}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={site.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            title="WhatsApp"
            aria-label="Chat on WhatsApp"
            className="hidden h-9 w-9 items-center justify-center rounded-full text-emerald-500 transition-colors hover:bg-emerald-500/10 md:inline-flex"
          >
            <Phone size={16} />
          </a>
          <button
            type="button"
            onClick={onTrack}
            className="hidden items-center gap-2 rounded-full border border-bdr bg-white/60 px-3.5 py-2 text-xs font-bold text-ink transition-colors hover:border-rose-m hover:text-rose-d md:inline-flex"
          >
            <Truck size={14} className="text-rose-d" /> Track Order
          </button>
          <button
            type="button"
            onClick={() => openPanel('category')}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-bdr bg-white/60 px-3 text-xs font-bold text-ink md:hidden"
            aria-label="Open categories"
          >
            <Grip size={13} className="text-rose-d" /> Cats
          </button>
          <button
            type="button"
            onClick={onTrack}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-bdr bg-white/60 text-ink md:hidden"
            aria-label="Track order"
          >
            <Truck size={14} />
          </button>
          <a
            href={site.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-emerald-500 md:hidden"
            aria-label="Chat on WhatsApp"
          >
            <Phone size={14} />
          </a>
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="relative inline-flex h-10 items-center justify-center rounded-full bg-rose-d px-3.5 text-white shadow-md transition-colors hover:bg-rose"
            aria-label="Open cart"
          >
            <ShoppingBag size={16} />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-extrabold text-white">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}