import { useEffect, useState } from 'react'
import { X, Lock } from 'lucide-react'
import { useShop, type CheckoutPayload } from '../../store/shop'
import { fmt } from '../../lib/format'
import { cn } from '../../utils/cn'
import { getLenis } from '../../utils/lenis'

export function Checkout() {
  const { checkoutOpen, closeCheckout, cart, placeOrder, config } = useShop()
  const [form, setForm] = useState<CheckoutPayload>({
    firstname: '', lastname: '', contactnumber: '', address: '',
    delivery_location: '', services: '', account_number: '', transaction_id: '',
  })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (checkoutOpen) getLenis()?.stop()
    else getLenis()?.start()
  }, [checkoutOpen])

  if (!checkoutOpen) return null

  const sub = cart.reduce((n, i) => n + i.offerPrice * i.qty, 0)
  const del = form.delivery_location === 'inside'
    ? (Number(config.insideDhakaCharge) || 60)
    : form.delivery_location === 'outside'
      ? (Number(config.outsideDhakaCharge) || 120)
      : 0
  const tot = sub + del

  const set = (k: keyof CheckoutPayload) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const bKash = config.bKashNumber || '01XXXXXXXXX'
  const nagad = config.nagadNumber || '01XXXXXXXXX'
  const needTxn = form.services === 'bKash' || form.services === 'Nagad'

  const submit = async () => {
    setErr('')
    if (!cart.length) { setErr('Your bag is empty.'); return }
    if (!form.firstname || !form.lastname || !form.contactnumber || !form.address || !form.delivery_location || !form.services) {
      setErr('Please fill in all required fields.'); return
    }
    if (form.contactnumber.replace(/\D/g, '').length < 10) { setErr('Please enter a valid contact number.'); return }
    if (form.address.length < 10) { setErr('Please enter a complete delivery address.'); return }
    if (needTxn && (!form.account_number || !form.transaction_id)) {
      setErr(`Please enter your ${form.services} account number and transaction ID.`); return
    }
    setBusy(true)
    try { await placeOrder(form) } catch { /* toast already shown */ } finally { setBusy(false) }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-6" onClick={(e) => { if (e.target === e.currentTarget) closeCheckout() }}>
      <div role="dialog" aria-modal="true" aria-label="Checkout"
        className="dd-in max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl" data-lenis-prevent>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-ink">Checkout</h2>
          <button type="button" aria-label="Close checkout" onClick={closeCheckout}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate transition-colors hover:bg-rose-s hover:text-rose-d">
            <X size={18} />
          </button>
        </div>
        <p className="mt-0.5 text-sm text-slate">Complete your order below</p>

        <div className="mt-4 rounded-2xl border border-bdr bg-blush p-4 text-sm">
          <div className="flex justify-between text-slate"><span>Subtotal</span><span className="font-bold text-ink">{fmt(sub)}</span></div>
          <div className="mt-1 flex justify-between text-slate">
            <span>Delivery</span>
            <span className="font-bold text-ink">{del ? fmt(del) : '—'}</span>
          </div>
          <div className="mt-1 flex justify-between text-base font-extrabold text-ink"><span>Total</span><span>{fmt(tot)}</span></div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="form-group">
            <label className="mb-1 block text-xs font-bold text-ink" htmlFor="co-fn">First Name *</label>
            <input id="co-fn" type="text" value={form.firstname} onChange={set('firstname')} autoComplete="given-name" placeholder="Nusrat"
              className="w-full rounded-xl border border-bdr px-4 py-2.5 text-sm focus:border-rose-m" />
          </div>
          <div className="form-group">
            <label className="mb-1 block text-xs font-bold text-ink" htmlFor="co-ln">Last Name *</label>
            <input id="co-ln" type="text" value={form.lastname} onChange={set('lastname')} autoComplete="family-name" placeholder="Jahan"
              className="w-full rounded-xl border border-bdr px-4 py-2.5 text-sm focus:border-rose-m" />
          </div>
        </div>

        <div className="form-group mt-4">
          <label className="mb-1 block text-xs font-bold text-ink" htmlFor="co-phone">Contact Number *</label>
          <input id="co-phone" type="tel" inputMode="tel" value={form.contactnumber} onChange={set('contactnumber')} autoComplete="tel" placeholder="01XXXXXXXXX"
            className="w-full rounded-xl border border-bdr px-4 py-2.5 text-sm focus:border-rose-m" />
        </div>

        <div className="form-group mt-4">
          <label className="mb-1 block text-xs font-bold text-ink" htmlFor="co-addr">Delivery Address *</label>
          <textarea id="co-addr" rows={2} value={form.address} onChange={set('address')} className="w-full resize-none rounded-xl border border-bdr px-4 py-2.5 text-sm focus:border-rose-m" placeholder="House No, Road, Area, City…" />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="form-group">
            <label className="mb-1 block text-xs font-bold text-ink" htmlFor="co-loc">Delivery Location *</label>
            <select id="co-loc" value={form.delivery_location} onChange={set('delivery_location')}
              className="w-full appearance-none rounded-xl border border-bdr bg-white px-4 py-2.5 text-sm focus:border-rose-m">
              <option value="">— Select —</option>
              <option value="inside">Inside Dhaka (Ashkona / Uttara area)</option>
              <option value="outside">Outside Dhaka</option>
            </select>
          </div>
          <div className="form-group">
            <label className="mb-1 block text-xs font-bold text-ink" htmlFor="co-pay">Payment Method *</label>
            <select id="co-pay" value={form.services} onChange={set('services')}
              className="w-full appearance-none rounded-xl border border-bdr bg-white px-4 py-2.5 text-sm focus:border-rose-m">
              <option value="">— Select —</option>
              <option value="Cash On Delivery">Cash On Delivery</option>
              <option value="bKash">bKash</option>
              <option value="Nagad">Nagad</option>
            </select>
          </div>
        </div>

        {needTxn && (
          <div className="dd-in mt-4 rounded-2xl border border-bdr bg-blush p-4 text-sm">
            <p className="font-extrabold text-ink">{form.services} Payment</p>
            <p className="mt-1 text-xs text-slate">
              Send to: <strong className="text-ink">{form.services === 'bKash' ? bKash : nagad}</strong><br />
              Then fill your account number and transaction ID below.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="form-group">
                <label className="mb-1 block text-xs font-bold text-ink">Your {form.services} Account No. *</label>
                <input type="tel" value={form.account_number} onChange={set('account_number')} placeholder="01XXXXXXXXX"
                  className="w-full rounded-xl border border-bdr px-4 py-2.5 text-sm focus:border-rose-m" />
              </div>
              <div className="form-group">
                <label className="mb-1 block text-xs font-bold text-ink">Transaction ID *</label>
                <input type="text" value={form.transaction_id} onChange={set('transaction_id')} placeholder="TXN123456"
                  className="w-full rounded-xl border border-bdr px-4 py-2.5 text-sm focus:border-rose-m" />
              </div>
            </div>
          </div>
        )}

        {err && <p role="alert" className="mt-3 rounded-xl bg-red-l px-4 py-2.5 text-sm font-semibold text-red">{err}</p>}

        <button type="button" onClick={submit} disabled={busy}
          className={cn('mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-rose-d py-3.5 text-sm font-bold text-white shadow-lg transition-colors hover:bg-rose disabled:opacity-60')}>
          {busy ? <><span className="spin h-4 w-4 rounded-full border-2 border-white/40 border-t-white" /> Placing Order…</>
          : <><Lock size={14} /> Place Order</>}
        </button>
      </div>
    </div>
  )
}