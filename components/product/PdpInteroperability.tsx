import type { App } from '@/lib/data'
import type { ProductNarrative } from '@/lib/content/productModel'
import { PdpSection } from '@/components/PdpSection'
import { pdpSectionTitle } from '@/lib/pdpSections'
import { deriveAssuranceDomains } from '@/lib/content/assuranceDomains'

/** "Interoperability" — the Interoperability assurance domain, shown on the Implementation page. */
export default function PdpInteroperability({ app, narrative }: { app: App; narrative: ProductNarrative }) {
  const domains =
    narrative.assurance_domains && narrative.assurance_domains.length > 0
      ? narrative.assurance_domains
      : deriveAssuranceDomains(app)
  const interop = domains.find((d) => d.domain === 'Interoperability')
  if (!interop?.summary) return null

  return (
    <PdpSection id="interoperability" shareKey="narrative-interoperability" title={pdpSectionTitle('interoperability')}>
      <p className="nhsuk-body-m">{interop.summary}</p>
    </PdpSection>
  )
}
