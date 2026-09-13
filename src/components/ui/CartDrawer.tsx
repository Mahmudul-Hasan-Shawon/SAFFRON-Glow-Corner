import { useEffect, useState } from 'react'
import { useShop } from '../../store/shop'
import { fmt } from '../../lib/format'
import { syncOverlayLock } from '../../utils/overlay'

export function CartDrawer() {
  const { cartOpen, setCartOpen, cart, changeQty, removeItem, openProduct, openCheckout, closePanel } = useShop()
  const [removing, setRemoving] = useState<number | null>(null)

  const sub = cart.reduce((n, i) => n + i.offerPrice * i.qty, 0)

  useEffect(() => {
    if (cartOpen) closePanel()
    syncOverlayLock()
  }, [cartOpen, closePanel])

  const tryRemove = (id: number) => {
    setRemoving(id)
    window.setTimeout(() => {
      removeItem(id)
      setRemoving(null)
    }, 240)
  }

  return (
    <>
      <div id="cart-veil" className={cartOpen ? 'on' : ''} onClick={() => setCartOpen(false)} />
      <aside id="cart" className={cartOpen ? 'on' : ''} aria-label="Shopping bag">
        <div className="cart-head">
          <h3>Shopping Bag</h3>
          <button className="icon-btn" type="button" aria-label="Close cart" onClick={() => setCartOpen(false)}>
            <i className="fa fa-xmark" />
          </button>
        </div>

        <div className="cart-body" id="cart-body" data-lenis-prevent>
          {cart.length === 0 && (
            <div className="cart-empty">
              <i className="fa fa-bag-shopping" />
              <p>Your bag is empty</p>
              <button className="btn-shop" type="button" onClick={() => setCartOpen(false)}>Continue Shopping</button>
            </div>
          )}
          {cart.map((i) => (
            <div key={i.id} className={removing === i.id ? 'ci removing' : 'ci'} data-id={i.id}>
              <img
                className="ci-img"
                src={i.imageUrl}
                alt={i.title}
                loading="lazy"
                onClick={() => { setCartOpen(false); openProduct(i.id) }}
              />
              <div className="ci-info">
                <p className="ci-name" onClick={() => { setCartOpen(false); openProduct(i.id) }}>{i.title}</p>
                {i.size && <p className="ci-size">{i.size}</p>}
                <p>
                  <span className="ci-price">{fmt(i.offerPrice)}</span>
                  {i.hasDiscount && <span className="ci-price-old">{fmt(i.oldPrice)}</span>}
                </p>
                <div className="ci-row">
                  <button className="q-btn" type="button" aria-label="Decrease quantity" onClick={() => changeQty(i.id, -1)}>−</button>
                  <span className="q-n">{i.qty}</span>
                  <button className="q-btn" type="button" aria-label="Increase quantity" onClick={() => changeQty(i.id, 1)}>+</button>
                  <button className="ci-rm" type="button" onClick={() => tryRemove(i.id)}>Remove</button>
                </div>
              </div>
              <span className="ci-tot">{fmt(i.offerPrice * i.qty)}</span>
            </div>
          ))}
        </div>

        {cart.length > 0 && (
          <div className="cart-foot" id="cart-foot">
            <div className="cart-line"><span>Subtotal</span><span id="cf-sub">{fmt(sub)}</span></div>
            <div className="cart-line"><span>Delivery</span><span id="cf-del">Calculated at checkout</span></div>
            <div className="cart-line big"><span>Total</span><span id="cf-tot">{fmt(sub)}</span></div>
            <button className="btn-checkout" type="button" onClick={openCheckout}>
              <i className="fa fa-lock" /> Secure Checkout
            </button>
          </div>
        )}
      </aside>
    </>
  )
}