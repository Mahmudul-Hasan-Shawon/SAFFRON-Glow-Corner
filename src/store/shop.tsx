import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode,
} from 'react'
import {
  CART_KEY, loadShopData, fetchProductsRefresh, submitOrder,
} from '../lib/api'
import { getImg, maxQty, productPrice } from '../lib/format'
import type { Offer, OrderResult, Product, SiteConfig } from '../lib/types'

export interface CartItem {
  id: number
  title: string
  brand?: string
  size?: string
  sku?: string
  oldPrice?: number
  offerPrice: number
  hasDiscount?: boolean
  imageUrl: string
  qty: number
}

export interface CheckoutPayload {
  firstname: string
  lastname: string
  contactnumber: string
  address: string
  delivery_location: string
  services: string
  account_number: string
  transaction_id: string
}

export interface LastOrder {
  orderNumber: string
  trackingCode: string
  emailSent?: boolean
  fullname: string
  contactnumber: string
  address: string
  delivery_location: string
  services: string
  account_number: string
  transaction_id: string
  sub: number
  del: number
  tot: number
  snap: CartItem[]
}

interface ToastState { msg: string; err?: boolean }

interface ShopContextValue {
  loadStatus: 'idle' | 'loading' | 'ready' | 'error'
  products: Product[]
  config: SiteConfig
  offers: Offer[] | null
  retry: () => void

  activeCat: string
  setActiveCat: (c: string) => void
  search: string
  setSearch: (s: string) => void
  clearFilter: () => void

  productId: number | null
  openProduct: (id: number) => void
  closeProduct: () => void

  cart: CartItem[]
  addToCart: (id: number, qty?: number) => void
  changeQty: (id: number, d: number) => void
  removeItem: (id: number) => void
  cartCount: number
  cartOpen: boolean
  setCartOpen: (v: boolean) => void

  panelMode: 'brand' | 'category' | null
  openPanel: (mode: 'brand' | 'category') => void
  closePanel: () => void

  checkoutOpen: boolean
  openCheckout: () => void
  closeCheckout: () => void
  trackOpen: boolean
  trackPrefill: string
  openTrack: (prefill?: string) => void
  closeTrack: () => void
  successOpen: boolean
  closeSuccess: () => void
  invoiceOpen: boolean
  setInvoiceOpen: (v: boolean) => void

  lastOrder: LastOrder | null
  placeOrder: (payload: CheckoutPayload) => Promise<OrderResult>

  toast: ToastState | null
  refresh: () => void
}

const ShopContext = createContext<ShopContextValue | null>(null)

function readCart(): CartItem[] {
  try { const d = JSON.parse(localStorage.getItem(CART_KEY) ?? '[]'); return Array.isArray(d) ? d : [] } catch { return [] }
}
function saveCart(cart: CartItem[]) {
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)) } catch { /* storage unavailable */ }
}

