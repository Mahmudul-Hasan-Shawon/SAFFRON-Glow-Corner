import { useEffect, useState } from 'react'
import { useShop } from '../../store/shop'
import { trackOrder } from '../../lib/api'
import { statusOrder } from '../../data/site'
import { fmt } from '../../lib/format'
import { syncOverlayLock } from '../../utils/overlay'
import type { TrackResult } from '../../lib/types'

function normalize(s: string | undefined): string {
  return String(s ?? '').trim().toLowerCase().replace(/\s+/g, '')
}

const STEP_ICONS = [
  { id: 'step-processing', icon: 'fa-clock', label: 'Processing' },
  { id: 'step-confirmed', icon: 'fa-check', label: 'Confirmed' },
  { id: 'step-packed', icon: 'fa-box', label: 'Packed' },
  { id: 'step-shipped', icon: 'fa-truck', label: 'Shipped' },
  { id: 'step-outfordelivery', icon: 'fa-motorcycle', label: 'Out for Delivery' },
  { id: 'step-delivered', icon: 'fa-house', label: 'Delivered' },
]

export function OrderTracking() {
  const { trackOpen, trackPrefill, closeTrack } = useShop()
  const [val, setVal] = useState('')
  const [res, setRes] = useState<TrackResult | null>(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => { syncOverlayLock() }, [trackOpen])

  useEffect(() => {
    setErr('')
    setRes(null)
    setVal(trackPrefill ?? '')
    if (trackPrefill && trackOpen) {
      // Auto-search when opened with a prefill code
      trackOrder(trackPrefill)
        .then((d) => { if (d && (d.status || d.orderID)) setRes(d); else setErr('Order not found.') })
        .catch(() => setErr('Order not found.'))
    }
  }, [trackOpen, trackPrefill])

  if (!trackOpen) return null

  const curIdx = res ? statusOrder.findIndex((s) => normalize(s) === normalize(res.status)) : -1

  const doTrack = async () => {
    setErr('')
    if (!val.trim()) { setErr('Please enter an Order ID or tracking code.'); return }
    setBusy(true)
    try {
      const d = await trackOrder(val.trim())
      if (!d || (d.status === undefined && !d.orderID)) throw new Error('Order not found.')
      setRes(d)
    } catch (e) {
      setRes(null)
      setErr(e instanceof Error ? e.message : 'Order not found. Check the code and try again.')
    } finally { setBusy(false) }
  }

  return (
    <div id="track-veil" className="on" onClick={(e) => { if (e.target === e.currentTarget) closeTrack() }}>
      <div id="track-box" role="dialog" aria-modal="true" aria-label="Track your order">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <h2 className="track-title">Track Your Order <i className="fa-solid fa-truck-fast" style={{ color: 'var(--rose)' }} /></h2>
          <button className="icon-btn" type="button" aria-label="Close" onClick={closeTrack}>
            <i className="fa fa-xmark" />
          </button>
        </div>
        <p className="track-sub">Enter your Order ID (e.g. #ORD-...) or Tracking Code (e.g. SGC-...)</p>

        <div className="track-input-row">
          <input
            type="text"
            id="track-inp"
            aria-label="Order ID or tracking code"
            placeholder="SGC-260319-1234 or #ORD-..."
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') doTrack() }}
          />
          <button className="btn-search" id="btn-search" type="button" onClick={doTrack} disabled={busy}>
            <i className="fa fa-magnifying-glass" /> {busy ? '…' : 'Search'}
          </button>
        </div>

        <p className="track-err" id="track-err" role="alert">
          {err}
        </p>

        {res && (
          <div className="track-result" id="track-result">
            <div className="status-bar">
              <div className="sl">Current Status</div>
              <div className="status-chip" id="tr-status-chip">{res.status ?? 'Processing'}</div>
            </div>

            <div className="steps" id="tr-steps">
              {STEP_ICONS.map((s, i) => {
                const active = i <= curIdx
                return (
                  <div key={s.id} className={active ? 'step on' : 'step'} id={s.id}>
                    <div className="step-dot"><i className={`fa ${s.icon}`} /></div>
                    <div className="step-lbl">{s.label}</div>
                  </div>
                )
              })}
            </div>

            {res.status === 'Cancelled' && (
              <div style={{ marginTop: '14px', padding: '12px 16px', borderRadius: '12px', background: '#FEF2F2', border: '1px solid #FECACA', fontSize: '13px', color: '#DC2626', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa fa-ban" /> Order Cancelled
              </div>
            )}

            <div className="tr-grid">
              <div className="tr-box">
                <div className="tbl">Order Info</div>
                <p id="tr-order-info">
                  {res.orderNumber && <>Order: <strong>{res.orderNumber}</strong><br /></>}
                  {res.date && <>Date: <strong>{res.date}</strong><br /></>}
                  {res.fullName && <>{res.fullName}<br /></>}
                  {res.payment && <>Payment: <strong>{res.payment}</strong><br /></>}
                  {res.trackingCode && <>Code: <strong>{res.trackingCode}</strong></>}
                </p>
              </div>
              <div className="tr-box">
                <div className="tbl">Delivery Info</div>
                <p id="tr-delivery-info">
                  {res.address || '—'}{res.delivery ? ` (${res.delivery})` : ''}
                  {res.contact && <><br />☎ {res.contact}</>}
                </p>
              </div>
            </div>

            {res.items && (
              <div className="tr-items">
                <div className="tbl">Items Ordered</div>
                <div id="tr-items-list">{res.items}</div>
              </div>
            )}

            <div className="tr-totals">
              <div className="line"><span>Subtotal</span><span id="tr-sub">{res.subtotal ? fmt(Number(res.subtotal)) : '—'}</span></div>
              <div className="line"><span>Delivery</span><span id="tr-del">{res.deliveryCharge ? fmt(Number(res.deliveryCharge)) : '—'}</span></div>
              <div className="grand"><span>Total</span><span id="tr-tot">{res.total ? fmt(Number(res.total)) : '—'}</span></div>
            </div>
          </div>
        )}

        <button className="btn-close-track" type="button" onClick={closeTrack}>Close</button>
      </div>
    </div>
  )
}