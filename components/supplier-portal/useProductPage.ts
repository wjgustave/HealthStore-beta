'use client'

import { useMemo } from 'react'
import type { PortalProductRecord } from '@/lib/portalProducts'
import type { TaskAnswers } from '@/lib/supplierOnboarding'
import { findManagedProduct, type ManagedProduct, type PublishedPageStatus } from '@/lib/supplierPortal'
import { productPageDefaults, type PageValues } from '@/lib/supplierProductPage'
import { publishedPageStatus } from './portalStatus'
import { useSupplierPortal, type EditRecord } from './useSupplierPortal'

export type ProductPageState = {
  hydrated: boolean
  product: ManagedProduct
  base: PortalProductRecord
  record: EditRecord
  status: PublishedPageStatus | undefined
  /** Product information as currently submitted (drafts in Manage products are not used). */
  answers: TaskAnswers
  /** Product name from product information. */
  name: string
  /** Prepopulated values, before anything the supplier has saved. */
  defaults: PageValues
  /** Published version: defaults plus submitted values. */
  published: PageValues
  /** What the supplier sees and edits: published plus the unsubmitted draft. */
  current: PageValues
}

/** Everything the product page hub, editor, check answers and preview read. */
export function useProductPage(productId: string, base: PortalProductRecord): ProductPageState {
  const product = findManagedProduct(productId)!
  const { hydrated, getRecord } = useSupplierPortal()
  const record = getRecord('pages', productId)
  const productValues = getRecord('products', productId).values

  return useMemo(() => {
    const answers: TaskAnswers = { ...base.answers, ...(productValues ?? {}) }
    const defaults = productPageDefaults(base.app, answers)
    const published = { ...defaults, ...(record.values ?? {}) }
    return {
      hydrated,
      product,
      base,
      record,
      status: hydrated ? publishedPageStatus(record) : undefined,
      answers,
      name: answers['a2-product-name']?.trim() || product.name,
      defaults,
      published,
      current: { ...published, ...(record.draft ?? {}) },
    }
  }, [hydrated, product, base, record, productValues])
}