export function ShopProvider({ children }: { children: ReactNode }) {
  const [loadStatus, setLoadStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [products, setProducts] = useState<Product[]>([])
  const [config, setConfig] = useState<SiteConfig>({ totalProducts: 13 })
  const [offers, setOffers] = useState<Offer[] | null>(null)

  const [activeCat, setActiveCatState] = useState('All')
  const [search, setSearch] = useState('')
  const [productId, setProductId] = useState<number | null>(null)

  const [cart, setCart] = useState<CartItem[]>(readCart)
  const [cartOpen, setCartOpen] = useState(false)
  const [panelMode, setPanelMode] = useState<'brand' | 'category' | null>(null)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [trackOpen, setTrackOpen] = useState(false)
  const [trackPrefill, setTrackPrefill] = useState('')
  const [successOpen, setSuccessOpen] = useState(false)
  const [invoiceOpen, setInvoiceOpen] = useState(false)
  const [lastOrder, setLastOrder] = useState<LastOrder | null>(null)
  const [toast, setToast] = useState<ToastState | null>(null)
  const toastTimer = useRef<number | null>(null)
  const busy = useRef(false)

  const showToast = useCallback((msg: string, err?: boolean) => {
    setToast({ msg, err })
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 3200)
  }, [])

  /* ── Data load ─────────────────────────────────────────── */
  const applyData = useCallback((prods: Product[], cfg: SiteConfig, off: Offer[] | null) => {
    const list = prods ?? []
    const c = { totalProducts: 13, ...(cfg ?? {}) }
    if (!c.totalProducts || c.totalProducts < 1) c.totalProducts = 13
    setProducts(list)
    setConfig(c)
    setOffers(off !== undefined ? off : null)
    setLoadStatus('ready')
  }, [])

  const load = useCallback(() => {
    setLoadStatus('loading')
    loadShopData()
      .then((d) => applyData(d.products, d.config, d.offers))
      .catch(() => setLoadStatus('error'))
  }, [applyData])

  useEffect(() => { load() }, [load])

  const retry = useCallback(() => { load() }, [load])

  /* Silent refresh so stock reflects a just-placed order. */
  const refresh = useCallback(() => {
    fetchProductsRefresh()
      .then((d) => { if (Array.isArray(d)) setProducts(d) })
      .catch(() => undefined)
  }, [])

  /* Reconcile cart against fresh product data. */
  useEffect(() => {
    if (!cart.length || !products.length) return
    const byId = new Map(products.map((p) => [p.id, p]))
    let changed = false
    let removed = 0
    const next: CartItem[] = []
    cart.forEach((i) => {
      const p = byId.get(i.id)
      if (!p || !p.inStock) { removed++; changed = true; return }
      const price = productPrice(p)
      const row: CartItem = {
        ...i,
        title: p.title ?? i.title,
        brand: p.brand,
        size: p.size,
        sku: p.sku,
        oldPrice: p.oldPrice,
        hasDiscount: p.hasDiscount,
        imageUrl: getImg(p),
      }
      if (row.offerPrice !== price) { row.offerPrice = price; changed = true }
      if (row.qty > maxQty(p)) { row.qty = maxQty(p); changed = true }
      next.push(row)
    })
    if (!changed && next.length === cart.length) return
    setCart(next)
    saveCart(next)
    if (removed) showToast('Your bag was updated to match current stock', true)
  }, [products]) // eslint-disable-line react-hooks/exhaustive-deps

  const setActiveCat = useCallback((c: string) => setActiveCatState(c), [])
  const clearFilter = useCallback(() => { setSearch(''); setActiveCat('All') }, [setActiveCat])

  const openProduct = useCallback((id: number) => {
    setProductId(id)
    window.scrollTo({ top: 0 })
  }, [])
  const closeProduct = useCallback(() => setProductId(null), [])

  /* ── Cart ops ──────────────────────────────────────────── */
  const addToCart = useCallback((id: number, qty = 1) => {
    const p = products.find((x) => x.id === id)
    if (!p || !p.inStock) return
    setCart((prev) => {
      const hit = prev.find((i) => i.id === id)
      const cap = maxQty(p)
      const next = hit
        ? prev.map((i) => (i.id === id ? { ...i, qty: Math.min(i.qty + qty, cap) } : i))
        : [...prev, { id, title: p.title, brand: p.brand, size: p.size, sku: p.sku, oldPrice: p.oldPrice, offerPrice: productPrice(p), hasDiscount: p.hasDiscount, imageUrl: getImg(p), qty: Math.min(qty, cap) }]
      saveCart(next)
      return next
    })
    showToast('Added to your bag')
  }, [products, showToast])

  const changeQty = useCallback((id: number, d: number) => {
    setCart((prev) => {
      const next = prev
        .map((i) => {
          if (i.id !== id) return i
          const q = i.qty + d
          if (q <= 0) return null
          const p = products.find((x) => x.id === id)
          return { ...i, qty: Math.min(q, p ? maxQty(p) : 99) }
        })
        .filter((x): x is CartItem => !!x)
      saveCart(next)
      return next
    })
  }, [products])

  const removeItem = useCallback((id: number) => {
    setCart((prev) => {
      const next = prev.filter((i) => i.id !== id)
      saveCart(next)
      return next
    })
  }, [])

  const cartCount = useMemo(() => cart.reduce((n, i) => n + i.qty, 0), [cart])

  /* ── Overlays ──────────────────────────────────────────── */
  const openPanel = useCallback((mode: 'brand' | 'category') => setPanelMode(mode), [])
  const closePanel = useCallback(() => setPanelMode(null), [])

  const openCheckout = useCallback(() => { setCartOpen(false); setCheckoutOpen(true) }, [])
  const closeCheckout = useCallback(() => setCheckoutOpen(false), [])
  const openTrack = useCallback((prefill?: string) => {
    setTrackPrefill(typeof prefill === 'string' ? prefill : '')
    setTrackOpen(true)
  }, [])
  const closeTrack = useCallback(() => setTrackOpen(false), [])
  const closeSuccess = useCallback(() => setSuccessOpen(false), [])

  /* ── Order placement (mirrors the vanilla payload) ─────── */
  const placeOrder = useCallback(async (payload: CheckoutPayload): Promise<OrderResult> => {
    if (busy.current) throw new Error('busy')
    if (!cart.length) { showToast('Your bag is empty', true); throw new Error('Your bag is empty.') }
    busy.current = true
    try {
      const totalProds = Math.max(config.totalProducts ?? 13, ...cart.map((i) => i.id), 13)
      const t = cart.reduce((acc, i) => ({ ...acc, sub: acc.sub + i.offerPrice * i.qty }), { sub: 0, del: 0, tot: 0 })
      t.del = payload.delivery_location === 'inside'
        ? (Number(config.insideDhakaCharge) || 60)
        : (Number(config.outsideDhakaCharge) || 120)
      t.tot = t.sub + t.del

      const qtyArr: number[] = new Array(totalProds).fill(0)
      let totalItems = 0
      const fullname = `${payload.firstname} ${payload.lastname}`.trim()
      cart.forEach((i) => {
        if (i.id >= 1 && i.id <= totalProds) qtyArr[i.id - 1] = i.qty
        totalItems += i.qty
      })

      const body = {
        action: 'submitOrder',
        firstname: payload.firstname,
        lastname: payload.lastname,
        fullname,
        contactnumber: payload.contactnumber,
        address: payload.address,
        delivery_location: payload.delivery_location,
        services: payload.services,
        account_number: payload.account_number,
        transaction_id: payload.transaction_id,
        subtotal: cart.map((i) => `${i.title} - ${i.offerPrice}`).join(', '),
        subtotalNum: t.sub,
        deliveryNum: t.del,
        totalNum: t.tot,
        calcTotal: t.tot,
        products: cart.map((i, x) => `${x + 1}. ${i.title} - ${i.offerPrice}`).join(', '),
        quantities: cart.map((i) => `Q-${i.qty}`),
        quantitiesArray: qtyArr,
        totalItems,
        offerSubtotal: t.sub,
      }

      const d = await submitOrder(body)
      const snap = cart.slice()
      setLastOrder({
        orderNumber: d.orderNumber,
        trackingCode: d.trackingCode,
        emailSent: d.emailSent,
        fullname,
        contactnumber: payload.contactnumber,
        address: payload.address,
        delivery_location: payload.delivery_location,
        services: payload.services,
        account_number: payload.account_number,
        transaction_id: payload.transaction_id,
        sub: t.sub,
        del: t.del,
        tot: t.tot,
        snap,
      })
      setCart([])
      saveCart([])
      setCheckoutOpen(false)
      setSuccessOpen(true)
      refresh()
      return d
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not place order.'
      showToast(`${msg} If this keeps happening, message us on WhatsApp.`, true)
      throw e
    } finally {
      busy.current = false
    }
  }, [cart, config, refresh, showToast])

  useEffect(() => () => { if (toastTimer.current) window.clearTimeout(toastTimer.current) }, [])

  const value = useMemo<ShopContextValue>(() => ({
    loadStatus, products, config, offers, retry,
    activeCat, setActiveCat, search, setSearch, clearFilter,
    productId, openProduct, closeProduct,
    cart, addToCart, changeQty, removeItem, cartCount,
    cartOpen, setCartOpen,
    panelMode, openPanel, closePanel,
    checkoutOpen, openCheckout, closeCheckout,
    trackOpen, trackPrefill, openTrack, closeTrack,
    successOpen, closeSuccess,
    invoiceOpen, setInvoiceOpen,
    lastOrder, placeOrder, toast, refresh,
  }), [
    loadStatus, products, config, offers, retry,
    activeCat, setActiveCat, search, setSearch, clearFilter,
    productId, openProduct, closeProduct,
    cart, addToCart, changeQty, removeItem, cartCount,
    cartOpen, setCartOpen,
    panelMode, openPanel, closePanel,
    checkoutOpen, openCheckout, closeCheckout,
    trackOpen, trackPrefill, openTrack, closeTrack,
    successOpen, closeSuccess,
    invoiceOpen, setInvoiceOpen,
    lastOrder, placeOrder, toast, refresh,
  ])

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>
}

export function useShop(): ShopContextValue {
  const ctx = useContext(ShopContext)
  if (!ctx) throw new Error('useShop must be used within ShopProvider')
  return ctx
}