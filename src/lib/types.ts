export interface Product {
  id: number
  title: string
  brand?: string
  category?: string
  size?: string
  sku?: string
  price?: number
  offerPrice?: number
  displayPrice?: number
  oldPrice?: number
  hasDiscount?: boolean
  inStock?: boolean
  stockQty?: number
  imageUrl?: string
  description?: string
}

export interface SiteConfig {
  siteTitle?: string
  totalProducts?: number
  currencySymbol?: string
  happyOrders?: number | string
  insideDhakaCharge?: number | string
  outsideDhakaCharge?: number | string
  whatsAppNumber?: string
  whatsappNumber?: string
  bKashNumber?: string
  nagadNumber?: string
  offers?: Array<Record<string, unknown>>
}

export interface GalleryItem {
  imageUrl: string
  title?: string
}

export interface Offer {
  title?: string
  eyebrow?: string
  description?: string
  imageUrl?: string
  cta?: string
  [key: string]: unknown
}

export interface ShopData {
  products: Product[]
  config: SiteConfig
  offers: Offer[] | null
}

export interface OrderResult {
  orderNumber: string
  trackingCode: string
  emailSent?: boolean
}

export interface TrackResult {
  status?: string
  orderID?: string
  orderDate?: string
  customerName?: string
  contactNumber?: string
  address?: string
  deliveryLocation?: string
  service?: string
  transaction?: string
  quantity?: string | number
  total?: string | number
  products?: string
  trackingCode?: string
  [key: string]: unknown
}