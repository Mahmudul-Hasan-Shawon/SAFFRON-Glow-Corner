import { Hero } from '../sections/Hero'
import { Offers } from '../sections/Offers'
import { ShopGrid } from '../sections/ShopGrid'
import { ProductView } from '../sections/ProductView'
import { useShop } from '../store/shop'

export function Home() {
  const { productId } = useShop()
  return (
    <div>
      <Hero />
      <Offers />
      {productId ? <ProductView /> : <ShopGrid />}
    </div>
  )
}