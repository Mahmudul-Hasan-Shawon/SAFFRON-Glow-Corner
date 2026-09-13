import { useState } from 'react'
import { PageHero } from '../components/ui/PageHero'
import { Reveal } from '../components/ui/Reveal'
import { faqItems } from '../data/site'

interface PageProps { onNavigate: (href: string) => void }

export function Faq({ onNavigate }: PageProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(0)

  const toggle = (i: number) => setOpenIdx(openIdx === i ? null : i)

  return (
    <div>
      <PageHero
        crumbs="FAQ"
        eyebrow={<><i className="fa fa-circle-question" /> Good to Know</>}
        title={<>Questions We Hear<br /><em>Most Often</em></>}
        sub="Can't find your answer here? Message us directly on WhatsApp and we'll get back to you quickly."
        onNavigate={onNavigate}
      />

      <div className="static-section">
        <div className="faq-list">
          {faqItems.map((f, i) => (
            <Reveal key={i} delay={i * 40}>
              <div className={`faq-item${openIdx === i ? ' open' : ''}`}>
                <button type="button" className="faq-q" onClick={() => toggle(i)}>
                  {f.q}
                  <i className="fa-solid fa-plus" />
                </button>
                <div className="faq-a" style={{ maxHeight: openIdx === i ? '300px' : '0' }}>
                  <p>{f.a}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="faq-cta reveal">
          <h3>Still have a question?</h3>
          <p>We're happy to talk through custom designs, flavors, or delivery details.</p>
          <a
            href="/contact"
            className="hero-btn"
            style={{ background: 'linear-gradient(135deg,var(--rose-d),var(--rose))', color: '#fff' }}
            onClick={(e) => { e.preventDefault(); onNavigate('/contact') }}
          >
            <i className="fa-brands fa-whatsapp" />
            <span>Contact Us</span>
          </a>
        </div>
      </div>
    </div>
  )
}