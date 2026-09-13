import { useCallback, useEffect, useRef, useState } from 'react'
import { PageHero } from '../components/ui/PageHero'
import { loadGallery } from '../lib/api'
import { DEFAULT_IMG } from '../lib/format'
import type { GalleryItem } from '../lib/types'
import { site } from '../data/site'
import { observeNew } from '../utils/reveal'
import { syncOverlayLock } from '../utils/overlay'
import { mountFocusTrap } from '../utils/focusTrap'

interface PageProps { onNavigate: (href: string) => void }

const SKEL_HEIGHTS = [300, 360, 260, 340, 300, 380, 280, 330, 310]

type Status = 'loading' | 'ready' | 'error' | 'empty'

export function Gallery({ onNavigate }: PageProps) {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [status, setStatus] = useState<Status>('loading')
  const [idx, setIdx] = useState<number | null>(null)
  const fetching = useRef(false)
  const lbRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      const fresh = await loadGallery()
      if (fresh && fresh.length) {
        setItems(fresh)
        setStatus('ready')
      } else {
        setStatus('empty')
      }
    } catch {
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    if (fetching.current) return
    fetching.current = true
    load()
  }, [load])

  useEffect(() => {
    if (status !== 'ready' || items.length === 0) return
    const grid = document.getElementById('gallery-grid')
    if (!grid) return
    observeNew(Array.from(grid.querySelectorAll('.gallery-item')))
  }, [status, items])

  useEffect(() => {
    if (idx === null) return
    syncOverlayLock()
    const untrap = mountFocusTrap(lbRef.current)
    /* Gallery owns its Escape (App's chain deliberately skips while the
       lightbox is on, so nothing behind it closes at the same time). */
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIdx(null) }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      untrap?.()
    }
  }, [idx])

  const renderSkeletons = () =>
    Array.from({ length: 9 }, (_, i) => (
      <div key={i} className="gallery-item gallery-skel" style={{ height: SKEL_HEIGHTS[i % SKEL_HEIGHTS.length] }} aria-hidden="true" />
    ))

  const renderItems = () =>
    items.map((g, i) => (
      <figure
        key={i}
        className="gallery-item is-loading reveal"
        data-delay={Math.min(i, 11) * 45}
        onClick={() => setIdx(i)}
        role="button"
        tabIndex={0}
        aria-label={g.title ? `View ${g.title} larger` : 'View image larger'}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIdx(i) }
        }}
      >
        <img
          src={g.imageUrl}
          alt={g.title || 'Gallery image'}
          loading={i < 6 ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={(e) => e.currentTarget.closest('.gallery-item')?.classList.remove('is-loading')}
          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = DEFAULT_IMG }}
        />
        <figcaption className="gallery-cap">
          <i className="fa-solid fa-magnifying-glass-plus" /> {g.title || ''}
        </figcaption>
      </figure>
    ))

  return (
    <div>
      <PageHero
        crumbs="Gallery"
        eyebrow={<><i className="fa fa-camera" /> Past Arrivals</>}
        title={<>A Look Inside<br /><em>Our Collection</em></>}
        sub="A few favorites from recent arrivals and customer picks. Looking for something specific? Message us on WhatsApp with your idea."
        onNavigate={onNavigate}
      />

      <div className="static-section tight">
        <div className="gallery-grid reveal" id="gallery-grid">
          {status === 'loading' && renderSkeletons()}
          {status === 'ready' && renderItems()}
          {(status === 'empty' || status === 'error') && (
            <div className="gallery-empty">
              <i className="fa-regular fa-images" />
              <h3>{status === 'error' ? "Couldn't load the gallery" : 'Our gallery is being refreshed'}</h3>
              <p>{status === 'error'
                ? 'Please check your connection and try again.'
                : 'New photos are on the way. Meanwhile, browse the collection or message us on WhatsApp.'}</p>
              {status === 'error' && (
                <button type="button" className="gal-retry" onClick={load}><i className="fa fa-rotate-right" /> Try Again</button>
              )}
            </div>
          )}
        </div>

        <div className="gallery-cta-note" style={{ textAlign: 'center', marginTop: 46 }}>
          <p style={{ fontSize: 14, color: 'var(--slate)', marginBottom: 18 }}>
            Have an idea or a custom request? We love sourcing hard-to-find items.
          </p>
          <a
            href={site.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="hero-btn"
            style={{ background: '#fff', color: 'var(--rose-d)' }}
          >
            <i className="fa-brands fa-whatsapp" style={{ fontSize: 20 }} />
            <span>Message us on WhatsApp</span>
          </a>
        </div>
      </div>

      <div
        id="lightbox"
        ref={lbRef}
        className={idx !== null ? 'on' : ''}
        onClick={(e) => { if (e.target === e.currentTarget) setIdx(null) }}
        data-lenis-prevent
      >
        <button type="button" className="lb-x" aria-label="Close" onClick={() => setIdx(null)}><i className="fa fa-xmark" /></button>
        {idx !== null && (
          <figure className="lb-fig" key={idx}>
            <img
              src={items[idx]?.imageUrl}
              alt={items[idx]?.title || ''}
              onLoad={(e) => e.currentTarget.classList.add('lb-loaded')}
            />
            <figcaption>{items[idx]?.title || ''}</figcaption>
          </figure>
        )}
      </div>
    </div>
  )
}