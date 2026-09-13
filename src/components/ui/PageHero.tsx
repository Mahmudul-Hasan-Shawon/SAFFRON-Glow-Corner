import type { ReactNode } from 'react'

interface PageHeroProps {
  crumbs: string
  eyebrow: ReactNode
  title: ReactNode
  sub: ReactNode
  onNavigate: (href: string) => void
}

export function PageHero({ crumbs, eyebrow, title, sub, onNavigate }: PageHeroProps) {
  return (
    <section className="page-hero">
      <div className="page-hero-inner">
        <div className="crumbs">
          <a href="/" onClick={(e) => { e.preventDefault(); onNavigate('/') }}>Home</a>
          {' '}
          <i className="fa-solid fa-chevron-right" style={{ fontSize: 8 }} />
          {' '}
          <span>{crumbs}</span>
        </div>
        <div className="hero-eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{sub}</p>
      </div>
    </section>
  )
}