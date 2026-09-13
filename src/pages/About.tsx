import { Heart, Leaf, Clock, MessageCircle, Truck, Star } from 'lucide-react'
import { PageHero } from '../components/ui/PageHero'
import { Reveal } from '../components/ui/Reveal'

const values = [
  { icon: Leaf, title: 'Authentic Products', text: 'Every item is sourced directly and checked for authenticity — never expired, never counterfeit.' },
  { icon: Clock, title: 'Fresh Stock, Always', text: 'We keep batches current and rotate stock regularly, so nothing you order has been sitting on a shelf for years.' },
  { icon: MessageCircle, title: 'Personal Recommendations', text: 'Not sure what suits your skin? Message us directly on WhatsApp and we\'ll help you find the right match.' },
  { icon: Truck, title: 'Careful Delivery', text: 'Every order travels securely with a tracking code you can follow in real time.' },
]

const stats = [
  { n: '6+', label: 'Years in Beauty' },
  { n: '2,500+', label: 'Orders Delivered' },
  { n: '40+', label: 'Brands & Products' },
  { n: '4.9', label: 'Average Rating', star: true },
]

export function About() {
  return (
    <div className="pb-20">
      <PageHero
        crumbs="About"
        eyebrow={<><Heart size={12} /> Our Story</>}
        title={<>Bringing Korean Beauty<br /><span className="display-serif italic text-rose-d">Closer to You</span></>}
        sub="What started as a small collection of favorite Korean skincare picks for friends has grown into Saffron Glow Corner — trusted by hundreds of customers across Bangladesh for authentic products and honest advice."
      />

      <div className="mx-auto max-w-[1400px] px-4 md:px-8">
        <Reveal className="mt-10 grid items-center gap-8 md:grid-cols-2">
          <img
            src="/logo/about.png"
            alt="Korean skincare and cosmetics products"
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=900&auto=format' }}
            className="w-full rounded-3xl border border-bdr object-cover"
            loading="lazy"
          />
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-bdr bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-rose-d">
              <span className="text-gold">✦</span> Since 2024
            </div>
            <h2 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-ink">
              From a Small Collection to <span className="display-serif italic text-rose-d">Dhaka's Trusted Source</span>
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate">
              Saffron Glow Corner began the way most good beauty stores do — with a genuine love for skincare, a few holy-grail products, and friends who kept asking "where did you get that from?" Today we source every product directly and keep our shelves stocked with what's actually working, no shortcuts.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate">
              We test new arrivals ourselves before they go on the site, and every order — from a single serum to a full routine — is checked for authenticity before it's packed, because your skin deserves that kind of care.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate">
              Every order is packed securely and handed off with tracking so you always know exactly when your products will arrive.
            </p>
          </div>
        </Reveal>

        <Reveal className="mt-16 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-ink">What We <span className="display-serif italic text-rose-d">Believe In</span></h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate">Four simple principles guide every order that leaves our hands.</p>
        </Reveal>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v, i) => (
            <Reveal key={v.title} delay={i * 80}>
              <div className="card-hover panel h-full p-6">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-s text-rose-d">
                  <v.icon size={18} />
                </span>
                <h3 className="mt-3 text-base font-extrabold text-ink">{v.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate">{v.text}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-14 grid grid-cols-2 gap-4 rounded-3xl border border-bdr bg-gradient-to-br from-blush to-white/60 p-8 text-center md:grid-cols-4 md:p-10">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="font-num text-4xl font-bold text-rose-d">
                {s.n}{s.star && <Star size={14} className="ml-1 inline fill-gold text-gold" />}
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate">{s.label}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </div>
  )
}