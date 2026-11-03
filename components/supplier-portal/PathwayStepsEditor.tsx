'use client'

import { NhsRadios } from '@/components/nhs/NhsRadios'
import { FormField, TextInput } from '@/components/ui/FormField'
import { PATHWAY_CHANGES, type PathwayStepInput } from '@/lib/supplierProductPage'
import { AddAnotherList } from './AddAnotherList'

/**
 * One column of the treatment pathway, built step by step.
 * [Provenance: Bespoke — builds on AddAnotherList (adapted MoJ "Add another") with
 * NHS Text input for the step and inline NHS Radios for what changes. No NHS or
 * GOV.UK component exists for authoring an ordered process.]
 *
 * Steps are ordered (Move up / Move down). With `markChanges`, each step is
 * marked Unchanged, Changed or New; that drives the NHS Tags on the diagram.
 */
export function PathwayStepsEditor({
  id,
  steps,
  onChange,
  markChanges = false,
  errorFor,
}: {
  id: string
  steps: PathwayStepInput[]
  onChange: (steps: PathwayStepInput[]) => void
  markChanges?: boolean
  errorFor?: (field: string) => string | undefined
}) {
  return (
    <AddAnotherList
      id={id}
      items={steps}
      onChange={onChange}
      newItem={(): PathwayStepInput => (markChanges ? { label: '', change: 'unchanged' } : { label: '' })}
      itemName="step"
      reorderable
      renderItem={(step, index, update) => (
        <>
          <FormField
            id={`${id}-${index}-label`}
            label="What happens at this step"
            error={errorFor?.(`${id}-${index}-label`)}
          >
            {(field) => (
              <TextInput {...field} value={step.label} onChange={(e) => update({ ...step, label: e.target.value })} />
            )}
          </FormField>
          {markChanges && (
            <NhsRadios
              id={`${id}-${index}-change`}
              legend="How does this step compare with the current pathway?"
              inline
              error={errorFor?.(`${id}-${index}-change`)}
              options={PATHWAY_CHANGES}
              value={step.change ?? 'unchanged'}
              onChange={(change) => update({ ...step, change: change as PathwayStepInput['change'] })}
            />
          )}
        </>
      )}
    />
  )
}
