import { useEffect, useState } from 'react'
import { X, Search, Clock, Check, Package, Truck, Bike, Home, MapPin } from 'lucide-react'
import { useShop } from '../../store/shop'
import { trackOrder } from '../../lib/api'
import { statusOrder } from '../../data/site'
import { cn } from '../../utils/cn'
import { fmt } from '../../lib/format'
import type { TrackResult } from '../../lib/types'
import { getLenis } from '../../utils/lenis'

const STEP_ICONS = [Clock, Check, Package, Truck, Bike, Home]

function normalize(s: string | undefined): string {
  return String(s ?? '').trim().toLowerCase().replace(/\s+/g, '')
}

export function OrderTracking() {
  const { trackOpen, closeTrack } = useShop()
  const [id, setId] = useState('')
  const [res, setRes] = useState<TrackResult | null>(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (trackOpen) getLenis()?.stop()
    else getLenis()?.start()
  }, [trackOpen])

  useEffect(() => {
    setErr('')
    setRes(null)
    setId('')
  }, [trackOpen])

  if (!trackOpen) return null

  const curIdx = res ? statusOrder.findIndex((s) => normalize(s) === normalize(res.status)) : -1

  const doTrack = async () => {
    setErr('')
    if (!id.trim()) { setErr('Please enter an Order ID or tracking code.'); return }
    setBusy(true)
    try {
      const d = await trackOrder(id.trim())
      if (!d || (d.status === undefined && !d.orderID)) throw new Error('Order not found.')
      setRes(d)
    } catch (e) {
      setRes(null)
      setErr(e instanceof Error ? e.message : 'Order not found. Check the code and try again.')
    } finally { setBusy(false) }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-6"
      onClick={(e) => { if (e.target === e.currentTarget) closeTrack() }}>
      <div role="dialog" aria-modal="true" aria-label="Track your order"
        className="dd-in max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl" data-lenis-prevent>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-ink">Track Your Order <span className="text-rose">🚚</span></h2>
          <button type="button" aria-label="Close" onClick={closeTrack}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate transition-colors hover:bg-rose-s hover:text-rose-d">
            <X size={18} />
          </button>
        </div>
        <p className="mt-0.5 text-sm text-slate">Enter your Order ID (e.g. #ORD-...) or Tracking Code (e.g. SGC-...)</p>

        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={id}
            onChange={(e) => setId(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') doTrack() }}
            placeholder="SGC-260319-1234 or #ORD-..."
            aria-label="Order ID or tracking code"
            className="flex-1 rounded-full border border-bdr px-4 py-2.5 text-sm focus:border-rose-m"
          />
          <button type="button" onClick={doTrack} disabled={busy}
            className="inline-flex items-center gap-2 rounded-full bg-rose-d px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-rose disabled:opacity-60">
            <Search size={14} /> {busy ? '…' : 'Search'}
          </button>
        </div>

        {err && <p role="alert" className="mt-3 rounded-xl bg-red-l px-4 py-2.5 text-sm font-semibold text-red">{err}</p>}

        {res && (
          <div className="dd-in mt-5">
            <div className="flex items-center justify-between rounded-2xl border border-bdr bg-blush px-4 py-3">
              <span className="text-sm font-bold text-ink">Current Status</span>
              <span className={cn('rounded-full px-3 py-1 text-xs font-extrabold text-white', curIdx >= 5 ? 'bg-green' : curIdx >= 3 ? 'bg-blue' : 'bg-gold')}>
                {res.status ?? 'Processing'}
              </span>
            </div>

            {/* Stepper */}
            <div className="mt-5 grid grid-cols-6 gap-1">
              {statusOrder.map((s, i) => {
                const Icon = STEP_ICONS[i]
                const active = i <= curIdx
                const isNow = i === curIdx
                return (
                  <div key={s} className="flex flex-col items-center gap-1.5 text-center">
                    <span className={cn(
                      'flex aspect-square w-full max-w-[44px] items-center justify-center rounded-full border transition-colors',
                      active ? 'border-rose-d bg-rose-d text-white' : 'border-bdr bg-white text-slate'
                    )}>
                      <Icon size={isNow ? 14 : 13} />
                    </span>
                    <span className={cn('text-[8px] font-bold leading-tight', active ? 'text-rose-d' : 'text-slate')}>
                      {s.replace(/([a-z])([A-Z])/g, '$1 $2')}
                    </span>
                  </div>
                )
              })}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="panel p-4 text-sm">
                <p className="text-xs font-extrabold uppercase tracking-wider text-slate">Order Info</p>
                <p className="mt-2 leading-relaxed text-ink whitespace-pre-line">
                  {res.orderID ? <>Order: <strong>{res.orderID}</strong><br /></> : null}
                  {res.orderDate ? <>Date: <strong>{res.orderDate}</strong><br /></> : null}
                  {res.customerName ? <>{res.customerName}<br /></> : null}
                  {res.trackingCode ? <>Code: <strong>{res.trackingCode}</strong></> : null}
                </p>
              </div>
              <div className="panel p-4 text-sm">
                <p className="text-xs font-extrabold uppercase tracking-wider text-slate">Delivery Info</p>
                <p className="mt-2 flex items-start gap-2 leading-relaxed text-ink">
                  <MapPin size={14} className="mt-0.5 shrink-0 text-rose-d" />
                  {res.address ?? '—'} {res.deliveryLocation ? `(${res.deliveryLocation})` : ''}
                </p>
                {res.contactNumber && <p className="mt-1 text-slate">☎ {res.contactNumber}</p>}
              </div>
            </div>

            {res.products && (
              <div className="panel mt-3 p-4 text-sm">
                <p className="text-xs font-extrabold uppercase tracking-wider text-slate">Items Ordered</p>
                <p className="mt-2 whitespace-pre-line leading-relaxed text-ink">{res.products}</p>
              </div>
            )}

            <div className="mt-3 rounded-2xl border border-bdr bg-blush p-4 text-sm">
              <div className="flex justify-between text-slate"><span>Subtotal</span><span className="font-bold text-ink">{fmt(Number(res.subtotalNum ?? res.total ?? 0))}</span></div>
              <div className="flex justify-between text-slate"><span>Delivery</span><span className="font-bold text-ink">{fmt(Number(res.deliveryNum ?? 0))}</span></div>
              <div className="mt-1 flex justify-between text-base font-extrabold text-ink"><span>Total</span><span>{fmt(Number(res.totalNum ?? res.total ?? 0))}</span></div>
            </div>
          </div>
        )}

        <button type="button" onClick={closeTrack}
          className="mt-5 w-full rounded-full border border-bdr py-3 text-sm font-bold text-ink transition-colors hover:bg-rose-s hover:text-rose-d">
          Close
        </button>
      </div>
    </div>
  )
}