import { site } from '../data/site'
import { brands } from '../data/brands'
import { REDUCED_MOTION } from '../utils/feedback'

export function Hero() {
  const scrollToShop = () => {
    const shop = document.getElementById('shop')
    if (shop) shop.scrollIntoView({ behavior: REDUCED_MOTION ? 'auto' : 'smooth' })
  }

  return (
    <section id="hero" className="hero-cover">
      <div className="hero-cover-overlay" />
      <div className="hero-cover-inner">
        <div className="hero-copy">
          <div className="hero-eyebrow"><i className="fa fa-star" /> 100% Authentic · Direct from Korea</div>
          <h1 className="hero-title">Discover Your<br /><span className="hero-title-accent">Radiant Glow</span></h1>
          <p className="hero-sub">
            Bangladesh's trusted destination for real K-beauty — every product verified,
            priced live, and delivered to your door. Your glow-up starts here.
          </p>
          <div className="hero-brands" aria-label="Brands we carry" role="marquee">
            <div className="hero-brands-track">
              {/* List is rendered twice so the -50% marquee loop is seamless */}
              {[...brands, ...brands].map((b, i) => (
                <img
                  key={`${b.name}-${i}`}
                  src={b.logo}
                  alt={b.name}
                  title={b.name}
                  loading="lazy"
                  className="hero-brand-logo"
                />
              ))}
            </div>
          </div>
          <div className="hero-btn-row">
            <a href="#shop" className="hero-btn" onClick={(e) => { e.preventDefault(); scrollToShop() }}>
              <i className="fa fa-arrow-down" /> <span>Explore the Collection</span>
            </a>
            <a href={site.phoneHref} className="hero-btn-ghost">
              <i className="fa-solid fa-phone" /> <span>Call to Order</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
