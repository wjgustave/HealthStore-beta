import { notFound } from 'next/navigation'
import ProductPageSectionEditor from '@/components/supplier-portal/ProductPageSectionEditor'
import { MANAGED_PRODUCTS, PORTAL_SERVICE_NAME, findManagedProduct } from '@/lib/supplierPortal'
import { productPageBase } from '@/lib/supplierPortalContent'
import { PRODUCT_PAGE_SECTIONS, findProductPageSection } from '@/lib/supplierProductPage'

type Params = Promise<{ productId: string; section: string }>

export function generateStaticParams() {
  return MANAGED_PRODUCTS.flatMap((p) => PRODUCT_PAGE_SECTIONS.map((s) => ({ productId: p.id, section: s.id })))
}

export async function generateMetadata({ params }: { params: Params }) {
  const { productId, section: sectionId } = await params
  const product = findManagedProduct(productId)
  const section = findProductPageSection(sectionId)
  const title = product && section ? `${section.title(product.name)} — ${product.name} — ` : ''
  return { title: `${title}${PORTAL_SERVICE_NAME}` }
}

export default async function ProductPageSectionPage({ params }: { params: Params }) {
  const { productId, section: sectionId } = await params
  const product = findManagedProduct(productId)
  const section = findProductPageSection(sectionId)
  if (!product || !section) notFound()
  return (
    <div className="nhsuk-width-container nhsuk-main-wrapper">
      <div className="nhsuk-grid-row">
        <div className="nhsuk-grid-column-two-thirds">
          <ProductPageSectionEditor productId={product.id} sectionId={section.id} base={productPageBase(product)} />
        </div>
      </div>
    </div>
  )
}
