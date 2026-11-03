'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BackLink } from '@/components/BackLink'
import { Button } from '@/components/ui/Button'
import type { PortalProductRecord } from '@/lib/portalProducts'
import {
  publishedProductConfirmationHref,
  publishedProductHref,
  publishedProductPreviewHref,
  publishedProductSectionHref,
} from '@/lib/supplierPortal'
import { PRODUCT_PAGE_SECTIONS } from '@/lib/supplierProductPage'
import { ProductPageSectionSummary } from './ProductPageSummary'
import { useProductPage } from './useProductPage'
import { useSupplierPortal } from './useSupplierPortal'

const DECLARATION =
  'By submitting these changes you confirm that the information is accurate and up to date. Your changes will be published on the Commissioning Store straight away.'

/**
 * Check your answers before publishing product page changes.
 * [Provenance: NHS / GOV.UK "Check answers" pattern]
 *
 * The first submission shows every section; later ones only the rows that
 * differ from the published page.
 */
export default function ProductPageCheckAnswers({ productId, base }: { productId: string; base: PortalProductRecord }) {
  const router = useRouter()
  const { submitChanges } = useSupplierPortal()
  const { hydrated, status, record, name, published, current } = useProductPage(productId, base)
  const [submitting, setSubmitting] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const hubHref = publishedProductHref(productId)

  const isFirstSubmission = !record.hasBeenPublished
  const canSubmit = status === 'unpublished' || status === 'unpublished_changes'
  const sections = PRODUCT_PAGE_SECTIONS.map((section) => ({
    section,
    rows: isFirstSubmission
      ? section.rows
      : section.rows.filter((row) => (current[row.key] ?? '') !== (published[row.key] ?? '')),
  })).filter((s) => s.rows.length > 0)
  const ready = hydrated && canSubmit && sections.length > 0

  useEffect(() => {
    if (hydrated && !ready && !submitting) router.replace(hubHref)
  }, [hydrated, ready, submitting, router, hubHref])

  useEffect(() => {
    if (ready) {
      window.scrollTo(0, 0)
      headingRef.current?.focus()
    }
  }, [ready])

  if (!ready) return null

  function confirmAndSubmit() {
    if (submitting) return
    setSubmitting(true)
    submitChanges('pages', productId, current)
    router.push(publishedProductConfirmationHref(productId))
  }

  return (
    <>
      <BackLink href={hubHref} />
      <h1 ref={headingRef} tabIndex={-1} className="nhsuk-heading-xl outline-none">
        Check your answers before publishing
      </h1>
      <span className="nhsuk-caption-l hs-caption-below">{name} product page</span>
      <p className="nhsuk-body-m">
        {isFirstSubmission
          ? 'Check everything you have written for the page.'
          : 'Only the parts of the page you have changed are shown below.'}{' '}
        You can also{' '}
        <a href={publishedProductPreviewHref(productId)} target="_blank" rel="noopener noreferrer">
          preview the page (opens in new tab)
        </a>
        .
      </p>

      {sections.map(({ section, rows }) => (
        <section key={section.id} aria-labelledby={`${section.id}-heading`} className="nhsuk-u-margin-top-7">
          <h2 id={`${section.id}-heading`} className="nhsuk-heading-m">
            {section.title(name)}
          </h2>
          <ProductPageSectionSummary
            section={section}
            app={base.app}
            name={name}
            values={current}
            rows={rows}
            showHeld={false}
            changeHref={(row) => `${publishedProductSectionHref(productId, section.id)}#${row.key}`}
          />
        </section>
      ))}

      <h2 className="nhsuk-heading-m nhsuk-u-margin-top-7">Publish your changes</h2>
      <p className="nhsuk-body-m">{DECLARATION}</p>
      <Button variant="confirm" onClick={confirmAndSubmit} loading={submitting}>
        {submitting ? 'Submitting…' : 'Confirm and submit'}
      </Button>
    </>
  )
}
