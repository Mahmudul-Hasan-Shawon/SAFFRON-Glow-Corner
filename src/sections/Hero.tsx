import { ArrowDown, Phone } from 'lucide-react'
import { useShop } from '../store/shop'
import { site } from '../data/site'

export function Hero() {
  const { products, config } = useShop()
  const brands = new Set(products.map((p) => p.brand).filter(Boolean)).size

  const imgSet = [
    'pngegg.png', 'pngegg (1).png', 'pngegg (2).png', 'pngegg (3).png', 'pngegg (4).png',
    'pngegg (5).png', 'pngegg (6).png', 'pngegg (7).png', 'pngegg (8).png', 'pngegg (9).png',
    'pngegg (10).png', 'pngegg (11).png', 'pngegg (12).png', 'pngegg (13).png', 'pngegg (14).png',
  ]

  const scrollToShop = () => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <section id="hero" className="relative overflow-hidden" aria-label="Introduction">
      {/* Ambient blobs */}
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-24 h-80 w-80 rounded-full bg-rose-m/20 blur-[100px]" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 bottom-10 h-96 w-96 rounded-full bg-gold/20 blur-[110px]" />

      <div className="relative mx-auto grid max-w-[1400px] gap-10 px-4 pb-10 pt-24 md:grid-cols-2 md:px-8 md:pt-36 md:pb-16">
        <div className="flex flex-col justify-center">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-bdr bg-white/70 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-rose-d">
            <span className="text-gold">★</span> Authentic Korean Products
          </div>
          <h1 className="mt-5 text-5xl font-extrabold leading-[1.04] tracking-tight text-ink md:text-6xl">
            Discover Your<br />
            <span className="display-serif italic text-rose-d">Radiant Glow</span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-slate">
            Curated Korean skincare and cosmetics, sourced with care — for the routines worth investing in, and the
            glow worth showing off.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button type="button" onClick={scrollToShop}
              className="inline-flex items-center gap-2 rounded-full bg-rose-d px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-rose">
              <ArrowDown size={15} /> Explore the Collection
            </button>
            <a href={site.phoneHref}
              className="inline-flex items-center gap-2 rounded-full border border-bdr bg-white/70 px-6 py-3 text-sm font-bold text-ink transition-colors hover:border-rose-m hover:text-rose-d">
              <Phone size={15} /> Call to Order
            </a>
          </div>

          {/* Stats */}
          <div className="mt-9 flex gap-10">
            <div>
              <p className="font-num text-3xl font-bold text-rose-d">{products.length}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate">Products</p>
            </div>
            <div>
              <p className="font-num text-3xl font-bold text-rose-d">{brands}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate">Brands</p>
            </div>
            <div>
              <p className="font-num text-3xl font-bold text-rose-d">{Number(config.happyOrders) || 56}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate">Happy Orders</p>
            </div>
          </div>
        </div>

        {/* Image marquee */}
        <div className="relative hidden items-center md:flex" aria-hidden="true">
          <div className="mask-fade-x relative h-96 w-full overflow-hidden">
            <div className="animate-marquee flex w-max items-center gap-5">
              {[...imgSet, ...imgSet].map((src, i) => (
                <img
                  key={i}
                  src={`/images/hero/${src}`}
                  alt=""
                  loading="lazy"
                  className="h-72 w-56 shrink-0 rounded-2xl object-cover shadow-sm"
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bengali price note */}
      <div className="relative mx-auto max-w-[1400px] px-4 pb-10 md:px-8">
        <p lang="bn" className="rounded-2xl border border-bdr bg-white/60 px-5 py-4 text-center text-xs leading-relaxed text-slate">
          পণ্যের মূল্য পরিবর্তনশীল। প্রদর্শিত মূল্য শুধুমাত্র ধারণার জন্য প্রদান করা হয়েছে; প্রকৃত মূল্য কিছুটা কম বা
          বেশি হতে পারে। সর্বশেষ মূল্য জানতে অনুগ্রহ করে সরাসরি যোগাযোগ করুন।
          <a href={site.phoneHref} className="ml-2 font-bold text-rose-d">{site.phone}</a>
        </p>
      </div>
    </section>
  )
}