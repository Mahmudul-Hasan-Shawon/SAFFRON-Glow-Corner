import { Hero } from '../sections/Hero'
import { Offers } from '../sections/Offers'
import { ShopGrid } from '../sections/ShopGrid'
import { ProductView } from '../sections/ProductView'
import { useShop } from '../store/shop'

interface PageProps { onNavigate: (href: string) => void }

export function Home(_props: PageProps) {
  const { productId } = useShop()
  if (productId) return <ProductView />
  return (
    <>
      <Hero />
      <Offers />
      <ShopGrid />
    </>
  )
}