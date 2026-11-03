import type { App } from '@/lib/data'
import { PdpSection } from '@/components/PdpSection'
import { pdpSectionTitle } from '@/lib/pdpSections'
import { splitPdpEvidence } from '@/lib/pdpEvidence'
import PdpClinicalPublications from '@/components/product/PdpClinicalPublications'

/** "Clinical publications and evaluations" — study-grade evidence, shown on the Peer and patient experience page. */
export default function PdpPublicationsSection({ app }: { app: App }) {
  const { publications } = splitPdpEvidence(app, { showNarrativeSpine: true, hasNhsExperience: false })
  if (publications.length === 0) return null

  return (
    <PdpSection
      id="clinical-publications"
      shareKey="narrative-clinical-publications"
      title={pdpSectionTitle('clinical-publications')}
    >
      <PdpClinicalPublications publications={publications} showHeading={false} />
    </PdpSection>
  )
}
