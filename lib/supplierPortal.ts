/**
 * Supplier portal — routes, sample data and status model.
 *
 * Structure follows the HealthStore Supplier Portal information architecture
 * (Lucidspark "Supplier onboarding" frame). Sections marked "scope TBC" there
 * (Account management, Contact us) are skeleton pages; Company information is
 * the Section A questionnaire (see lib/supplierCompany.ts).
 *
 * Prototype: there is no back office. Sample products and their starting
 * statuses live here; supplier edits are kept in the browser (see
 * components/supplier-portal/useSupplierPortal.ts).
 */

export const PORTAL_NAME = 'Supplier portal'
export const PORTAL_SERVICE_NAME = 'HealthStore Supplier portal'

export const PORTAL_BASE_PATH = '/supplier-portal'

export const PORTAL_PATHS = {
  dashboard: PORTAL_BASE_PATH,
  signIn: `${PORTAL_BASE_PATH}/sign-in`,
  products: `${PORTAL_BASE_PATH}/products`,
  manage: `${PORTAL_BASE_PATH}/products/manage`,
  onboard: `${PORTAL_BASE_PATH}/products/onboard`,
  published: `${PORTAL_BASE_PATH}/published`,
  supplierPage: `${PORTAL_BASE_PATH}/published/supplier`,
  company: `${PORTAL_BASE_PATH}/company`,
  account: `${PORTAL_BASE_PATH}/account`,
  contact: `${PORTAL_BASE_PATH}/contact`,
} as const

export function managedProductHref(productId: string): string {
  return `${PORTAL_PATHS.manage}/${productId}`
}

export function managedProductCheckAnswersHref(productId: string): string {
  return `${managedProductHref(productId)}/check-answers`
}

export function managedProductConfirmationHref(productId: string): string {
  return `${managedProductHref(productId)}/confirmation`
}

export function publishedProductHref(productId: string): string {
  return `${PORTAL_PATHS.published}/products/${productId}`
}

export function publishedProductCheckAnswersHref(productId: string): string {
  return `${publishedProductHref(productId)}/check-answers`
}

export function publishedProductConfirmationHref(productId: string): string {
  return `${publishedProductHref(productId)}/confirmation`
}

export function publishedSupplierCheckAnswersHref(): string {
  return `${PORTAL_PATHS.supplierPage}/check-answers`
}

export function publishedSupplierConfirmationHref(): string {
  return `${PORTAL_PATHS.supplierPage}/confirmation`
}

export function managedProductQuestionHref(
  productId: string,
  taskSlug: string,
  step: number,
  options?: { returnTo?: 'check-answers' },
): string {
  const href = `${managedProductHref(productId)}/${taskSlug}${step > 1 ? `/${step}` : ''}`
  return options?.returnTo === 'check-answers' ? `${href}?return=check-answers` : href
}

export function publishedProductSectionHref(productId: string, sectionId: string): string {
  return `${publishedProductHref(productId)}/${sectionId}`
}

/** Full product page preview. `published` shows the submitted version only. */
export function publishedProductPreviewHref(productId: string, options?: { published?: boolean }): string {
  const href = `${publishedProductHref(productId)}/preview`
  return options?.published ? `${href}?version=published` : href
}

/** Prototype dummy answers for supplier page fields (fill shortcut). */
export const PUBLISHED_PAGE_DUMMY_ANSWERS: Record<string, string> = {
  about:
    'Aurora Health develops clinician-supported digital therapeutics for common mental health conditions, used by NHS Talking Therapies services to extend capacity between face-to-face appointments.',
  website: 'https://www.aurora-health.example',
  enquiries_email: 'nhs@aurora-health.example',
}

/** True for every page in the portal, including sign-in. */
export function isSupplierPortalPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  return pathname === PORTAL_BASE_PATH || pathname.startsWith(`${PORTAL_BASE_PATH}/`)
}

/**
 * Pages that keep the "no navigation" NHS header: sign-in, onboarding form
 * questions / check answers / confirmation, Manage products check answers /
 * confirmation, Published pages check answers / confirmation, and Company
 * information questions / check answers / confirmation.
 */
export function isPortalFocusedPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  if (pathname === PORTAL_PATHS.signIn) return true
  if (pathname.startsWith(`${PORTAL_PATHS.company}/`)) {
    const segments = pathname.slice(PORTAL_PATHS.company.length + 1).split('/').filter(Boolean)
    return segments[0] === 'questions' || segments[0] === 'check-answers' || segments[0] === 'confirmation'
  }
  if (pathname.startsWith(`${PORTAL_PATHS.onboard}/`)) {
    return pathname.slice(PORTAL_PATHS.onboard.length + 1).split('/').filter(Boolean).length > 1
  }
  if (pathname.startsWith(`${PORTAL_PATHS.manage}/`)) {
    const segments = pathname.slice(PORTAL_PATHS.manage.length + 1).split('/').filter(Boolean)
    return segments.length === 2 && (segments[1] === 'check-answers' || segments[1] === 'confirmation')
  }
  if (pathname.startsWith(`${PORTAL_PATHS.published}/`)) {
    const segments = pathname.slice(PORTAL_PATHS.published.length + 1).split('/').filter(Boolean)
    // products/[id]/check-answers|confirmation or supplier/check-answers|confirmation
    if (segments[0] === 'products' && segments.length === 3) {
      return segments[2] === 'check-answers' || segments[2] === 'confirmation'
    }
    if (segments[0] === 'supplier' && segments.length === 2) {
      return segments[1] === 'check-answers' || segments[1] === 'confirmation'
    }
  }
  return false
}

