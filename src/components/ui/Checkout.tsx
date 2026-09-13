import { useEffect, useRef, useState } from 'react'
import { useShop, type CheckoutPayload } from '../../store/shop'
import { fmt } from '../../lib/format'
import { syncOverlayLock } from '../../utils/overlay'

export function Checkout() {
  const { checkoutOpen, closeCheckout, cart, placeOrder, config } = useShop()

  const fnRef = useRef<HTMLInputElement>(null)
  const lnRef = useRef<HTMLInputElement>(null)
  const phoneRef = useRef<HTMLInputElement>(null)
  const addrRef = useRef<HTMLTextAreaElement>(null)
  const accRef = useRef<HTMLInputElement>(null)
  const txnRef = useRef<HTMLInputElement>(null)
  const errRef = useRef<HTMLParagraphElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  const [loc, setLoc] = useState('')
  const [pay, setPay] = useState('')
  const [busy, setBusy] = useState(false)
  const [sbOn, setSbOn] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)
  const thumbRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    syncOverlayLock()
  }, [checkoutOpen])

  useEffect(() => {
    setLoc('')
    setPay('')
    setBusy(false)
    setSbOn(false)
  }, [checkoutOpen])

  /* Thin auto-hiding scrollbar: thumb follows the box while it scrolls,
     fades in on scroll and fades out ~0.85s after the last one. */
  useEffect(() => {
    if (!checkoutOpen) return
    const box = boxRef.current
    const thumb = thumbRef.current
    if (!box || !thumb) return

    let raf = 0
    let idle: ReturnType<typeof setTimeout> | undefined

    const update = () => {
      const max = box.scrollHeight - box.clientHeight
      const h = Math.max(28, (box.clientHeight / box.scrollHeight) * box.clientHeight)
      thumb.style.height = `${h}px`
      thumb.style.transform = `translateY(${max > 0 ? (box.scrollTop / max) * (box.clientHeight - h) : 0}px)`
    }

    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(update)
      setSbOn(true)
      window.clearTimeout(idle)
      idle = window.setTimeout(() => setSbOn(false), 850)
    }

    update()
    box.addEventListener('scroll', onScroll, { passive: true })
    box.addEventListener('input', () => requestAnimationFrame(update), true)
    const ro = new ResizeObserver(update)
    ro.observe(box)
    Array.from(box.children).forEach((c) => ro.observe(c))

    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(idle)
      box.removeEventListener('scroll', onScroll)
      ro.disconnect()
    }
  }, [checkoutOpen])

  if (!checkoutOpen) return null

  const sub = cart.reduce((n, i) => n + i.offerPrice * i.qty, 0)
  const del = loc === 'inside'
    ? (Number(config.insideDhakaCharge) || 60)
    : loc === 'outside'
      ? (Number(config.outsideDhakaCharge) || 120)
      : 0
  const tot = sub + del
  const delLabel = loc === 'outside' ? 'Delivery (Outside)' : loc === 'inside' ? 'Delivery (Inside)' : 'Delivery'
  const needTxn = pay === 'bKash' || pay === 'Nagad'
  const bKashAccount = config.bKashAccount || config.bkashAccount || '01XXXXXXXXX'
  const nagadAccount = config.nagadAccount || '01XXXXXXXXX'
  const payAccount = pay === 'bKash' ? bKashAccount : nagadAccount

  const showErr = (msg: string) => {
    if (!errRef.current) return
    errRef.current.textContent = msg
    errRef.current.classList.add('on')
  }
  const hideErr = () => { errRef.current?.classList.remove('on') }

  const submit = async () => {
    hideErr()
    const form: CheckoutPayload = {
      firstname: fnRef.current?.value?.trim() ?? '',
      lastname: lnRef.current?.value?.trim() ?? '',
      contactnumber: phoneRef.current?.value?.trim() ?? '',
      address: addrRef.current?.value?.trim() ?? '',
      delivery_location: loc,
      services: pay,
      account_number: accRef.current?.value?.trim() ?? '',
      transaction_id: txnRef.current?.value?.trim() ?? '',
    }

    if (!cart.length) { showErr('Your bag is empty.'); return }
    if (!form.firstname || !form.lastname || !form.contactnumber || !form.address || !form.delivery_location || !form.services) {
      showErr('Please fill in all required fields.'); return
    }
    if (form.contactnumber.replace(/\D/g, '').length < 10) { showErr('Please enter a valid contact number.'); return }
    if (form.address.length < 10) { showErr('Please enter a complete delivery address.'); return }
    if (needTxn && (!form.account_number || !form.transaction_id)) {
      showErr(`Please enter your ${form.services} account number and transaction ID.`); return
    }

    setBusy(true)
    try { await placeOrder(form) } catch { /* toast already shown */ } finally { setBusy(false) }
  }

  return (
    <div id="checkout-veil" className="on" onClick={(e) => { if (e.target === e.currentTarget) closeCheckout() }}>
      <div className="co-wrap" role="dialog" aria-modal="true" aria-label="Checkout">
        <div id="checkout-box" ref={boxRef} data-lenis-prevent>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <h2 className="co-title">Checkout</h2>
          <button className="icon-btn" type="button" aria-label="Close checkout" onClick={closeCheckout}>
            <i className="fa fa-xmark" />
          </button>
        </div>
        <p className="co-sub">Complete your order below</p>

        <div className="order-mini">
          <div className="osm-line"><span>Subtotal</span><span id="co-sub">{fmt(sub)}</span></div>
          <div className="osm-line"><span id="co-del-lbl">{delLabel}</span><span id="co-del">{del ? fmt(del) : 'TBD'}</span></div>
          <div className="osm-line big"><span>Total</span><span id="co-tot">{fmt(tot)}</span></div>
        </div>

        <div className="form-row">
          <div className="form-group"><label htmlFor="co-fn">First Name *</label>
            <input type="text" id="co-fn" ref={fnRef} autoComplete="given-name" placeholder="Nusrat" /></div>
          <div className="form-group"><label htmlFor="co-ln">Last Name *</label>
            <input type="text" id="co-ln" ref={lnRef} autoComplete="family-name" placeholder="Jahan" /></div>
        </div>
        <div className="form-group"><label htmlFor="co-phone">Contact Number *</label>
          <input type="tel" id="co-phone" ref={phoneRef} inputMode="tel" autoComplete="tel" placeholder="01XXXXXXXXX" /></div>
        <div className="form-group"><label htmlFor="co-addr">Delivery Address *</label>
          <textarea id="co-addr" ref={addrRef} rows={2} autoComplete="street-address" placeholder="House No, Road, Area, City…" style={{ resize: 'none' }} /></div>
        <div className="form-group">
          <label htmlFor="co-loc">Delivery Location *</label>
          <select id="co-loc" value={loc} onChange={(e) => setLoc(e.target.value)}>
            <option value="">— Select —</option>
            <option value="inside">Inside Dhaka (Ashkona / Uttara area)</option>
            <option value="outside">Outside Dhaka</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="co-pay">Payment Method *</label>
          <select id="co-pay" value={pay} onChange={(e) => setPay(e.target.value)}>
            <option value="">— Select —</option>
            <option value="Cash On Delivery">Cash On Delivery</option>
            <option value="bKash">bKash</option>
            <option value="Nagad">Nagad</option>
          </select>
        </div>

        <div className={needTxn ? 'pay-info' : 'pay-info hidden'} id="pay-info">
          <strong id="pi-title">{pay} Payment</strong><br />
          Send to: <strong id="pi-num">{payAccount}</strong><br />
          Then fill your account number and transaction ID below.
        </div>

        <div id="txn-wrap" className={needTxn ? '' : 'hidden'}>
          <div className="form-group"><label htmlFor="co-acc">Your Mobile Account No. *</label>
            <input type="text" id="co-acc" ref={accRef} inputMode="tel" placeholder="01XXXXXXXXX" /></div>
          <div className="form-group"><label htmlFor="co-txn">Transaction ID *</label>
            <input type="text" id="co-txn" ref={txnRef} placeholder="TXN123456" /></div>
        </div>

        <p className="form-err" id="co-err" ref={errRef} role="alert" />
        <button className="btn-place" id="btn-place" type="button" ref={btnRef} disabled={busy} onClick={submit}>
          {busy ? <><i className="fa fa-spinner fa-spin" /> Placing Order…</> : <><i className="fa fa-check-circle" /> Place Order</>}
        </button>
        </div>
        <div className={sbOn ? 'co-sb on' : 'co-sb'} aria-hidden="true">
          <div className="co-sb-thumb" ref={thumbRef} />
        </div>
      </div>
    </div>
  )
}