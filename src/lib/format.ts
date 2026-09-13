import type { Product } from './types'

/* Fallback images by product keyword so cards always have art. */
const IMGS: Record<string, string> = {
  d: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&auto=format',
  s: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&auto=format',
  c: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab12?w=500&auto=format',
  cl: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=500&auto=format',
  t: 'https://images.unsplash.com/photo-1570194065650-d99fb4b8ccb0?w=500&auto=format',
  sun: 'https://images.unsplash.com/photo-1556228852-6d35a585d566?w=500&auto=format',
  bb: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500&auto=format',
}

export const CURRENCY_SYMBOL = '৳'

export function money(n: number | null | undefined): string {
  const v = Math.round(Number(n) || 0)
  return v.toLocaleString('en-US')
}

export function fmt(n: number | null | undefined, symbol: string = CURRENCY_SYMBOL): string {
  return symbol + money(n)
}

export function getImg(p: Product): string {
  if (p.imageUrl && p.imageUrl.indexOf('http') === 0) return p.imageUrl
  const t = `${p.title} ${p.category}`.toLowerCase()
  if (t.indexOf('serum') !== -1) return IMGS.s
  if (t.indexOf('cream') !== -1) return IMGS.c
  if (t.indexOf('cleanser') !== -1) return IMGS.cl
  if (t.indexOf('toner') !== -1) return IMGS.t
  if (t.indexOf('sunscreen') !== -1 || t.indexOf('sunblock') !== -1) return IMGS.sun
  if (t.indexOf('bb') !== -1 || t.indexOf('boomer') !== -1) return IMGS.bb
  if (t.indexOf('essence') !== -1) return IMGS.s
  return IMGS.d
}

export function maxQty(p: Product): number {
  return p && typeof p.stockQty === 'number' && p.stockQty > 0 ? p.stockQty : 99
}

export function productPrice(p: Product): number {
  return Number(p.displayPrice ?? p.offerPrice ?? p.oldPrice ?? 0) || 0
}

export function discountPct(p: Product): number {
  const old = Number(p.oldPrice) || 0
  const cur = productPrice(p)
  if (old > cur && cur > 0) return Math.round(((old - cur) / old) * 100)
  return 0
}

export function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function jsStr(s: string): string {
  return String(s ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

export function trunc(s: unknown, n: number): string {
  const t = String(s ?? '')
  return t.length > n ? t.slice(0, n - 1) + '…' : t
}