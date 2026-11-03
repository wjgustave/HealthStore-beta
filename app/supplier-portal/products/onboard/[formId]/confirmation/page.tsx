import { notFound } from 'next/navigation'
import OnboardingConfirmationPage from '@/components/supplier-onboard/OnboardingConfirmationPage'
import { SERVICE_NAME } from '@/lib/supplierOnboarding'
import { ONBOARDING_FORMS, findOnboardingForm } from '@/lib/supplierPortal'

type Params = Promise<{ formId: string }>

export function generateStaticParams() {
  return ONBOARDING_FORMS.map((f) => ({ formId: f.id }))
}

export async function generateMetadata({ params }: { params: Params }) {
  const form = findOnboardingForm((await params).formId)
  return { title: `${form ? `${form.productName} has been onboarded — ` : ''}${SERVICE_NAME}` }
}

/** Static segment: takes precedence over the .../[formId]/[task] route. */
export default async function SupplierOnboardConfirmationPage({ params }: { params: Params }) {
  const { formId } = await params
  const form = findOnboardingForm(formId)
  if (!form) notFound()
  return <OnboardingConfirmationPage formId={form.id} productName={form.productName} />
}
