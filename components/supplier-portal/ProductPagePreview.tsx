'use client'

import { Suspense, type ReactNode } from 'react'
import { useSearchParams } from 'next/navigation'
import { ConditionTag } from '@/components/Badges'
import { PdpSharePrintProvider } from '@/components/PdpSharePrintContext'
import PdpAssurancePassport from '@/components/product/PdpAssurancePassport'
import PdpFundingLevers from '@/components/product/PdpFundingLevers'
import PdpHowItHelps from '@/components/product/PdpHowItHelps'
import PdpHowToBuy from '@/components/product/PdpHowToBuy'
import PdpImplementation from '@/components/product/PdpImplementation'
import PdpLocalValue from '@/components/product/PdpLocalValue'
import PdpInteroperability from '@/components/product/PdpInteroperability'
import PdpNhsExperience from '@/components/product/PdpNhsExperience'
import PdpPublicationsSection from '@/components/product/PdpPublicationsSection'
import PdpGetInTouch from '@/components/product/PdpGetInTouch'
import PdpProblem from '@/components/product/PdpProblem'
import PdpResources from '@/components/product/PdpResources'
import { buildPdpSectionLinks } from '@/lib/pdpOnThisPage'
import { PDP_DEMO_CONTEXT, pdpPageTitle, type PdpPageId } from '@/lib/pdpSections'
import type { PortalProductRecord } from '@/lib/portalProducts'
import { publishedProductHref } from '@/lib/supplierPortal'
import { buildPortalProductPage } from '@/lib/supplierProductPage'
import { useProductPage } from './useProductPage'

/**
 * The product page as commissioners would see it on the Commissioning Store,
 * built from held data plus the supplier's page values. Shows unpublished
 * changes by default; `?version=published` shows the live version.
 * Reuses the PDP section components so the preview cannot drift from the store.
 */
export default function ProductPagePreview(props: { productId: string; base: PortalProductRecord }) {
  return (
    <Suspense fallback={null}>
      <Preview {...props} />
    </Suspense>
  )
}

function Preview({ productId, base }: { productId: string; base: PortalProductRecord }) {
  const showPublished = useSearchParams().get('version') === 'published'
  const { hydrated, record, answers, published, current } = useProductPage(productId, base)
  if (!hydrated) return null

  const { app, narrative } = buildPortalProductPage({
    app: base.app,
    narrative: base.narrative,
    answers,
    page: showPublished ? published : current,
  })
  const linkedFundingIds: string[] = app.linked_funding_ids ?? []
  const sections = buildPdpSectionLinks({
    app,
    narrative,
    showNarrativeSpine: true,
    showLocalValue: app.condition_tags?.includes('copd') ?? false,
    hasLinkedFunding: linkedFundingIds.length > 0,
  })
  const has = (id: PdpPageId) => sections.some((s) => s.id === id)
  const notPublishedYet = showPublished && !record.hasBeenPublished

  return (
    <PdpSharePrintProvider>
      <div className="nhsuk-warning-callout">
        <h2 className="nhsuk-warning-callout__label">
          <span role="text">
            <span className="nhsuk-u-visually-hidden">Important: </span>
            {showPublished ? 'Published page' : 'Preview'}
          </span>
        </h2>
        {showPublished ? (
          <p>
            {notPublishedYet
              ? 'This page has not been published yet. This is how it will look with the information the NHS HealthStore holds.'
              : 'This is the version of your product page that commissioners can see on the Commissioning Store.'}
          </p>
        ) : (
          <p>
            This is how your product page will look, including changes you have not published yet. Commissioners cannot see
            these changes until you{' '}
            <a href={publishedProductHref(productId)}>submit them from your product page</a>.
          </p>
        )}
      </div>

      <div className="nhsuk-u-margin-bottom-6">
        <h1 className="nhsuk-heading-xl">{app.app_name}</h1>
        <span className="nhsuk-caption-xl hs-caption-below">{app.supplier_name}</span>
        <div className="flex flex-wrap gap-2 nhsuk-u-margin-bottom-4">
          {(app.condition_tags ?? []).map((t: string) => (
            <ConditionTag key={t} tag={t} />
          ))}
        </div>
        {app.one_line_value_proposition && (
          <p className="nhsuk-body-l" style={{ color: 'var(--text-secondary)' }}>
            {app.one_line_value_proposition}
          </p>
        )}
      </div>

      <nav className="nhsuk-contents-list nhsuk-u-margin-bottom-8" aria-label="Contents">
        <h2 className="nhsuk-u-visually-hidden">Contents</h2>
        <ol className="nhsuk-contents-list__list">
          {sections.map((s) => (
            <li key={s.id} className="nhsuk-contents-list__item">
              <a className="nhsuk-contents-list__link" href={`#page-${s.id}`}>
                {s.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {has('how-it-helps') && (
        <PreviewPage id="how-it-helps" title={pdpPageTitle('how-it-helps', { appName: app.app_name })}>
          <PdpProblem app={app} narrative={narrative} />
          <PdpHowItHelps app={app} narrative={narrative} />
        </PreviewPage>
      )}
      {has('local-impact-and-value') && (
        <PreviewPage id="local-impact-and-value" title={pdpPageTitle('local-impact-and-value')}>
          <PdpLocalValue app={app} narrative={narrative} context={PDP_DEMO_CONTEXT} />
        </PreviewPage>
      )}
      {has('funding-levers') && (
        <PreviewPage id="funding-levers" title={pdpPageTitle('funding-levers')}>
          <PdpFundingLevers narrative={narrative} fundingIds={linkedFundingIds} />
        </PreviewPage>
      )}
      {has('assurance') && (
        <PreviewPage id="assurance" title={pdpPageTitle('assurance')}>
          <PdpAssurancePassport app={app} narrative={narrative} />
        </PreviewPage>
      )}
      {has('implementation') && (
        <PreviewPage id="implementation" title={pdpPageTitle('implementation')}>
          <PdpImplementation app={app} narrative={narrative} />
          <PdpInteroperability app={app} narrative={narrative} />
        </PreviewPage>
      )}
      {has('peer-and-patient-experience') && (
        <PreviewPage id="peer-and-patient-experience" title={pdpPageTitle('peer-and-patient-experience')}>
          <PdpNhsExperience app={app} />
          <PdpPublicationsSection app={app} />
        </PreviewPage>
      )}
      {has('procurement') && (
        <PreviewPage id="procurement" title={pdpPageTitle('procurement')}>
          <PdpHowToBuy app={app} narrative={narrative} />
        </PreviewPage>
      )}
      {has('get-in-touch') && (
        <PreviewPage id="get-in-touch" title={pdpPageTitle('get-in-touch')}>
          <PdpGetInTouch slug={app.slug} />
        </PreviewPage>
      )}
      {has('resources') && (
        <PreviewPage id="resources" title={pdpPageTitle('resources')}>
          <PdpResources app={app} />
        </PreviewPage>
      )}
    </PdpSharePrintProvider>
  )
}

/** One store page in the single-scroll preview; the store shows each on its own URL. */
function PreviewPage({ id, title, children }: { id: PdpPageId; title: string; children: ReactNode }) {
  return (
    <section id={`page-${id}`} aria-labelledby={`page-${id}-title`} className="nhsuk-u-margin-bottom-8">
      <h2 id={`page-${id}-title`} className="nhsuk-heading-xl">
        {title}
      </h2>
      {children}
    </section>
  )
}
