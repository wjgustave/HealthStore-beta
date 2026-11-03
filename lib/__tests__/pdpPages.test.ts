import { describe, it, expect } from 'vitest'
import { buildPdpSectionLinks } from '@/lib/pdpOnThisPage'
import { niceTechGuidanceRefs } from '@/lib/pdpEvidence'
import { BREATHEWELL_APP, BREATHEWELL_NARRATIVE } from '@/lib/portalProducts/breathewellCopd'

const narrative = {
  ...BREATHEWELL_NARRATIVE,
  decision_summary: { ...BREATHEWELL_NARRATIVE.decision_summary, pathway_problem: 'COPD admissions are rising.' },
  what_it_does_bullets: ['Remote monitoring'],
} as typeof BREATHEWELL_NARRATIVE

const pages = (app: typeof BREATHEWELL_APP & { market_preview?: boolean }) =>
  buildPdpSectionLinks({
    app,
    narrative,
    showNarrativeSpine: true,
    showLocalValue: !app.market_preview,
    hasLinkedFunding: false,
  })

describe('PDP pages', () => {
  it('groups the sections into the renamed pages', () => {
    const links = pages(BREATHEWELL_APP)
    const ids = links.map((l) => l.id)
    expect(ids).toContain('how-it-helps')
    expect(ids).toContain('local-impact-and-value')
    expect(ids).toContain('get-in-touch')
    expect(ids).not.toContain('the-problem')
    expect(ids).not.toContain('nhs-experience')
    expect(ids).not.toContain('how-to-buy')
    expect(ids.indexOf('get-in-touch')).toBe(ids.indexOf('resources') - 1)
    expect(links.find((l) => l.id === 'how-it-helps')?.label).toBe(`How ${BREATHEWELL_APP.app_name} helps`)
    expect(links.find((l) => l.id === 'local-impact-and-value')?.label).toBe('Local impact and value')
    expect(links.every((l) => l.href === `/apps/${BREATHEWELL_APP.slug}/${l.id}`)).toBe(true)
  })

  it('keeps market-preview products to the problem page', () => {
    const ids = pages({ ...BREATHEWELL_APP, market_preview: true }).map((l) => l.id)
    expect(ids[0]).toBe('how-it-helps')
    for (const hidden of ['funding-levers', 'assurance', 'implementation', 'procurement', 'get-in-touch']) {
      expect(ids).not.toContain(hidden)
    }
  })
})

describe('HTG and MTG guidance under Regulatory position', () => {
  const app = {
    nice_guidance_refs: [
      { ref: 'NICE HTE19 (HTG736)', url: 'https://www.nice.org.uk/guidance/htg736', type: 'EVA', date: 'December 2024' },
      { ref: 'NICE HTG624', type: 'HTG', date: '2023', note: 'Migrated from MTG70' },
      { ref: 'NICE MTG42', type: 'MTG', date: '2019' },
      { ref: 'NICE NG226', type: 'NG', date: '2022' },
    ],
  }

  it('lists HTG and MTG references and skips other guidance', () => {
    expect(niceTechGuidanceRefs(app).map((r) => r.ref)).toEqual([
      'NICE HTE19 (HTG736)',
      'NICE HTG624',
      'NICE MTG42',
    ])
  })

  it('skips the reference already shown as the headline NICE recommendation', () => {
    expect(niceTechGuidanceRefs(app, 'NICE HTG736').map((r) => r.ref)).toEqual(['NICE HTG624', 'NICE MTG42'])
  })

  it('returns nothing when no guidance is held', () => {
    expect(niceTechGuidanceRefs({})).toEqual([])
  })
})
