import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { PageHero } from '../components/ui/PageHero'
import { useShop } from '../store/shop'
import { trackOrder } from '../lib/api'
import { statusOrder } from '../data/site'
import { fmt } from '../lib/format'
import type { Product, TrackResult } from '../lib/types'

interface PageProps { onNavigate: (href: string) => void }

function normalize(s: string | undefined): string {
  return String(s ?? '').trim().toLowerCase().replace(/\s+/g, '')
}

function isFoundOrder(d: TrackResult): boolean {
  if (d.found === true) return true
  if (d.found === false) return false
  return !!(d.shippingStatus || d.status || d.orderNumber)
}

/** Pull the positional quantity string ("Q-2, Q-1" / "2, 1") from any field
 *  shape the backend might have returned. */
function qtyOf(d: TrackResult | null): unknown {
  if (!d) return ''
  const r = d as TrackResult & Record<string, unknown>
  return r.quantities ?? r['Qty by Product'] ?? r.qtyByProduct ?? r.quantitiesArray ?? ''
}

function statusOf(d: TrackResult | null): string {
  return String(d?.shippingStatus ?? d?.status ?? 'Processing')
}

function statusKey(d: TrackResult | null): string {
  const k = normalize(statusOf(d))
  if (k === 'canceled') return 'cancelled'
  return k || 'processing'
}

/** Strip currency symbols / "Tk" / "BDT" and pull the last number from a string. */
function extractNum(raw: unknown): number | null {
  if (raw === undefined || raw === null || raw === '') return null
  if (typeof raw === 'number' && !Number.isNaN(raw)) return raw
  const s = String(raw).replace(/[৳$,]/g, '').replace(/\b(?:tk|bdt)\b/gi, '').trim()
  if (!s) return null
  const n = Number(s)
  if (!Number.isNaN(n) && n >= 0) return n
  const m = s.match(/(\d[\d.]*)\s*$/)
  if (m) { const p = Number(m[1]); if (!Number.isNaN(p) && p >= 0) return p }
  return null
}

/** Parse an item line like "1. Rice Water Cleanser - 749" (also handles
 *  "৳749" and "749 Tk" suffixes) → { name, price }. */
function parseItem(raw: string): { name: string; price: number } {
  const stripped = raw.trim().replace(/^\d+\.\s*/, '').trim()
  const m = stripped.match(/^(.*?)\s*[-–—]\s*(?:[৳$]\s*)?(\d[\d.,]*)\s*(?:tk|bdt)?\s*$/i)
  if (m) {
    const price = Number(m[2].replace(/,/g, ''))
    if (!Number.isNaN(price) && price >= 0) return { name: m[1].trim(), price }
  }
  return { name: stripped, price: 0 }
}

interface ItemRow { name: string; size: string; qty: number; base: number; subtotal: number }

/**
 * Group item lines into rows, resolving each against the catalogue so that
 * same-named products with different sizes keep separate rows.
 * Backend format: items = "1. Name - 749, 2. Name - 949"
 *                 quantities = "Q-2, Q-1"  (positional, optional)
 * qty comes from quantities when present, else defaults to 1 per line.
 * A row is keyed by name + size + order-price, so two sizes of the same
 * product split into their own lines with their own subtotal.
 * lookup(name, price) returns the catalogue { size, base } when a product
 * matches, otherwise the line's own price is used as the base price.
 */
function groupItems(raw: unknown, qtyStr?: unknown, lookup?: (name: string, price: number) => { size?: string; base: number } | null): ItemRow[] {
  const items = String(raw ?? '').split(',')
  const qtys = String(qtyStr ?? '')
    .split(',')
    .map((s) => {
      const m = s.trim().match(/Q?-(\d+)/i) || s.trim().match(/(\d+)/)
      return m ? parseInt(m[1], 10) : 1
    })

  const rows: ItemRow[] = []
  const keyIdx = new Map<string, number>()
  items.forEach((it, i) => {
    const x = it.trim()
    if (!x) return
    const { name, price } = parseItem(x)
    if (!name) return
    const q = qtys[i] ?? 1
    const hit = lookup ? lookup(name, price) : null
    const size = (hit?.size ?? '').trim()
    const base = hit && hit.base > 0 ? hit.base : price
    const key = `${name}\u0001${size}\u0001${price}`
    let ri = keyIdx.get(key)
    if (ri === undefined) {
      ri = rows.length
      keyIdx.set(key, ri)
      rows.push({ name, size, qty: 0, base: base || price, subtotal: 0 })
    }
    const row = rows[ri]
    row.qty += q
    row.subtotal += price * q
  })
  return rows
}

/** Per-status accent (value + soft tint) drives the whole colour story. */
const ACCENTS: Record<string, { acc: string; soft: string }> = {
  processing: { acc: '#F59E0B', soft: '#FEF0CD' },
  confirmed: { acc: '#E11D48', soft: '#FFE2E8' },
  packed: { acc: '#8B5CF6', soft: '#EDE6FD' },
  shipped: { acc: '#0EA5E9', soft: '#DFF2FD' },
  outfordelivery: { acc: '#14B8A6', soft: '#D5F4EF' },
  delivered: { acc: '#22C55E', soft: '#DDF7E7' },
  cancelled: { acc: '#EF4444', soft: '#FEE2E2' },
}

