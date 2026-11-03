import type { App } from '@/lib/data'
import type { ProductNarrative } from '@/lib/content/productModel'
import { PdpSection } from '@/components/PdpSection'
import { pdpSectionTitle } from '@/lib/pdpSections'
import PathwayDiagram from './PathwayDiagram'

/** "How it helps" section — what the product does and how it changes the pathway. */
export default function PdpHowItHelps({ app, narrative }: { app: App; narrative: ProductNarrative }) {
  const bullets = narrative.what_it_does_bullets ?? []
  const pathway = narrative.pathway_model
  if (bullets.length === 0 && !pathway) return null

  return (
    <PdpSection
      id="how-it-helps"
      shareKey="narrative-how-it-helps"
      title={pdpSectionTitle('how-it-helps', { appName: app.app_name })}
    >
      {bullets.length > 0 && (
        <ul className="nhsuk-list nhsuk-list--bullet">
          {bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      )}

      {pathway && (
        <div>
          <h3 className="nhsuk-heading-s hs-pdp-subheading">
            How it changes the pathway
          </h3>
          <PathwayDiagram
            productName={app.app_name}
            currentSteps={pathway.current_steps}
            futureSteps={pathway.future_steps}
          />
        </div>
      )}
    </PdpSection>
  )
}
