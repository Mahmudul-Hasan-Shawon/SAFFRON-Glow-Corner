import { useState } from 'react'
import { Info, MessageCircle, Plus, Minus } from 'lucide-react'
import { PageHero } from '../components/ui/PageHero'
import { Reveal } from '../components/ui/Reveal'
import { faqItems, site } from '../data/site'
import { cn } from '../utils/cn'

export function Faq() {
  const [open, setOpen] = useState<number>(0)

  return (
    <div className="pb-20">
      <PageHero
        crumbs="FAQ"
        eyebrow={<><Info size={12} /> Good to Know</>}
        title={<>Questions We Hear<br /><span className="display-serif italic text-rose-d">Most Often</span></>}
        sub="Can't find your answer here? Message us directly on WhatsApp and we'll get back to you quickly."
      />

      <div className="mx-auto max-w-3xl px-4 md:px-8">
        <div className="mt-10 space-y-3">
          {faqItems.map((f, i) => {
            const isOpen = open === i
            return (
              <Reveal key={i} delay={i * 40}>
                <div className={cn('panel overflow-hidden transition-colors', isOpen && 'border-rose-m/60')}>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-a-${i}`}
                    className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                  >
                    <span className="text-sm font-extrabold leading-snug text-ink">{f.q}</span>
                    <span className={cn('inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors', isOpen ? 'bg-rose-d text-white' : 'bg-rose-s text-rose-d')}>
                      {isOpen ? <Minus size={13} /> : <Plus size={13} />}
                    </span>
                  </button>
                  <div id={`faq-a-${i}`} className={cn('grid transition-all duration-300', isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}>
                    <div className="overflow-hidden">
                      <p className="px-5 pb-5 text-sm leading-relaxed text-slate">{f.a}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            )
          })}
        </div>

        <Reveal className="mt-12 flex flex-col items-center gap-3 rounded-3xl border border-bdr bg-gradient-to-br from-blush to-white/60 p-8 text-center">
          <p className="text-sm font-semibold text-ink">Still have a question?</p>
          <p className="max-w-sm text-sm text-slate">We usually reply within a few hours during business hours. For urgent same-day requests, WhatsApp is fastest.</p>
          <a
            href={site.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-2 rounded-full bg-rose-d px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-rose"
          >
            <MessageCircle size={15} /> Chat on WhatsApp
          </a>
        </Reveal>
      </div>
    </div>
  )
}