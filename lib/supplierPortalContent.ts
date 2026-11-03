import { portalProductRecord, type PortalProductRecord } from '@/lib/portalProducts'
import { SAMPLE_SUPPLIER, type ManagedProduct, type ReadOnlyRow } from '@/lib/supplierPortal'

/**
 * Server-side starting values for the Supplier portal. Kept apart from
 * lib/supplierPortal.ts so client components do not bundle the held records;
 * pages pass what they need down as props.
 */

/** Product information as last submitted: the onboarding answers, flat by question id. */
export function productDefaults(product: ManagedProduct): Record<string, string> {
  return portalProductRecord(product).answers
}

/** Everything the product page editor and preview start from. */
export function productPageBase(product: ManagedProduct): PortalProductRecord {
  return portalProductRecord(product)
}

/**
 * Supplier page content that comes from supplier onboarding and cannot be edited here.
 * The editor adds "Products on the HealthStore", which depends on which onboarding forms are submitted.
 */
export function supplierPageReadOnly(): ReadOnlyRow[] {
  return [
    { label: 'Company name', value: SAMPLE_SUPPLIER.name },
    { label: 'Registered address', value: SAMPLE_SUPPLIER.registeredAddress },
    { label: 'Company number', value: SAMPLE_SUPPLIER.companyNumber },
  ]
}
