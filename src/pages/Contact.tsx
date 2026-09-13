import { useState } from 'react'
import { Mail, Info, LoaderCircle, MapPin, Phone, Send, Clock, Check } from 'lucide-react'
import { PageHero } from '../components/ui/PageHero'
import { Reveal } from '../components/ui/Reveal'
import { site } from '../data/site'

const channels = [
  { icon: Phone, label: 'Phone / WhatsApp', value: '+8801874460244', href: 'tel:+8801874460244' },
  { icon: Mail, label: 'Email', value: site.email, href: 'mailto:glowsaffron7@gmail.com' },
  { icon: MapPin, label: 'Location', value: 'Dhaka, Bangladesh' },
  { icon: Clock, label: 'Hours', value: 'Sat–Thu: 10AM – 10PM' },
]

interface Form { name: string; phone: string; email: string; message: string }

export function Contact() {
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
    // The vanilla site handled the contact form locally; posting to GAS is a
    // best-effort so we keep the same behavior even if the sheet is unreachable.
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
    <div className="pb-20">
      <PageHero
        crumbs="Contact"
        eyebrow={<><Mail size={12} /> Let's Talk Skincare</>}
        title={<>We'd Love to Hear<br /><span className="display-serif italic text-rose-d">From You</span></>}
        sub="Questions about a product, your skin type, or an order? Reach out below or message us directly on WhatsApp for the fastest reply."
      />

      <div className="mx-auto grid max-w-[1400px] gap-8 px-4 md:grid-cols-2 md:px-8">
        <Reveal className="mt-10">
          <div className="panel h-full p-7">
            <h3 className="text-xl font-extrabold text-ink">Get in Touch</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate">
              We usually reply within a few hours during business hours. For urgent same-day requests, WhatsApp is fastest.
            </p>
            <div className="mt-6 space-y-5">
              {channels.map((c) => (
                <div key={c.label} className="flex items-start gap-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-s text-rose-d">
                    <c.icon size={16} />
                  </span>
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-wider text-slate">{c.label}</p>
                    {c.href
                      ? <a href={c.href} className="text-sm font-bold text-ink transition-colors hover:text-rose-d">{c.value}</a>
                      : <p className="text-sm font-bold text-ink">{c.value}</p>}
                  </div>
                </div>
              ))}
            </div>
            <a
              href={site.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex items-center gap-2 rounded-full border border-bdr bg-white px-6 py-3 text-sm font-bold text-rose-d transition-colors hover:border-rose-m hover:bg-rose-s"
            >
              <Phone size={15} /> Chat on WhatsApp
            </a>
          </div>
        </Reveal>

        <Reveal className="mt-10" delay={80}>
          <div className="panel p-7">
            {!sent ? (
              <>
                <h3 className="text-xl font-extrabold text-ink">Send a Message</h3>
                <p className="mt-1 text-sm text-slate">Fill this out and we'll get back to you shortly.</p>
                <form onSubmit={submit} className="mt-5 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="form-group">
                      <label className="mb-1 block text-xs font-bold text-ink" htmlFor="cf-name">Your Name *</label>
                      <input id="cf-name" type="text" value={form.name} onChange={set('name')} placeholder="Nusrat Jahan" required
                        className="w-full rounded-xl border border-bdr px-4 py-2.5 text-sm focus:border-rose-m" />
                    </div>
                    <div className="form-group">
                      <label className="mb-1 block text-xs font-bold text-ink" htmlFor="cf-phone">Phone Number *</label>
                      <input id="cf-phone" type="tel" value={form.phone} onChange={set('phone')} placeholder="01XXXXXXXXX" required
                        className="w-full rounded-xl border border-bdr px-4 py-2.5 text-sm focus:border-rose-m" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="mb-1 block text-xs font-bold text-ink" htmlFor="cf-email">Email (optional)</label>
                    <input id="cf-email" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com"
                      className="w-full rounded-xl border border-bdr px-4 py-2.5 text-sm focus:border-rose-m" />
                  </div>
                  <div className="form-group">
                    <label className="mb-1 block text-xs font-bold text-ink" htmlFor="cf-message">Message *</label>
                    <textarea id="cf-message" rows={5} value={form.message} onChange={set('message')} required
                      placeholder="Tell us what you're looking for — product, skin concern, or order question."
                      className="w-full resize-none rounded-xl border border-bdr px-4 py-2.5 text-sm focus:border-rose-m" />
                  </div>
                  {err && <p role="alert" className="rounded-xl bg-red-l px-4 py-2.5 text-sm font-semibold text-red">{err}</p>}
                  <button type="submit" disabled={busy}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-rose-d py-3.5 text-sm font-bold text-white shadow-lg transition-colors hover:bg-rose disabled:opacity-60">
                    {busy ? <LoaderCircle size={15} className="spin" /> : <Send size={14} />} Send Message
                  </button>
                </form>
                <p className="mt-4 flex items-center gap-2 rounded-xl bg-blush px-4 py-2.5 text-xs text-slate">
                  <Info size={12} className="shrink-0 text-rose-d" />
                  Prefer to talk it through? Call or WhatsApp us at +8801874460244.
                </p>
              </>
            ) : (
              <div className="dd-in py-8 text-center">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-l text-green">
                  <Check size={28} strokeWidth={3} />
                </span>
                <h4 className="mt-4 text-2xl font-extrabold text-ink">Message Sent!</h4>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate">
                  Thanks for reaching out — we'll get back to you shortly. For a faster reply, feel free to message us on WhatsApp in the meantime.
                </p>
                <button type="button" onClick={() => { setSent(false); setForm({ name: '', phone: '', email: '', message: '' }) }}
                  className="mt-6 rounded-full border border-bdr px-6 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-rose-s hover:text-rose-d">
                  Send another message
                </button>
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </div>
  )
}