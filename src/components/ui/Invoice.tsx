import { useEffect } from 'react'
import { Printer, Check } from 'lucide-react'
import { useShop } from '../../store/shop'
import { fmt } from '../../lib/format'
import { site } from '../../data/site'
import { getLenis } from '../../utils/lenis'

export function Invoice() {
  const { invoiceOpen, setInvoiceOpen, lastOrder, config } = useShop()

  useEffect(() => {
    if (invoiceOpen) getLenis()?.stop()
    else getLenis()?.start()
  }, [invoiceOpen])

  if (!invoiceOpen || !lastOrder) return null
  const o = lastOrder
  const sym = config.currencySymbol || '৳'

  const print = () => {
    const actions = document.getElementById('inv-actions')
    if (actions) actions.style.display = 'none'
    window.print()
    if (actions) actions.style.display = ''
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div className="dd-in max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
        <div id="inv-content" className="print-area">
          <div className="border-b border-dashed border-bdr pb-5 text-center">
            <p className="display-logo text-xl font-bold text-rose-d">✿ Saffron Glow Corner ✿</p>
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate">Your Glow, Our Pride</p>
            <span className="mt-3 inline-block rounded border border-rose px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-rose-d">Invoice</span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-bdr p-4 text-sm">
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate">Order Details</p>
              <p className="mt-2 leading-relaxed text-ink whitespace-pre-line">
                Order: <strong>{o.orderNumber}</strong><br />
                Tracking: <strong>{o.trackingCode}</strong><br />
                Date: <strong>{new Date().toLocaleDateString('en-GB')}</strong>
              </p>
            </div>
            <div className="rounded-2xl border border-bdr p-4 text-sm">
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate">Customer</p>
              <p className="mt-2 leading-relaxed text-ink whitespace-pre-line">
                {o.fullname}<br />
                {o.contactnumber}<br />
                {o.address}
              </p>
            </div>
          </div>

          <table className="mt-5 w-full text-sm">
            <thead>
              <tr className="border-b border-bdr text-left">
                <th className="pb-2 text-xs font-extrabold uppercase tracking-wider text-slate">Product</th>
                <th className="pb-2 text-center text-xs font-extrabold uppercase tracking-wider text-slate">Qty</th>
                <th className="pb-2 text-right text-xs font-extrabold uppercase tracking-wider text-slate">Total</th>
              </tr>
            </thead>
            <tbody>
              {o.snap.map((i) => (
                <tr key={i.id} className="border-b border-bdr/60">
                  <td className="py-2.5 font-semibold text-ink">{i.title}</td>
                  <td className="py-2.5 text-center text-slate">{i.qty}</td>
                  <td className="py-2.5 text-right font-semibold text-ink">{fmt(i.offerPrice * i.qty, sym)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 ml-auto max-w-[220px] space-y-1.5 text-sm">
            <div className="flex justify-between text-slate"><span>Subtotal</span><span>{fmt(o.sub, sym)}</span></div>
            <div className="flex justify-between text-slate"><span>Delivery</span><span>{fmt(o.del, sym)}</span></div>
            <div className="flex justify-between border-t border-bdr pt-1.5 text-base font-extrabold text-ink">
              <span>Grand Total</span><span>{fmt(o.tot, sym)}</span>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-slate">🌸 Thank you for shopping with Saffron Glow Corner!</p>
          <p className="mt-3 text-center text-xs text-slate">
            <strong className="text-rose-d">Saffron Glow Corner</strong> &nbsp;|&nbsp; {site.email} &nbsp;|&nbsp; © 2026
          </p>
        </div>

        <div id="inv-actions" className="mt-6 flex gap-2.5">
          <button type="button" onClick={print}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-bdr py-3 text-sm font-bold text-ink transition-colors hover:bg-rose-s hover:text-rose-d">
            <Printer size={14} /> Print
          </button>
          <button type="button" onClick={() => setInvoiceOpen(false)}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-rose-d py-3 text-sm font-bold text-white transition-colors hover:bg-rose">
            <Check size={14} /> Done
          </button>
        </div>
      </div>
    </div>
  )
}