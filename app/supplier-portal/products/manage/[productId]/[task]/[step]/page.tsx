import { notFound, redirect } from 'next/navigation'
import ManagedQuestionPage from '@/components/supplier-portal/ManagedQuestionPage'
import { ALL_TASKS, findTask } from '@/lib/supplierOnboarding'
import {
  MANAGED_PRODUCTS,
  PORTAL_SERVICE_NAME,
  findManagedProduct,
  managedProductQuestionHref,
} from '@/lib/supplierPortal'
import { productDefaults } from '@/lib/supplierPortalContent'

type Params = Promise<{ productId: string; task: string; step: string }>

export function generateStaticParams() {
  return MANAGED_PRODUCTS.flatMap((p) =>
    ALL_TASKS.flatMap((t) => t.questions.slice(1).map((_, i) => ({ productId: p.id, task: t.slug, step: String(i + 2) }))),
  )
}

function parseStep(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null
  const n = Number(raw)
  return n >= 1 ? n : null
}

export async function generateMetadata({ params }: { params: Params }) {
  const { productId, task, step: rawStep } = await params
  const product = findManagedProduct(productId)
  const match = findTask(task)
  const step = parseStep(rawStep)
  const question = step ? match?.task.questions[step - 1] : undefined
  if (!product || !question) return { title: PORTAL_SERVICE_NAME }
  return { title: `${question.pageTitle ?? question.label} — ${product.name} — ${PORTAL_SERVICE_NAME}` }
}

export default async function ManagedProductStepPage({ params }: { params: Params }) {
  const { productId, task, step: rawStep } = await params
  const product = findManagedProduct(productId)
  const match = findTask(task)
  const step = parseStep(rawStep)
  if (!product || !match || !step || !match.task.questions[step - 1]) notFound()
  if (step === 1) redirect(managedProductQuestionHref(product.id, match.task.slug, 1))
  return (
    <ManagedQuestionPage
      productId={product.id}
      task={match.task}
      section={match.section}
      step={step}
      defaults={productDefaults(product)}
    />
  )
}
