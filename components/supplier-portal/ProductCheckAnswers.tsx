'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BackLink } from '@/components/BackLink'
import { AnswerSummaryList } from '@/components/supplier-onboard/AnswerSummaryList'
import { Button } from '@/components/ui/Button'
import {
  SECTIONS,
  questionKeys,
  sectionHeading,
  taskListLabel,
  visibleQuestions,
  type OnboardingQuestion,
  type TaskAnswers,
} from '@/lib/supplierOnboarding'
import {
  findManagedProduct,
  managedProductConfirmationHref,
  managedProductHref,
  managedProductQuestionHref,
} from '@/lib/supplierPortal'
import { managedProductStatus } from './portalStatus'
import { useSupplierPortal } from './useSupplierPortal'

const DECLARATION =
  'By submitting these changes you confirm that the information and documents are accurate and up to date. Your changes will be used straight away.'

/**
 * Check your answers before submitting product updates.
 * [Provenance: NHS / GOV.UK "Check answers" pattern]
 *
 * Lists only the onboarding answers that differ from the current version,
 * grouped by onboarding section and task. Reachable only when the product has
 * draft changes; otherwise redirects back to the product page.
 */
export default function ProductCheckAnswers({
  productId,
  defaults,
}: {
  productId: string
  defaults: TaskAnswers
}) {
  const router = useRouter()
  const product = findManagedProduct(productId)!
  const productHref = managedProductHref(productId)
  const { hydrated, getRecord, submitChanges } = useSupplierPortal()
  const [submitting, setSubmitting] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)

  const record = getRecord('products', productId)
  const status = hydrated ? managedProductStatus(product, record) : undefined
  const draft = record.draft ?? {}
  const baseline: TaskAnswers = { ...defaults, ...(record.values ?? {}) }
  const answers: TaskAnswers = { ...baseline, ...draft }
  const isChanged = (question: OnboardingQuestion) =>
    questionKeys(question).some((key) => key in draft && draft[key] !== (baseline[key] ?? ''))
  const hasChanges = SECTIONS.some((s) =>
    s.tasks.some((t) => visibleQuestions(t, answers).some(({ question }) => isChanged(question))),
  )
  const canSubmit = status === 'draft_changes' && hasChanges

  useEffect(() => {
    if (hydrated && !canSubmit && !submitting) router.replace(productHref)
  }, [hydrated, canSubmit, submitting, router, productHref])

  useEffect(() => {
    if (hydrated && canSubmit) {
      window.scrollTo(0, 0)
      headingRef.current?.focus()
    }
  }, [hydrated, canSubmit])

  if (!hydrated || !canSubmit) return null

  function confirmAndSubmit() {
    if (submitting) return
    setSubmitting(true)
    submitChanges('products', productId)
    router.push(managedProductConfirmationHref(productId))
  }

  return (
    <div className="nhsuk-width-container nhsuk-main-wrapper">
      <div className="nhsuk-grid-row">
        <div className="nhsuk-grid-column-two-thirds">
          <BackLink href={productHref} />
          <h1 ref={headingRef} tabIndex={-1} className="nhsuk-heading-xl outline-none">
            <span className="nhsuk-caption-l">{product.name}</span>
            Check your answers before submitting
          </h1>
          <p className="nhsuk-body-m">Only the answers you have changed are shown below.</p>

          {SECTIONS.map((section) => {
            const tasks = section.tasks.filter((t) =>
              visibleQuestions(t, answers).some(({ question }) => isChanged(question)),
            )
            if (tasks.length === 0) return null
            return (
              <section key={section.id} className="nhsuk-u-margin-top-7">
                <h2 className="nhsuk-heading-m">{sectionHeading(section)}</h2>
                {tasks.map((task) => (
                  <AnswerSummaryList
                    key={task.id}
                    task={task}
                    answersFor={() => answers}
                    include={isChanged}
                    taskLabel={taskListLabel(task)}
                    showQuestionCode={false}
                    replaceUploads
                    changeHref={(step) =>
                      managedProductQuestionHref(productId, task.slug, step, { returnTo: 'check-answers' })
                    }
                  />
                ))}
              </section>
            )
          })}

          <h2 className="nhsuk-heading-m nhsuk-u-margin-top-7">Submit your changes</h2>
          <p className="nhsuk-body-m">{DECLARATION}</p>
          <Button variant="confirm" onClick={confirmAndSubmit} loading={submitting}>
            {submitting ? 'Submitting…' : 'Confirm and submit'}
          </Button>
        </div>
      </div>
    </div>
  )
}
