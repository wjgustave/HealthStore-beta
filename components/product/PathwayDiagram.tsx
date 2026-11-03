import type { PathwayStep } from '@/lib/content/productModel'

const CHANGE_TAG: Partial<Record<NonNullable<PathwayStep['change']>, { label: string; className: string }>> = {
  added: { label: 'New', className: 'nhsuk-tag nhsuk-tag--green' },
  changed: { label: 'Changed', className: 'nhsuk-tag nhsuk-tag--blue' },
}

/** "Step one → step two [New]" — the text version, also used by the supplier portal. */
export function pathwayText(steps: PathwayStep[]): string {
  return steps
    .map((s) => {
      const tag = s.change ? CHANGE_TAG[s.change] : undefined
      return tag ? `${s.label} (${tag.label.toLowerCase()})` : s.label
    })
    .join(', then ')
}

/**
 * Current pathway against the pathway with the product.
 * [Provenance: Bespoke layout (hs-pathway-*, no NHS or GOV.UK equivalent) built from
 * NHS parts — Tag for new and changed steps, Details for the text version.]
 *
 * Used by the PDP "How X changes a treatment pathway" section, the supplier
 * portal preview and the pathway editor's live diagram, so all three match.
 */
export default function PathwayDiagram({
  productName,
  currentSteps,
  futureSteps,
}: {
  productName: string
  currentSteps: PathwayStep[]
  futureSteps: PathwayStep[]
}) {
  const hasCurrent = currentSteps.length > 0
  const hasFuture = futureSteps.length > 0
  if (!hasCurrent && !hasFuture) return null

  return (
    <div>
      <div className="hs-pathway-visual" style={hasCurrent && hasFuture ? undefined : { gridTemplateColumns: '1fr' }}>
        {hasCurrent && (
          <Column heading="Current pathway" className="hs-pathway-current" steps={currentSteps} />
        )}
        {hasCurrent && hasFuture && (
          <div className="hs-pathway-divider" aria-hidden>
            →
          </div>
        )}
        {hasFuture && <Column heading={`With ${productName}`} className="hs-pathway-future" steps={futureSteps} />}
      </div>
      <details className="nhsuk-details">
        <summary className="nhsuk-details__summary">
          <span className="nhsuk-details__summary-text">Text-only pathway description</span>
        </summary>
        <div className="nhsuk-details__text">
          {hasCurrent && (
            <p>
              <strong>Current pathway:</strong> {pathwayText(currentSteps)}.
            </p>
          )}
          {hasFuture && (
            <p className="nhsuk-u-margin-bottom-0">
              <strong>With {productName}:</strong> {pathwayText(futureSteps)}.
            </p>
          )}
        </div>
      </details>
    </div>
  )
}

function Column({ heading, className, steps }: { heading: string; className: string; steps: PathwayStep[] }) {
  return (
    <div className={`hs-pathway-col ${className}`}>
      <h3 className="hs-pathway-heading">{heading}</h3>
      <ol className="hs-pathway-steps" aria-label={heading}>
        {steps.map((step, i) => {
          const tag = step.change ? CHANGE_TAG[step.change] : undefined
          return (
            <li key={step.id}>
              <div
                className={`hs-pathway-step ${step.change === 'added' ? 'hs-pathway-added' : step.change === 'changed' ? 'hs-pathway-changed' : ''}`}
              >
                {step.label}
                {tag && <strong className={`${tag.className} hs-pathway-tag`}>{tag.label}</strong>}
              </div>
              {i < steps.length - 1 && (
                <div className="hs-pathway-arrow" aria-hidden>
                  ↓
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
