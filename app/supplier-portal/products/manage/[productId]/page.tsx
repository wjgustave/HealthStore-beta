import { notFound } from 'next/navigation'
import { PortalBreadcrumb } from '@/components/supplier-portal/PortalBreadcrumb'
import ManagedProductView from '@/components/supplier-portal/ManagedProductView'
import { MANAGED_PRODUCTS, PORTAL_PATHS, PORTAL_SERVICE_NAME, findManagedProduct } from '@/lib/supplierPortal'
import { productDefaults } from '@/lib/supplierPortalContent'

type Params = Promise<{ productId: string }>

export function generateStaticParams() {
  return MANAGED_PRODUCTS.map((p) => ({ productId: p.id }))
}

export async function generateMetadata({ params }: { params: Params }) {
  const product = findManagedProduct((await params).productId)
  return { title: `${product ? `${product.name} — ` : ''}Product information — ${PORTAL_SERVICE_NAME}` }
}

export default async function ManagedProductPage({ params }: { params: Params }) {
  const product = findManagedProduct((await params).productId)
  if (!product) notFound()
  return (
    <div className="nhsuk-width-container nhsuk-main-wrapper">
      <PortalBreadcrumb
        items={[
          { label: 'Product management', href: PORTAL_PATHS.products },
          { label: 'Manage products', href: PORTAL_PATHS.manage },
          { label: product.name },
        ]}
      />
      <div className="nhsuk-grid-row">
        <div className="nhsuk-grid-column-two-thirds">
          <ManagedProductView productId={product.id} defaults={productDefaults(product)} />
        </div>
      </div>
    </div>
  )
}
