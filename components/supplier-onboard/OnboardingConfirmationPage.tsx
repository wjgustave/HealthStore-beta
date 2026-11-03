'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formBasePath } from '@/lib/supplierOnboarding'
import { PORTAL_PATHS } from '@/lib/supplierPortal'
import { useOnboardingProgress } from './useOnboardingProgress'

/**
 * Onboarding submitted — confirmation. [Provenance: NHS]
 *
 * NHS Panel with the product name, then a short next-step paragraph (with a
 * Manage products link) and a Dashboard link. Guard: without a recorded
 * submission there is nothing to confirm, so direct visits return to the task
 * list.
 */
export default function OnboardingConfirmationPage({
  formId,
  productName,
}: {
  formId: string
  productName: string
}) {
  const router = useRouter()
  const { hydrated, submission } = useOnboardingProgress(formId)
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (hydrated && !submission) router.replace(formBasePath(formId))
  }, [hydrated, submission, router, formId])

  useEffect(() => {
    if (submission) {
      window.scrollTo(0, 0)
      headingRef.current?.focus()
    }
  }, [submission])

  if (!submission) return null

  return (
    <div className="nhsuk-width-container nhsuk-main-wrapper">
      <div className="nhsuk-grid-row">
        <div className="nhsuk-grid-column-two-thirds">
          <div className="nhsuk-panel" style={{ textAlign: 'center' }}>
            <h1 ref={headingRef} tabIndex={-1} className="nhsuk-panel__title outline-none">
              {productName} has been onboarded
            </h1>
          </div>
          <p style={{ fontSize: 'var(--text-body)' }}>
            Your product has been onboarded to the NHS HealthStore. You can keep its information and
            documents up to date from <Link className="nhsuk-link" href={PORTAL_PATHS.manage}>Manage products</Link>.
          </p>
          <p style={{ fontSize: 'var(--text-body)' }}>
            <Link className="nhsuk-link" href={PORTAL_PATHS.dashboard}>
              Dashboard
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
