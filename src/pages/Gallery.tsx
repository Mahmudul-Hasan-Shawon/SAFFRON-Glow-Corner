import { useCallback, useEffect, useState } from 'react'
import { Camera, ChevronLeft, ChevronRight, MessageCircle, X, LoaderCircle } from 'lucide-react'
import { PageHero } from '../components/ui/PageHero'
import { Reveal } from '../components/ui/Reveal'
import { loadGallery } from '../lib/api'
import type { GalleryItem } from '../lib/types'
import { site } from '../data/site'
import { getLenis } from '../utils/lenis'

export function Gallery() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [err, setErr] = useState('')
  const [idx, setIdx] = useState<number | null>(null)

  useEffect(() => {
    loadGallery().then(setItems).catch(() => setErr('Could not load the gallery right now. Please try again later.'))
  }, [])

  const prev = useCallback(() => setIdx((i) => (i === null ? null : (i + items.length - 1) % items.length)), [items.length])
  const next = useCallback(() => setIdx((i) => (i === null ? null : (i + 1) % items.length)), [items.length])

  useEffect(() => {
    if (idx === null) { getLenis()?.start(); return }
    getLenis()?.stop()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIdx(null)
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey); getLenis()?.start() }
  }, [idx, prev, next])

  return (
    <div className="pb-20">
      <PageHero
        crumbs="Gallery"
        eyebrow={<><Camera size={12} /> Past Arrivals</>}
        title={<>A Look Inside<br /><span className="display-serif italic text-rose-d">Our Collection</span></>}
        sub="A few favorites from recent arrivals and customer picks. Looking for something specific? Message us on WhatsApp with your idea."
      />

      <div className="mx-auto max-w-[1400px] px-4 md:px-8">
        {err && <p role="alert" className="mt-8 rounded-2xl border border-bdr bg-blush px-5 py-4 text-sm font-semibold text-rose-d">{err}</p>}

        {!items.length && !err && (
          <div className="mt-16 flex flex-col items-center justify-center gap-3 text-slate">
            <LoaderCircle size={22} className="spin" />
            <p className="text-sm">Loading gallery…</p>
          </div>
        )}

        {items.length > 0 && (
          <Reveal className="mt-10 columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
            {items.map((g, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIdx(i)}
                className="group relative block w-full overflow-hidden rounded-2xl border border-bdr text-left focus:outline-none"
                aria-label={g.title ? `View photo: ${g.title}` : 'View photo'}
              >
                <img
                  src={g.imageUrl}
                  alt={g.title ?? 'Gallery photo'}
                  loading="lazy"
                  className="w-full transform-gpu object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {g.title && (
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-8 text-sm font-bold text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    {g.title}
                  </span>
                )}
              </button>
            ))}
          </Reveal>
        )}

        <Reveal className="mt-12 flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-slate">Have an idea or a custom request? We love sourcing hard-to-find items.</p>
          <a
            href={site.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-ink/80"
          >
            <MessageCircle size={15} /> Message us on WhatsApp
          </a>
        </Reveal>
      </div>

      {/* Lightbox */}
      {idx !== null && items[idx] && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setIdx(null) }}
          data-lenis-prevent
        >
          <button type="button" aria-label="Close" onClick={() => setIdx(null)}
            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20">
            <X size={20} />
          </button>
          <button type="button" aria-label="Previous" onClick={prev}
            className="absolute left-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:left-6">
            <ChevronLeft size={20} />
          </button>
          <button type="button" aria-label="Next" onClick={next}
            className="absolute right-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:right-6">
            <ChevronRight size={20} />
          </button>
          <figure className="dd-in max-h-full">
            <img src={items[idx].imageUrl} alt={items[idx].title ?? 'Gallery photo'} className="max-h-[82vh] rounded-2xl object-contain" />
            {items[idx].title && <figcaption className="mt-4 text-center text-sm font-bold text-white">{items[idx].title}</figcaption>}
          </figure>
          <span className="absolute bottom-4 right-4 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white">
            {idx + 1} / {items.length}
          </span>
        </div>
      )}
    </div>
  )
}