import { useEffect } from 'react'
import { Tag, ShoppingBag } from 'lucide-react'
import { useShop } from '../store/shop'

const FALLBACK_OFFERS = [{
  eyebrow: 'Limited Time',
  title: 'Up to 30% Off',
  title2: 'Beauty of Joseon',
  description: 'Stock up on the Relief Sun and Glow Serum — our most-loved rice and honey essentials, now at their lowest price this month.',
  imageUrl: 'https://aubeautybazaar.com/cdn/shop/files/beauty-of-joseon-relief-sun-10ml-3896945.png?v=1771417989',
}]

export function Offers() {
  const { offers } = useShop()
  const list = offers && offers.length ? offers : FALLBACK_OFFERS

  useEffect(() => {
    const t = window.setInterval(() => {
      // placeholder slider tick — data-driven offers render statically for now
    }, 6000)
    return () => window.clearInterval(t)
  }, [])

  const scrollToShop = () => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <section className="relative overflow-hidden" id="offers">
      <div aria-hidden="true" className="pointer-events-none absolute -left-20 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-gold-l blur-[90px]" />
      <div className="relative mx-auto max-w-[1200px] px-4 py-12 md:px-8 md:py-16">
        <div className="panel grid gap-6 overflow-hidden p-1 md:grid-cols-[1.2fr_1fr]">
          {list.slice(0, 1).map((o, i) => {
            const t = String(o.title ?? '').split('|')
            const title = t[0] || 'Special Offer'
            const title2 = t[1] || ''
            return (
              <div key={i} className="grid gap-4 rounded-[calc(var(--radius-r-lg)-4px)] bg-gradient-to-br from-rose-s via-gold-l to-white p-8 md:grid-cols-2 md:items-center md:p-10">
                <div>
                  <p className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-rose-d">
                    <Tag size={12} /> {String(o.eyebrow ?? 'Limited Time')}
                  </p>
                  <h2 className="mt-4 text-3xl font-extrabold leading-tight text-ink md:text-4xl">
                    {title}
                    {title2 && <><br /><span className="display-serif italic text-rose-d">{title2}</span></>}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-slate">{String(o.description ?? '')}</p>
                  <button type="button" onClick={scrollToShop}
                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-rose-d px-5 py-2.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-rose">
                    <ShoppingBag size={14} /> Shop the Offer
                  </button>
                </div>
                <div className="flex items-center justify-center">
                  {String(o.imageUrl ?? '').startsWith('http') ? (
                    <img src={String(o.imageUrl)} alt="" loading="lazy" className="animate-float-soft h-52 w-52 rounded-2xl object-cover shadow-lg" />
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}