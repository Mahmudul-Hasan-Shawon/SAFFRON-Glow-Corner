import { useState } from 'react'
import { PageHero } from '../components/ui/PageHero'
import { Reveal } from '../components/ui/Reveal'
import { site } from '../data/site'

interface PageProps { onNavigate: (href: string) => void }
interface Form { name: string; phone: string; email: string; message: string }

export function Contact({ onNavigate }: PageProps) {
  const [form, setForm] = useState<Form>({ name: '', phone: '', email: '', message: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr('')
    if (!form.name.trim() || !form.phone.trim() || !form.message.trim()) {
      setErr('Please fill in your name, phone number, and message.')
      return
    }
    setBusy(true)
    try {
      await fetch(
        'https://script.google.com/macros/s/AKfycbxriqOAO51MW3ekmUhGZ6TWvEqgn9a7wYV6JxU5tvdkiu04VnLvlzRfi6B9JApXUXqLrg/exec',
        { method: 'POST', body: JSON.stringify({ action: 'submitContact', ...form }) },
      )
    } catch { /* best effort only */ }
    setBusy(false)
    setSent(true)
  }

  return (
    <div>
      <PageHero
        crumbs="Contact"
        eyebrow={<><i className="fa fa-envelope" /> Let's Talk Skincare</>}
        title={<>We'd Love to Hear<br /><em>From You</em></>}
        sub="Questions about a product, your skin type, or an order? Reach out below or message us directly on WhatsApp for the fastest reply."
        onNavigate={onNavigate}
      />

      <div className="static-section">
        <div className="contact-grid">
          <div className="contact-info-card reveal">
            <h3>Get in Touch</h3>
            <p>We usually reply within a few hours during business hours. For urgent same-day requests, WhatsApp is fastest.</p>

            <div className="cic-item">
              <div className="ci-ic"><i className="fa-solid fa-phone" /></div>
              <div><strong>Phone / WhatsApp</strong><a href="tel:+8801874460244">+8801874460244</a></div>
            </div>
            <div className="cic-item">
              <div className="ci-ic"><i className="fa-solid fa-envelope" /></div>
              <div><strong>Email</strong><a href="mailto:glowsaffron7@gmail.com">{site.email}</a></div>
            </div>
            <div className="cic-item">
              <div className="ci-ic"><i className="fa-solid fa-location-dot" /></div>
              <div><strong>Location</strong><span>Dhaka, Bangladesh</span></div>
            </div>
            <div className="cic-item">
              <div className="ci-ic"><i className="fa-solid fa-clock" /></div>
              <div><strong>Hours</strong><span>Sat–Thu: 10AM – 10PM</span></div>
            </div>

            <a href={site.whatsapp} target="_blank" rel="noopener" className="hero-btn" style={{ marginTop: 10, background: '#fff', color: 'var(--rose-d)' }}>
              <i className="fa-brands fa-whatsapp" style={{ fontSize: 20 }} />
              <span>Chat on WhatsApp</span>
            </a>
          </div>

          <Reveal delay={80}>
            <div className="contact-form-card">
              {!sent ? (
                <form onSubmit={submit}>
                  <h3>Send a Message</h3>
                  <p className="co-sub">Fill this out and we'll get back to you shortly.</p>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="cf-name">Your Name *</label>
                      <input id="cf-name" type="text" value={form.name} onChange={set('name')} placeholder="Nusrat Jahan" required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="cf-phone">Phone Number *</label>
                      <input id="cf-phone" type="tel" value={form.phone} onChange={set('phone')} placeholder="01XXXXXXXXX" required />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="cf-email">Email (optional)</label>
                    <input id="cf-email" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="cf-message">Message *</label>
                    <textarea id="cf-message" rows={5} value={form.message} onChange={set('message')} placeholder="Tell us what you're looking for — product, skin concern, or order question." required style={{ resize: 'none' }} />
                  </div>
                  {err && <p className="form-err" role="alert">{err}</p>}
                  <button type="submit" className="btn-place" disabled={busy}>
                    <i className={`fa ${busy ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`} /> Send Message
                  </button>
                </form>
              ) : (
                <div className="contact-success on">
                  <div className="success-icon"><i className="fa fa-check" /></div>
                  <h4>Message Sent!</h4>
                  <p>Thanks for reaching out — we'll get back to you shortly. For a faster reply, feel free to message us on WhatsApp in the meantime.</p>
                </div>
              )}

              <div className="contact-map-note"><i className="fa-solid fa-circle-info" /> Prefer to talk it through? Call or WhatsApp us at +8801874460244.</div>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  )
}