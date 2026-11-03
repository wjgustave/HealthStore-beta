import type { App } from '@/lib/data'
import type { ProductNarrative } from '@/lib/content/productModel'
import { PdpSection } from '@/components/PdpSection'
import { pdpSectionTitle } from '@/lib/pdpSections'
import { deriveAssuranceDomains } from '@/lib/content/assuranceDomains'
import { isMarketPreview } from '@/lib/marketPreview'
import PdpRegulatoryPosition from '@/components/product/PdpRegulatoryPosition'

/**
 * Round 3 content migration — assurance passport for the hybrid PDP.
 *
 * Decisions (see /DS/Audits/Luscii-Content-Mig-4):
 *  - R3-1 A: rendered as an "Assurance" section in the narrative spine, after How-to-buy.
 *  - R3-2 D: NHS task list for domain status with domain-by-domain detail in the list hints.
 *  - R3-3 C: domains default to deriveAssuranceDomains(app) from granular JSON. When a
 *            curated narrative.assurance_domains list is authored (matt_demo parity —
 *            e.g. myCOPD), that list is used instead so the passport matches the gold
 *            standard table.
 *  - Sep 2026 Assurance feedback: the HealthStore does not run national assurance or
 *            certify products. Domains follow the DTAC layout and list the supplier
 *            evidence held.
 *
 * Server component — no client boundary.
 */

export default function PdpAssurancePassport({
  app,
  narrative,
}: {
  app: App
  narrative: ProductNarrative
}) {
  // Prefer curated narrative domains (matt_demo parity) when authored; otherwise
  // derive from granular JSON so the passport cannot overstate the Safety tab.
  const domains =
    narrative.assurance_domains && narrative.assurance_domains.length > 0
      ? narrative.assurance_domains
      : deriveAssuranceDomains(app)

  if (domains.length === 0 && !narrative.regulatory_position) return null

  // Interoperability lives on the Implementation page. Commercial readiness is no longer
  // part of the assurance pack (pending commercial team review) — guard against legacy data.
  const packDomains = domains.filter((d) => d.domain !== 'Interoperability' && !/commercial/i.test(d.domain))

  const material = packDomains.filter((d) => d.status === 'incomplete' || d.status === 'expired')
  const speedNote = narrative.regulatory_position?.assurance_speed_note

  return (
    <PdpSection
      id="assurance"
      shareKey="narrative-assurance"
      title={pdpSectionTitle('assurance')}
      description={
        isMarketPreview(app)
          ? 'These are the assurance items a commissioner would expect to review. They are not held for this product.'
          : 'Your local team retains responsibility for due diligence — we make that faster by providing access to source documents in your workspace once verified.'
      }
    >
      {speedNote && (
        <div className="mb-4">
          <div className="hs-font-bold hs-text-label mb-1" style={{ color: 'var(--text-primary)' }}>
            How we support your local assurance
          </div>
          <p className="nhsuk-body-m nhsuk-u-margin-bottom-0">
            {speedNote}
          </p>
        </div>
      )}

      {material.length > 0 && (
        <div
          className="rounded-lg p-4 mb-4"
          style={{ borderLeft: '8px solid #d5281b', background: '#FDECEA' }}
          role="note"
          aria-label="Material assurance gaps"
        >
          <div className="hs-font-bold hs-text-label mb-1" style={{ color: '#7A1210' }}>
            Material assurance gaps
          </div>
          <ul className="nhsuk-body-m" style={{ color: '#5A1010', margin: 0, paddingLeft: 20 }}>
            {material.map((d) => (
              <li key={d.domain}>
                <strong>{d.domain}:</strong> {d.summary}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* R4-2 B: dedicated regulatory-position card */}
      <PdpRegulatoryPosition narrative={narrative} app={app} />

      {/* R3-2 D: NHS task list for domain status (replaces compact chips) */}
      {packDomains.length > 0 && (
      <>
      <div className="nhsuk-task-list" style={{ marginBottom: 0, marginTop: 40, listStyle: 'none', padding: 0 }}>
        <div className="flex justify-between gap-4" style={{ marginBottom: 0 }}>
          <span className="hs-font-bold" style={{ color: '#212b32' }}>
            Assurance pack
          </span>
        </div>
      </div>
      <ul className="nhsuk-task-list" style={{ marginTop: 0 }}>
        {packDomains.map((d, index) => {
          const hintId = `assurance-${index + 1}-hint`
          const hint = d.summary?.trim()
          const items = d.items ?? []
          return (
            <li key={d.domain} className="nhsuk-task-list__item">
              <div className="nhsuk-task-list__name-and-hint">
                <div className="hs-font-bold">{d.domain}</div>
                {hint && (
                  <div id={hintId} className="nhsuk-task-list__hint hs-text-label">
                    {hint}
                  </div>
                )}
                {items.length > 0 && (
                  <dl
                    className="nhsuk-body-m nhsuk-u-margin-top-2 nhsuk-u-margin-bottom-0"
                    aria-label={`${d.domain} evidence held`}
                  >
                    {items.map((item) => (
                      <div key={item.label} style={{ display: 'flex', flexWrap: 'wrap', gap: '0 6px' }}>
                        <dt style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}:</dt>
                        <dd style={{ margin: 0 }}>{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            </li>
          )
        })}
      </ul>
      </>
      )}

    </PdpSection>
  )
}
