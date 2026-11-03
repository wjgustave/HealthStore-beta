import { notFound } from 'next/navigation'
import ProductPagePreview from '@/components/supplier-portal/ProductPagePreview'
import { MANAGED_PRODUCTS, PORTAL_SERVICE_NAME, findManagedProduct } from '@/lib/supplierPortal'
import { productPageBase } from '@/lib/supplierPortalContent'

type Params = Promise<{ productId: string }>

export function generateStaticParams() {
  return MANAGED_PRODUCTS.map((p) => ({ productId: p.id }))
}

export async function generateMetadata({ params }: { params: Params }) {
  const product = findManagedProduct((await params).productId)
  return { title: `${product ? `${product.name} — ` : ''}Preview product page — ${PORTAL_SERVICE_NAME}` }
}

export default async function ProductPagePreviewPage({ params }: { params: Params }) {
  const product = findManagedProduct((await params).productId)
  if (!product) notFound()
  return (
    <div className="nhsuk-width-container nhsuk-main-wrapper">
      <ProductPagePreview productId={product.id} base={productPageBase(product)} />
    </div>
  )
}
