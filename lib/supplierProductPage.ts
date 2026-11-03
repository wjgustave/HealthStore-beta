import type { App } from '@/lib/data'
import type { AssuranceDomain, AssuranceDomainStatus, AssuranceEvidenceItem, ProductNarrative } from '@/lib/content/productModel'
import { DTAC_DOMAIN } from '@/lib/content/assuranceDomains'
import { pdpSectionTitle } from '@/lib/pdpSections'
import {
  CHECKBOX_SEPARATOR,
  NOT_PROVIDED_ANSWER,
  isValidIsoDate,
  otherDetailsKey,
  parseCountries,
  parseUploadedDocuments,
  type TaskAnswers,
} from '@/lib/supplierOnboarding'

/**
 * The supplier's product page on the Commissioning Store, rebuilt section by
 * section from the product detail page (PDP).
 *
 * What the supplier writes is stored as flat page values (lists JSON-encoded,
 * like uploads in the onboarding form). Everything else comes from what the
 * HealthStore already holds: the onboarding answers drive Assurance and
 * evidence and the starting local prerequisites; the held product record
 * drives patient impact, worth, funding levers, NICE guidance and how to
 * commission. `buildPortalProductPage` merges the two into the App and
 * ProductNarrative the PDP components render.
 */

export type PageValues = Record<string, string>

/* ------------------------------------------------------------------------ */
/* Lists                                                                     */
/* ------------------------------------------------------------------------ */

export function parseList<T>(value: string | undefined): T[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}

export function serializeList<T>(items: T[]): string {
  return items.length === 0 ? '' : JSON.stringify(items)
}

/** True when every string field of a list item is blank (an unused "Add another" row). */
export function isBlankItem(item: unknown): boolean {
  if (typeof item === 'string') return item.trim() === ''
  if (!item || typeof item !== 'object') return true
  return Object.entries(item as Record<string, unknown>).every(
    ([key, value]) => key === 'change' || typeof value !== 'string' || value.trim() === '',
  )
}

export type PathwayChange = 'unchanged' | 'changed' | 'added'
export type PathwayStepInput = { label: string; change?: PathwayChange }

export const PATHWAY_CHANGES: { value: PathwayChange; label: string }[] = [
  { value: 'unchanged', label: 'Unchanged' },
  { value: 'changed', label: 'Changed' },
  { value: 'added', label: 'New' },
]

export type PublicationInput = { type: string; title: string; setting: string; outcome: string; url: string }

export const PUBLICATION_TYPES: { value: string; label: string }[] = [
  { value: 'rct', label: 'Randomised controlled trial' },
  { value: 'observational', label: 'Observational study' },
  { value: 'service_eval', label: 'Service evaluation' },
  { value: 'systematic_review', label: 'Systematic review or meta-analysis' },
  { value: 'other', label: 'Other publication' },
]

export type CaseStudyInput = { title: string; setting: string; sample_size: string; outcome: string; source: string }

export type SiteInput = { site: string; icb: string; care_setting: string; status: string }

export const SITE_STATUSES: { value: string; label: string }[] = [
  { value: 'live', label: 'Live' },
  { value: 'pilot', label: 'Pilot' },
  { value: 'research', label: 'Research' },
]

/* ------------------------------------------------------------------------ */
/* Sections                                                                  */
/* ------------------------------------------------------------------------ */

export type PageRowKind = 'text' | 'bullets' | 'steps' | 'url' | 'publications' | 'case-studies' | 'sites'

/** One stored value on the product page. Labels may contain `{name}`. */
export type PageRow = { key: string; label: string; kind: PageRowKind }

export type ProductPageSectionId =
  | 'the-problem'
  | 'how-it-helps'
  | 'publications'
  | 'implementation'
  | 'supplier-support'
  | 'nhs-experience'
  | 'case-studies'
  | 'resources'

export type ProductPageSection = {
  id: ProductPageSectionId
  title: (name: string) => string
  /** Hub summary heading level: sub-sections sit under the PDP section they belong to. */
  subsection?: boolean
  rows: PageRow[]
}

