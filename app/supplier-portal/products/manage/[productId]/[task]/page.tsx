import { notFound } from 'next/navigation'
import ManagedQuestionPage from '@/components/supplier-portal/ManagedQuestionPage'
import { ALL_TASKS, findTask } from '@/lib/supplierOnboarding'
import { MANAGED_PRODUCTS, PORTAL_SERVICE_NAME, findManagedProduct } from '@/lib/supplierPortal'
import { productDefaults } from '@/lib/supplierPortalContent'

type Params = Promise<{ productId: string; task: string }>

export function generateStaticParams() {
  return MANAGED_PRODUCTS.flatMap((p) => ALL_TASKS.map((t) => ({ productId: p.id, task: t.slug })))
}

export async function generateMetadata({ params }: { params: Params }) {
  const { productId, task } = await params
  const product = findManagedProduct(productId)
  const match = findTask(task)
  if (!product || !match) return { title: PORTAL_SERVICE_NAME }
  const question = match.task.questions[0]
  return { title: `${question.pageTitle ?? question.label} — ${product.name} — ${PORTAL_SERVICE_NAME}` }
}

/** First question page of a task for an onboarded product. Later pages are at [task]/[step]. */
export default async function ManagedProductTaskPage({ params }: { params: Params }) {
  const { productId, task } = await params
  const product = findManagedProduct(productId)
  const match = findTask(task)
  if (!product || !match || match.task.questions.length === 0) notFound()
  return (
    <ManagedQuestionPage
      productId={product.id}
      task={match.task}
      section={match.section}
      step={1}
      defaults={productDefaults(product)}
    />
  )
}
