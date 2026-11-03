import { describe, it, expect } from 'vitest'
import { DTAC_DOMAIN } from '@/lib/content/assuranceDomains'
import { splitPdpEvidence } from '@/lib/pdpEvidence'
import { BREATHEWELL_ANSWERS, BREATHEWELL_APP, BREATHEWELL_NARRATIVE } from '@/lib/portalProducts/breathewellCopd'
import {
  PRODUCT_PAGE_SECTIONS,
  assuranceDomainsFromAnswers,
  buildPortalProductPage,
  cleanSectionValues,
  findProductPageSection,
  parseList,
  productPageDefaults,
  serializeList,
  validateSection,
} from '@/lib/supplierProductPage'
import { PRODUCT_PAGE_SAMPLES } from '@/lib/supplierProductPageSamples'

const build = (page: Record<string, string>, answers = BREATHEWELL_ANSWERS) =>
  buildPortalProductPage({ app: BREATHEWELL_APP, narrative: BREATHEWELL_NARRATIVE, answers, page })

describe('list values', () => {
  it('round-trips lists and treats an empty list as blank', () => {
    const steps = [{ label: 'Referral' }, { label: 'Assessment', change: 'added' }]
    expect(parseList(serializeList(steps))).toEqual(steps)
    expect(serializeList([])).toBe('')
    expect(parseList('')).toEqual([])
    expect(parseList('not json')).toEqual([])
  })

  it('drops blank rows and trims text when cleaning a section', () => {
    const section = findProductPageSection('how-it-helps')!
    const cleaned = cleanSectionValues(section, {
      how_bullets: serializeList(['  One  ', '', ' ']),
      pathway_current: serializeList([{ label: ' Referral ' }, { label: '' }]),
      pathway_future: serializeList([{ label: '', change: 'added' }]),
    })
    expect(parseList(cleaned.how_bullets)).toEqual(['One'])
    expect(parseList(cleaned.pathway_current)).toEqual([{ label: 'Referral' }])
    expect(cleaned.pathway_future).toBe('')
  })
})

describe('validateSection', () => {
  it('requires type, title, setting and outcome for each publication', () => {
    const section = findProductPageSection('publications')!
    const errors = validateSection(section, {
      publications: serializeList([{ type: '', title: 'A study', setting: '', outcome: '', url: 'not a url' }]),
    })
    expect(errors.map((e) => e.field)).toEqual([
      'publications-0-type',
      'publications-0-setting',
      'publications-0-outcome',
      'publications-0-url',
    ])
  })

  it('accepts every sample', () => {
    for (const section of PRODUCT_PAGE_SECTIONS) {
      expect(validateSection(section, PRODUCT_PAGE_SAMPLES[section.id]), section.id).toEqual([])
    }
  })
})

describe('assuranceDomainsFromAnswers', () => {
  it('builds every DTAC domain in store order', () => {
    const domains = assuranceDomainsFromAnswers(BREATHEWELL_ANSWERS, BREATHEWELL_APP)
    expect(domains.map((d) => d.domain)).toEqual([
      DTAC_DOMAIN.clinicalSafety,
      DTAC_DOMAIN.dataProtection,
      DTAC_DOMAIN.technicalSecurity,
      DTAC_DOMAIN.interoperability,
      DTAC_DOMAIN.usability,
      DTAC_DOMAIN.nice,
      DTAC_DOMAIN.dtacForm,
    ])
    expect(domains.find((d) => d.domain === DTAC_DOMAIN.clinicalSafety)?.status).toBe('verified_current')
  })

  it('marks a domain pending when evidence was not provided', () => {
    const answers = { ...BREATHEWELL_ANSWERS, 'c3-3-pen-test-can-provide': 'no' }
    const security = assuranceDomainsFromAnswers(answers, BREATHEWELL_APP).find(
      (d) => d.domain === DTAC_DOMAIN.technicalSecurity,
    )
    expect(security?.status).toBe('declared_pending')
  })
})

describe('buildPortalProductPage', () => {
  it('leaves supplier-written sections empty until the supplier writes them', () => {
    const { narrative } = build(productPageDefaults(BREATHEWELL_APP, BREATHEWELL_ANSWERS))
    expect(narrative.decision_summary).toBeUndefined()
    expect(narrative.pathway_model).toBeUndefined()
    // Prerequisites are prepopulated, so the implementation section exists.
    expect(narrative.implementation?.prerequisites.length).toBeGreaterThan(2)
    expect(narrative.commissioner_economics).toEqual(BREATHEWELL_NARRATIVE.commissioner_economics)
  })

  it('maps every section the supplier writes onto the PDP model', () => {
    const page = Object.assign({}, ...Object.values(PRODUCT_PAGE_SAMPLES))
    const { app, narrative } = build(page)

    expect(narrative.decision_summary?.pathway_problem).toBe(page.problem)
    expect(narrative.what_it_does_bullets).toHaveLength(4)
    expect(narrative.pathway_model?.current_steps).toHaveLength(4)
    expect(narrative.pathway_model?.future_steps.map((s) => s.change)).toEqual([
      'unchanged',
      'added',
      'added',
      'changed',
      'changed',
    ])
    expect(narrative.implementation?.human_wrapper).toBe(page.impl_human_wrapper)
    expect(narrative.implementation?.owner).toBe('community respiratory service lead')
    expect(narrative.implementation?.onboarding_steps).toHaveLength(4)

    const supplierPublication = app.clinical_evidence_detailed.find((p: { supplier_provided?: boolean }) => p.supplier_provided)
    expect(supplierPublication?.type).toBe('observational')
    expect(app.case_studies).toHaveLength(2)
    expect(app.deployment_register).toHaveLength(3)
    expect(app.demo_variants.map((d: { type: string }) => d.type)).toEqual(['demo', 'documentation'])
  })

  it('shows supplier publications under Clinical publications and evaluations', () => {
    const { app } = build({
      publications: serializeList([
        { type: 'other', title: 'Health economic model', setting: 'York Health Economics Consortium', outcome: 'Cost saving at 12 months', url: '' },
      ]),
    })
    const { publications } = splitPdpEvidence(app, { showNarrativeSpine: true, hasNhsExperience: true })
    expect(publications.map((p: { ref: string }) => p.ref)).toContain('Health economic model')
  })

  it('uses the product name from product information', () => {
    const { app } = build({}, { ...BREATHEWELL_ANSWERS, 'a2-product-name': 'BreatheWell' })
    expect(app.app_name).toBe('BreatheWell')
  })
})
