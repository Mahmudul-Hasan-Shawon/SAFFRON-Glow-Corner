import { site } from '../data/site'
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
          <div className="hero-eyebrow"><i className="fa fa-star" /> Authentic Korean Products</div>
          <h1 className="hero-title">Discover Your<br /><em>Radiant Glow</em></h1>
          <p className="hero-sub">
            Curated Korean skincare and cosmetics, sourced with care — for the routines worth
            investing in, and the glow worth showing off.
          </p>
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