const DEFAULT_ACCENT = { acc: '#E11D48', soft: '#FFE2E8' }

const STEP_ICONS = [
  { id: 'step-processing', icon: 'fa-clock', label: 'Processing' },
  { id: 'step-confirmed', icon: 'fa-check', label: 'Confirmed' },
  { id: 'step-packed', icon: 'fa-box', label: 'Packed' },
  { id: 'step-shipped', icon: 'fa-truck', label: 'Shipped' },
  { id: 'step-outfordelivery', icon: 'fa-motorcycle', label: 'Out for Delivery' },
  { id: 'step-delivered', icon: 'fa-house', label: 'Delivered' },
]

export function Track({ onNavigate }: PageProps) {
  const { trackPrefill, closeTrack, config, products } = useShop()

  /* Catalogue lookups so each ordered line can be back-filled with the right
     product's size and base (unit) price. Keyed by title+price first so two
     same-named products (e.g. 100ml vs 150ml) stay distinct. */
  const prodByKey = useMemo(() => {
    const m = new Map<string, Product>()
    for (const p of products) {
      if (p?.title && p.title.trim()) {
        const price = Number(p.displayPrice ?? p.offerPrice) || 0
        m.set(`${normalize(p.title)}|${price}`, p)
      }
    }
    return m
  }, [products])

  const lookup = useMemo(
    () =>
      (name: string, orderPrice: number): { size?: string; base: number } | null => {
        const p =
          prodByKey.get(`${normalize(name)}|${orderPrice}`) ||
          products.find((pr) => pr?.title && normalize(pr.title) === normalize(name))
        if (!p) return null
        return { size: p.size, base: Number(p.displayPrice ?? p.offerPrice) || 0 }
      },
    [prodByKey, products],
  )
  const [val, setVal] = useState('')
  const [res, setRes] = useState<TrackResult | null>(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  /* When arriving from the order-success screen a prefill code is waiting;
     consume it once, then clear it so a later visit starts clean. */
  useEffect(() => {
    if (!trackPrefill) return
    setErr('')
    setVal(trackPrefill)
    trackOrder(trackPrefill)
      .then((d) => { if (isFoundOrder(d)) setRes(d); else setErr(d.error || 'Order not found.') })
      .catch(() => setErr('Order not found.'))
    closeTrack()
  }, [trackPrefill, closeTrack])

  const doTrack = async () => {
    setErr('')
    if (!val.trim()) { setErr('Please enter an Order ID or tracking code.'); return }
    setBusy(true)
    try {
      const d = await trackOrder(val.trim())
      if (!isFoundOrder(d)) throw new Error(d.error || 'Order not found.')
      setRes(d)
    } catch (e) {
      setRes(null)
      setErr(e instanceof Error ? e.message : 'Order not found. Check the code and try again.')
    } finally { setBusy(false) }
  }

  const key = statusKey(res)
  const curIdx = res
    ? statusOrder.findIndex((s) => normalize(s) === normalize(statusOf(res)))
    : -1
  const cancelled = key === 'cancelled'
  const accent = ACCENTS[key] ?? DEFAULT_ACCENT
  const themeStyle: CSSProperties = {
    '--tr-acc': accent.acc,
    '--tr-acc-soft': accent.soft,
  } as CSSProperties

  return (
    <div>
      <PageHero
        crumbs="Track Order"
        eyebrow={<><i className="fa-solid fa-truck-fast" /> Follow Your Order</>}
        title={<>Track Your <em>Order</em></>}
        sub="Enter your Order ID or Tracking Code to follow your parcel from our shelf to your doorstep."
        onNavigate={onNavigate}
      />

      <div className="tr-page">
        <section className={`tr-search${res ? ' compact' : ''}`}>
          <div className="tr-search-icon"><i className="fa fa-truck-fast" /></div>
          <div className="tr-search-txt">
            <h2 className="tr-search-title">Track Your Order</h2>
            <p className="tr-p">Enter your Order ID or Tracking Code to follow your parcel from our shelf to your doorstep.</p>
          </div>
          <div className="tr-search-box">
            <i className="fa fa-magnifying-glass tr-search-ico" />
            <input
              type="text"
              id="track-inp"
              aria-label="Order ID or tracking code"
              placeholder="SGC-260319-1234 or #ORD-..."
              value={val}
              onChange={(e) => setVal(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') doTrack() }}
            />
            <button className="tr-search-btn" id="btn-search" type="button" onClick={doTrack} disabled={busy}>
              {busy ? <i className="fa fa-circle-notch fa-spin" /> : <i className="fa fa-magnifying-glass" />} Search
            </button>
          </div>
          <p className={`tr-err${err ? ' on' : ''}`} id="track-err" role="alert">{err}</p>
        </section>

        {res && (
          <section className="tr-result" id="track-result" style={themeStyle}>
            {cancelled ? (
              <div className="tr-cancelled" id="tr-steps"><i className="fa fa-ban" /> This order has been cancelled</div>
            ) : (
              <div className="steps" id="tr-steps">
                {STEP_ICONS.map((s, i) => {
                  const isDone = i < curIdx
                  const isActive = i === curIdx
                  const dotClass = isDone ? 'step-dot done' : isActive ? 'step-dot active' : 'step-dot'
                  const lblClass = isDone ? 'step-lbl done' : isActive ? 'step-lbl active' : 'step-lbl'
                  const wrapClass = (isDone || isActive) ? 'step on' : 'step'
                  return (
                    <div key={s.id} className={wrapClass} id={s.id}>
                      <div className={dotClass}><i className={`fa ${s.icon}`} /></div>
                      <div className={lblClass}>{s.label}</div>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="tr-cards">
              <div className="tr-card">
                <div className="tr-ct"><i className="fa fa-box-open" /> Order Info</div>
                <dl className="tr-kv" id="tr-order-info">
                  {res.fullName && <div className="tr-kv-row"><dt>Name</dt><dd>{res.fullName}</dd></div>}
                  {res.orderNumber && <div className="tr-kv-row"><dt>Order</dt><dd>{res.orderNumber}</dd></div>}
                  {res.payment && <div className="tr-kv-row"><dt>Payment</dt><dd>{res.payment}</dd></div>}
                  {res.trackingCode && <div className="tr-kv-row"><dt>Tracking</dt><dd>{res.trackingCode}</dd></div>}
                </dl>
              </div>
              <div className="tr-card">
                <div className="tr-ct"><i className="fa fa-location-dot" /> Delivery Info</div>
                <dl className="tr-kv" id="tr-delivery-info">
                  {res.address && <div className="tr-kv-row"><dt>Address</dt><dd>{res.address}</dd></div>}
                  {res.delivery && <div className="tr-kv-row"><dt>Zone</dt><dd>{res.delivery}</dd></div>}
                  {res.contact && <div className="tr-kv-row"><dt>Contact</dt><dd>{res.contact}</dd></div>}
                </dl>
              </div>
            </div>

            {(() => {
              const rows = groupItems(res?.items, qtyOf(res), lookup)
              if (!rows.length) return null
              return (
                <div className="tr-card tr-items-card">
                  <div className="tr-ct"><i className="fa fa-bag-shopping" /> Items Ordered</div>
                  <ul className="tr-items-list" id="tr-items-list">
                    {rows.map((r, i) => (
                      <li key={i}>
                        <span className="tr-item-qty">{r.qty}×</span>
                        <span className="tr-item-name">
                          {r.name}
                          {r.size && <em className="tr-item-size">{r.size}</em>}
                        </span>
                        {r.base > 0 && <span className="tr-item-price">{fmt(r.base)}</span>}
                        <strong className="tr-item-sub">{fmt(r.subtotal)}</strong>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })()}

            {(() => {
              const itemsSum = groupItems(res?.items, qtyOf(res), lookup).reduce((acc, r) => acc + r.subtotal, 0)

              const subNum = itemsSum || (
                extractNum(
                  res?.subtotal ?? res?.subtotalNum ?? res?.offerSubtotal ??
                  res?.subTotal ?? res?.['Sub Total'] ?? res?.orderSubtotal
                ) ?? 0
              )

              const backendDel = extractNum(
                res?.deliveryCharge ?? res?.deliveryNum ?? res?.deliveryFee ??
                res?.['Delivery Charge'] ?? res?.shipping ?? res?.shippingCharge
              )

              const zone = normalize(String(res?.delivery ?? res?.deliveryLocation ?? ''))
              const isInside = zone.includes('inside')
              const isOutside = zone.includes('outside')
              const cfgDel = isInside
                ? (Number(config.insideDhakaCharge) || 60)
                : isOutside
                  ? (Number(config.outsideDhakaCharge) || 120)
                  : 0
              const delNum = backendDel ?? cfgDel

              const backendTot = extractNum(
                res?.total ?? res?.totalNum ?? res?.calcTotal ??
                res?.grandTotal ?? res?.['Grand Total'] ?? res?.amount
              )
              const totNum = backendTot ?? subNum + delNum

              return (
                <div className="tr-card tr-totals">
                  <div className="tr-total-row"><span>Subtotal</span><strong id="tr-sub">{subNum ? fmt(subNum) : '—'}</strong></div>
                  <div className="tr-total-row"><span>Delivery</span><strong id="tr-del">{delNum ? fmt(delNum) : '—'}</strong></div>
                  <div className="tr-total-row total"><span>Total</span><strong className="tr-grand" id="tr-tot">{totNum ? fmt(totNum) : '—'}</strong></div>
                </div>
              )
            })()}
          </section>
        )}
      </div>
    </div>
  )
}