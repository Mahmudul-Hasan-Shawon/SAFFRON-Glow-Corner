import { Store, Grip, ShoppingBag, Truck, Phone } from 'lucide-react'
import { useShop } from '../../store/shop'
import { site } from '../../data/site'
import { cn } from '../../utils/cn'

interface MobileBottomNavProps {
  onTrack: () => void
}

export function MobileBottomNav({ onTrack }: MobileBottomNavProps) {
  const { cartCount, setCartOpen, openPanel } = useShop()

  const items = [
    { label: 'Brand', icon: Store, onClick: () => openPanel('brand'), badge: null as number | null },
    { label: 'Categories', icon: Grip, onClick: () => openPanel('category'), badge: null },
    { label: 'Cart', icon: ShoppingBag, onClick: () => setCartOpen(true), badge: cartCount },
    { label: 'Track Order', icon: Truck, onClick: onTrack, badge: null },
    { label: 'Chat', icon: Phone, href: site.whatsapp, badge: null },
  ]

  return (
    <nav id="mobile-bottom-nav" className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
      aria-label="Mobile navigation">
      <div className="glass rounded-t-2xl border-t border-bdr px-2 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around">
          {items.map((it) => (
            <a
              key={it.label}
              href={it.href}
              target={it.href ? '_blank' : undefined}
              rel={it.href ? 'noopener noreferrer' : undefined}
              onClick={it.href ? undefined : (e) => { e.preventDefault(); it.onClick?.() }}
              className={cn('relative flex w-16 flex-col items-center gap-0.5 py-2.5 text-ink transition-colors', !it.href && 'cursor-pointer', it.label === 'Chat' && 'text-emerald-500')}
              aria-label={it.label}
            >
              <it.icon size={18} />
              <span className="text-[9px] font-bold">{it.label}</span>
              {it.badge !== null && it.badge > 0 && (
                <span className="absolute -top-0.5 right-3 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[9px] font-extrabold text-white">
                  {it.badge}
                </span>
              )}
            </a>
          ))}
        </div>
      </div>
    </nav>
  )
}