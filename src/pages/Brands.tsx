import { useMemo, useState } from 'react'
import { PageHero } from '../components/ui/PageHero'
import { getLenis } from '../utils/lenis'
import { brands, type Brand } from '../data/brands'

interface PageProps { onNavigate: (href: string) => void }

const LETTERS = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))

function initial(name: string): string {
  const m = name.match(/[A-Za-z]/)
  return m ? m[0].toUpperCase() : '#'
}

export function Brands({ onNavigate }: PageProps) {
  const [letter, setLetter] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const grouped = useMemo(() => {
    const map = new Map<string, Brand[]>()
    for (const b of brands) {
      const k = initial(b.name)
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(b)
    }
    return map
  }, [])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return brands.filter((b) => !q || b.name.toLowerCase().includes(q))
  }, [query])

  const pick = (l: string | null) => {
    setLetter(l)
    setQuery('')
    if (!l) return
    window.setTimeout(() => {
      const el = document.getElementById(`bl-${l}`)
      if (el) {
        const lenis = getLenis()
        if (lenis) lenis.scrollTo(el, { offset: -130 })
        else el.scrollIntoView({ behavior: 'smooth' })
      }
    }, 60)
  }

  const shown = letter ? (grouped.get(letter) ?? []) : visible

  return (
    <div>
      <PageHero
        crumbs="Brands"
        eyebrow={<><i className="fa-solid fa-award" /> Shop by Brand</>}
        title={<>The Brands We <em>Carry</em></>}
        sub="Every product on Saffron Glow Corner comes from these authentic, trusted global brands — sourced directly and checked before it reaches you."
        onNavigate={onNavigate}
      />

      <div className="static-section brands-page">
        {/* Search + letter rail */}
        <div className="brands-tools reveal in">
          <div className="brands-search">
            <i className="fa fa-magnifying-glass" />
            <input
              type="search"
              aria-label="Search brands"
              placeholder="Search brands…"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setLetter(null) }}
            />
            {query && (
              <button type="button" aria-label="Clear search" onClick={() => setQuery('')}>
                <i className="fa fa-xmark" />
              </button>
            )}
          </div>
          <div className="brands-letters" role="tablist" aria-label="Jump to letter">
            <button
              type="button"
              className={letter === null ? 'on' : ''}
              onClick={() => pick(null)}
            >
              All
            </button>
            {LETTERS.map((l) => (
              <button
                key={l}
                type="button"
                className={letter === l ? 'on' : ''}
                aria-pressed={letter === l}
                onClick={() => pick(l)}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Letter sections (all view) */}
        <div className="brands-groups">
          {letter === null && (
            [...grouped.entries()]
              .sort(([a], [b]) => a.localeCompare(b))
              .filter(([k]) => !query || shown.some((b) => initial(b.name) === k))
              .map(([k, list], gi) => (
                <section key={k} className="brands-group" id={`bl-${k}`}>
                  <h3 className="brands-letter" style={{ animationDelay: `${Math.min(gi, 10) * 40}ms` }}>{k}</h3>
                  <div className="brands-grid">
                    {list.map((b) => (
                      <BrandCard key={b.name} b={b} />
                    ))}
                  </div>
                </section>
              ))
          )}
        </div>

        {/* Filtered grid (letter view) */}
        {letter !== null && (
          <div className="brands-group" id={`bl-${letter}`}>
            <h3 className="brands-letter">Brands starting with “{letter}”</h3>
            <div className="brands-grid">
              {shown.map((b) => (
                <BrandCard key={b.name} b={b} />
              ))}
            </div>
          </div>
        )}

        {!query && letter === null && (
          <p className="brands-cap reveal in">
            {brands.length}+ authentic brands · can't find one?{' '}
            <a href="/" onClick={(e) => { e.preventDefault(); onNavigate('/contact') }}>Ask us to source it</a>
          </p>
        )}
      </div>
    </div>
  )
}

function BrandCard({ b }: { b: Brand }) {
  return (
    <figure
      className="brand-card reveal in"
      title={b.name}
      aria-label={b.name}
    >
      {b.logo ? (
        <img src={b.logo} alt={`${b.name} logo`} loading="lazy" />
      ) : (
        <span className="brand-fallback">{b.name}</span>
      )}
      <figcaption>{b.name}</figcaption>
    </figure>
  )
}