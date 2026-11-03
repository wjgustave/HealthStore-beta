import { notFound } from 'next/navigation'
import ProductPageCheckAnswers from '@/components/supplier-portal/ProductPageCheckAnswers'
import { MANAGED_PRODUCTS, PORTAL_SERVICE_NAME, findManagedProduct } from '@/lib/supplierPortal'
import { productPageBase } from '@/lib/supplierPortalContent'

type Params = Promise<{ productId: string }>

export function generateStaticParams() {
  return MANAGED_PRODUCTS.map((p) => ({ productId: p.id }))
}

export async function generateMetadata({ params }: { params: Params }) {
  const product = findManagedProduct((await params).productId)
  return { title: `${product ? `${product.name} — ` : ''}Check your answers — ${PORTAL_SERVICE_NAME}` }
}

export default async function PublishedProductCheckAnswersPage({ params }: { params: Params }) {
  const product = findManagedProduct((await params).productId)
  if (!product) notFound()
  return (
    <div className="nhsuk-width-container nhsuk-main-wrapper">
      <div className="nhsuk-grid-row">
        <div className="nhsuk-grid-column-two-thirds">
          <ProductPageCheckAnswers productId={product.id} base={productPageBase(product)} />
        </div>
      </div>
    </div>
  )
}
