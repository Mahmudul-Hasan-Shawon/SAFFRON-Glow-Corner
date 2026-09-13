import { useEffect } from 'react'
import { useShop } from '../../store/shop'
import { fmt } from '../../lib/format'
import { syncOverlayLock } from '../../utils/overlay'

function printInvoice() {
  document.body.classList.add('printing-invoice')
  window.print()
  document.body.classList.remove('printing-invoice')
}

export function Invoice() {
  const { invoiceOpen, setInvoiceOpen, lastOrder } = useShop()

  useEffect(() => { syncOverlayLock() }, [invoiceOpen])

  if (!invoiceOpen || !lastOrder) return null

  const snap = lastOrder.snap ?? []

  return (
    <div id="inv-veil" className="on" onClick={(e) => { if (e.target === e.currentTarget) setInvoiceOpen(false) }}>
      <div id="inv-box" role="dialog" aria-modal="true" aria-label="Invoice">
        <div id="inv-content">
          <div className="inv-hdr">
            <div className="inv-logo">✿ Saffron Glow Corner ✿</div>
            <div className="inv-tagline">Your Glow, Our Pride</div>
            <div className="inv-badge">INVOICE</div>
          </div>
          <div className="inv-grid">
            <div className="inv-box">
              <h4>Order Details</h4>
              <p id="inv-order">
                Order: <strong>{lastOrder.orderNumber}</strong><br />
                Date: <strong>{new Date().toLocaleDateString('en-BD')}</strong><br />
                Payment: <strong>{lastOrder.services}</strong><br />
                {lastOrder.account_number && <>Account: <strong>{lastOrder.account_number}</strong><br /></>}
                {lastOrder.transaction_id && <>Txn: <strong>{lastOrder.transaction_id}</strong></>}
              </p>
            </div>
            <div className="inv-box">
              <h4>Customer</h4>
              <p id="inv-cust">
                {lastOrder.fullname}<br />
                {lastOrder.contactnumber}<br />
                {lastOrder.address}<br />
                ({lastOrder.delivery_location})
              </p>
            </div>
          </div>
          <table id="inv-table">
            <thead>
              <tr>
                <th>Product</th>
                <th style={{ textAlign: 'center' }}>Qty</th>
                <th style={{ textAlign: 'right' }}>Price</th>
                <th style={{ textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody id="inv-rows">
              {snap.map((item, i) => (
                <tr key={i}>
                  <td>{item.title}</td>
                  <td style={{ textAlign: 'center' }}>{item.qty}</td>
                  <td style={{ textAlign: 'right' }}>{fmt(item.offerPrice)}</td>
                  <td style={{ textAlign: 'right' }}>{fmt(item.offerPrice * item.qty)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="inv-totals">
            <div className="inv-line"><span>Subtotal</span><span id="inv-sub">{fmt(lastOrder.sub)}</span></div>
            <div className="inv-line"><span>Delivery</span><span id="inv-del">{fmt(lastOrder.del)}</span></div>
            <div className="inv-grand"><span>Grand Total</span><span id="inv-tot">{fmt(lastOrder.tot)}</span></div>
          </div>
          <p className="inv-thanks">🌸 Thank you for shopping with Saffron Glow Corner!</p>
          <div className="inv-footer">
            <strong style={{ color: 'var(--rose-d)' }}>Saffron Glow Corner</strong>
            &nbsp;|&nbsp; glowsaffron7@gmail.com &nbsp;|&nbsp; © 2026
          </div>
        </div>
        <div className="inv-actions">
          <button className="btn-inv btn-inv-out" type="button" onClick={printInvoice}>
            <i className="fa fa-print" /> Print
          </button>
          <button className="btn-inv btn-inv-fill" type="button" onClick={() => setInvoiceOpen(false)}>
            <i className="fa fa-check" /> Done
          </button>
        </div>
      </div>
    </div>
  )
}