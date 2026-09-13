import { useEffect, useRef } from 'react'
import { Check, MapPin, FileText, X } from 'lucide-react'
import { useShop } from '../../store/shop'
import { getLenis } from '../../utils/lenis'

function confetti() {
  const colors = ['#B8674F', '#D99B7C', '#C08A3E', '#FFFFFF', '#7A3D28']
  for (let i = 0; i < 40; i++) {
    const el = document.createElement('div')
    const size = 6 + Math.random() * 7
    el.style.cssText =
      `position:fixed;left:50%;top:34%;width:${size}px;height:${size * 0.5}px;background:${colors[i % colors.length]};z-index:999;pointer-events:none;border-radius:2px;opacity:1;transition:transform 1.5s cubic-bezier(.2,.6,.35,1),opacity 1.5s ease`
    document.body.appendChild(el)
    requestAnimationFrame(() => {
      const x = (Math.random() - 0.5) * 620
      const y = (Math.random() - 0.35) * 560
      el.style.transform = `translate(${x}px,${y}px) rotate(${Math.random() * 900 - 450}deg)`
      el.style.opacity = '0'
    })
    window.setTimeout(() => el.remove(), 1700)
  }
}

export function OrderSuccess() {
  const { successOpen, closeSuccess, lastOrder, openTrack, setInvoiceOpen } = useShop()
  const fired = useRef(false)

  useEffect(() => {
    if (successOpen && !fired.current) {
      confetti()
      fired.current = true
    }
    if (!successOpen) fired.current = false
  }, [successOpen])

  useEffect(() => {
    if (successOpen) getLenis()?.stop()
    else getLenis()?.start()
  }, [successOpen])

  if (!successOpen) return null

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4">
      <div role="dialog" aria-modal="true" aria-label="Order placed"
        className="dd-in w-full max-w-md rounded-3xl bg-white p-7 text-center shadow-2xl">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-l text-green">
          <Check size={30} strokeWidth={3} />
        </span>
        <h2 className="mt-4 text-2xl font-extrabold text-ink">Order Placed!</h2>
        <p className="mt-2 text-sm text-slate">
          Your order has been received. Save your tracking code to check delivery status anytime.
        </p>
        {lastOrder?.emailSent === false && (
          <p className="mt-3 rounded-xl bg-amber-100 px-4 py-2.5 text-xs text-amber">
            Your order is saved, but our confirmation email didn't go out. Please keep your tracking code and message us
            on WhatsApp to confirm.
          </p>
        )}
        <div className="mt-5 rounded-2xl border border-bdr bg-blush p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate">Order ID</p>
          <p className="mt-1 text-lg font-extrabold text-ink">{lastOrder?.orderNumber ?? '—'}</p>
        </div>
        <div className="mt-3 rounded-2xl border border-bdr p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate">Your Tracking Code</p>
          <p className="mt-1 text-lg font-extrabold text-rose-d">{lastOrder?.trackingCode ?? '—'}</p>
          <p className="mt-1 text-xs text-slate">Use this code to track your shipment</p>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-2.5">
          <button type="button" onClick={() => { closeSuccess(); openTrack() }}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-rose-d py-3 text-sm font-bold text-white transition-colors hover:bg-rose">
            <MapPin size={14} /> Track My Order
          </button>
          <button type="button" onClick={() => setInvoiceOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-bdr py-3 text-sm font-bold text-ink transition-colors hover:bg-rose-s hover:text-rose-d">
            <FileText size={14} /> View Invoice
          </button>
          <button type="button" onClick={closeSuccess}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-ink py-3 text-sm font-bold text-white transition-colors hover:bg-ink/80">
            <X size={14} /> Done
          </button>
        </div>
      </div>
    </div>
  )
}