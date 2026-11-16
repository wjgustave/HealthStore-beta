'use client'

import { useRouter } from 'next/navigation'
import { AnswerSummaryList } from '@/components/supplier-onboard/AnswerSummaryList'
import { Button } from '@/components/ui/Button'
import { SECTIONS, sectionHeading, taskListLabel, type TaskAnswers } from '@/lib/supplierOnboarding'
import {
  findManagedProduct,
  managedProductCheckAnswersHref,
  managedProductQuestionHref,
} from '@/lib/supplierPortal'
import { managedProductStatus } from './portalStatus'
import { StatusSummary } from './StatusSummary'
import { useSupplierPortal } from './useSupplierPortal'

/**
 * An onboarded product's information. [Provenance: NHS Summary list + Check answers pattern]
 *
 * Laid out exactly like the onboarding form it was submitted with: one section
 * per onboarding section, one NHS Summary list per task, only the questions on
 * the supplier's route. Each row links to the same question page as onboarding.
 * Changes are held as a draft until "Submit changes", which applies them
 * straight away. Documents show the latest version only (the HealthStore keeps
 * earlier versions); there is deliberately no delete.
 */
export default function ManagedProductView({
  productId,
  defaults,
}: {
  productId: string
  /** Answers as last submitted through onboarding. */
  defaults: TaskAnswers
}) {
  const router = useRouter()
  const product = findManagedProduct(productId)!
  const { hydrated, getRecord } = useSupplierPortal()

  const record = getRecord('products', productId)
  const status = hydrated ? managedProductStatus(product, record) : undefined
  if (!hydrated || !status) return null

  const answers: TaskAnswers = { ...defaults, ...(record.values ?? {}), ...(record.draft ?? {}) }
  const answersFor = () => answers

  return (
    <>
      <h1 className="nhsuk-heading-xl">
        <span className="nhsuk-caption-l">Product information</span>
        {product.name}
      </h1>

      <StatusSummary
        status={status}
        lastUpdated={record.lastUpdated ?? product.lastUpdated}
        draftMessage="You have changes saved as a draft. They will not be used until you submit them."
      />

      <p className="nhsuk-body-m nhsuk-u-margin-top-5">
        This is the information you gave when you onboarded {product.name}. You can change an answer or replace a
        document with a newer version. Only the latest version of each document is shown; the NHS HealthStore keeps
        previous versions.
      </p>

      {SECTIONS.map((section) => (
        <section key={section.id} aria-labelledby={`${section.id}-heading`} className="nhsuk-u-margin-top-7">
          <h2 id={`${section.id}-heading`} className="nhsuk-heading-m">
            {sectionHeading(section)}
          </h2>
          {section.tasks.map((task) => (
            <AnswerSummaryList
              key={task.id}
              task={task}
              answersFor={answersFor}
              showTaskTitle
              taskLabel={taskListLabel(task)}
              showQuestionCode={false}
              replaceUploads
              changeHref={(step) => managedProductQuestionHref(productId, task.slug, step)}
            />
          ))}
        </section>
      ))}

      {status === 'draft_changes' && (
        <div className="nhsuk-u-margin-top-7">
          <h2 className="nhsuk-heading-m">Submit your changes</h2>
          <p className="nhsuk-body-m">Your changes will be used as soon as you submit them.</p>
          <Button type="button" onClick={() => router.push(managedProductCheckAnswersHref(productId))}>
            Submit changes
          </Button>
        </div>
      )}
    </>
  )
}
