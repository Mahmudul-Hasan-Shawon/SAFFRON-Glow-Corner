import { useEffect, useMemo, useRef, useState } from 'react'
import { useShop } from '../store/shop'
import { DEFAULT_IMG } from '../lib/format'
import { REDUCED_MOTION } from '../utils/feedback'

/* "Up to *30% Off*" → highlighted span; a newline in the cell → <br>. */
function offerTitleHTML(t: string): string {
  return String(t ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/\*([^*]+)\*/g, '<span>$1</span>')
    .replace(/\r?\n/g, '<br>')
}

export function Offers() {
  const { offers, openProduct, setActiveCat } = useShop()
  const [idx, setIdx] = useState(0)
  const [paused, setPaused] = useState(false)
  const [cycle, setCycle] = useState(0)
  const touchX = useRef<number | null>(null)
  const touchTimer = useRef<number | null>(null)

  const list = useMemo(() => (Array.isArray(offers) ? offers : []), [offers])
  const total = list.length

  useEffect(() => {
    setIdx(0)
  }, [total])

  /* Autoplay pauses while hovered/focused (WCAG 2.2.2) and for a while
     after any touch, so mobile users can read/act on a slide. */
  useEffect(() => {
    if (total < 2 || REDUCED_MOTION || paused) return
    const t = window.setInterval(() => setIdx((prev) => (prev + 1) % total), 4500)
    return () => window.clearInterval(t)
  }, [total, paused, cycle])

  const goTo = (i: number) => {
    setIdx(i)
    setCycle((c) => c + 1) // restart the autoplay countdown
  }

  const touchPause = () => {
    setPaused(true)
    if (touchTimer.current) window.clearTimeout(touchTimer.current)
    touchTimer.current = window.setTimeout(() => setPaused(false), 8000)
  }

  /** Vanilla: a bare-number Link jumps to that product; otherwise it is a
      category filter that lands the shopper back at the collection. */
  const slideAction = (o: (typeof list)[number]) => {
    const link = String(o.link ?? '').trim()
    if (/^\d+$/.test(link) && Number(link) !== Infinity) { openProduct(Number(link)); return }
    if (o.category) setActiveCat(String(o.category))
    const shop = document.getElementById('shop')
    if (shop) shop.scrollIntoView({ behavior: REDUCED_MOTION ? 'auto' : 'smooth' })
  }

  if (total === 0) return null

  const btn = (o: (typeof list)[number]) => String(o.buttonText ?? '').trim() || 'Shop Now'

  return (
    <section className="offer-section" id="offers">
      <div className="offer-petal offer-petal-1">
      </div>
      <div className="offer-petal offer-petal-2">
      </div>
      <div className="offer-petal offer-petal-3">
      </div>

      <div
        className="offer-slider"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setPaused(false) }}
      >
        <div
          className="offer-viewport"
          onTouchStart={(e) => { touchX.current = e.touches[0].clientX; touchPause() }}
          onTouchEnd={(e) => {
            if (touchX.current === null) return
            const dx = e.changedTouches[0].clientX - touchX.current
            touchX.current = null
            if (Math.abs(dx) < 42 || total < 2) return
            goTo((idx + (dx < 0 ? 1 : -1) + total) % total)
          }}
        >
          <div className="offer-track" id="offerTrack" style={{ transform: `translateX(-${idx * 100}%)` }}>
            {list.map((o, i) => {
              const icon = String(o.icon ?? '').trim() || 'fa-solid fa-tag'
              const img = o.imageUrl && String(o.imageUrl).indexOf('http') === 0 ? o.imageUrl : DEFAULT_IMG
              return (
                <div key={i} className={i === idx ? 'offer-slide is-active' : 'offer-slide'}>
                  <div className="offer-copy">
                    {o.eyebrow && <p className="offer-eyebrow"><i className={icon} /> {o.eyebrow}</p>}
                    <h2 className="offer-title" dangerouslySetInnerHTML={{ __html: offerTitleHTML(o.title ?? '') }} />
                    {o.description && <p className="offer-desc">{o.description}</p>}
                    <a href="#shop" className="offer-btn" onClick={(e) => { e.preventDefault(); slideAction(o) }}>
                      <i className="fa-solid fa-bag-shopping" /> {btn(o)}
                    </a>
                  </div>
                  <div className="offer-image">
                    <img src={img} alt={o.title ?? 'Offer'} loading="lazy" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {total > 1 && (
          <div className="offer-dots" id="offerDots">
            {list.map((_, i) => (
              <button
                key={i}
                className={i === idx ? 'offer-dot is-active' : 'offer-dot'}
                aria-label={`Show offer ${i + 1}`}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}