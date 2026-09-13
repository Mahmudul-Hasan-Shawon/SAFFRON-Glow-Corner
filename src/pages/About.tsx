import { PageHero } from '../components/ui/PageHero'

interface PageProps { onNavigate: (href: string) => void }

const values = [
  { icon: 'fa-solid fa-leaf', title: 'Authentic Products', text: 'Every item is sourced directly and checked for authenticity — never expired, never counterfeit.' },
  { icon: 'fa-solid fa-clock', title: 'Fresh Stock, Always', text: 'We keep batches current and rotate stock regularly, so nothing you order has been sitting on a shelf for years.' },
  { icon: 'fa-solid fa-comments', title: 'Personal Recommendations', text: 'Not sure what suits your skin? Message us directly on WhatsApp and we\'ll help you find the right match.' },
  { icon: 'fa-solid fa-truck-fast', title: 'Careful Delivery', text: 'Every order travels securely with a tracking code you can follow in real time.' },
]

const stats = [
  { html: '6+', label: 'Years in Beauty' },
  { html: '2,500+', label: 'Orders Delivered' },
  { html: '40+', label: 'Brands &amp; Products' },
  { html: '4.9<i class="fa-solid fa-star" style="font-size:.6em;margin-left:2px"></i>', label: 'Average Rating' },
]

export function About({ onNavigate }: PageProps) {
  return (
    <div>
      <PageHero
        crumbs="About"
        eyebrow={<><i className="fa fa-heart" /> Our Story</>}
        title={<>Bringing Korean Beauty<br /><em>Closer to You</em></>}
        sub="What started as a small collection of favorite Korean skincare picks for friends has grown into Saffron Glow Corner — trusted by hundreds of customers across Bangladesh for authentic products and honest advice."
        onNavigate={onNavigate}
      />

      <div className="static-section">
        <div className="about-split reveal">
          <img
            src="/logo/about.png"
            alt="Korean skincare and cosmetics products"
            loading="lazy"
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=900&auto=format' }}
          />
          <div className="about-copy">
            <div className="hero-eyebrow"><i className="fa-solid fa-spa" /> Since 2024</div>
            <h2>From a Small Collection to <em>Dhaka's Trusted Source</em></h2>
            <p>Saffron Glow Corner began the way most good beauty stores do — with a genuine love for skincare, a few holy-grail products, and friends who kept asking "where did you get that from?" Today we source every product directly and keep our shelves stocked with what's actually working, no shortcuts.</p>
            <p>We test new arrivals ourselves before they go on the site, and every order — from a single serum to a full routine — is checked for authenticity before it's packed, because your skin deserves that kind of care.</p>
            <p>Every order is packed securely and handed off with tracking so you always know exactly when your products will arrive.</p>
          </div>
        </div>

        <div className="static-lede reveal">
          <h2>What We <span>Believe In</span></h2>
          <p>Four simple principles guide every order that leaves our hands.</p>
        </div>

        <div className="value-grid reveal">
          {values.map((v) => (
            <div className="value-card" key={v.title}>
              <div className="vi"><i className={v.icon} /></div>
              <h3>{v.title}</h3>
              <p>{v.text}</p>
            </div>
          ))}
        </div>

        <div className="stat-strip reveal">
          {stats.map((s) => (
            <div className="st" key={s.label}>
              <strong dangerouslySetInnerHTML={{ __html: s.html }} />
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}