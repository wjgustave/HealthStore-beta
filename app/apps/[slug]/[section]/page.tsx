import { notFound } from 'next/navigation'
import { getAllAppsUnfiltered, getAppBySlug, type App } from '@/lib/data'
import type { ProductNarrative } from '@/lib/content/productModel'
import type { CommissionerContext } from '@/lib/context/types'
import { getPdpPageModel, pdpBasePath, type PdpSearchParams } from '@/lib/pdpPageModel'
import { buildPdpSectionLinks, getPdpSection } from '@/lib/pdpOnThisPage'
import { PDP_PAGE_IDS, type PdpPageId, type PdpSectionId } from '@/lib/pdpSections'
import { getProductNarrative, resolveProductNarrative } from '@/lib/content/productNarratives'
import { isMarketPreview } from '@/lib/marketPreview'
import PdpFrame from '@/components/product/PdpFrame'
import { PdpSectionHeadingProvider } from '@/components/PdpSection'
import PdpProblem from '@/components/product/PdpProblem'
import PdpHowItHelps from '@/components/product/PdpHowItHelps'
import PdpLocalValue from '@/components/product/PdpLocalValue'
import PdpFundingLevers from '@/components/product/PdpFundingLevers'
import PdpAssurancePassport from '@/components/product/PdpAssurancePassport'
import PdpImplementation from '@/components/product/PdpImplementation'
import PdpInteroperability from '@/components/product/PdpInteroperability'
import PdpNhsExperience from '@/components/product/PdpNhsExperience'
import PdpPublicationsSection from '@/components/product/PdpPublicationsSection'
import PdpHowToBuy from '@/components/product/PdpHowToBuy'
import PdpGetInTouch from '@/components/product/PdpGetInTouch'
import PdpResources from '@/components/product/PdpResources'

type Params = { slug: string; section: string }

/**
 * Pages made of a single section: that section's heading becomes the page H1.
 * Every other page gets a route-level H1 and its sections keep H2 headings.
 */
const SINGLE_SECTION_PAGES: Partial<Record<PdpPageId, PdpSectionId>> = {
  assurance: 'assurance',
  procurement: 'how-to-buy',
  'get-in-touch': 'get-in-touch',
  resources: 'resources',
}

/** Only products with a curated narrative have section pages. */
export async function generateStaticParams() {
  return getAllAppsUnfiltered()
    .filter((a) => getProductNarrative(a.slug) != null)
    .flatMap((a) => PDP_PAGE_IDS.map((section) => ({ slug: a.slug, section })))
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { slug, section } = await params
  const app = getAppBySlug(slug)
  if (!app || getProductNarrative(slug) == null) return { title: 'Not found' }

  const links = buildPdpSectionLinks({
    app,
    narrative: resolveProductNarrative(slug, app),
    showNarrativeSpine: true,
    showLocalValue: !isMarketPreview(app) && (app.condition_tags?.includes('copd') ?? false),
    hasLinkedFunding: !isMarketPreview(app) && (app.linked_funding_ids ?? app.funding_ids ?? []).length > 0,
  })
  const match = getPdpSection(links, section)
  return { title: match ? `${match.label} — ${app.app_name} — NHS HealthStore` : 'Not found' }
}

/**
 * One product page per route. The page name is the H1 (with the product name
 * as a caption); the side nav links between pages.
 */
export default async function AppSectionPage({
  params,
  searchParams,
}: {
  params: Promise<Params>
  searchParams: Promise<PdpSearchParams>
}) {
  const { slug, section } = await params
  const model = await getPdpPageModel(slug, await searchParams)
  if (!model) notFound()

  const current = getPdpSection(model.sections, section)
  if (!current) notFound()

  const { app, narrative, commissionerContext, linkedFundingIds, hasNhsExperience } = model
  const h1SectionId = SINGLE_SECTION_PAGES[current.id]

  return (
    <PdpFrame
      model={model}
      breadcrumb={[
        { label: 'Product catalogue', href: '/catalogue' },
        { label: 'Digital therapeutics', href: '/catalogue/digital-therapeutics' },
        { label: app.app_name, href: pdpBasePath(app.slug) },
        { label: current.label },
      ]}
    >
      {!h1SectionId && (
        <>
          <h1 className="nhsuk-heading-xl">{current.label}</h1>
          <span className="nhsuk-caption-xl hs-caption-below">{app.app_name}</span>
        </>
      )}
      <PdpSectionHeadingProvider value={{ h1SectionId, pageTitle: current.label, caption: app.app_name }}>
        <PageContent
          id={current.id}
          app={app}
          narrative={narrative}
          context={commissionerContext}
          linkedFundingIds={linkedFundingIds}
          hasNhsExperience={hasNhsExperience}
        />
      </PdpSectionHeadingProvider>
    </PdpFrame>
  )
}

function PageContent({
  id,
  app,
  narrative,
  context,
  linkedFundingIds,
  hasNhsExperience,
}: {
  id: PdpPageId
  app: App
  narrative: ProductNarrative
  context: CommissionerContext
  linkedFundingIds: string[]
  hasNhsExperience: boolean
}) {
  switch (id) {
    case 'how-it-helps':
      return (
        <>
          <PdpProblem app={app} narrative={narrative} />
          {!isMarketPreview(app) && <PdpHowItHelps app={app} narrative={narrative} />}
        </>
      )
    case 'local-impact-and-value':
      return <PdpLocalValue app={app} narrative={narrative} context={context} />
    case 'funding-levers':
      return <PdpFundingLevers narrative={narrative} fundingIds={linkedFundingIds} />
    case 'assurance':
      return <PdpAssurancePassport app={app} narrative={narrative} />
    case 'implementation':
      return (
        <>
          <PdpImplementation app={app} narrative={narrative} />
          <PdpInteroperability app={app} narrative={narrative} />
        </>
      )
    case 'peer-and-patient-experience':
      return (
        <>
          {hasNhsExperience && <PdpNhsExperience app={app} />}
          {!isMarketPreview(app) && <PdpPublicationsSection app={app} />}
        </>
      )
    case 'procurement':
      return <PdpHowToBuy app={app} narrative={narrative} />
    case 'get-in-touch':
      return <PdpGetInTouch slug={app.slug} />
    case 'resources':
      return <PdpResources app={app} />
  }
}