/**
 * Sections the supplier writes, in PDP order. Sections the HealthStore works out
 * (patient impact, worth, funding levers, how to commission) are not edited or
 * shown here; Assurance is shown read-only on the hub.
 */
export const PRODUCT_PAGE_SECTIONS: ProductPageSection[] = [
  {
    id: 'the-problem',
    title: (name) => pdpSectionTitle('the-problem', { appName: name }),
    rows: [{ key: 'problem', label: 'The problem', kind: 'text' }],
  },
  {
    id: 'how-it-helps',
    title: (name) => pdpSectionTitle('how-it-helps', { appName: name }),
    rows: [
      { key: 'how_bullets', label: 'What {name} does', kind: 'bullets' },
      { key: 'pathway_current', label: 'Current pathway', kind: 'steps' },
      { key: 'pathway_future', label: 'With {name}', kind: 'steps' },
    ],
  },
  {
    id: 'publications',
    title: () => 'Clinical publications and evaluations',
    subsection: true,
    rows: [{ key: 'publications', label: 'Publications you have added', kind: 'publications' }],
  },
  {
    id: 'implementation',
    title: () => pdpSectionTitle('implementation'),
    rows: [
      { key: 'impl_human_wrapper', label: 'Clinical and human wrapper', kind: 'text' },
      { key: 'impl_workforce', label: 'What you need locally', kind: 'text' },
      { key: 'impl_timescale', label: 'Timeline to go-live', kind: 'text' },
      { key: 'prerequisites', label: 'Local prerequisites', kind: 'bullets' },
    ],
  },
  {
    id: 'supplier-support',
    title: () => 'Supplier support',
    subsection: true,
    rows: [
      { key: 'support_owner', label: 'Recommended local owner', kind: 'text' },
      { key: 'support_steps', label: 'Onboarding steps', kind: 'bullets' },
      { key: 'support_ongoing', label: 'Ongoing support', kind: 'text' },
      { key: 'support_note', label: 'Support note', kind: 'text' },
    ],
  },
  {
    id: 'nhs-experience',
    title: () => pdpSectionTitle('nhs-experience'),
    rows: [{ key: 'nhs_sites', label: 'Sites you have added', kind: 'sites' }],
  },
  {
    id: 'case-studies',
    title: () => 'Case studies and evaluations',
    subsection: true,
    rows: [{ key: 'case_studies', label: 'Case studies you have added', kind: 'case-studies' }],
  },
  {
    id: 'resources',
    title: () => pdpSectionTitle('resources'),
    rows: [
      { key: 'demo_url', label: 'Demo link', kind: 'url' },
      { key: 'documentation_url', label: 'Documentation link', kind: 'url' },
    ],
  },
]

export const PRODUCT_PAGE_KEYS: string[] = PRODUCT_PAGE_SECTIONS.flatMap((s) => s.rows.map((r) => r.key))

export function findProductPageSection(id: string): ProductPageSection | undefined {
  return PRODUCT_PAGE_SECTIONS.find((s) => s.id === id)
}

export function withName(text: string, name: string): string {
  return text.replace(/\{name\}/g, name)
}

/** Stored values with blank list rows removed and text trimmed, ready to save. */
export function cleanSectionValues(section: ProductPageSection, values: PageValues): PageValues {
  const out: PageValues = {}
  for (const row of section.rows) {
    const raw = values[row.key] ?? ''
    if (row.kind === 'text' || row.kind === 'url') {
      out[row.key] = raw.trim()
      continue
    }
    const items = parseList<unknown>(raw)
      .filter((item) => !isBlankItem(item))
      .map((item) =>
        typeof item === 'string'
          ? item.trim()
          : Object.fromEntries(
              Object.entries(item as Record<string, string>).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v]),
            ),
      )
    out[row.key] = serializeList(items)
  }
  return out
}

export type PageFieldError = { field: string; message: string }

const isUrl = (value: string) => /^https?:\/\/\S+\.\S+/i.test(value.trim())

