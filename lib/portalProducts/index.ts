import type { ProductNarrative } from '@/lib/content/productModel'
import type { TaskAnswers } from '@/lib/supplierOnboarding'
import type { ManagedProduct } from '@/lib/supplierPortal'
import { BREATHEWELL_ANSWERS, BREATHEWELL_APP, BREATHEWELL_NARRATIVE, type PortalApp } from './breathewellCopd'
import { RESPIRA_ANSWERS, RESPIRA_APP, RESPIRA_NARRATIVE } from './respiraCbt'

export type { PortalApp }

/** What the HealthStore holds for an onboarded product. */
export type PortalProductRecord = {
  app: PortalApp
  narrative: ProductNarrative
  /** Submitted onboarding answers, flat by question id. */
  answers: TaskAnswers
}

const RECORDS: Record<string, PortalProductRecord> = {
  'breathewell-copd': { app: BREATHEWELL_APP, narrative: BREATHEWELL_NARRATIVE, answers: BREATHEWELL_ANSWERS },
  'respira-cbt': { app: RESPIRA_APP, narrative: RESPIRA_NARRATIVE, answers: RESPIRA_ANSWERS },
}

export function portalProductRecord(product: ManagedProduct): PortalProductRecord {
  const record = RECORDS[product.appSlug]
  if (!record) throw new Error(`No held record for portal product "${product.appSlug}"`)
  return record
}
