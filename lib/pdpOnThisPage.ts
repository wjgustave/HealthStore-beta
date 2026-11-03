import type { App } from '@/lib/data'
import type { ProductNarrative } from '@/lib/content/productModel'
import { deriveAssuranceDomains } from '@/lib/content/assuranceDomains'
import { getDeploymentRegister } from '@/lib/deploymentRegister'
import { splitPdpEvidence } from '@/lib/pdpEvidence'
import { isMarketPreview } from '@/lib/marketPreview'
import { pdpPageTitle } from '@/lib/pdpSections'
import type { PdpPageId } from '@/lib/pdpSections'

/** A product page under /apps/[slug]/[id]. */
export type PdpSectionLink = { id: PdpPageId; label: string; href: string }

/** True when the product's assurance domains include an Interoperability entry. */
export function hasInteroperabilityDomain(app: App, narrative: ProductNarrative | null): boolean {
  const domains =
    narrative?.assurance_domains && narrative.assurance_domains.length > 0
      ? narrative.assurance_domains
      : deriveAssuranceDomains(app)
  return domains.some((d) => d.domain === 'Interoperability' && !!d.summary)
}

/**
 * Builds the list of pages for a product, in reading order. Each entry becomes
 * a route (/apps/[slug]/[id]) and a side-nav link labelled with the page name.
 */
export function buildPdpSectionLinks(input: {
  app: App
  narrative: ProductNarrative | null
  showNarrativeSpine: boolean
  showLocalValue: boolean
  hasLinkedFunding: boolean
}): PdpSectionLink[] {
  const { app, narrative, showNarrativeSpine, showLocalValue, hasLinkedFunding } = input
  const links: PdpSectionLink[] = []

  const push = (id: PdpPageId) =>
    links.push({
      id,
      href: `/apps/${app.slug}/${id}`,
      label: pdpPageTitle(id, { appName: app.app_name }),
    })

  const hasNhsExperience =
    showNarrativeSpine &&
    (getDeploymentRegister(app).length > 0 || (app.case_studies?.length ?? 0) > 0)
  const evidenceSplit = splitPdpEvidence(app, { showNarrativeSpine, hasNhsExperience })

  if (showNarrativeSpine && narrative) {
    const marketPreview = isMarketPreview(app)
    const problem = narrative.decision_summary?.pathway_problem
    const bullets = narrative.what_it_does_bullets ?? []
    const pathway = narrative.pathway_model

    // Limited market view keeps the problem only. Pathway, assurance and
    // implementation stay off the page so it does not read as a product you can adopt.
    if (problem || (!marketPreview && (bullets.length > 0 || pathway))) {
      push('how-it-helps')
    }
    if (showLocalValue) {
      push('local-impact-and-value')
    }
    const economics = narrative.commissioner_economics
    if (
      !marketPreview &&
      ((economics?.funding_levers?.length ?? 0) > 0 || !!economics?.tariff_note?.trim() || hasLinkedFunding)
    ) {
      push('funding-levers')
    }
    if (
      !marketPreview &&
      ((narrative.assurance_domains?.length ?? 0) > 0 ||
        deriveAssuranceDomains(app).length > 0 ||
        !!narrative.regulatory_position)
    ) {
      push('assurance')
    }
    if (!marketPreview && (narrative.implementation || hasInteroperabilityDomain(app, narrative))) {
      push('implementation')
    }
    if (hasNhsExperience || (!marketPreview && evidenceSplit.publications.length > 0)) {
      push('peer-and-patient-experience')
    }
    if (!marketPreview && narrative.commercial_readiness) {
      push('procurement')
    }
    if (!marketPreview) {
      push('get-in-touch')
    }
    const hasResources =
      (app.product_videos?.length ?? 0) > 0 || app.catalogue_demo_available === true
    if (!marketPreview || hasResources) {
      push('resources')
    }
  }

  return links
}

/** Finds a section by its URL segment; undefined when the product has no such page. */
export function getPdpSection(links: PdpSectionLink[], section: string): PdpSectionLink | undefined {
  return links.find((l) => l.id === section)
}
