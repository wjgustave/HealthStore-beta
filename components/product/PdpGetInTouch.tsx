import { PdpSection } from '@/components/PdpSection'
import { pdpSectionTitle } from '@/lib/pdpSections'
import { STORE_ACCENT } from '@/lib/storeAccent'
import PdpExpressInterestCallout from '@/components/product/PdpExpressInterestCallout'

/** "Get commissioning support" — the express-interest callout on its own page. */
export default function PdpGetInTouch({ slug }: { slug: string }) {
  return (
    <PdpSection id="get-in-touch" shareKey="narrative-get-in-touch" title={pdpSectionTitle('get-in-touch')}>
      <PdpExpressInterestCallout accent={STORE_ACCENT} slug={slug} />
    </PdpSection>
  )
}