/* ------------------------------------------------------------------------ */
/* Statuses                                                                  */
/* ------------------------------------------------------------------------ */

/*
 * Submissions are accepted as soon as they are made, so there are no review
 * statuses (in review, action needed).
 */

/** Onboarding form statuses. */
export type OnboardingFormStatus = 'incomplete' | 'submitted'

/** Onboarded product statuses. */
export type ManagedProductStatus = 'up_to_date' | 'draft_changes'

/**
 * Commissioning Store page statuses. A page starts Unpublished; edits saved to a
 * page that has been published become Unpublished changes until submitted.
 */
export type PublishedPageStatus = 'published' | 'unpublished' | 'unpublished_changes'

export type PortalStatus = OnboardingFormStatus | ManagedProductStatus | PublishedPageStatus

/* ------------------------------------------------------------------------ */
/* Sample supplier                                                           */
/* ------------------------------------------------------------------------ */

export const SAMPLE_SUPPLIER = {
  name: 'Aurora Health Limited',
  contactName: 'Brandson Sanderson',
  email: 'brandson.sanderson@aurora-health.example',
  /** Supplier information held from supplier onboarding (read-only on the Supplier page). */
  registeredAddress: '14 Canal Wharf, Leeds LS1 4DY',
  companyNumber: '14285736',
  icoRegistration: 'ZA987654',
}

/* ------------------------------------------------------------------------ */
/* Product onboarding                                                        */
/* ------------------------------------------------------------------------ */

export type OnboardingForm = {
  /** URL segment and storage key for this product's form. */
  id: string
  productName: string
  /** ISO date the form was started (shown until the supplier saves something). */
  startedOn: string
}

/** Products awaiting onboarding. */
export const ONBOARDING_FORMS: OnboardingForm[] = [
  { id: 'respira-cbt', productName: 'Respira CBT', startedOn: '2026-09-02' },
]

export function findOnboardingForm(formId: string): OnboardingForm | undefined {
  return ONBOARDING_FORMS.find((f) => f.id === formId)
}

/* ------------------------------------------------------------------------ */
/* Manage products                                                           */
/* ------------------------------------------------------------------------ */

export type ContentField = {
  id: string
  label: string
  hint?: string
  type: 'text' | 'textarea'
}

/** Content shown read-only because it comes from onboarding. */
export type ReadOnlyRow = { label: string; value: string }

/**
 * An onboarded product. Its information is the onboarding questionnaire
 * (lib/supplierOnboarding.ts), stored as flat answers keyed by question id.
 */
export type ManagedProduct = {
  id: string
  /** Key of the held product record (lib/portalProducts). */
  appSlug: string
  name: string
  /** ISO date of the last update. */
  lastUpdated: string
  /** Starting status before the supplier changes anything. */
  status: ManagedProductStatus
  /**
   * The onboarding form this product comes from. The product (and its page)
   * only appears once that form has been submitted.
   */
  onboardingFormId?: string
}

/**
 * BreatheWell COPD is already onboarded. Respira CBT joins it once its
 * onboarding form (ONBOARDING_FORMS) is submitted.
 */
export const MANAGED_PRODUCTS: ManagedProduct[] = [
  {
    id: 'breathewell-copd',
    appSlug: 'breathewell-copd',
    name: 'BreatheWell COPD',
    lastUpdated: '2026-06-03',
    status: 'up_to_date',
  },
  {
    id: 'respira-cbt',
    appSlug: 'respira-cbt',
    name: 'Respira CBT',
    lastUpdated: '2026-09-22',
    status: 'up_to_date',
    onboardingFormId: 'respira-cbt',
  },
]

export function findManagedProduct(productId: string): ManagedProduct | undefined {
  return MANAGED_PRODUCTS.find((p) => p.id === productId)
}

/** The managed product an onboarding form becomes once it is submitted. */
export function managedProductForForm(formId: string): ManagedProduct | undefined {
  return MANAGED_PRODUCTS.find((p) => p.onboardingFormId === formId)
}

/* ------------------------------------------------------------------------ */
/* Published pages                                                           */
/* ------------------------------------------------------------------------ */

/** User-entered content on the supplier's Commissioning Store page. */
export const SUPPLIER_PAGE_FIELDS: ContentField[] = [
  { id: 'about', label: 'About your company', type: 'textarea' },
  { id: 'website', label: 'Website', type: 'text' },
  { id: 'enquiries_email', label: 'General enquiries email', type: 'text' },
]

export const SUPPLIER_PAGE_ID = 'supplier'

/**
 * Prototype public Commissioning Store URL for the supplier page.
 * Used for Store link and Preview changes (opens in a new window).
 */
export const SUPPLIER_STORE_PAGE_HREF = '/suppliers/aurora-health'

export const SUPPLIER_PAGE_DEFAULTS: Record<string, string> = {
  about:
    'Aurora Health develops clinician-supported digital therapeutics for common mental health conditions, used by NHS Talking Therapies services to extend capacity between face-to-face appointments.',
  website: 'https://www.aurora-health.example',
  enquiries_email: 'nhs@aurora-health.example',
}

/** ISO date the published pages were last updated (starting value). */
export const PUBLISHED_PAGES_LAST_UPDATED = '2026-08-19'

/* ------------------------------------------------------------------------ */
/* Formatting                                                                */
/* ------------------------------------------------------------------------ */

/** "14 July 2026" from an ISO date or timestamp. */
export function formatPortalDate(iso: string | undefined): string {
  if (!iso) return ''
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}
