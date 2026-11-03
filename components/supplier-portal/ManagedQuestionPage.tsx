'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { BackLink } from '@/components/BackLink'
import { ErrorSummary } from '@/components/eoi/journey/shared'
import { QuestionField } from '@/components/supplier-onboard/TaskQuestionPage'
import { Button } from '@/components/ui/Button'
import {
  isQuestionAnswered,
  isQuestionVisible,
  questionError,
  questionErrorFieldId,
  questionForDisplay,
  questionKeys,
  taskCaption,
  visibleQuestions,
  type OnboardingSection,
  type OnboardingTask,
  type TaskAnswers,
} from '@/lib/supplierOnboarding'
import { sampleAnswerFor } from '@/lib/supplierOnboardingSampleAnswers'
import {
  managedProductCheckAnswersHref,
  managedProductHref,
  managedProductQuestionHref,
} from '@/lib/supplierPortal'
import { useSupplierPortal } from './useSupplierPortal'

type Props = {
  productId: string
  task: OnboardingTask
  section: OnboardingSection
  /** 1-based physical page in the task. */
  step: number
  /** Answers as last submitted through onboarding. */
  defaults: TaskAnswers
}

/**
 * Change one onboarding answer for an onboarded product. [Provenance: NHS / GOV.UK gap-fill]
 *
 * Renders the same question page as onboarding (QuestionField), but saves into
 * the product's draft rather than the onboarding form. "Save and continue"
 * moves on to any follow-up question the new answer has put on the route and
 * not yet answered; otherwise it returns to the product (or Check your answers).
 */
export default function ManagedQuestionPage(props: Props) {
  return (
    <Suspense fallback={null}>
      <ManagedQuestionPageInner {...props} />
    </Suspense>
  )
}

function ManagedQuestionPageInner({ productId, task, section, step, defaults }: Props) {
  const router = useRouter()
  const returnToCheck = useSearchParams().get('return') === 'check-answers'
  const exitHref = returnToCheck ? managedProductCheckAnswersHref(productId) : managedProductHref(productId)
  const { hydrated, getRecord, saveDraft } = useSupplierPortal()

  const question = task.questions[step - 1]
  const record = getRecord('products', productId)
  const saved = useMemo<TaskAnswers>(
    () => ({ ...defaults, ...(record.values ?? {}), ...(record.draft ?? {}) }),
    [defaults, record],
  )

  const [draft, setDraft] = useState<TaskAnswers>({})
  const [error, setError] = useState<string | undefined>()
  const merged = useMemo(() => ({ ...saved, ...draft }), [saved, draft])

  useEffect(() => {
    if (!hydrated) return
    const initial: TaskAnswers = {}
    for (const key of questionKeys(question)) initial[key] = saved[key] ?? ''
    setDraft(initial)
    // Prefill once per page, after stored state has been read.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, question])

  const offRoute = hydrated && !isQuestionVisible(question, task, saved)
  useEffect(() => {
    if (offRoute) router.replace(exitHref)
  }, [offRoute, router, exitHref])

  if (!hydrated || offRoute) return null

  const withReturn = returnToCheck ? { returnTo: 'check-answers' as const } : undefined

  /** Store only the keys that differ from the current version, so an unchanged page leaves no draft. */
  function persist(changes: TaskAnswers): TaskAnswers {
    const next = { ...saved, ...changes }
    const changed = Object.fromEntries(Object.entries(changes).filter(([key, value]) => value !== (saved[key] ?? '')))
    if (Object.keys(changed).length > 0) saveDraft('products', productId, changed)
    return next
  }

  /** Next follow-up on the route that still needs an answer, else back to where the supplier came from. */
  function continueFrom(answers: TaskAnswers) {
    const next = visibleQuestions(task, answers).find(
      ({ question: q, step: s }) =>
        s > step && !q.hideInSummary && q.type !== 'info' && (q.type === 'blocked' || (!q.optional && !isQuestionAnswered(q, answers))),
    )
    router.push(next ? managedProductQuestionHref(productId, task.slug, next.step, withReturn) : exitHref)
  }

  function saveAndContinue() {
    const message = questionError(question, merged)
    setError(message)
    if (message) return
    continueFrom(persist(draft))
  }

  const blocked = question.type === 'blocked'

  return (
    <div className="nhsuk-width-container nhsuk-main-wrapper">
      <div className="nhsuk-grid-row">
        <div className="nhsuk-grid-column-two-thirds">
          <BackLink href={exitHref} />
          <ErrorSummary errors={error ? [{ field: questionErrorFieldId(question, merged), message: error }] : []} />
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault()
              saveAndContinue()
            }}
          >
            <QuestionField
              question={questionForDisplay(question, () => merged)}
              draft={draft}
              patch={(changes) => {
                setDraft((d) => ({ ...d, ...changes }))
                if (error) setError(undefined)
              }}
              commit={(changes) => {
                setDraft((d) => ({ ...d, ...changes }))
                persist(changes)
              }}
              answers={merged}
              error={error}
              caption={taskCaption(section, task)}
            />

            {blocked ? (
              <p className="nhsuk-body">
                <Link className="nhsuk-link" href={exitHref}>
                  Go back to your product
                </Link>{' '}
                and change your earlier answer, or get support from the HealthStore team.
              </p>
            ) : (
              <>
                <p className="nhsuk-body-m nhsuk-u-margin-top-4 nhsuk-u-margin-bottom-0">
                  <button
                    type="button"
                    className="nhsuk-link"
                    onClick={() => setDraft((d) => ({ ...d, ...sampleAnswerFor(question, merged) }))}
                    style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', textDecoration: 'underline', font: 'inherit' }}
                  >
                    Fill with sample
                  </button>
                </p>
                <div className="nhsuk-u-margin-top-6 flex flex-wrap items-center gap-4">
                  <Button type="submit">Save and continue</Button>
                  <Button type="button" variant="secondary" onClick={() => router.push(exitHref)}>
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
