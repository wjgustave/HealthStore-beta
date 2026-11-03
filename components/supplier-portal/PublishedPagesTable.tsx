'use client'

import { PORTAL_PATHS, SAMPLE_SUPPLIER, SUPPLIER_PAGE_ID, publishedProductHref } from '@/lib/supplierPortal'
import { publishedPageStatus, useAvailableManagedProducts } from './portalStatus'
import { StatusTable, type StatusTableRow } from './StatusTable'
import { useSupplierPortal } from './useSupplierPortal'

/** Product pages and the supplier page on the Commissioning Store, with status. */
export default function PublishedPagesTable() {
  const { hydrated, getRecord } = useSupplierPortal()
  const { hydrated: productsReady, products } = useAvailableManagedProducts()
  if (!hydrated || !productsReady) return null

  const row = (id: string, name: string, detail: string, href: string): StatusTableRow => {
    const record = getRecord('pages', id)
    return {
      id,
      name,
      detail,
      href,
      status: publishedPageStatus(record),
      date: record.lastUpdated,
    }
  }

  return (
    <StatusTable
      caption="Your pages on the NHS Commissioning Store and their status"
      nameHeading="Page"
      dateHeading="Last updated"
      rows={[
        ...products.map((p) => row(p.id, p.name, 'Product page', publishedProductHref(p.id))),
        row(SUPPLIER_PAGE_ID, SAMPLE_SUPPLIER.name, 'Supplier page', PORTAL_PATHS.supplierPage),
      ]}
    />
  )
}
