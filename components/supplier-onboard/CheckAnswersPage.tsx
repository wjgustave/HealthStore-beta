'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BackLink } from '@/components/BackLink'
import { Button } from '@/components/ui/Button'
import { useSupplierPortal } from '@/components/supplier-portal/useSupplierPortal'
import {
  ALL_TASKS,
  SECTIONS,
  SUBMISSION_DECLARATION,
  confirmationPath,
  formBasePath,
  sectionHeading,
  taskListLabel,
  taskStepHref,
} from '@/lib/supplierOnboarding'
import { managedProductForForm } from '@/lib/supplierPortal'
import { AnswerSummaryList } from './AnswerSummaryList'
import { useOnboardingProgress } from './useOnboardingProgress'

export { formatAnswer } from './AnswerSummaryList'

/**
 * Check your answers. [Provenance: NHS / GOV.UK "Check answers" pattern]
 *
 * Replays every answer from every section as NHS Summary lists (one per task,
 * grouped under the numbered section headings from the task list), each row
 * with a Change link back to its question page. Only questions on the
 * supplier's route (see `visibleQuestions`) are shown. The declaration sits above the
 * NHS green "Confirm and submit" action; confirming onboards the product and
 * moves to the confirmation page.
 *
 * Guard: reachable only once every task is Completed (the Submit button that
 * leads here is disabled otherwise); direct visits are sent back to the list.
 */
export default function CheckAnswersPage({ formId }: { formId: string }) {
  const router = useRouter()
  const { hydrated, allComplete, getAnswers, completeSubmission } = useOnboardingProgress(formId)
  const { submitChanges } = useSupplierPortal()
  const taskListHref = formBasePath(formId)
  const [submitting, setSubmitting] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (hydrated && !allComplete && !submitting) router.replace(taskListHref)
  }, [hydrated, allComplete, submitting, router, taskListHref])

  useEffect(() => {
    if (hydrated && allComplete) headingRef.current?.focus()
  }, [hydrated, allComplete])

  if (!hydrated || !allComplete) return null

  function confirmAndSubmit() {
    if (submitting) return
    setSubmitting(true)
    completeSubmission()
    const product = managedProductForForm(formId)
    if (product) {
      submitChanges('products', product.id, Object.assign({}, ...ALL_TASKS.map((t) => getAnswers(t.id))))
    }
    router.push(confirmationPath(formId))
  }

  return (
    <div className="nhsuk-width-container nhsuk-main-wrapper">
      <div className="nhsuk-grid-row">
        <div className="nhsuk-grid-column-two-thirds">
          <BackLink href={taskListHref} />
          <h1 ref={headingRef} tabIndex={-1} className="nhsuk-heading-xl outline-none">
            Check your answers before submitting
          </h1>

          {SECTIONS.map((section) => (
            <section key={section.id} aria-labelledby={`${section.id}-check-heading`} className="nhsuk-u-margin-bottom-7">
              <h2 id={`${section.id}-check-heading`} className="nhsuk-heading-m">
                {sectionHeading(section)}
              </h2>
              {section.tasks.map((task) => (
                <AnswerSummaryList
                  key={task.id}
                  task={task}
                  answersFor={getAnswers}
                  changeHref={(step) => taskStepHref(formId, task, step)}
                  showQuestionCode={false}
                  taskLabel={taskListLabel(task)}
                />
              ))}
            </section>
          ))}

          <h2 className="nhsuk-heading-m">Submit your onboarding form</h2>
          <p className="nhsuk-body-m">{SUBMISSION_DECLARATION}</p>
          <Button variant="confirm" onClick={confirmAndSubmit} loading={submitting}>
            {submitting ? 'Submitting…' : 'Confirm and submit'}
          </Button>
        </div>
      </div>
    </div>
  )
}