/** Errors for one section's values (after `cleanSectionValues`). Field ids match the editor inputs. */
export function validateSection(section: ProductPageSection, values: PageValues): PageFieldError[] {
  const errors: PageFieldError[] = []
  for (const row of section.rows) {
    const raw = values[row.key] ?? ''
    if (row.kind === 'url' && raw && !isUrl(raw)) {
      errors.push({ field: row.key, message: 'Enter a full web address, starting with https://' })
    }
    if (row.kind === 'publications') {
      parseList<PublicationInput>(raw).forEach((p, i) => {
        const n = i + 1
        if (!p.type) errors.push({ field: `${row.key}-${i}-type`, message: `Select the type of publication ${n}` })
        if (!p.title) errors.push({ field: `${row.key}-${i}-title`, message: `Enter the title of publication ${n}` })
        if (!p.setting)
          errors.push({ field: `${row.key}-${i}-setting`, message: `Enter where the research or study for publication ${n} took place` })
        if (!p.outcome) errors.push({ field: `${row.key}-${i}-outcome`, message: `Enter a summary of the outcome of publication ${n}` })
        if (p.url && !isUrl(p.url)) errors.push({ field: `${row.key}-${i}-url`, message: `Enter a full web address for publication ${n}` })
      })
    }
    if (row.kind === 'case-studies') {
      parseList<CaseStudyInput>(raw).forEach((c, i) => {
        const n = i + 1
        if (!c.title) errors.push({ field: `${row.key}-${i}-title`, message: `Enter the title of case study ${n}` })
        if (!c.setting) errors.push({ field: `${row.key}-${i}-setting`, message: `Enter where case study ${n} took place` })
        if (!c.outcome) errors.push({ field: `${row.key}-${i}-outcome`, message: `Enter the outcome of case study ${n}` })
        if (c.sample_size && !/^\d[\d,]*$/.test(c.sample_size))
          errors.push({ field: `${row.key}-${i}-sample_size`, message: `Number of patients for case study ${n} must be a number` })
      })
    }
    if (row.kind === 'sites') {
      parseList<SiteInput>(raw).forEach((s, i) => {
        const n = i + 1
        if (!s.site) errors.push({ field: `${row.key}-${i}-site`, message: `Enter the name of site ${n}` })
        if (!s.status) errors.push({ field: `${row.key}-${i}-status`, message: `Select the status of site ${n}` })
      })
    }
  }
  return errors
}

/* ------------------------------------------------------------------------ */
/* From the onboarding answers                                               */
/* ------------------------------------------------------------------------ */

