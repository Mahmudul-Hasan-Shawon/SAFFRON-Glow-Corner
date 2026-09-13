import { X, Minus, Plus, Trash2, Lock } from 'lucide-react'
import { useEffect } from 'react'
import { useShop } from '../../store/shop'
import { fmt } from '../../lib/format'
import { cn } from '../../utils/cn'
import { getLenis } from '../../utils/lenis'

export function CartDrawer() {
  const { cartOpen, setCartOpen, cart, changeQty, removeItem, openCheckout, openProduct } = useShop()

  const sub = cart.reduce((n, i) => n + i.offerPrice * i.qty, 0)

  useEffect(() => {
    if (cartOpen) getLenis()?.stop()
    else getLenis()?.start()
  }, [cartOpen])

  if (!cartOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/45" onClick={() => setCartOpen(false)} />
      <aside
        aria-label="Shopping bag"
        className="fixed right-0 top-0 z-[70] flex h-full w-full max-w-md flex-col bg-chalk shadow-2xl dd-in"
      >
        <div className="flex items-center justify-between border-b border-bdr px-5 py-4">
          <h3 className="text-lg font-bold text-ink">Shopping Bag</h3>
          <button type="button" aria-label="Close cart" onClick={() => setCartOpen(false)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate transition-colors hover:bg-rose-s hover:text-rose-d">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4" data-lenis-prevent>
          {cart.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="text-5xl">🛍️</p>
              <p className="mt-4 font-semibold text-ink">Your bag is empty</p>
              <p className="mt-1 text-sm text-slate">Add some glow to get started.</p>
            </div>
          )}
          {cart.map((i) => (
            <div key={i.id} className="flex gap-3 rounded-2xl border border-bdr bg-white p-3">
              <img
                src={i.imageUrl}
                alt=""
                loading="lazy"
                className="h-20 w-20 shrink-0 cursor-pointer rounded-xl object-cover"
                onClick={() => { setCartOpen(false); openProduct(i.id) }}
              />
              <div className="min-w-0 flex-1">
                <p onClick={() => { setCartOpen(false); openProduct(i.id) }}
                  className="cursor-pointer truncate text-sm font-bold text-ink hover:text-rose-d">{i.title}</p>
                <p className="mt-0.5 text-xs text-slate">{i.brand || '—'}</p>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1 rounded-full border border-bdr">
                    <button type="button" aria-label="Decrease quantity" onClick={() => changeQty(i.id, -1)}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-ink transition-colors hover:bg-rose-s hover:text-rose-d">
                      <Minus size={12} />
                    </button>
                    <span className="w-6 text-center text-sm font-bold">{i.qty}</span>
                    <button type="button" aria-label="Increase quantity" onClick={() => changeQty(i.id, 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-ink transition-colors hover:bg-rose-s hover:text-rose-d">
                      <Plus size={12} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn('text-sm font-bold', i.hasDiscount ? 'text-rose-d' : 'text-ink')}>
                      {fmt(i.offerPrice)}
                    </span>
                    <button type="button" aria-label="Remove item" onClick={() => removeItem(i.id)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate transition-colors hover:bg-red-l hover:text-red">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {cart.length > 0 && (
          <div className="border-t border-bdr bg-white px-5 py-4">
            <div className="flex items-center justify-between text-sm text-slate">
              <span>Subtotal</span>
              <span className="font-bold text-ink">{fmt(sub)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-slate">
              <span>Delivery</span>
              <span>Calculated at checkout</span>
            </div>
            <button type="button" onClick={openCheckout}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-rose-d py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-rose">
              <Lock size={14} /> Secure Checkout
            </button>
          </div>
        )}
      </aside>
    </>
  )
}