import type { GalleryItem, Offer, OrderResult, Product, ShopData, SiteConfig, TrackResult } from './types'

/**
 * Google Apps Script Web App endpoint.
 * GET actions: getAll, getProducts, getGallery, trackOrder
 * POST action: submitOrder (no Content-Type header on purpose — keeps it a
 * "simple" request so the browser skips the CORS preflight that Apps Script
 * web apps cannot answer).
 */
export const API_URL =
  'https://script.google.com/macros/s/AKfycbz5bW2F7pmkZA78S_bhrn6x9SEt_tPf7E6RKtx7b5xhVfb41eavlAymiri7O_bD_TMT7g/exec'

export const SHOP_CACHE_KEY = 'sgc_shop_v1'
export const GALLERY_CACHE_KEY = 'sgc_gallery_v1'
export const CART_KEY = 'sgc_cart'

/* localStorage can throw (private mode, blocked storage); guard every call. */
export function lsGet(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}
export function lsSet(key: string, val: string): void {
  try { localStorage.setItem(key, val) } catch { /* storage unavailable */ }
}

/** Fetch with a timeout, no browser cache, redirects followed, JSON parsed. */
export function fetchJson<T>(url: string, opts?: RequestInit, ms?: number): Promise<T> {
  const o: RequestInit = { ...(opts ?? {}), redirect: 'follow', cache: 'no-store' }
  const timeout = ms ?? 25000
  const ctrl = 'AbortController' in window ? new AbortController() : null
  if (ctrl) o.signal = ctrl.signal
  const timer = window.setTimeout(() => ctrl?.abort(), timeout)

  return fetch(url, o)
    .then((r) => r.text())
    .then((t) => {
      clearTimeout(timer)
      let d: unknown
      try { d = JSON.parse(t) } catch { throw new Error('The server returned an unexpected response. Please try again.') }
      if (d && typeof d === 'object' && (d as { error?: unknown }).error) {
        throw new Error(String((d as { error: unknown }).error))
      }
      return d as T
    })
    .catch((e) => {
      clearTimeout(timer)
      throw e
    })
}

interface RawShopData { products?: unknown[]; config?: unknown; offers?: unknown }

/** Normalize a raw getAll payload into the shop data shape. */
function normalizeShopData(d: RawShopData): ShopData {
  return {
    products: Array.isArray(d.products) ? (d.products as Product[]) : [],
    config: (d.config && typeof d.config === 'object' ? d.config : {}) as SiteConfig,
    offers: d.offers !== undefined && d.offers !== null
      ? (Array.isArray(d.offers) ? d.offers as Offer[] : null)
      : null,
  }
}

/** localStorage cache lookups are forgiving — bad cache is treated as "no cache". */
function readCache(key: string): unknown {
  try { return JSON.parse(lsGet(key) ?? 'null') } catch { return null }
}

/**
 * Load the full shop payload (products + config + offers).
 * Serves the localStorage cache instantly when present, then revalidates
 * against the sheet in the background.
 */
export async function loadShopData(): Promise<ShopData> {
  const cached = readCache(SHOP_CACHE_KEY) as ShopData | null
  const hasCache = !!(cached && Array.isArray(cached.products) && cached.products.length)

  if (!hasCache) {
    const fresh = normalizeShopData(await fetchJson<RawShopData>(`${API_URL}?action=getAll`))
    lsSet(SHOP_CACHE_KEY, JSON.stringify(fresh))
    return fresh
  }

  // Paint cache first, then fetch fresh in the background.
  fetchJson<RawShopData>(`${API_URL}?action=getAll`)
    .then((d) => {
      const fresh = normalizeShopData(d)
      lsSet(SHOP_CACHE_KEY, JSON.stringify(fresh))
      return fresh
    })
    .catch(() => undefined)
  return cached
}

/** Product refresh after an order so stock levels stay honest. */
export async function fetchProductsRefresh(): Promise<Product[]> {
  const d = await fetchJson<Product[]>(`${API_URL}?action=getProducts`)
  return Array.isArray(d) ? d : []
}

/** Gallery images with a localStorage cache (stale-while-revalidate). */
export async function loadGallery(): Promise<GalleryItem[]> {
  const cached = readCache(GALLERY_CACHE_KEY) as GalleryItem[] | null
  const hasCache = Array.isArray(cached) && cached.length > 0
  if (!hasCache) {
    const fresh = (await fetchJson<GalleryItem[]>(`${API_URL}?action=getGallery`)).filter((g) => g && g.imageUrl)
    lsSet(GALLERY_CACHE_KEY, JSON.stringify(fresh))
    return fresh
  }
  fetchJson<GalleryItem[]>(`${API_URL}?action=getGallery`)
    .then((d) => {
      const fresh = (Array.isArray(d) ? d : []).filter((g) => g && g.imageUrl)
      if (fresh.length) {
        lsSet(GALLERY_CACHE_KEY, JSON.stringify(fresh))
        return fresh
      }
      return cached
    })
    .catch(() => undefined)
  return cached
}

/** Submit an order to the sheet. */
export async function submitOrder(payload: Record<string, unknown>): Promise<OrderResult> {
  return fetchJson<OrderResult>(API_URL, { method: 'POST', body: JSON.stringify(payload) }, 40000)
}

/** Track an order by Order ID or tracking code. */
export async function trackOrder(id: string): Promise<TrackResult> {
  return fetchJson<TrackResult>(`${API_URL}?action=trackOrder&id=${encodeURIComponent(id)}`)
}