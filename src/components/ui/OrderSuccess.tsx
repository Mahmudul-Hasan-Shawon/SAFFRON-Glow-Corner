import { useEffect, useRef } from 'react'
import { useShop } from '../../store/shop'
import { syncOverlayLock } from '../../utils/overlay'
import { confetti } from '../../utils/feedback'

export function OrderSuccess({ onTrack }: { onTrack: (code?: string) => void }) {
  const { successOpen, closeSuccess, lastOrder } = useShop()
  const fired = useRef(false)

  useEffect(() => {
    if (successOpen && !fired.current) { confetti(); fired.current = true }
    if (!successOpen) fired.current = false
    syncOverlayLock()
  }, [successOpen])

  if (!successOpen) return null

  return (
    <div id="success-veil" className="on">
      <div id="success-box" role="dialog" aria-modal="true" aria-label="Order placed">
        <div className="success-icon"><i className="fa fa-check" /></div>
        <h2 className="success-title">Order Placed!</h2>
        <p className="success-sub">
          Your order has been received. Save your tracking code to check delivery status anytime.
        </p>

        {lastOrder?.emailSent === false && (
          <p className="success-note" id="succ-note">
            Your order is saved, but our confirmation email didn't go out. Please keep your tracking code and message us
            on WhatsApp to confirm.
          </p>
        )}

        <div className="order-id-box">
          <div className="order-id-lbl">Order ID</div>
          <div className="order-id-val" id="succ-order-id">{lastOrder?.orderNumber ?? '—'}</div>
        </div>

        <div className="tracking-box">
          <div className="tracking-lbl">Your Tracking Code</div>
          <div className="tracking-val" id="succ-tracking">{lastOrder?.trackingCode ?? '—'}</div>
          <div className="tracking-hint">Use this code to track your shipment</div>
        </div>

        <button className="btn-track-order" type="button"
          onClick={() => { closeSuccess(); onTrack(lastOrder?.trackingCode) }}>
          <i className="fa fa-location-dot" /> Track My Order
        </button>

        <button className="btn-done" type="button" onClick={closeSuccess}>
          <i className="fa fa-check" /> Done
        </button>
      </div>
    </div>
  )
}