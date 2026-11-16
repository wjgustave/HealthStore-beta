'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { STATUS_LABELS, STATUS_TAG } from '@/components/product/AssurancePassport'
import { Button } from '@/components/ui/Button'
import { DTAC_DOMAIN } from '@/lib/content/assuranceDomains'
import { pdpSectionTitle } from '@/lib/pdpSections'
import type { PortalProductRecord } from '@/lib/portalProducts'
import {
  managedProductHref,
  publishedProductCheckAnswersHref,
  publishedProductPreviewHref,
  publishedProductSectionHref,
} from '@/lib/supplierPortal'
import {
  PRODUCT_PAGE_KEYS,
  PRODUCT_PAGE_SECTIONS,
  assuranceDomainsFromAnswers,
  type ProductPageSection,
} from '@/lib/supplierProductPage'
import { ProductPageSectionSummary } from './ProductPageSummary'
import { StatusSummary } from './StatusSummary'
import { useProductPage } from './useProductPage'

/**
 * The product page hub: every section the supplier writes, as NHS Summary lists
 * with Change links, plus a read-only view of what the HealthStore works out.
 * [Provenance: NHS Summary list + Check answers pattern]
 */
export default function ProductPageOverview({ productId, base }: { productId: string; base: PortalProductRecord }) {
  const router = useRouter()
  const page = useProductPage(productId, base)
  const { hydrated, status, record, name, current, published, answers } = page
  if (!hydrated || !status) return null

  const app = base.app
  const sectionsFor = (...ids: ProductPageSection['id'][]) => PRODUCT_PAGE_SECTIONS.filter((s) => ids.includes(s.id))
  const assurance = assuranceDomainsFromAnswers(answers, app).filter((d) => d.domain !== DTAC_DOMAIN.nice)
  const hasDraft =
    status !== 'published' &&
    (!record.hasBeenPublished || PRODUCT_PAGE_KEYS.some((key) => (current[key] ?? '') !== (published[key] ?? '')))

  const renderSection = (section: ProductPageSection) => {
    const Heading = section.subsection ? 'h3' : 'h2'
    return (
      <section key={section.id} aria-labelledby={`${section.id}-heading`} className="nhsuk-u-margin-top-7">
        <Heading id={`${section.id}-heading`} className={section.subsection ? 'nhsuk-heading-s' : 'nhsuk-heading-m'}>
          {section.title(name)}
        </Heading>
        <ProductPageSectionSummary
          section={section}
          app={app}
          name={name}
          values={current}
          changeHref={(row) => `${publishedProductSectionHref(productId, section.id)}#${row.key}`}
        />
      </section>
    )
  }

  return (
    <>
      <h1 className="nhsuk-heading-xl">
        <span className="nhsuk-caption-l">Product page</span>
        {name}
      </h1>

      <StatusSummary
        status={status}
        lastUpdated={record.lastUpdated}
        commissioningStoreLink={
          record.hasBeenPublished
            ? { href: publishedProductPreviewHref(productId, { published: true }), label: `${name} (opens in new tab)` }
            : undefined
        }
        draftMessage={
          status === 'unpublished'
            ? 'This page is not published yet, so commissioners cannot see it on the Commissioning Store. Add your content and submit your changes.'
            : 'You have changes saved that are not published. Commissioners will keep seeing the published version until you submit your changes.'
        }
      />

      <p className="nhsuk-body-m">
        <a
          className="nhsuk-button nhsuk-button--secondary nhsuk-u-margin-bottom-0"
          href={publishedProductPreviewHref(productId)}
          target="_blank"
          rel="noopener noreferrer"
        >
          Preview page<span className="nhsuk-u-visually-hidden"> (opens in new tab)</span>
        </a>
      </p>

      <div className="nhsuk-inset-text">
        <span className="nhsuk-u-visually-hidden">Information: </span>
        <p>The NHS HealthStore works out these sections from the information it holds, so you do not need to write them:</p>
        <ul className="nhsuk-list nhsuk-list--bullet">
          <li>{pdpSectionTitle('local-impact', { appName: name })}</li>
          <li>{pdpSectionTitle('local-value-worth')}</li>
          <li>{pdpSectionTitle('funding-levers')}</li>
          <li>{pdpSectionTitle('how-to-buy')}</li>
        </ul>
      </div>

      {sectionsFor('the-problem', 'how-it-helps').map(renderSection)}

      <section aria-labelledby="assurance-heading" className="nhsuk-u-margin-top-7">
        <h2 id="assurance-heading" className="nhsuk-heading-m">
          {pdpSectionTitle('assurance')}
        </h2>
        <p className="nhsuk-body-m">
          This comes from your answers in <Link href={managedProductHref(productId)}>Manage products</Link>. To change
          it, update your product information there.
        </p>
        <dl className="nhsuk-summary-list">
          {assurance.map((domain) => (
            <div key={domain.domain} className="nhsuk-summary-list__row">
              <dt className="nhsuk-summary-list__key">{domain.domain}</dt>
              <dd className="nhsuk-summary-list__value">
                <strong className={STATUS_TAG[domain.status]}>{STATUS_LABELS[domain.status]}</strong>
                <p className="nhsuk-body-s nhsuk-u-margin-top-2 nhsuk-u-margin-bottom-0">{domain.summary}</p>
              </dd>
            </div>
          ))}
        </dl>
        {sectionsFor('publications').map(renderSection)}
      </section>

      {sectionsFor('implementation', 'supplier-support', 'nhs-experience', 'case-studies', 'resources').map(renderSection)}

      {hasDraft && (
        <div className="nhsuk-u-margin-top-7">
          <h2 className="nhsuk-heading-m">Publish your changes</h2>
          <p className="nhsuk-body-m">
            Check how the page will look with <a href={publishedProductPreviewHref(productId)} target="_blank" rel="noopener noreferrer">Preview page (opens in new tab)</a>, then submit your changes to publish them.
          </p>
          <Button type="button" onClick={() => router.push(publishedProductCheckAnswersHref(productId))}>
            Submit changes
          </Button>
        </div>
      )}
    </>
  )
}
