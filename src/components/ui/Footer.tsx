import { Camera, MapPin, Phone, Mail, Clock } from 'lucide-react'
import { site } from '../../data/site'
import { navigation } from '../../data/navigation'
import { useShop } from '../../store/shop'

interface FooterProps {
  onNavigate: (href: string) => void
}

export function Footer({ onNavigate }: FooterProps) {
  const { setActiveCat, products } = useShop()

  const topCats = Array.from(new Set(products.map((p) => p.category).filter((x): x is string => !!x))).slice(0, 5)

  const goCategory = (c: string) => {
    onNavigate('/')
    window.setTimeout(() => setActiveCat(c), 520)
  }

  return (
    <footer className="relative overflow-hidden bg-ink text-mist">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[42rem] -translate-x-1/2 rounded-full bg-rose/10 blur-[120px]" />
      <div className="relative mx-auto max-w-[1400px] px-4 pt-16 pb-8 md:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <span className="display-logo text-xl font-bold tracking-wide text-white">
              SAFFRON<span className="text-gold">.</span>
            </span>
            <p className="text-xs uppercase tracking-[0.2em] text-rose-m">Beauty that inspires, quality that lasts</p>
            <p className="text-sm leading-relaxed text-mist/70">
              Your trusted destination for premium skincare and beauty products in Bangladesh. We bring you authentic
              products from world-renowned brands at the best prices.
            </p>
            <div className="flex gap-2.5">
              <a
                href="https://www.instagram.com/glowsaffron7"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-mist transition-all hover:-translate-y-0.5 hover:border-rose-m hover:text-white"
              >
                <Camera size={15} />
              </a>
              <a
                href={site.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-mist transition-all hover:-translate-y-0.5 hover:border-emerald-400 hover:text-emerald-400"
              >
                <Phone size={15} />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="mb-5 text-sm font-bold uppercase tracking-wider text-white/70">Quick Links</h4>
            <ul className="space-y-2.5 text-sm">
              {navigation.map((l) => (
                <li key={l.href}>
                  <a onClick={() => onNavigate(l.href)} className="cursor-pointer text-mist/70 transition-colors hover:text-white">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="mb-5 text-sm font-bold uppercase tracking-wider text-white/70">Categories</h4>
            <ul className="space-y-2.5 text-sm">
              {topCats.map((c) => (
                <li key={c}>
                  <a onClick={() => goCategory(c)} className="cursor-pointer text-mist/70 transition-colors hover:text-white">
                    {c}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-3 text-sm">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white/70">Contact</h4>
            {site.locations.map((loc) => (
              <div key={loc} className="flex items-start gap-2.5 text-mist/70">
                <MapPin size={14} className="mt-0.5 shrink-0 text-rose-m" />
                <span>{loc}</span>
              </div>
            ))}
            <div className="flex items-center gap-2.5 text-mist/70">
              <Phone size={14} className="shrink-0 text-rose-m" />
              <a href={site.phoneHref} className="transition-colors hover:text-white">{site.phone}</a>
            </div>
            <div className="flex items-center gap-2.5 text-mist/70">
              <Mail size={14} className="shrink-0 text-rose-m" />
              <a href={`mailto:${site.email}`} className="transition-colors hover:text-white">{site.email}</a>
            </div>
            <div className="flex items-center gap-2.5 text-mist/70">
              <Clock size={14} className="shrink-0 text-rose-m" />
              <span>{site.hours}</span>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 md:flex-row">
          <p className="text-xs text-mist/60">© 2026 <strong className="text-white">Saffron Glow Corner.</strong> All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded border border-white/15 px-3 py-1.5 text-[10px] font-extrabold text-pink-400">bKash</span>
            <span className="inline-flex items-center rounded border border-white/15 px-3 py-1.5 text-[10px] font-extrabold text-orange-400">Nagad</span>
            <span className="inline-flex items-center rounded border border-white/15 px-3 py-1.5 text-[10px] font-extrabold text-purple-400">Rocket</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-mist/60">
            <span>Powered by</span>
            <a href={site.creditHref} target="_blank" rel="noopener noreferrer" className="transition-opacity hover:opacity-80">
              <img src={site.creditLogo} alt="Shawon" className="h-8 w-auto" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}