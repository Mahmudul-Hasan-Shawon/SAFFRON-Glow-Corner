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
  stockStatus?: string
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
  bKashAccount?: string
  bkashAccount?: string
  nagadAccount?: string
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
  found?: boolean
  error?: string
  status?: string
  orderID?: string
  orderNumber?: string
  date?: string
  payment?: string
  trackingCode?: string
  shippingStatus?: string
  fullName?: string
  contact?: string
  address?: string
  delivery?: string
  items?: string
  subtotal?: string | number
  deliveryCharge?: string | number
  total?: string | number
  customerName?: string
  contactNumber?: string
  deliveryLocation?: string
  service?: string
  transaction?: string
  quantity?: string | number
  products?: string
  [key: string]: unknown
}