function formatDate(iso: string | undefined): string {
  if (!isValidIsoDate(iso)) return ''
  const [y, m, d] = iso!.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

/** File name(s) for an upload answer, "Not provided" when declined, or undefined when unanswered. */
function documentAnswer(answers: TaskAnswers, id: string): string | undefined {
  const raw = (answers[id] ?? '').trim()
  if (!raw) return undefined
  if (raw === NOT_PROVIDED_ANSWER) return NOT_PROVIDED_ANSWER
  if (raw.startsWith('[')) {
    const names = parseUploadedDocuments(raw).map((d) => d.name)
    return names.length > 0 ? names.join(', ') : undefined
  }
  return raw
}

/** An upload behind a "Can you provide…?" question (`${id}-can-provide`): Not provided when answered No. */
function gatedDocument(answers: TaskAnswers, id: string): string {
  if (answers[`${id}-can-provide`] !== 'yes') return NOT_PROVIDED_ANSWER
  return documentAnswer(answers, id) ?? NOT_PROVIDED_ANSWER
}

function rollUp(items: AssuranceEvidenceItem[], blocked: boolean): AssuranceDomainStatus {
  if (blocked) return 'incomplete'
  return items.some((item) => item.value === NOT_PROVIDED_ANSWER) ? 'declared_pending' : 'verified_current'
}

/** How a transparency or terms answer was given: the link, "Document provided", or Not provided. */
function linkOrDocument(answers: TaskAnswers, id: string): string {
  const choice = answers[id]
  if (choice === 'link') return answers[otherDetailsKey(id)]?.trim() || NOT_PROVIDED_ANSWER
  if (choice === 'upload') return documentAnswer(answers, `${id}-upload`) ?? NOT_PROVIDED_ANSWER
  if (choice === 'not-applicable') return 'Not applicable'
  return NOT_PROVIDED_ANSWER
}

/** Medical device status as commissioners read it, from C1.1.1 / C1.1.2 and the held device class. */
export function deviceStatusFromAnswers(answers: TaskAnswers, deviceClass?: string): string {
  if (answers['c1-1-1-samd'] !== 'yes') return 'Not a medical device'
  const cls = deviceClass?.trim() ? deviceClass.trim() : 'class to be confirmed'
  const kind = answers['c1-1-2-standalone'] === 'part-of-it-system' ? 'part of a Health IT system' : 'standalone software'
  return `Medical device (${cls}), ${kind}`
}

/**
 * The Assurance pack for the product page, driven by the onboarding answers.
 * Each domain rolls up to Incomplete (a blocking No), Declared, pending (a
 * document not provided) or Available.
 */
export function assuranceDomainsFromAnswers(answers: TaskAnswers, app: { device_class?: string; nice_guidance_refs?: { ref: string }[] }): AssuranceDomain[] {
  const yes = (id: string) => answers[id] === 'yes'

  // Clinical safety (C1)
  const clinical: AssuranceEvidenceItem[] = [{ label: 'Medical device status', value: deviceStatusFromAnswers(answers, app.device_class) }]
  if (yes('c1-1-1-samd')) clinical.push({ label: 'PAQ form', value: documentAnswer(answers, 'c1-1-1-paq-upload') ?? NOT_PROVIDED_ANSWER })
  const directCare = answers['c1-2-direct-care']
  if (directCare === 'no') clinical.push({ label: 'DCB0129', value: 'Out of scope — supplier justification held' })
  if (directCare === 'yes' && yes('c1-2-2-crm-activities')) {
    clinical.push(
      { label: 'Clinical risk management system', value: gatedDocument(answers, 'c1-2-3-crm-system') },
      { label: 'DCB0129 clinical safety case report', value: gatedDocument(answers, 'c1-2-4-safety-case') },
      { label: 'DCB0129 hazard log', value: gatedDocument(answers, 'c1-2-4-hazard-log') },
    )
    const cso = [answers['c1-2-5-cso__full-name'], answers['c1-2-5-cso__profession']].filter((v) => v?.trim()).join(', ')
    if (cso) clinical.push({ label: 'Clinical Safety Officer', value: cso })
  }
  const clinicalBlocked = directCare === 'yes' && answers['c1-2-2-crm-activities'] === 'no'

  // Data protection (C2)
  const dspt = answers['c2-1-dspt']
  const data: AssuranceEvidenceItem[] = [
    {
      label: 'Data Security and Protection Toolkit',
      value: dspt === 'yes' ? 'Standards met' : dspt === 'no-patient-data' ? 'Not required — no access to patient data or NHS systems' : dspt === 'no' ? 'Standards not met' : NOT_PROVIDED_ANSWER,
    },
  ]
  if (yes('c2-2-personal-data')) {
    const ico = gatedDocument(answers, 'c2-2-1-ico')
    const expiry = formatDate(answers['c2-2-1-ico-expiry'])
    const countries = parseCountries(answers['c2-2-6-outside-uk']).map((c) => c.trim()).filter(Boolean)
    data.push(
      { label: 'ICO registration', value: ico !== NOT_PROVIDED_ANSWER && expiry ? `${ico}, expires ${expiry}` : ico },
      { label: 'Data Protection Impact Assessment', value: gatedDocument(answers, 'c2-2-2-dpia') },
      { label: 'Transparency information', value: linkOrDocument(answers, 'c2-2-3-privacy-notice') },
      { label: 'Terms and conditions or EULA', value: linkOrDocument(answers, 'c2-2-4-terms') },
      {
        label: 'Where data is stored and processed',
        value:
          answers['c2-2-5-data-location'] !== 'outside-uk'
            ? 'UK only'
            : countries.length > 0
              ? `Outside the UK: ${countries.join(', ')} — safeguards described`
              : 'Includes countries outside the UK — safeguards described',
      },
    )
  } else if (answers['c2-2-personal-data'] === 'no') {
    data.push({ label: 'Personal data', value: 'Not processed by the supplier' })
  }

  // Technical security (C3)
  const cyber = gatedDocument(answers, 'c3-1-cyber-essentials')
  const cyberExpiry = formatDate(answers['c3-1-cyber-essentials-expiry'])
  const security: AssuranceEvidenceItem[] = [
    {
      label: 'Cyber Essentials',
      value: cyber !== NOT_PROVIDED_ANSWER ? `Certificate held${cyberExpiry ? `, expires ${cyberExpiry}` : ''}` : NOT_PROVIDED_ANSWER,
    },
    { label: 'Cyber Security Charter for NHS suppliers', value: yes('c3-2-charter') ? 'Signed' : 'Not signed' },
    { label: 'External penetration test summary', value: gatedDocument(answers, 'c3-3-pen-test') },
    {
      label: 'Software Security Code of Practice',
      value: answers['c3-4-code-of-practice'] === 'confirmed' ? 'Adherence confirmed' : 'Not confirmed',
    },
    {
      label: 'Multi-factor authentication for privileged accounts',
      value: yes('c3-5-1-privileged-mfa') ? 'In place' : answers['c3-5-1-privileged-mfa'] === 'not-applicable' ? 'Not applicable' : 'Not in place',
    },
    { label: 'Logging and reporting', value: yes('c3-6-logging') ? 'Defined' : 'Not defined' },
  ]

  // Interoperability (C4) — shown as a summary callout on the PDP.
  const interop: string[] = []
  if (yes('c4-1-apis')) {
    interop.push(
      answers['c4-1-2-open-api'] === 'confirm'
        ? 'Exposes openly documented APIs that follow GDS Open API guidance and recognised interoperability standards.'
        : 'Exposes APIs for other health products; documentation is available from the supplier.',
    )
  } else if (answers['c4-1-apis'] === 'no') {
    interop.push('Does not expose APIs for other health products.')
  }
  if (yes('c4-2-data-sharing')) {
    if (yes('c4-2-1-nhs-number')) {
      interop.push(
        yes('c4-2-2-pds')
          ? 'Uses the NHS number to identify patients and validates it against the Personal Demographics Service.'
          : 'Uses the NHS number to identify patients.',
      )
    } else {
      interop.push('Identifies patient records without the NHS number; the supplier describes its matching approach.')
    }
  }
  if (yes('c4-2-4-nhs-login')) interop.push('Patients sign in with NHS login.')

  // Usability and accessibility (D1)
  const usability: AssuranceEvidenceItem[] = [
    {
      label: 'Care pathway and user journey documentation',
      value: yes('d1-1-pathways') ? (documentAnswer(answers, 'd1-1-pathways-upload') ?? NOT_PROVIDED_ANSWER) : NOT_PROVIDED_ANSWER,
    },
    { label: 'Testing with intended users', value: yes('d1-2-user-testing') ? 'Yes' : 'No' },
    { label: 'Accessible Information Standard', value: yes('d1-3-ais') ? 'Considered in design' : 'Not considered' },
  ]
  if (yes('d1-4-web-or-mobile')) {
    const platforms = (answers['d1-4-platforms'] ?? '')
      .split(CHECKBOX_SEPARATOR)
      .filter(Boolean)
      .map((p) => ({ android: 'Android', ios: 'iOS', web: 'Web' })[p] ?? p)
    if (platforms.length) usability.push({ label: 'Platforms', value: platforms.join(', ') })
    const wcag = answers['d1-4-1-wcag']
    usability.push({
      label: 'WCAG 2.2 AA',
      value:
        wcag === 'yes'
          ? 'Compliant'
          : wcag === 'no-plan-in-place'
            ? `Plan in place${answers['d1-4-2-timescale'] ? ` — compliant by ${answers['d1-4-2-timescale']}` : ''}`
            : wcag === 'not-applicable'
              ? 'Not applicable'
              : 'Not compliant',
    })
    if (answers['d1-4-3-accessibility-statement']) {
      usability.push({ label: 'Accessibility statement', value: answers['d1-4-3-accessibility-statement'] })
    }
    if (answers['d1-5-availability']) usability.push({ label: 'Service availability (last 12 months)', value: `${answers['d1-5-availability']}%` })
  }

  const niceRefs = (app.nice_guidance_refs ?? []).map((r) => r.ref).join(', ')
  const version = answers['a3-product-version']?.trim()

  return [
    {
      domain: DTAC_DOMAIN.clinicalSafety,
      status: rollUp(clinical, clinicalBlocked),
      summary: 'Clinical risk management evidence from the supplier, as submitted through HealthStore onboarding.',
      residual_action: 'Complete a local DCB0160 clinical safety case before go-live.',
      items: clinical,
    },
    {
      domain: DTAC_DOMAIN.dataProtection,
      status: rollUp(data, dspt === 'no'),
      summary: 'How the product collects, stores and uses personal data in line with UK GDPR.',
      residual_action: 'Complete a local DPIA and data processing agreement before go-live.',
      items: data,
    },
    {
      domain: DTAC_DOMAIN.technicalSecurity,
      status: rollUp(security, false),
      summary: 'Security certification and practice for the product.',
      items: security,
    },
    {
      domain: DTAC_DOMAIN.interoperability,
      status: 'verified_current',
      summary: interop.join(' ') || 'Interoperability details to be confirmed with the supplier.',
    },
    {
      domain: DTAC_DOMAIN.usability,
      status: rollUp(usability, false),
      summary: 'How the product fits existing pathways and meets accessibility standards.',
      items: usability,
    },
    {
      domain: DTAC_DOMAIN.nice,
      status: 'verified_current',
      summary: niceRefs ? `Referenced in ${niceRefs}.` : 'No NICE guidance recorded.',
    },
    {
      domain: DTAC_DOMAIN.dtacForm,
      status: 'verified_current',
      summary: 'DTAC answers submitted through HealthStore onboarding.',
      items: version ? [{ label: 'Product version assessed', value: version }] : undefined,
    },
  ]
}

/** Local prerequisites that follow from the onboarding answers. */
export function prerequisitesFromAnswers(answers: TaskAnswers): string[] {
  const out: string[] = []
  if (answers['c1-2-direct-care'] === 'yes') {
    out.push('Local DCB0160 clinical safety assessment, signed off by your Clinical Safety Officer')
  }
  if (answers['c2-2-personal-data'] === 'yes') {
    out.push('Local DPIA completed and data processing agreement signed')
  }
  if (answers['c2-2-5-data-location'] === 'outside-uk') {
    out.push('Information governance review of international data transfer safeguards')
  }
  if (answers['c4-2-data-sharing'] === 'yes') {
    out.push(
      answers['c4-1-apis'] === 'yes'
        ? 'Integration with your clinical record system agreed (supplier APIs available)'
        : 'Agreed process for sharing data with your clinical record system',
    )
  }
  if (answers['c4-2-4-nhs-login'] === 'yes') out.push('Patients able to sign in with NHS login')
  return out
}

/** Starting page values: everything the HealthStore can prepopulate from data it holds. */
export function productPageDefaults(app: { implementation_prerequisites?: string[] }, answers: TaskAnswers): PageValues {
  const prerequisites = [...(app.implementation_prerequisites ?? []), ...prerequisitesFromAnswers(answers)]
  return { prerequisites: serializeList(Array.from(new Set(prerequisites))) }
}

/* ------------------------------------------------------------------------ */
/* Builder                                                                   */
/* ------------------------------------------------------------------------ */

const PUBLICATION_EVIDENCE_TYPE: Record<string, string> = {
  rct: 'RCT',
  observational: 'observational',
  service_eval: 'service_eval',
  systematic_review: 'systematic_review',
  other: 'other',
}

/**
 * The App and ProductNarrative for a product page, from the held record, the
 * product's onboarding answers and the page values the supplier has written.
 */
export function buildPortalProductPage({
  app: baseApp,
  narrative: baseNarrative,
  answers,
  page,
}: {
  app: App
  narrative: ProductNarrative
  answers: TaskAnswers
  page: PageValues
}): { app: App; narrative: ProductNarrative } {
  const name = answers['a2-product-name']?.trim() || baseApp.app_name
  const description = answers['b2-description']?.trim()
  const text = (key: string) => (page[key] ?? '').trim()
  const strings = (key: string) => parseList<string>(page[key]).map((s) => s.trim()).filter(Boolean)

  const publications = parseList<PublicationInput>(page.publications).filter((p) => !isBlankItem(p))
  const caseStudies = parseList<CaseStudyInput>(page.case_studies).filter((c) => !isBlankItem(c))
  const sites = parseList<SiteInput>(page.nhs_sites).filter((s) => !isBlankItem(s))

  const app: App = {
    ...baseApp,
    app_name: name,
    overview: description ? [description] : baseApp.overview,
    clinical_evidence_detailed: [
      ...(baseApp.clinical_evidence_detailed ?? []),
      ...publications.map((p, i) => ({
        id: `supplier-publication-${i + 1}`,
        type: PUBLICATION_EVIDENCE_TYPE[p.type] ?? 'other',
        type_label: PUBLICATION_TYPES.find((t) => t.value === p.type)?.label ?? 'Publication',
        ref: p.title,
        setting: p.setting,
        key_results: p.outcome,
        url_full_text: p.url || undefined,
        source_label: p.url ? 'Read the publication' : undefined,
        supplier_provided: true,
      })),
    ],
    case_studies: [
      ...(baseApp.case_studies ?? []),
      ...caseStudies.map((c) => ({
        title: c.title,
        setting: c.setting,
        sample_size: c.sample_size ? Number(c.sample_size.replace(/,/g, '')) : undefined,
        outcome: c.outcome,
        source: c.source || undefined,
        type_label: 'Supplier case study',
      })),
    ],
    deployment_register: [
      ...(baseApp.deployment_register ?? []),
      ...sites.map((s) => ({
        site: s.site,
        icb: s.icb || undefined,
        care_setting: s.care_setting || undefined,
        status: s.status || 'unknown',
        confidence: 'medium',
        notes: 'Reported by the supplier',
      })),
    ],
    demo_variants: [
      ...(text('demo_url') ? [{ label: `${name} demo`, type: 'demo', url: text('demo_url') }] : []),
      ...(text('documentation_url') ? [{ label: `${name} documentation`, type: 'documentation', url: text('documentation_url') }] : []),
    ],
  }

  const bullets = strings('how_bullets')
  const current = parseList<PathwayStepInput>(page.pathway_current).filter((s) => s.label?.trim())
  const future = parseList<PathwayStepInput>(page.pathway_future).filter((s) => s.label?.trim())

  const prerequisites = page.prerequisites !== undefined ? strings('prerequisites') : (baseApp.implementation_prerequisites ?? [])
  const hasImplementation =
    !!(text('impl_human_wrapper') || text('impl_workforce') || text('impl_timescale')) || prerequisites.length > 0

  const narrative: ProductNarrative = {
    ...baseNarrative,
    decision_summary: text('problem')
      ? {
          one_line_proposition: baseApp.one_line_value_proposition ?? '',
          pathway_problem: text('problem'),
          intervention_class: 'Digital therapeutic',
          why_relevant: '',
        }
      : undefined,
    what_it_does_bullets: bullets.length > 0 ? bullets : undefined,
    pathway_model:
      current.length > 0 || future.length > 0
        ? {
            current_steps: current.map((s, i) => ({ id: `c${i + 1}`, label: s.label.trim() })),
            future_steps: future.map((s, i) => ({ id: `f${i + 1}`, label: s.label.trim(), change: s.change ?? 'unchanged' })),
            roles: [],
            changed_resources: [],
          }
        : undefined,
    assurance_domains: assuranceDomainsFromAnswers(answers, app),
    regulatory_position: baseNarrative.regulatory_position
      ? { ...baseNarrative.regulatory_position, dtac_complete: true }
      : undefined,
    implementation: hasImplementation
      ? {
          human_wrapper: text('impl_human_wrapper'),
          workforce: text('impl_workforce'),
          timescale: text('impl_timescale'),
          prerequisites,
          owner: text('support_owner') || undefined,
          onboarding_steps: strings('support_steps'),
          onboarding_ongoing_step: text('support_ongoing') || undefined,
          onboarding_note: text('support_note') || undefined,
        }
      : undefined,
  }

  return { app, narrative }
}
