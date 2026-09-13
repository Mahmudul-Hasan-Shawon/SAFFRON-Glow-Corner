import { useMemo } from 'react'
import { site } from '../../data/site'
import { useShop } from '../../store/shop'

interface FooterProps {
  onNavigate: (href: string) => void
  onTrack: () => void
}

export function Footer({ onNavigate, onTrack }: FooterProps) {
  const { products, setActiveCat } = useShop()

  const cats = useMemo(() => {
    const perRow = 5
    const seen = new Map<string, number>()
    products.forEach((p) => { if (p.category) seen.set(p.category, (seen.get(p.category) ?? 0) + 1) })
    const all = Array.from(seen.entries()).map(([name, count]) => ({ name, count }))
    const top = all.sort((a, b) => b.count - a.count).slice(0, perRow)
    return top.map((c) => c.name)
  }, [products])

  const goCategory = (name: string) => {
    setActiveCat(name)
    onNavigate('/')
  }

  return (
    <footer className="site-footer">
      <div className="footer-glow" />
      <div className="footer-main">
        <div className="footer-grid">
          <div className="reveal in">
            <div className="footer-brand-name" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
              <img src="/logo/saffron_footer.svg" alt="Saffron" style={{ width: '10rem', height: 'auto' }} />
              <div style={{ color: '#ffc1ca', fontFamily: 'manrope', fontSize: 9, fontWeight: 400, letterSpacing: 2, whiteSpace: 'nowrap' }}>
                BEAUTY THAT INSPIRES, QUALITY THAT LASTS
              </div>
            </div>
            <p className="footer-about">
              Your trusted destination for premium skincare and beauty products in Bangladesh. We bring you authentic
              products from world-renowned brands at the best prices.
            </p>
            <div className="footer-socials">
              <a href="https://www.instagram.com/glowsaffron7" target="_blank" rel="noopener" aria-label="Instagram" className="footer-social-link">
                <i className="fab fa-instagram" />
              </a>
              <a href={site.whatsapp} target="_blank" rel="noopener" aria-label="WhatsApp" id="wa-footer" className="footer-social-link">
                <i className="fab fa-whatsapp" />
              </a>
            </div>
          </div>

          <div className="reveal in">
            <div className="footer-col-title">Quick Links</div>
            <ul className="footer-links">
              <li><a href="/" onClick={(e) => { e.preventDefault(); onNavigate('/') }}>All Products</a></li>
              <li><a href="/track" onClick={(e) => { e.preventDefault(); onTrack() }}>Track Order</a></li>
              <li><a href="/about" onClick={(e) => { e.preventDefault(); onNavigate('/about') }}>About Us</a></li>
              <li><a href="/brands" onClick={(e) => { e.preventDefault(); onNavigate('/brands') }}>Brands</a></li>
              <li><a href="/contact" onClick={(e) => { e.preventDefault(); onNavigate('/contact') }}>Contact Us</a></li>
              <li><a href="/faq" onClick={(e) => { e.preventDefault(); onNavigate('/faq') }}>FAQ</a></li>
            </ul>
          </div>

          <div className="reveal in">
            <div className="footer-col-title">Categories</div>
            <ul className="footer-links" id="footer-cats">
              {cats.map((c) => (
                <li key={c}><a href="/" onClick={(e) => { e.preventDefault(); goCategory(c) }}>{c}</a></li>
              ))}
              <li><a href="/gallery" onClick={(e) => { e.preventDefault(); onNavigate('/gallery') }}>Gallery</a></li>
            </ul>
          </div>

          <div className="reveal in">
            <div className="footer-col-title">Contact</div>
            {site.locations.map((l) => (
              <div className="footer-contact-item" key={l}>
                <i className="fas fa-location-dot" />
                <p>{l}</p>
              </div>
            ))}
            <div className="footer-contact-item">
              <i className="fas fa-phone" />
              <a href={site.phoneHref}>{site.phone}</a>
            </div>
            <div className="footer-contact-item">
              <i className="fas fa-envelope" />
              <a href={`mailto:${site.email}`}>{site.email}</a>
            </div>
            <div className="footer-contact-item">
              <i className="fas fa-clock" />
              <p>{site.hours}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-copy">© 2026 <strong>Saffron Glow Corner.</strong> All rights reserved.</div>
        <div className="footer-payments">
          <div className="footer-pay-icon" style={{ fontSize: 11, fontWeight: 800, color: '#E2136E' }}>bKash</div>
          <div className="footer-pay-icon" style={{ fontSize: 10, fontWeight: 800, color: '#F6921E' }}>Nagad</div>
          <div className="footer-pay-icon" style={{ fontSize: 9, fontWeight: 800, color: '#8B2F89' }}>Rocket</div>
        </div>
        <span className="footer-credit-inner">
          <span>Powered by</span>
          <a href={site.creditHref} target="_blank" rel="noopener noreferrer" className="credit-link">
            <img src={site.creditLogo} alt="Shawon" style={{ height: 32, width: 'auto', display: 'block' }} />
          </a>
        </span>
      </div>
    </footer>
  )
}