'use client'

import { managedProductHref } from '@/lib/supplierPortal'
import { managedProductStatus, useAvailableManagedProducts } from './portalStatus'
import { StatusTable } from './StatusTable'
import { useSupplierPortal } from './useSupplierPortal'

/** Onboarded products with their current status and last update. */
export default function ManagedProductsTable() {
  const { hydrated, getRecord } = useSupplierPortal()
  const { hydrated: productsReady, products } = useAvailableManagedProducts()
  if (!hydrated || !productsReady) return null
  return (
    <StatusTable
      caption="Your onboarded products and their status"
      nameHeading="Product"
      dateHeading="Last updated"
      rows={products.map((p) => {
        const record = getRecord('products', p.id)
        return {
          id: p.id,
          name: p.name,
          href: managedProductHref(p.id),
          status: managedProductStatus(p, record),
          date: record.lastUpdated ?? p.lastUpdated,
        }
      })}
    />
  )
}
