import { notFound } from 'next/navigation'
import { PortalBreadcrumb } from '@/components/supplier-portal/PortalBreadcrumb'
import ProductPageOverview from '@/components/supplier-portal/ProductPageOverview'
import { MANAGED_PRODUCTS, PORTAL_PATHS, PORTAL_SERVICE_NAME, findManagedProduct } from '@/lib/supplierPortal'
import { productPageBase } from '@/lib/supplierPortalContent'

type Params = Promise<{ productId: string }>

export function generateStaticParams() {
  return MANAGED_PRODUCTS.map((p) => ({ productId: p.id }))
}

export async function generateMetadata({ params }: { params: Params }) {
  const product = findManagedProduct((await params).productId)
  return { title: `${product ? `${product.name} — ` : ''}Product page — ${PORTAL_SERVICE_NAME}` }
}

export default async function PublishedProductPage({ params }: { params: Params }) {
  const product = findManagedProduct((await params).productId)
  if (!product) notFound()
  return (
    <div className="nhsuk-width-container nhsuk-main-wrapper">
      <PortalBreadcrumb items={[{ label: 'Published pages', href: PORTAL_PATHS.published }, { label: product.name }]} />
      <div className="nhsuk-grid-row">
        <div className="nhsuk-grid-column-two-thirds">
          <ProductPageOverview productId={product.id} base={productPageBase(product)} />
        </div>
      </div>
    </div>
  )
}
