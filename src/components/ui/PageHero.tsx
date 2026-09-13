import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'

interface PageHeroProps {
  crumbs: string
  eyebrow: ReactNode
  title: ReactNode
  sub: ReactNode
}

export function PageHero({ crumbs, eyebrow, title, sub }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute -left-20 top-8 h-72 w-72 rounded-full bg-rose-m/15 blur-[110px]" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 bottom-4 h-72 w-72 rounded-full bg-gold/15 blur-[120px]" />
      <div className="relative mx-auto max-w-[1400px] px-4 pt-24 md:px-8 md:pt-32">
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-xs font-semibold text-slate">
          <a href="/" className="transition-colors hover:text-rose-d">Home</a>
          <ChevronRight size={10} />
          <span className="text-rose-d">{crumbs}</span>
        </nav>
        <div className="rounded-3xl bg-gradient-to-br from-blush to-white/60 p-8 md:p-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-bdr bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-rose-d">
            {eyebrow}
          </div>
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight text-ink md:text-5xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate md:text-base">{sub}</p>
        </div>
      </div>
    </section>
  )
}