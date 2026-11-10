/**
 * Supplier onboarding task list — single source of truth for the structure of
 * the product onboarding form in the Supplier portal.
 *
 * Follows the NHS "Complete multiple tasks" pattern:
 * https://service-manual.nhs.uk/design-system/patterns/complete-multiple-tasks
 *
 * Each product awaiting onboarding has its own copy of the form at
 * `/supplier-portal/products/onboard/[formId]`. Sections group related tasks;
 * each task has its own page at `.../[formId]/[slug]` and its own Completed /
 * Incomplete status.
 *
 * The questionnaire is multi-routed: a question may declare `showIf` conditions
 * on earlier answers in the same task. Hidden questions are skipped by
 * Save and Next, ignored by the Completed check and omitted from Check your
 * answers. See `isQuestionVisible`. The routes are documented in
 * docs/SUPPLIER_PORTAL_FLOWS.md ("Product onboarding question routes").
 */

import { TEXTAREA_CHARACTER_LIMIT, characterLimitMessage, countCharacters } from '@/lib/characterCount'
import { canonicalCountryName } from '@/lib/countries'
import { QUESTION_ERRORS, type QuestionErrorMessages } from '@/lib/supplierOnboardingErrors'
import { PORTAL_PATHS } from '@/lib/supplierPortal'

export const SERVICE_NAME = 'HealthStore Onboarding'

/** localStorage key prefix; one entry per form (client-side prototype). */
export const STORAGE_KEY_PREFIX = 'hs-supplier-portal:onboarding:'

export function storageKey(formId: string): string {
  return `${STORAGE_KEY_PREFIX}${formId}`
}

/** Page caption for a task's pages. Assessed standards name the standard being answered. */
export function taskCaption(section: Pick<OnboardingSection, 'id' | 'title'>, task: Pick<OnboardingTask, 'title'>): string {
  return section.id === 'technical-questions' ? `Assessed standard: ${task.title}` : section.title
}

/** Task list page for one product's form. */
export function formBasePath(formId: string): string {
  return `${PORTAL_PATHS.onboard}/${formId}`
}

export type TextInputType = 'text' | 'url' | 'email' | 'tel'

export type QuestionOption = {
  value: string
  label: string
  /** Not rendered (kept in the model so a route can be switched on later). */
  hidden?: boolean
  /** Checkboxes only: selecting this clears every other option, and vice versa ("None of the above"). */
  exclusive?: boolean
  /** Guidance shown under this option. */
  hint?: string
  /** Render an NHS radios/checkboxes "or" divider immediately before this option. */
  dividerBefore?: boolean
  /**
   * Nested input revealed when this option is selected (NHS radios/checkboxes
   * conditional). Stored under `otherDetailsKey(questionId)`.
   */
  followUp?: { label: string; hint?: string; inputType?: TextInputType }
}

/**
 * Routing condition on an earlier answer in the same task. `in` holds when any
 * selected value is listed; `notIn` holds when none is. An unanswered (or
 * hidden) referenced question never satisfies a condition, so follow-up
 * questions only appear once their parent has been answered.
 */
export type AnswerCondition =
  | { questionId: string; in?: string[]; notIn?: string[] }
  | { anyOf: AnswerCondition[] }

/**
 * One question = one page (NHS/GOV.UK "one thing per page"). The question
 * `label` is rendered as the page heading, `hint` beneath it.
 */
type QuestionBase = {
  id: string
  /** Questionnaire reference (e.g. "C1.1.1"), shown on Check your answers. */
  code?: string
  label: string
  /** Page heading when it is not the question itself. The question `label` is then shown above the answers. */
  pageTitle?: string
  hint?: string
  /** Phrase inside `hint` shown as a link. Several links are applied in the order they appear. */
  hintLink?: { text: string; href: string } | { text: string; href: string }[]
  /**
   * Hint under the question label when `pageTitle` is set (the page `hint` then
   * sits under the title as body text).
   */
  fieldHint?: string
  /** NHS inset text shown under the hint. */
  inset?: string
  /** Optional questions (e.g. "if applicable") do not block the task from being Completed. */
  optional?: boolean
  /** Shown only when every condition holds (see `isQuestionVisible`). Absent = always shown. */
  showIf?: AnswerCondition | AnswerCondition[]
  /** Short row key for read-only summaries (e.g. "Company name"); the question `label` is used when omitted. */
  summaryLabel?: string
  /** Leave the row out of read-only summaries (e.g. a Yes/No gate whose answer is implied by the next row). */
  hideInSummary?: boolean
  /**
   * Show/hide blocks under the hint. `details` is the NHS Details component.
   * `expander` is the NHS Expander. `link.text` is the phrase inside `text` shown as a link.
   */
  details?: {
    summary: string
    text: string
    link?: { text: string; href: string } | { text: string; href: string }[]
    variant?: 'details' | 'expander'
  }[]
}

/** One input in a `fields` question (e.g. Address line 1, First name). */
export type FieldSpec = {
  key: string
  label: string
  optional?: boolean
  inputType?: TextInputType
  autoComplete?: string
  /** NHS input width modifier, e.g. 'nhsuk-input--width-10'. Full width when omitted. */
  width?: string
  /** On Check your answers, show on the same line as the previous field (e.g. first and last name). */
  inline?: boolean
}

export type OnboardingQuestion =
  | (QuestionBase & { type: 'radios'; options: QuestionOption[] })
  | (QuestionBase & { type: 'checkboxes'; options: QuestionOption[] })
  | (QuestionBase & { type: 'textarea' })
  /**
   * Single-line NHS Text input (links, email addresses, phone numbers, percentages, short dates).
   * `inputWidth` is an NHS width modifier (e.g. 'nhsuk-input--width-4').
   * `suffix` renders an NHS input suffix (e.g. '%').
   */
  | (QuestionBase & { type: 'text'; inputType?: TextInputType; inputWidth?: string; suffix?: string })
  /**
   * Several short text inputs under one heading (NHS Addresses pattern, a
   * person's name, contact details). Each field is stored under
   * `${id}${FIELD_SEPARATOR}${field.key}` — see `fieldKey`.
   */
  | (QuestionBase & { type: 'fields'; fields: FieldSpec[] })
  /**
   * NHS Date input (day / month / year). Stored as YYYY-MM-DD.
   * Set `mustBeFuture` when the date must be after today.
   */
  | (QuestionBase & { type: 'date'; mustBeFuture?: boolean })
  /**
   * File upload plus a required reference name (GOV.UK File upload — the NHS
   * design system has no equivalent). `documents` lists the evidence that may be
   * supplied. The file name is stored under `id`; the reference name under
   * `${id}${UPLOAD_REFERENCE_SUFFIX}`. Set `noReference` to ask for the file only.
   * Set `multiple` to accept several files at once or one after another; the
   * list is stored JSON-encoded under `id` (see `UploadedDocument`).
   * When a supplier may not have the document, ask first with a radios
   * question using `CAN_PROVIDE` and show the upload only on Yes (`canProvide`).
   */
  | (QuestionBase & {
      type: 'upload'
      documents?: string[]
      noReference?: boolean
      multiple?: boolean
      /** Short note shown under the file list. */
      footnote?: string
    })
  /**
   * One or more countries, each an autocomplete from the GOV.UK country register
   * (countries only, UK excluded), with "Add another country" (Scottish
   * Government "Add more fields" pattern). Stored JSON-encoded under `id` as a
   * list of names — see `parseCountries`.
   */
  | (QuestionBase & { type: 'countries' })
  /**
   * A text area for each country listed in the `countriesFrom` question (same
   * task). Stored JSON-encoded under `id` as `{ [country]: text }` — see
   * `parseCountryDetails`.
   */
  | (QuestionBase & { type: 'country-details'; countriesFrom: string })
  /**
   * Several documents, added one at a time (file + reference name, then
   * "Upload file"), listed with a Remove action. Adapted from the MoJ Multi file
   * upload pattern using NHS components. The list is stored JSON-encoded under
   * `id` (see `UploadedDocument`); the "Mark as complete" checkbox under
   * `${id}${MULTI_UPLOAD_CONFIRMED_SUFFIX}` — the question only counts as
   * answered once at least one document is listed AND the box is ticked.
   * `documents` is shown in an NHS Details component ("Documents you can provide").
   */
  | (QuestionBase & { type: 'multi-upload'; documents?: string[] })
  /**
   * A stop page. It has no answer. While it is on the route the task cannot be
   * completed, and Save and Next is not offered.
   */
  | (QuestionBase & { type: 'blocked' })
  /**
   * Read-only interstitial before a set of questions. No answer is stored; the
   * page always counts as complete so it does not block the task.
   */
  | (QuestionBase & { type: 'info' })

export const UPLOAD_REFERENCE_SUFFIX = '__reference'

/** Shown wherever an expected answer or document was not given. */
export const NOT_PROVIDED_ANSWER = 'Not provided'
export const MULTI_UPLOAD_CONFIRMED_SUFFIX = '__confirmed'
export const CONFIRMED_VALUE = 'yes'
export const FIELD_SEPARATOR = '__'

/** Answer key for the "Give details" text shown when an option labelled Other is selected. */
export const OTHER_DETAILS_SUFFIX = '__other-details'

export function otherDetailsKey(questionId: string): string {
  return `${questionId}${OTHER_DETAILS_SUFFIX}`
}

export function questionHasOther(q: OnboardingQuestion): boolean {
  return (q.type === 'radios' || q.type === 'checkboxes') && q.options.some((o) => o.value === 'other')
}

/** True when any option reveals a nested text field (Other or an authored `followUp`). */
export function questionHasConditionalInput(q: OnboardingQuestion): boolean {
  return (
    (q.type === 'radios' || q.type === 'checkboxes') &&
    q.options.some((o) => o.value === 'other' || !!o.followUp)
  )
}

/** Follow-up field config for a selected option value, if any. */
export function optionFollowUp(
  q: OnboardingQuestion,
  value: string,
): { label: string; hint?: string; inputType?: TextInputType } | undefined {
  if (q.type !== 'radios' && q.type !== 'checkboxes') return undefined
  const option = q.options.find((o) => o.value === value)
  if (option?.followUp) return option.followUp
  if (value === 'other') return { label: 'Give details' }
  return undefined
}

/** Answer key for one input of a `fields` question. */
export function fieldKey(questionId: string, field: Pick<FieldSpec, 'key'>): string {
  return `${questionId}${FIELD_SEPARATOR}${field.key}`
}

/** One entry in a multi-upload list. Prototype: metadata only, no file bytes. */
export type UploadedDocument = {
  name: string
  size: number
  reference: string
  uploadedAt: string
}

export function parseUploadedDocuments(value: string | undefined): UploadedDocument[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? (parsed as UploadedDocument[]) : []
  } catch {
    return []
  }
}

export function serializeUploadedDocuments(docs: UploadedDocument[]): string {
  return docs.length === 0 ? '' : JSON.stringify(docs)
}

/** Country names for a `countries` question, including empty rows still being filled in. */
export function parseCountries(value: string | undefined): string[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.map((c) => (typeof c === 'string' ? c : '')) : []
  } catch {
    return []
  }
}

export function serializeCountries(countries: string[]): string {
  return countries.length === 0 || countries.every((c) => !c.trim()) ? '' : JSON.stringify(countries)
}

/** Text per country for a `country-details` question. */
export function parseCountryDetails(value: string | undefined): Record<string, string> {
  if (!value) return {}
  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, string>) : {}
  } catch {
    return {}
  }
}

export function serializeCountryDetails(details: Record<string, string>): string {
  return Object.values(details).some((v) => v.trim()) ? JSON.stringify(details) : ''
}

/** The filled-in countries a `country-details` question asks about, in the order they were added. */
export function countriesFor(question: OnboardingQuestion, answers: TaskAnswers): string[] {
  if (question.type !== 'country-details') return []
  return [...new Set(parseCountries(answers[question.countriesFrom]).map((c) => c.trim()).filter(Boolean))]
}

export type OnboardingTask = {
  /** Stable identifier used as the completion-state key. */
  id: string
  /** URL segment under /supplier-onboard. */
  slug: string
  /** Section code from the DTAC form (A, B, C1–C4, D). Absent for non-DTAC tasks such as company information. */
  code?: string
  title: string
  /** Question pages for this task. Empty until the content is authored. */
  questions: OnboardingQuestion[]
}

/** Task name with its DTAC code in front, for task lists. */
export function taskTitleWithCode(task: Pick<OnboardingTask, 'code' | 'title'>): string {
  return task.code ? `${task.code} ${task.title}` : task.title
}

/**
 * Section heading for the onboarding form. The DTAC letter (A, B, C, D) replaces
 * a 1–4 number. A section of several tasks (C1–C4) uses the letter they share.
 */
export function sectionHeading(section: OnboardingSection): string {
  const codes = section.tasks.map((t) => t.code).filter((code): code is string => !!code)
  const shared = codes.length > 0 && codes.every((code) => code[0] === codes[0][0]) ? codes[0][0] : undefined
  return shared ? `${shared}. ${section.title}` : section.title
}

/**
 * Onboarding task-list link. A single letter heads the section, so the link
 * shows the title alone. Longer codes (C1–C4) follow the title in brackets.
 */
export function taskListLabel(task: Pick<OnboardingTask, 'code' | 'title'>): string {
  return task.code && task.code.length > 1 ? `${task.title} (${task.code})` : task.title
}

export type OnboardingSection = {
  id: string
  title: string
  /** Short explanation shown under the numbered section heading. */
  description: string
  tasks: OnboardingTask[]
}

/** Regulatory notice shown in the blue panel under the task list introduction. */
export const ONBOARDING_NOTICE =
  'Use this form to onboard your digital therapeutic (DTx) into the NHS HealthStore. The NHS HealthStore is an information and signposting platform only; NHS England is not a distributor or part of the medical device supply chain. Under the UK Medical Devices Regulation (MDR) 2002, manufacturers are solely liable for all clinical, efficacy and regulatory claims. Answers you provide to questions must be objective, evidence-based and aligned with NHS clinical guidelines.'

/** Declaration shown above "Confirm and submit" on the Check your answers page. */
export const SUBMISSION_DECLARATION =
  'By submitting you confirm you understand that under UK MDR, manufacturers are solely liable for all clinical, efficacy and regulatory claims. All answers are objective, evidence-based and aligned with NHS clinical guidelines.'

export function checkAnswersPath(formId: string): string {
  return `${formBasePath(formId)}/check-answers`
}

export function confirmationPath(formId: string): string {
  return `${formBasePath(formId)}/confirmation`
}

function task(slug: string, code: string, title: string, questions: OnboardingQuestion[] = []): OnboardingTask {
  return { id: slug, slug, code, title, questions }
}

/* ----------------------------- option sets ------------------------------ */

const YES_NO: QuestionOption[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
]

const YES_NO_NA: QuestionOption[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'not-applicable', label: 'Not applicable' },
]

const PROVIDED_NOT_PROVIDED: QuestionOption[] = [
  { value: 'provided', label: 'Provided' },
  { value: 'not-provided', label: 'Not provided' },
]

const CONFIRMED_UNABLE: QuestionOption[] = [
  { value: 'confirmed', label: 'Yes, I confirm' },
  { value: 'unable-to-confirm', label: 'Unable to confirm' },
]

const UPLOAD_HINT = 'Label the document with your company name, the question number and the date of submission.'

/** "Can you provide…?" before an upload: Yes opens the upload page, No skips it. */
const CAN_PROVIDE: QuestionOption[] = [
  { value: 'yes', label: 'Yes', hint: 'You can upload this on the next page' },
  { value: 'no', label: "No, I can't provide this right now" },
]

/** Shown when the `CAN_PROVIDE` question before an upload is answered Yes. */
function canProvide(gateId: string): AnswerCondition {
  return { questionId: gateId, in: ['yes'] }
}

/**
 * C1.2.2 onwards. C1.2 is asked of everyone: Yes continues here, No stops
 * after C1.2.1 and then goes to C2.
 */
const CLINICAL_RISK_ROUTE: AnswerCondition = { questionId: 'c1-2-direct-care', in: ['yes'] }

const DCB0129_STANDARD_HREF =
  'https://digital.nhs.uk/data-and-information/information-standards/governance/latest-activity/standards-and-collections/dcb0129-clinical-risk-management-its-application-in-the-manufacture-of-health-it-systems/'

const DCB0160_STANDARD_HREF =
  'https://digital.nhs.uk/data-and-information/information-standards/governance/latest-activity/standards-and-collections/dcb0160-clinical-risk-management-its-application-in-the-deployment-and-use-of-health-it-systems/'

/** Intro copy shown before any clinical safety question. */
const CLINICAL_SAFETY_INTERSTITIAL_HINT = [
  'Suppliers must provide responses and documentation relating to the specific version of the Digital Health Technology (DHT) product that is subject to assessment.',
  'DCB0129: Clinical Risk Management: its Application in the Manufacture of Health IT Systems applies to the manufacturers of Health IT systems. A Health IT system is defined as ’product used to provide electronic information for health and social care purposes’ meaning it can "influence, support or manage real-time or near real-time direct care of patients or service users".',
  'Suppliers should note that while the Digital Technology Assessment Criteria (DTAC) applies to DHTs which cover software products, Health IT systems subject to DCB0129 may include hardware elements provided alongside the software. If the DHT product under assessment is being provided as part of a Health IT system with hardware elements, the DCB0129 documentation requested should cover the full scope of the Health IT system being offered, including any hardware elements. If a manufacturer considers that the C1 Clinical Safety is not applicable to the product being assessed, rationale must be submitted detailing why DCB0129 does not apply.',
  'Health and care organisations should note that the DCB0160: Clinical Risk Management: its Application in the Deployment and Use of Health IT Systems standard applies to organisations in which the health IT is deployed or used. It is a requirement of the standard (2.5.1) that before deploying Health IT systems, the organisation must ensure that the manufacturer and Health IT system comply with DCB0129. Health and care organisations must do so in accordance with the requirements and obligations set out in the standard, including ensuring that personnel involved have the knowledge, experience and competences appropriate to undertaking the clinical risk management, such as a qualified Clinical Safety Officer (CSO). Health and care organisations should ensure that all questions in this section of the DTAC are assessed by the same personnel.',
  'If the CSO or any other individual in the health and care organisation has concerns relating to the safety of a medical device, including software and apps, this should be reported to the Medicines and Healthcare products Regulatory Agency (MHRA) using the Yellow Card reporting system: Report a problem with a medicine or medical device. If there is a patient safety event relating to the use of any DHT product (whether a medical device or otherwise) which impacts upon the safety of one or more patients accessing NHS services, it should be recorded to the Learn from patient safety events (LFPSE) service (either online or through the local organisation\'s LFPSE-connected LRMS software where possible), to support both national learning and local response. This should be done in addition to a Yellow Card report if the DHT is a SaaMD or AIaaMD product.',
].join('\n\n')

const CLINICAL_SAFETY_INTERSTITIAL_LINKS = [
  {
    text: 'DCB0129: Clinical Risk Management: its Application in the Manufacture of Health IT Systems',
    href: DCB0129_STANDARD_HREF,
  },
  {
    text: 'DCB0160: Clinical Risk Management: its Application in the Deployment and Use of Health IT Systems',
    href: DCB0160_STANDARD_HREF,
  },
  {
    text: 'Report a problem with a medicine or medical device',
    href: 'https://www.gov.uk/report-problem-medicine-medical-device',
  },
]

/** Intro copy shown before any technical security question. */
const TECHNICAL_SECURITY_INTERSTITIAL_HINT = [
  'Dependent on the DHT being procured, it is recommended that appropriate contractual arrangements are put in place for problem identification and resolution, incident management and response planning and disaster recovery.',
  'In this section, you will be asked to provide details about the specific technology product under assessment, and not generally for your organisation.',
].join('\n\n')

/** Intro copy shown before any interoperability question. */
const INTEROPERABILITY_INTERSTITIAL_HINT = [
  'It is important that relevant technologies in the health and social care system are interoperable in terms of hardware, software and data they contain for health and social care providers to deliver integrated care. For example, data from a patient\'s ambulatory blood glucose monitor should be able to be downloaded onto an appropriate clinical system without being restricted to one type. Technologies that need to interface within clinical record systems must also be interoperable.',
  'Application Program Interfaces (APIs) should follow the Government Digital Services (GDS) Open API Best Practices, be documented and freely available, and third parties reasonable access to integrate technologies.',
  'Good interoperability reduces expenditure, complexity and delivery times on local system integration projects by standardising technology and interface specifications and simplifying integration. Interoperability allows integration projects to be replicated and scaled and opens the market for innovation by defining standards upfront.',
  'This section should be tailored to the specific use case of the product and the needs of the buyer; however, it should reflect the standards used within the NHS and social care and direction of travel.',
  'Provide details relating to the specific technology and not to your organisation.',
].join('\n\n')

const INTEROPERABILITY_INTERSTITIAL_LINKS = [
  {
    text: 'Open API Best Practices',
    href: 'https://www.gov.uk/guidance/gds-api-technical-and-data-standards',
  },
]

/** Shared guidance under DCB0129 Compliance and the page shown when the answer is No. */
const DCB0129_MANUFACTURER_HINT =
  'The DCB0129 standard applies to manufacturers of Health IT system. If your software product is placed on the market as part of a system including hardware components, you need to provide DCB0129 documentation for the whole Health IT system, including any hardware elements.'

const DCB0129_STANDARD_LINK = { text: 'DCB0129 standard', href: DCB0129_STANDARD_HREF }

const DSPT_HREF = 'https://www.dsptoolkit.nhs.uk/'
const DSPT_EXPLAINER =
  'The DSPT allows organisations to measure performance against information governance and cyber security standards for health and care data.\n\nAny organisation that accesses NHS data and systems must complete an annual assessment to demonstrate that it is compliant. Where this applies, it should be a condition of the contract with the health and care organisation.\n\nWhere an organisation has access to any patient data or national NHS systems, the DSPT must be completed.'
const DSPT_LINK = { text: 'DSPT', href: DSPT_HREF }

/** C1.2.3 onwards, after clinical risk management activities are confirmed. */
const CRM_CONFIRMED: AnswerCondition = { questionId: 'c1-2-2-crm-activities', in: ['yes'] }

/** C2.2.1 onwards. No on C2.2 leaves data protection and continues at C3. */
const PROCESSES_PERSONAL_DATA: AnswerCondition = { questionId: 'c2-2-personal-data', in: ['yes'] }

/** C1.2 follows C1.1.1 No, or either C1.1.2 classification. */
const ASKS_DIRECT_CARE: AnswerCondition = {
  anyOf: [
    { questionId: 'c1-1-1-samd', in: ['no'] },
    { questionId: 'c1-1-2-standalone', in: ['standalone-device', 'part-of-it-system'] },
  ],
}

/* -------------------------------- content ------------------------------- */

export const SECTIONS: OnboardingSection[] = [
  {
    id: 'product-details',
    title: 'Product details',
    description: 'Tell us which product, and which version of it, this form is for.',
    tasks: [
      task('product-details', 'A', 'Product details', [
        {
          id: 'a2-product-name',
          code: 'A2',
          type: 'text',
          label: 'What is the name of your product?',
          hint: 'Each listed product has its own onboarding form. Answers you provide to questions within the form will be saved until you choose to submit them.',
        },
        {
          id: 'a3-product-version',
          code: 'A3',
          type: 'text',
          label: 'Which version number of your product is this form for?',
          hint: 'For example, 3.2.0.',
        },
        {
          id: 'a4-product-type',
          code: 'A4',
          type: 'radios',
          label: 'What type of product is it?',
          options: [
            { value: 'standalone-application', label: 'Standalone application' },
            { value: 'wearable', label: 'Wearable' },
            { value: 'saas', label: 'Software as a service (SaaS)' },
            { value: 'other', label: 'Other' },
          ],
        },
      ]),
    ],
  },
  {
    id: 'value-proposition',
    title: 'Value proposition',
    description:
      'Set out the clinical, economic or behavioural benefits of your product to support the review of your technology.',
    tasks: [
      task('value-proposition', 'B', 'Value proposition', [
        {
          id: 'b1-intended-use',
          code: 'B1',
          type: 'radios',
          label: "What is the product's intended use?",
          options: [
            { value: 'patient-care-support', label: 'Patient care or support' },
            { value: 'diagnostics', label: 'Diagnostics' },
            { value: 'clinical-support', label: 'Clinical support' },
            { value: 'workforce-support', label: 'Workforce support' },
            { value: 'other', label: 'Other' },
          ],
        },
        {
          id: 'b2-description',
          code: 'B2',
          type: 'textarea',
          label: 'Describe what it is designed to do and how it is expected to be used?',
          hint: 'A clear, high-level summary.',
        },
        {
          id: 'b3-users-benefits',
          code: 'B3',
          type: 'textarea',
          label:
            'Describe the intended users and proven benefits, and confirm if and how those benefits have been validated',
          hint: 'A high-level summary, including any trial details.',
        },
        {
          id: 'b4-data-flow',
          code: 'B4',
          type: 'radios',
          label: 'Can you provide information about the data flow between the product and the health IT system?',
          hint: 'Information you provide might include existing documentation showing data flows, user journey such as deployment diagrams, product installation or user guides.',
          options: CAN_PROVIDE,
          details: [
            {
              summary: 'How to make a user journey map',
              text: 'GOV.UK provides guidance on how to make a user journey map and what should be included.',
              link: {
                text: 'how to make a user journey map',
                href: 'https://designnotes.blog.gov.uk/2016/04/21/how-to-make-a-user-journey-map/',
              },
            },
            {
              summary: 'How providing flows help',
              text: 'Data flows enable the assessor to understand how data moves through a product. This may be included within a Data Protection Impact Assessment. If this is the case, please provide as a separate attachment for ease of review.',
            },
          ],
        },
        {
          id: 'b4-data-flow-upload',
          code: 'B4',
          type: 'upload',
          multiple: true,
          noReference: true,
          label: 'Upload your journey maps and data flows',
          hint: 'You can upload multiple files at a time or one after the other. The maximum single file size you can upload is XMB, and you can upload up to XXMB of files in total.',
          showIf: { questionId: 'b4-data-flow', in: ['yes'] },
        },
      ]),
    ],
  },
  {
    id: 'technical-questions',
    title: 'Assessed standards',
    description:
      'Suppliers must provide responses and documentation relating to the specific version of the product that is subject to assessment.',
    tasks: [
      task('clinical-safety', 'C1', 'Clinical safety', [
        {
          id: 'c1-clinical-safety-intro',
          type: 'info',
          label: 'Establishing that your product is clinically safe to use.',
          hint: CLINICAL_SAFETY_INTERSTITIAL_HINT,
          hintLink: CLINICAL_SAFETY_INTERSTITIAL_LINKS,
          hideInSummary: true,
        },
        {
          id: 'c1-1-1-samd',
          code: 'C1.1.1',
          type: 'radios',
          label: 'Does your product qualify as software or AI as a medical device under UK MDR 2002?',
          hint: "If you select 'Yes', you will need to upload a completed Pre-acquisition questionnaire (PAQ).",
          hintLink: {
            text: 'Pre-acquisition questionnaire (PAQ)',
            href: 'https://www.england.nhs.uk/publication/pre-acquisition-questionnaire/',
          },
          options: YES_NO,
        },
        {
          id: 'c1-1-1-paq-upload',
          code: 'C1.1.1',
          type: 'upload',
          noReference: true,
          label: 'Upload your Pre-acquisition questionnaire (PAQ)',
          hint: 'You must upload a PAQ.',
          hintLink: {
            text: 'PAQ',
            href: 'https://www.england.nhs.uk/publication/pre-acquisition-questionnaire/',
          },
          showIf: { questionId: 'c1-1-1-samd', in: ['yes'] },
        },
        {
          id: 'c1-1-2-standalone',
          code: 'C1.1.2',
          type: 'radios',
          pageTitle: 'Product classification',
          label: 'What is your product classified as?',
          hint:
            'Read guidance on applicability of the DCB0129 and DCB0160 clinical safety standards.\n\nThis question is intended to determine whether your product is a standalone medical device, or if it forms part of or integrates with a Health IT System that your organisation places on the market. For example; an EPR incorporating a SaMD or AIaMD module.\n\nIf it forms part of or integrates with a Health IT System that your organisation places on the market, the product as a whole may have non-medical intended-uses not covered by medical device regulations. However, it may still pose clinical risks and as such is subject to the DCB0129 standard.',
          hintLink: [
            {
              text: 'guidance on applicability',
              href: 'https://digital.nhs.uk/services/clinical-safety/applicability-of-dcb-0129-and-dcb-0160',
            },
            {
              text: 'DCB0129 standard',
              href: 'https://digital.nhs.uk/data-and-information/information-standards/governance/latest-activity/standards-and-collections/dcb0129-clinical-risk-management-its-application-in-the-manufacture-of-health-it-systems/',
            },
          ],
          options: [
            { value: 'standalone-device', label: 'Standalone device' },
            { value: 'part-of-it-system', label: 'Part of an IT system', hint: 'Forming part of, or integrating with.' },
          ],
          showIf: { questionId: 'c1-1-1-samd', in: ['yes'] },
        },
        {
          id: 'c1-2-direct-care',
          code: 'C1.2',
          type: 'radios',
          label: 'Is your product designed to support or manage real-time or direct care?',
          hint: 'Your answer determines whether your product is or is part of a Health IT System that is subject to DCB0129.',
          hintLink: {
            text: 'DCB0129',
            href: 'https://digital.nhs.uk/data-and-information/information-standards/governance/latest-activity/standards-and-collections/dcb0129-clinical-risk-management-its-application-in-the-manufacture-of-health-it-systems/',
          },
          details: [
            {
              summary: 'The definition of a Health IT System',
              text: 'A Health IT system is defined as a product used to provide electronic information for health and social care purposes, meaning it may influence, support or manage real time or near real time direct care of patients/service users. Further information can be found in guidance on applicability.',
              link: {
                text: 'guidance on applicability',
                href: 'https://digital.nhs.uk/services/clinical-safety/applicability-of-dcb-0129-and-dcb-0160',
              },
            },
          ],
          options: YES_NO,
          showIf: ASKS_DIRECT_CARE,
        },
        {
          id: 'c1-2-1-justification',
          code: 'C1.2.1',
          type: 'textarea',
          label: 'Explain why the product is out of scope of DCB0129',
          hint: 'The explanation you provide should consider the terms as defined in the DCB0129 standard, and the guidance on applicability.',
          hintLink: [
            {
              text: 'DCB0129 standard',
              href: 'https://digital.nhs.uk/data-and-information/information-standards/governance/latest-activity/standards-and-collections/dcb0129-clinical-risk-management-its-application-in-the-manufacture-of-health-it-systems/',
            },
            {
              text: 'guidance on applicability',
              href: 'https://digital.nhs.uk/services/clinical-safety/applicability-of-dcb-0129-and-dcb-0160',
            },
          ],
          inset: 'Commissioning organisations can challenge the determination if not in agreement.',
          showIf: { questionId: 'c1-2-direct-care', in: ['no'] },
        },
        {
          id: 'c1-2-2-crm-activities',
          code: 'C1.2.2',
          type: 'radios',
          pageTitle: 'DCB0129 Compliance',
          label: 'Have you undertaken clinical risk management activities complying with DCB0129?',
          hint: DCB0129_MANUFACTURER_HINT,
          hintLink: DCB0129_STANDARD_LINK,
          options: YES_NO,
          showIf: CLINICAL_RISK_ROUTE,
        },
        {
          id: 'c1-2-2-crm-required',
          code: 'C1.2.2',
          type: 'blocked',
          label: 'You must undertake clinical risk management activities complying with DCB0129 before you can continue.',
          hint: DCB0129_MANUFACTURER_HINT,
          hintLink: DCB0129_STANDARD_LINK,
          hideInSummary: true,
          showIf: { questionId: 'c1-2-2-crm-activities', in: ['no'] },
        },
        {
          id: 'c1-2-3-crm-system-can-provide',
          code: 'C1.2.3',
          type: 'radios',
          label: 'Can you provide your clinical risk management system document?',
          hint: 'DCB0129 sets out the activities that must be undertaken for Health IT systems.',
          hintLink: { text: 'DCB0129', href: DCB0129_STANDARD_HREF },
          details: [
            {
              summary: 'I need a clinical risk management system template',
              text: 'You can download an NHS clinical risk management system template if you need one.',
              link: {
                text: 'clinical risk management system template',
                href: 'https://digital.nhs.uk/services/clinical-safety/documentation#clinical-risk-management',
              },
            },
          ],
          options: CAN_PROVIDE,
          showIf: [CLINICAL_RISK_ROUTE, CRM_CONFIRMED],
        },
        {
          id: 'c1-2-3-crm-system',
          code: 'C1.2.3',
          type: 'upload',
          noReference: true,
          label: 'Upload your clinical risk management system document',
          showIf: [CLINICAL_RISK_ROUTE, CRM_CONFIRMED, canProvide('c1-2-3-crm-system-can-provide')],
        },
        {
          id: 'c1-2-4-safety-case-can-provide',
          code: 'C1.2.4',
          type: 'radios',
          label: 'Can you provide your Clinical Safety Case Report?',
          hint: 'To pass, the manufacturer is required to submit a Clinical Safety Case Report that is compliant with the requirements set out in DCB0129. This report should be commensurate with the scale and clinical functionality of the product and address the clinical risk management activities specified with the standard.',
          details: [
            {
              summary: 'I need a template',
              text: 'You can download an NHS clinical safety case report template if you need one.',
              link: {
                text: 'clinical safety case report template',
                href: 'https://digital.nhs.uk/services/clinical-safety/documentation#clinical-risk-management',
              },
            },
          ],
          options: CAN_PROVIDE,
          showIf: [CLINICAL_RISK_ROUTE, CRM_CONFIRMED],
        },
        {
          id: 'c1-2-4-safety-case',
          code: 'C1.2.4',
          type: 'upload',
          noReference: true,
          label: 'Upload your Clinical Safety Case Report',
          showIf: [CLINICAL_RISK_ROUTE, CRM_CONFIRMED, canProvide('c1-2-4-safety-case-can-provide')],
        },
        {
          id: 'c1-2-4-hazard-log-can-provide',
          code: 'C1.2.4',
          type: 'radios',
          label: 'Can you provide your Hazard Log?',
          hint: 'To pass, the manufacturer is required to submit a Hazard Log that is compliant with the requirements set out in DCB0129. This report should be commensurate with the scale and clinical functionality of the product and address the clinical risk management activities specified with the standard.',
          details: [
            {
              summary: 'I need a template',
              text: 'You can download an NHS hazard log template if you need one.',
              link: {
                text: 'hazard log template',
                href: 'https://digital.nhs.uk/services/clinical-safety/documentation#clinical-risk-management',
              },
            },
          ],
          options: CAN_PROVIDE,
          showIf: [CLINICAL_RISK_ROUTE, CRM_CONFIRMED],
        },
        {
          id: 'c1-2-4-hazard-log',
          code: 'C1.2.4',
          type: 'upload',
          multiple: true,
          noReference: true,
          label: 'Upload your Hazard Log',
          hint: 'You can upload multiple files at a time or one after the other. The maximum single file size you can upload is XMB, and you can upload up to XXMB of files in total.',
          footnote: 'If needed, your Hazard Log can be appended later.',
          showIf: [CLINICAL_RISK_ROUTE, CRM_CONFIRMED, canProvide('c1-2-4-hazard-log-can-provide')],
        },
        {
          id: 'c1-2-5-cso',
          code: 'C1.2.5',
          type: 'fields',
          label: 'Provide details of your Clinical Safety Officer (CSO)',
          details: [
            {
              summary: "Check your CSO's suitability",
              text: [
                'The CSO must:',
                '● Be a suitably qualified and experienced clinician',
                '● Hold a current registration with an appropriate professional body relevant to their training and experience',
                '● Be knowledgeable in risk management and its application to clinical domains',
                '● Have sufficient responsibility to be able to ensure processes defined in DCB0129 are followed',
              ].join('\n\n'),
            },
          ],
          fields: [
            { key: 'full-name', label: 'Full name', autoComplete: 'name', width: 'nhsuk-u-width-two-thirds' },
            { key: 'profession', label: 'Profession', width: 'nhsuk-u-width-two-thirds' },
            { key: 'registration-number', label: 'Registration number', width: 'nhsuk-input--width-20' },
          ],
          showIf: [CLINICAL_RISK_ROUTE, CRM_CONFIRMED],
        },
      ]),
      task('data-protection', 'C2', 'Data protection', [
        {
          id: 'c2-data-protection-intro',
          type: 'info',
          label: 'Establishing that your product collects, stores and uses personal data in compliance with UK GDPR.',
          hint: 'Suppliers must provide responses and documentation relating to the specific version of the DHT product that is subject to assessment. This section covers how personal data is collected, stored and used, and how you meet the requirements of the UK General Data Protection Regulation (UK GDPR) and other relevant legislation.',
          hideInSummary: true,
        },
        {
          id: 'c2-1-dspt',
          code: 'C2.1',
          type: 'radios',
          pageTitle: 'Compliance with the annual Data Security and Protection Toolkit (DSPT) assessment',
          label: 'Are you compliant with the annual DSPT assessment?',
          hint: 'If your organisation has or will have direct or remote access to any patient data or NHS systems, it must be compliant with the annual Data Security and Protection Toolkit (DSPT) assessment for the current year if new to market, or previous year if you have yet to provide a return for the current year.',
          fieldHint: 'You must have met or exceeded status.',
          details: [
            {
              summary: 'What is a DSPT assessment',
              text: DSPT_EXPLAINER,
              link: DSPT_LINK,
            },
          ],
          options: [
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
            {
              value: 'no-patient-data',
              label: 'Not applicable',
            },
          ],
        },
        {
          id: 'c2-1-dspt-required',
          code: 'C2.1',
          type: 'blocked',
          label: 'You must be compliant with the Data Security and Protection Toolkit (DSPT)',
          hint: DSPT_EXPLAINER,
          hintLink: DSPT_LINK,
          hideInSummary: true,
          showIf: { questionId: 'c2-1-dspt', in: ['no'] },
        },
        {
          id: 'c2-2-personal-data',
          code: 'C2.2',
          type: 'radios',
          label: 'Does the product process personal data or data about deceased individuals?',
          hint: [
            'This includes any personal data processed by a sub processor.',
            'If your organisation has no role in operating or hosting the product or service (for example, products designed to be hosted on the care providers infrastructure) and with no means of accessing information contained within it (including remote access for support and maintenance purposes) select \'No\'.',
            'The UK General Data Protection Regulation (UK GDPR) applies to the processing of personal data. While it does not apply to deceased individuals, there are additional legal considerations under the common law duty of confidentiality for health and care data, including for data of deceased individuals.',
          ].join('\n\n'),
          hintLink: {
            // Trailing full stop keeps this distinct from "personal data" in the first paragraph.
            text: 'personal data.',
            href: 'https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/personal-information-what-is-it/what-is-personal-data/what-is-personal-data/',
          },
          options: YES_NO,
        },
        {
          id: 'c2-2-1-ico-can-provide',
          code: 'C2.2.1',
          type: 'radios',
          label: "Can you provide evidence of current Information Commissioner's Office (ICO) registration?",
          hint: 'The Data Protection Act 2018 requires all organisations processing personal data to register with the ICO.',
          options: CAN_PROVIDE,
          showIf: PROCESSES_PERSONAL_DATA,
        },
        {
          id: 'c2-2-1-ico',
          code: 'C2.2.1',
          type: 'upload',
          noReference: true,
          label: "Upload evidence of your current Information Commissioner's Office (ICO) registration document",
          hint: 'Your evidence can be a screenshot of the registration number that includes details of the expiration date.',
          showIf: [PROCESSES_PERSONAL_DATA, canProvide('c2-2-1-ico-can-provide')],
        },
        {
          id: 'c2-2-1-ico-expiry',
          code: 'C2.2.1',
          type: 'date',
          mustBeFuture: true,
          label: "What is the expiry date on your Information Commissioner's Office (ICO) Registration document?",
          hint: 'For example, 15 3 2028.',
          showIf: [PROCESSES_PERSONAL_DATA, canProvide('c2-2-1-ico-can-provide')],
        },
        {
          id: 'c2-2-2-dpia-can-provide',
          code: 'C2.2.2',
          type: 'radios',
          label: 'Can you provide the Data Protection Impact Assessment (DPIA) for your product?',
          hint: [
            'It is a legal requirement under the UK General Data Protection Regulation (UK GDPR) to complete a DPIA in advance of any processing likely to present high-risk to individuals.',
            'NHS England has developed a DPIA template and guidance to help you.',
            'The nature of health and care data means the impact on individuals is significant so most digital health technologies will require a DPIA.',
          ].join('\n\n'),
          hintLink: [
            {
              text: 'DPIA',
              href: 'https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/data-protection-impact-assessments-dpias/',
            },
            {
              text: 'high-risk',
              href: 'https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/data-protection-impact-assessments-dpias/when-do-we-need-to-do-a-dpia/',
            },
            {
              text: 'DPIA template and guidance',
              href: 'https://digital.nhs.uk/data-and-information/information-governance/templates/universal-ig-templates',
            },
          ],
          options: CAN_PROVIDE,
          showIf: PROCESSES_PERSONAL_DATA,
        },
        {
          id: 'c2-2-2-dpia',
          code: 'C2.2.2',
          type: 'upload',
          noReference: true,
          label: 'Upload the Data Protection Impact Assessment (DPIA) for your product',
          showIf: [PROCESSES_PERSONAL_DATA, canProvide('c2-2-2-dpia-can-provide')],
        },
        {
          id: 'c2-2-3-privacy-notice',
          code: 'C2.2.3',
          type: 'radios',
          pageTitle: "Provide your product's transparency information",
          label: 'How will you provide your transparency information?',
          hint: [
            'Transparency information may include published DPIAs, other documents that explain how the product processes information, or a Privacy Notice.',
            'NHS England has developed a template privacy notice and guidance to help you.',
          ].join('\n\n'),
          hintLink: {
            text: 'privacy notice and guidance',
            href: 'https://digital.nhs.uk/data-and-information/information-governance/templates/universal-ig-templates/privacy-notice',
          },
          options: [
            {
              value: 'link',
              label: "I'll provide a link",
              followUp: {
                label: 'Provide the URL',
                hint: 'For example, www.productname.com/privacy-notice',
                inputType: 'url',
              },
            },
            {
              value: 'upload',
              label: "I'll upload a document",
            },
            {
              value: 'not-provided',
              label: "I can't provide the transparency information right now",
            },
          ],
          showIf: PROCESSES_PERSONAL_DATA,
        },
        {
          id: 'c2-2-3-privacy-notice-upload',
          code: 'C2.2.3',
          type: 'upload',
          multiple: true,
          noReference: true,
          label: "Upload a document that shows your product's transparency information",
          hint: 'You can upload multiple files at a time or one after the other. The maximum single file size you can upload is XMB, and you can upload up to XXMB of files in total.',
          showIf: [PROCESSES_PERSONAL_DATA, { questionId: 'c2-2-3-privacy-notice', in: ['upload'] }],
        },
        {
          id: 'c2-2-4-terms',
          code: 'C2.2.4',
          type: 'radios',
          pageTitle:
            'Provide product terms and conditions regarding user data, an end user licence agreement (EULA) or equivalent',
          label: "How will you provide your product's terms and conditions?",
          hint: 'The UK General Data Protection Regulation (UK GDPR) principles set a legal requirement for health and care organisations to only engage in processing that it has assessed as fair.',
          hintLink: {
            text: 'assessed as fair',
            href: 'https://ico.org.uk/for-organisations/advice-and-services/audits/data-protection-audit-framework/',
          },
          options: [
            {
              value: 'link',
              label: "I'll provide a link",
              followUp: {
                label: 'Provide the URL',
                hint: 'For example, www.productname.com/terms-and-conditions',
                inputType: 'url',
              },
            },
            {
              value: 'upload',
              label: "I'll upload a document",
              hint: 'You can upload on the next page',
            },
            {
              value: 'not-provided',
              label: "I can't provide these terms and conditions right now",
            },
            {
              value: 'not-applicable',
              label: 'This question is not applicable to your product',
              dividerBefore: true,
            },
          ],
          showIf: PROCESSES_PERSONAL_DATA,
        },
        {
          id: 'c2-2-4-terms-upload',
          code: 'C2.2.4',
          type: 'upload',
          multiple: true,
          noReference: true,
          label:
            'Upload documentation for user data, an end user licence agreement (EULA) or equivalent',
          hint: 'You can upload multiple files at a time or one after the other. The maximum single file size you can upload is XMB, and you can upload up to XXMB of files in total.',
          showIf: [PROCESSES_PERSONAL_DATA, { questionId: 'c2-2-4-terms', in: ['upload'] }],
        },
        {
          id: 'c2-2-5-data-location',
          code: 'C2.2.5',
          type: 'radios',
          label: 'Where does your product store and process data?',
          options: [
            { value: 'uk-only', label: 'UK only' },
            { value: 'outside-uk', label: 'Outside of the UK' },
          ],
          showIf: PROCESSES_PERSONAL_DATA,
        },
        {
          id: 'c2-2-6-outside-uk',
          code: 'C2.2.6',
          type: 'countries',
          label: 'Name the countries outside the UK where data is stored or processed',
          summaryLabel: 'Countries where data is stored or processed',
          hint: [
            'The UK General Data Protection Regulation (UK GDPR) requires safeguards to be applied to personal data processed, including storage or transfer through of data, in any country outside of the UK. The UK government maintains a list of countries that it has granted adequacy status, which effectively means that personal data can flow freely to that country.',
            'To process data in any other country, an alternative legal mechanism compliant with UK GDPR such as an International Data Transfer Agreement (IDTA) is required. The manufacturer must ensure it has an appropriate safeguard in place if any personal data within its product leaves the UK.',
          ].join('\n\n'),
          hintLink: {
            text: 'list of countries',
            href: 'https://www.gov.uk/government/publications/uk-approach-to-international-data-transfers/international-data-transfers-building-trust-delivering-growth-and-firing-up-innovation',
          },
          showIf: [PROCESSES_PERSONAL_DATA, { questionId: 'c2-2-5-data-location', in: ['outside-uk'] }],
        },
        {
          id: 'c2-2-6-safeguards',
          code: 'C2.2.6',
          type: 'country-details',
          countriesFrom: 'c2-2-6-outside-uk',
          label: 'Compliance safeguards',
          hint: 'Set out the safeguards you have in place for the countries you listed.',
          showIf: [PROCESSES_PERSONAL_DATA, { questionId: 'c2-2-5-data-location', in: ['outside-uk'] }],
        },
      ]),
      task('technical-security', 'C3', 'Technical security', [
        {
          id: 'c3-technical-security-intro',
          type: 'info',
          label: 'Establishing that your product meets industry best practice security standards.',
          hint: TECHNICAL_SECURITY_INTERSTITIAL_HINT,
          hideInSummary: true,
        },
        {
          id: 'c3-1-cyber-essentials-can-provide',
          code: 'C3.1',
          type: 'radios',
          label: 'Can you provide a valid Cyber Essentials certificate?',
          hint: [
            'Cyber Essentials helps organisations guard against the most common cyber threats.',
            "The scope of assessment should include all systems and services under the supplier's control that support the development, production use and operational management of the system under assessment.",
          ].join('\n\n'),
          hintLink: {
            text: 'Cyber Essentials',
            href: 'https://www.ncsc.gov.uk/cyberessentials/overview',
          },
          options: CAN_PROVIDE,
        },
        {
          id: 'c3-1-cyber-essentials',
          code: 'C3.1',
          type: 'upload',
          noReference: true,
          label: 'Upload a valid Cyber Essentials certificate',
          showIf: canProvide('c3-1-cyber-essentials-can-provide'),
        },
        {
          id: 'c3-1-cyber-essentials-expiry',
          code: 'C3.1',
          type: 'date',
          mustBeFuture: true,
          label: 'What is the Cyber Essentials certificate expiry date?',
          hint: 'For example, 15 3 2028.',
          showIf: canProvide('c3-1-cyber-essentials-can-provide'),
        },
        {
          id: 'c3-2-charter',
          code: 'C3.2',
          type: 'radios',
          label: 'Have you signed the Cyber Security Charter for Suppliers to the NHS?',
          options: YES_NO,
        },
        {
          id: 'c3-3-pen-test-can-provide',
          code: 'C3.3',
          type: 'radios',
          label: 'Can you provide an external penetration test summary report from the last 12 months?',
          hint: 'If your product is internet based or is provided as a service accessible from the internet, for example, a mobile app or server-side software, your external penetration test summary must include Open Web Application Security Project (OWASP) Top 10 vulnerabilities.',
          details: [
            {
              summary: 'Penetration testing and OWASP guidance',
              text: 'The NCSC provides guidance on penetration testing. The OWASP Foundation provides guidance on the OWASP top 10 vulnerabilities.',
              link: [
                {
                  text: 'penetration testing',
                  href: 'https://www.ncsc.gov.uk/guidance/penetration-testing',
                },
                {
                  text: 'OWASP top 10 vulnerabilities',
                  href: 'https://owasp.org/projects/top-ten',
                },
              ],
            },
          ],
          options: CAN_PROVIDE,
        },
        {
          id: 'c3-3-pen-test',
          code: 'C3.3',
          type: 'upload',
          noReference: true,
          label: 'Upload an external penetration test summary report from the last 12 months',
          showIf: canProvide('c3-3-pen-test-can-provide'),
        },
        {
          id: 'c3-4-code-of-practice',
          code: 'C3.4',
          type: 'radios',
          pageTitle:
            'Department for Science, Innovation and Technology (DSIT) and National Cyber Security Centre (NCSC) Software Security Code of Practice',
          label: 'Can you confirm your product adheres to the DSIT and NCSC Software Security Code of Practice?',
          hint: [
            'The Software Security Code of Practice commits to meeting the principles of secure design and development, secure build environment, secure deployment and maintenance and communication with customers.',
            'Software provided to the NHS should be produced in adherence to this code of practice and principles.',
          ].join('\n\n'),
          hintLink: {
            text: 'Software Security Code of Practice',
            href: 'https://www.gov.uk/government/publications/software-security-code-of-practice/software-security-code-of-practice',
          },
          options: CONFIRMED_UNABLE,        },
        {
          id: 'c3-5-mfa-plan',
          code: 'C3.5',
          type: 'radios',
          label: 'Do you have a plan for implementing multi-factor authentication (MFA) across all accounts?',
          hint: 'The NCSC provides guidance on Multi-Factor Authentication.',
          hintLink: {
            text: 'Multi-Factor Authentication',
            href: 'https://www.ncsc.gov.uk/collection/mfa-for-your-corporate-online-services',
          },
          options: YES_NO,        },
        {
          id: 'c3-5-1-privileged-mfa',
          code: 'C3.5.1',
          type: 'radios',
          label:
            'Confirm that all supplier accounts with privileged access to the product have multi-factor authentication (MFA) or equivalent?',
          hint: [
            'MFA must be enforced on all privileged access connections to the product, and on all remote access connections to the product, but does not necessarily need to be enforced on the product itself. For example, MFA may be applied to initial connectivity to a network from which the product can be accessed directly.',
            'The NCSC provides guidance on Multi-Factor Authentication.',
          ].join('\n\n'),
          hintLink: {
            text: 'Multi-Factor Authentication',
            href: 'https://www.ncsc.gov.uk/collection/mfa-for-your-corporate-online-services',
          },
          options: [
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
            {
              value: 'not-applicable',
              label: 'Not applicable',
              hint: 'Supplier has no access to the product',
            },
          ],        },
        {
          id: 'c3-6-logging',
          code: 'C3.6',
          type: 'radios',
          label: 'Have logging and reporting requirements been defined?',
          hint: "The National Cyber Security Centre (NCSC) provides guidance on logging and protective monitoring. Logging, such as audit trails that show all access, must be in place if you answer 'Yes'. We recognise that not all manufacturers will have advanced audit capabilities.",
          hintLink: {
            text: 'logging and protective monitoring',
            href: 'https://www.ncsc.gov.uk/collection/device-security-guidance/managing-deployed-devices/logging-and-protective-monitoring',
          },
          options: YES_NO,        },
      ]),
      task('interoperability', 'C4', 'Interoperability', [
        {
          id: 'c4-interoperability-intro',
          type: 'info',
          label: 'Establishing how well your product exchanges data with other systems.',
          hint: INTEROPERABILITY_INTERSTITIAL_HINT,
          hintLink: INTEROPERABILITY_INTERSTITIAL_LINKS,
          hideInSummary: true,
        },
        {
          id: 'c4-1-apis',
          code: 'C4.1',
          type: 'radios',
          label: 'Does your product expose any APIs or integration channels for other health products?',
          options: YES_NO,
        },
        {
          id: 'c4-1-1-standards',
          code: 'C4.1.1',
          type: 'textarea',
          pageTitle: 'Confirm your APIs use international or industry standards for interoperability appropriate for the use case',
          label: "List the standards relevant to the product's use case and explain why they are appropriate",
          hint: [
            "The NHS England Standards Directory allows manufacturers to identify standards relevant for their product's use case.",
            'NHS England website Developer and integration hub provides guidance on national APIs and API standards.',
          ].join('\n\n'),
          hintLink: [
            {
              text: 'Standards Directory',
              href: 'https://standards.nhs.uk/',
            },
            {
              text: 'Developer and integration',
              href: 'https://digital.nhs.uk/developer/api-catalogue',
            },
          ],
          showIf: { questionId: 'c4-1-apis', in: ['yes'] },
        },
        {
          id: 'c4-1-2-open-api',
          code: 'C4.1.2',
          type: 'radios',
          label: 'Confirm your APIs follow GDS Open API guidance and are openly documented',
          hint: 'Documentation must be freely available to third parties. The Government Digital Services provide guidance on Open API best practice, including open documentation.',
          hintLink: [
            {
              text: 'Open API best practice',
              href: 'https://www.gov.uk/government/collections/api-design-guidance',
            },
            {
              text: 'open documentation',
              href: 'https://www.gov.uk/guidance/how-to-document-apis',
            },
          ],
          options: [
            { value: 'confirm', label: 'Yes, I confirm' },
            { value: 'cannot-confirm', label: 'No, I cannot confirm' },
          ],
          showIf: { questionId: 'c4-1-apis', in: ['yes'] },
        },
        {
          id: 'c4-1-3-documentation',
          code: 'C4.1.3',
          type: 'textarea',
          label: 'Provide details on how your APIs are documented and made available to third parties',
          showIf: { questionId: 'c4-1-2-open-api', in: ['cannot-confirm'] },
        },
        {
          id: 'c4-2-data-sharing',
          code: 'C4.2',
          type: 'radios',
          label: 'Is your product intended to share or receive data from national or local care systems?',
          hint: 'This could be for managing or delivering patient care, for example, clinical record systems, or patient administration systems. Or it could be for other administrative purposes where a patient identity is relevant, for example, license management of a digital therapeutic (DTx).',
          options: YES_NO,
        },
        {
          id: 'c4-2-1-nhs-number',
          code: 'C4.2.1',
          type: 'radios',
          label: 'Is your product capable of using an NHS number to identify patient data when exchanging data?',
          hint: [
            'The NHS number is the mandated standard identifier for patients.',
            'Further guidance on the benefits of using NHS numbers.',
          ].join('\n\n'),
          hintLink: [
            {
              text: 'mandated standard identifier',
              href: 'https://digital.nhs.uk/data-and-information/information-standards/governance/latest-activity/standards-and-collections/isb-0149-nhs-number/',
            },
            {
              text: 'benefits of using NHS numbers',
              href: 'https://digital.nhs.uk/services/personal-demographics-service/nhs-number',
            },
          ],
          options: YES_NO,
          showIf: { questionId: 'c4-2-data-sharing', in: ['yes'] },
        },
        {
          id: 'c4-2-2-pds',
          code: 'C4.2.2',
          type: 'radios',
          label: 'Does your product integrate with the NHS Personal Demographics Service (PDS) or local systems to validate NHS numbers?',
          hint: 'The Personal Demographics Service is used as the national master database for all NHS patients in England.',
          hintLink: {
            text: 'Personal Demographics Service',
            href: 'https://digital.nhs.uk/services/personal-demographics-service',
          },
          options: [
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
            { value: 'onboarding-to-pds', label: 'In the process of onboarding to PDS' },
          ],
          showIf: { questionId: 'c4-2-1-nhs-number', in: ['yes'] },
        },
        {
          id: 'c4-2-3-identification',
          code: 'C4.2.3',
          type: 'textarea',
          label: 'Provide details on your current approach to correctly identifying patient records',
          showIf: {
            anyOf: [
              { questionId: 'c4-2-1-nhs-number', in: ['no'] },
              { questionId: 'c4-2-2-pds', in: ['no', 'onboarding-to-pds'] },
            ],
          },
        },
        {
          id: 'c4-2-4-nhs-login',
          code: 'C4.2.4',
          type: 'radios',
          label: 'If your product is used directly by patients, do you use NHS login to verify identity and authenticate users?',
          hint: 'NHS England provides guidance on NHS Login for partners and developers, and a list of digital health and social services that integrate with NHS Login',
          hintLink: [
            {
              text: 'NHS Login for partners and developers',
              href: 'https://digital.nhs.uk/services/nhs-login/nhs-login-for-partners-and-developers',
            },
            {
              text: 'digital health and social services that integrate with NHS Login',
              href: 'https://digital.nhs.uk/services/nhs-login/nhs-login-for-partners-and-developers/nhs-login-integrated-partners-and-services',
            },
          ],
          options: [
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
            {
              value: 'not-applicable',
              label: 'Not applicable',
              hint: 'Your product is not used directly by patients',
            },
          ],
          showIf: {
            anyOf: [
              { questionId: 'c4-2-2-pds', in: ['yes'] },
              { questionId: 'c4-2-1-nhs-number', in: ['no'] },
              { questionId: 'c4-2-2-pds', in: ['no', 'onboarding-to-pds'] },
            ],
          },
        },
        {
          id: 'c4-2-5-dapb3051',
          code: 'C4.2.5',
          type: 'radios',
          label: 'If used by public health or social care, does the product support the DAPB3051 identity standard?',
          hint: 'Where digital health technology products are used by Health and Care provider organisations to deliver services, the product must enable the care provider organisation to comply with DAPB3051 Identity Verification and Authentication Standard for Digital Health and Care Services.',
          hintLink: {
            text: 'DAPB3051 Identity Verification and Authentication Standard for Digital Health and Care Services',
            href: 'https://digital.nhs.uk/data-and-information/information-standards/governance/latest-activity/standards-and-collections/dapb3051-identity-verification-and-authentication-standard-for-digital-health-and-care-services',
          },
          options: [
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
            {
              value: 'not-applicable',
              label: 'Not applicable',
              hint: 'The product is not used by public health or adult social care services',
            },
          ],
          showIf: { questionId: 'c4-2-4-nhs-login', in: ['no'] },
        },
        {
          id: 'c4-2-6-authentication',
          code: 'C4.2.6',
          type: 'textarea',
          label: 'Detail your authentication approach and data protection measures',
          hint: 'For this patient facing product, detail your robust approach to identity verification and authentication sufficient to ensure data protection',
          showIf: { questionId: 'c4-2-5-dapb3051', in: ['no', 'not-applicable'] },
        },
      ]),
    ],
  },
  {
    id: 'usability-accessibility',
    title: 'Usability and accessibility',
    description: 'Establishing that your product has followed best practice.',
    tasks: [
      task('usability-accessibility', 'D', 'Usability and accessibility', [
        {
          id: 'd1-1-pathways',
          code: 'D1.1',
          type: 'radios',
          label: 'Can you provide information about how the product fits into existing systems such as care pathways or staff journeys?',
          hint: 'Understanding intended use case in context of user journey is important to help Health and Care providers to design accessible, usable digital care pathways.',
          options: [
            { value: 'yes', label: 'Yes', hint: 'You can provide information on the next page' },
            { value: 'no', label: "No, I can't provide this right now" },
          ],
        },
        {
          id: 'd1-1-pathways-upload',
          code: 'D1.1',
          type: 'upload',
          multiple: true,
          noReference: true,
          label: 'Upload care pathways or staff journey documentation',
          details: [
            {
              summary: 'Examples of accepted documents',
              text: [
                '● Instructions for use',
                '● Care pathway diagrams',
                '● Staff journey diagrams',
              ].join('\n\n'),
            },
          ],
          documents: [
            'You can upload multiple files at a time or one after the other. The maximum single file size you can upload is XMB, and you can upload up to XXMB of files in total',
          ],
          showIf: { questionId: 'd1-1-pathways', in: ['yes'] },
        },
        {
          id: 'd1-2-user-testing',
          code: 'D1.2',
          type: 'radios',
          label: 'Do you test your product with intended users to validate its useability?',
          hint: 'Testing that your product is usable ensures efficiency, efficacy and safety',
          options: YES_NO,
        },
        {
          id: 'd1-3-ais',
          code: 'D1.3',
          type: 'radios',
          pageTitle: 'Accessible Information Standard',
          label:
            'Have you read the Accessible Information Standard and considered its design requirement in regards to your product?',
          hint: [
            'The Accessible Information Standard is a set of requirements regarding accessibility and other elements necessary for NHS bodies compliance with the Equalities Act (2010).',
            'While it is not binding on IT suppliers, providers duty to conform may create requirements for products used in the provision of Health and Adult Social Care in the UK.',
          ].join('\n\n'),
          hintLink: {
            text: 'Accessible Information Standard',
            href: 'https://www.england.nhs.uk/accessible-information-standard/',
          },
          options: YES_NO,
        },
        {
          id: 'd1-4-web-or-mobile',
          code: 'D1.4',
          type: 'radios',
          label: 'Is your product a web or mobile application?',
          hint: 'Refer to the Web Content Accessibility Guidelines (WCAG) 2.2 to determine if your product is a web or mobile application',
          options: YES_NO,
        },
        {
          id: 'd1-4-platforms',
          code: 'D1.4',
          type: 'checkboxes',
          label: 'Which digital platforms does your product support?',
          hint: 'Select all that apply.',
          options: [
            { value: 'android', label: 'Android' },
            { value: 'ios', label: 'iOS' },
            { value: 'web', label: 'Web' },
          ],
          showIf: { questionId: 'd1-4-web-or-mobile', in: ['yes'] },
        },
        {
          id: 'd1-4-1-wcag',
          code: 'D1.4.1',
          type: 'radios',
          pageTitle: 'Web Content Accessibility Guidelines (WCAG) 2.2',
          label: 'Does your product comply with WCAG 2.2 at level AA or higher?',
          hint: [
            'It is UK government policy that from October 2024, digital public services should achieve AA or higher on the WCAG 2.2 as a means of demonstrating compliance with The Public Sector Bodies, Websites and Mobile Applications, and Accessibility Regulations 2018.',
            'While achieving AA or higher may not apply directly to third party products in all situations, meeting these requirements remains important where digital products are used in the Health and Adult Social Care System.',
          ].join('\n\n'),
          hintLink: {
            text: 'government policy',
            href: 'https://www.gov.uk/service-manual/helping-people-to-use-your-service/making-your-service-accessible-an-introduction#meeting-government-accessibility-requirements',
          },
          options: [
            { value: 'yes', label: 'Yes' },
            { value: 'no-plan-in-place', label: 'Not yet, but a plan is in place' },
            { value: 'no', label: 'No' },
            {
              value: 'not-applicable',
              label: 'Not applicable',
              hint: 'your product is not a web or mobile application',
              dividerBefore: true,
            },
          ],
          showIf: { questionId: 'd1-4-platforms', in: ['android', 'ios', 'web'] },
        },
        {
          id: 'd1-4-2-timescale',
          code: 'D1.4.2',
          type: 'textarea',
          label: 'When do you plan to be compliant with Web Content Accessibility Guidelines (WCAG) 2.2?',
          hint: 'provide a date or the number of months',
          showIf: { questionId: 'd1-4-1-wcag', in: ['no-plan-in-place'] },
        },
        {
          id: 'd1-4-3-accessibility-statement',
          code: 'D1.4.3',
          type: 'text',
          inputType: 'url',
          pageTitle: 'Provide a link to your published accessibility statement',
          label: 'Provide a link to your published accessibility statement',
          hint: 'If you need help building your accessibility statement, the Government Digital Service (GDS) provides guidance on accessibility and accessibility statements, including a sample template.',
          hintLink: {
            text: 'accessibility and accessibility statements',
            href: 'https://www.gov.uk/guidance/make-your-website-or-app-accessible-and-publish-an-accessibility-statement',
          },
          fieldHint: 'For example, https://www.example.com/accessibility',
          showIf: { questionId: 'd1-4-platforms', in: ['android', 'ios', 'web'] },
        },
        {
          id: 'd1-5-availability',
          code: 'D1.5',
          type: 'text',
          pageTitle: 'What was your average service availability over the past 12 months?',
          label: 'What was your average service availability over the past 12 months?',
          hint: 'Provision of reliable, high availability services is a requirement for digital services in the public sector.',
          fieldHint: 'Provide your service availability as a percentage to 2 decimal places, for example, 99.95',
          inputWidth: 'nhsuk-input--width-4',
          suffix: '%',
          showIf: { questionId: 'd1-4-platforms', in: ['android', 'ios', 'web'] },
        },
      ]),
    ],
  },
]

export const ALL_TASKS: OnboardingTask[] = SECTIONS.flatMap((s) => s.tasks)

/** Resolve a task (and its parent section) from a URL slug. */
export function findTask(slug: string): { task: OnboardingTask; section: OnboardingSection } | null {
  for (const section of SECTIONS) {
    const found = section.tasks.find((t) => t.slug === slug)
    if (found) return { task: found, section }
  }
  return null
}

export function taskHref(formId: string, task: OnboardingTask): string {
  return `${formBasePath(formId)}/${task.slug}`
}

/** URL for question page `step` (1-based). Step 1 is the bare task URL. */
export function taskStepHref(formId: string, task: OnboardingTask, step: number): string {
  return step <= 1 ? taskHref(formId, task) : `${taskHref(formId, task)}/${step}`
}

/**
 * Answers are flat string values keyed by question id. Composite questions use
 * extra keys: upload -> `${id}${UPLOAD_REFERENCE_SUFFIX}`; checkboxes store the
 * selected values joined with `CHECKBOX_SEPARATOR`; dates store `YYYY-MM-DD`.
 */
export type TaskAnswers = Record<string, string>

export const CHECKBOX_SEPARATOR = ','

export function isAnswered(value: string | undefined): boolean {
  return typeof value === 'string' && value.trim() !== ''
}

/** All answer keys a question writes (used to scope a page's draft). */
export function questionKeys(q: OnboardingQuestion): string[] {
  switch (q.type) {
    case 'upload':
      return q.multiple || q.noReference ? [q.id] : [q.id, `${q.id}${UPLOAD_REFERENCE_SUFFIX}`]
    case 'multi-upload':
      return [q.id, `${q.id}${MULTI_UPLOAD_CONFIRMED_SUFFIX}`]
    case 'fields':
      return q.fields.map((f) => fieldKey(q.id, f))
    case 'radios':
    case 'checkboxes':
      return questionHasConditionalInput(q) ? [q.id, otherDetailsKey(q.id)] : [q.id]
    case 'blocked':
    case 'info':
      return []
    default:
      return [q.id]
  }
}

/** YYYY-MM-DD check: all three parts present, a year from 1900 to 2100, and a real calendar date. */
export function isValidIsoDate(value: string | undefined): boolean {
  if (!value) return false
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value)
  if (!m) return false
  const [, y, mo, d] = m.map(Number)
  if (y < 1900 || y > 2100 || mo < 1 || mo > 12 || d < 1) return false
  return d <= new Date(y, mo, 0).getDate()
}

/** True when the date is a valid calendar date strictly after today (local time). */
export function isFutureIsoDate(value: string | undefined): boolean {
  if (!isValidIsoDate(value)) return false
  const [y, m, d] = value!.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date.getTime() > today.getTime()
}

export function isQuestionAnswered(q: OnboardingQuestion, answers: TaskAnswers): boolean {
  switch (q.type) {
    case 'upload':
      if (q.multiple) return parseUploadedDocuments(answers[q.id]).length > 0
      return isAnswered(answers[q.id]) && (q.noReference || isAnswered(answers[`${q.id}${UPLOAD_REFERENCE_SUFFIX}`]))
    case 'countries':
      return countriesError(q, answers) === undefined
    case 'textarea':
      return isAnswered(answers[q.id]) && countCharacters(answers[q.id] ?? '') <= TEXTAREA_CHARACTER_LIMIT
    case 'country-details': {
      const countries = countriesFor(q, answers)
      const details = parseCountryDetails(answers[q.id])
      return (
        countries.length > 0 &&
        countries.every((c) => isAnswered(details[c]) && countCharacters(details[c] ?? '') <= TEXTAREA_CHARACTER_LIMIT)
      )
    }
    case 'fields':
      return q.fields.every((f) => f.optional || isAnswered(answers[fieldKey(q.id, f)]))
    case 'multi-upload':
      return (
        parseUploadedDocuments(answers[q.id]).length > 0 &&
        answers[`${q.id}${MULTI_UPLOAD_CONFIRMED_SUFFIX}`] === CONFIRMED_VALUE
      )
    case 'date':
      return q.mustBeFuture ? isFutureIsoDate(answers[q.id]) : isValidIsoDate(answers[q.id])
    case 'radios':
    case 'checkboxes':
      if (!isAnswered(answers[q.id])) return false
      if (selectedValues(q, answers).some((value) => optionFollowUp(q, value) && !isAnswered(answers[otherDetailsKey(q.id)]))) {
        return false
      }
      return true
    case 'blocked':
      return false
    case 'info':
      return true
    default:
      return isAnswered(answers[q.id])
  }
}

function uploadHasFile(question: OnboardingQuestion, answers: TaskAnswers): boolean {
  if (question.type !== 'upload') return false
  if (question.multiple) return parseUploadedDocuments(answers[question.id]).length > 0
  return isAnswered(answers[question.id])
}

/** First problem with a `countries` answer, with the row it applies to. */
export function countriesProblem(
  question: OnboardingQuestion,
  answers: TaskAnswers,
): { message: string; row: number } | undefined {
  const rows = parseCountries(answers[question.id])
  const required = QUESTION_ERRORS[question.id]?.required ?? 'Enter a country'
  if (rows.length === 0) return { message: required, row: 0 }
  const seen = new Set<string>()
  for (let row = 0; row < rows.length; row += 1) {
    const value = rows[row].trim()
    if (!value) return { message: rows.length > 1 ? 'Enter a country or delete this row' : required, row }
    const name = canonicalCountryName(value)
    if (!name) return { message: 'Select a country from the list', row }
    if (seen.has(name)) return { message: `You have already added ${name}. Enter a different country or delete this row`, row }
    seen.add(name)
  }
  return undefined
}

/** Error for one country's safeguards text area on a `country-details` page. */
export function countrySafeguardsError(country: string, value: string): string | undefined {
  if (countCharacters(value) > TEXTAREA_CHARACTER_LIMIT) return characterLimitMessage(`Safeguards for ${country}`)
  if (!isAnswered(value)) return `Set out the safeguards you have in place for ${country}`
  return undefined
}

function countriesError(question: OnboardingQuestion, answers: TaskAnswers): string | undefined {
  return countriesProblem(question, answers)?.message
}

/** First problem with a `country-details` answer, with the row it applies to. */
function countryDetailsProblem(
  question: OnboardingQuestion,
  answers: TaskAnswers,
): { message: string; row: number } | undefined {
  if (question.type !== 'country-details') return undefined
  const details = parseCountryDetails(answers[question.id])
  const countries = countriesFor(question, answers)
  for (let row = 0; row < countries.length; row += 1) {
    const message = countrySafeguardsError(countries[row], details[countries[row]] ?? '')
    if (message) return { message, row }
  }
  return undefined
}

/** Field id of one country's row: its autocomplete, or its text area on a `country-details` page. */
export function countryFieldId(questionId: string, row: number): string {
  return `${questionId}-${row}`
}

/** The question's error messages, with "your product" replaced by the product name when it is known. */
function errorMessagesFor(question: OnboardingQuestion, productName?: string): QuestionErrorMessages {
  const messages = QUESTION_ERRORS[question.id] ?? {}
  if (!productName || SKIP_PRODUCT_NAME_SUBSTITUTION.has(question.id)) return messages
  const named = (text?: string) => (text ? substituteProductName(text, productName) : text)
  return {
    required: named(messages.required),
    followUp: named(messages.followUp),
    subject: named(messages.subject),
    fields: messages.fields,
  }
}

type DatePart = 'day' | 'month' | 'year'

/** Date parts left empty, in the order the inputs appear. */
function missingDateParts(value: string | undefined): DatePart[] {
  const [year = '', month = '', day = ''] = (value ?? '').split('-')
  const parts: Array<[DatePart, string]> = [
    ['day', day],
    ['month', month],
    ['year', year],
  ]
  return parts.filter(([, v]) => !v).map(([part]) => part)
}

/** GOV.UK Date input messages: empty, incomplete, year not 4 numbers, not a real date, not in the future. */
function dateError(
  question: Extract<OnboardingQuestion, { type: 'date' }>,
  value: string | undefined,
  messages: QuestionErrorMessages,
): string | undefined {
  const subject = messages.subject ?? 'Date'
  const missing = missingDateParts(value)
  if (missing.length === 3) return question.optional ? undefined : (messages.required ?? 'Enter a date')
  if (missing.length > 0) return `${subject} must include a ${missing.join(' and ')}`
  if ((value ?? '').split('-')[0].length !== 4) return 'Year must include 4 numbers'
  if (!isValidIsoDate(value)) return `${subject} must be a real date`
  if (question.mustBeFuture && !isFutureIsoDate(value)) return `${subject} must be in the future`
  return undefined
}

/** "Enter address line 1" from the label "Address line 1"; keeps capitals in labels like "NHS number". */
function enterFieldMessage(label: string): string {
  const lowered = /^[A-Z][a-z]/.test(label) ? label.charAt(0).toLowerCase() + label.slice(1) : label
  return `Enter ${lowered}`
}

/**
 * Error message for the answer(s) on one question page, or undefined when it can be saved.
 * Pass `productName` so messages name the product, as the question heading does.
 */
export function questionError(question: OnboardingQuestion, merged: TaskAnswers, productName?: string): string | undefined {
  const messages = errorMessagesFor(question, productName)
  if (question.type === 'date') return dateError(question, merged[question.id], messages)
  if (
    (question.type === 'radios' || question.type === 'checkboxes') &&
    isAnswered(merged[question.id]) &&
    optionFollowUp(question, merged[question.id]) &&
    !isAnswered(merged[otherDetailsKey(question.id)])
  ) {
    if (messages.followUp) return messages.followUp
    return optionFollowUp(question, merged[question.id])?.inputType === 'url' ? 'Enter a URL' : 'Enter details'
  }
  if (question.type === 'textarea' && countCharacters(merged[question.id] ?? '') > TEXTAREA_CHARACTER_LIMIT) {
    return characterLimitMessage(messages.subject ?? question.label)
  }
  if (question.type === 'countries') return countriesError(question, merged)
  if (question.type === 'country-details') return countryDetailsProblem(question, merged)?.message
  if (question.type === 'upload' && !question.multiple) {
    const hasFile = uploadHasFile(question, merged)
    const needsRef = !question.noReference
    const hasRef = isAnswered(merged[`${question.id}${UPLOAD_REFERENCE_SUFFIX}`])
    if (!hasFile) {
      if (question.optional) return undefined
      return needsRef && !hasRef ? 'Upload a file and enter a reference name' : (messages.required ?? 'Upload a file')
    }
    if (needsRef && !hasRef) return 'Enter a reference name'
    return undefined
  }
  if (question.optional || question.type === 'blocked' || question.type === 'info' || isQuestionAnswered(question, merged)) {
    return undefined
  }
  if (question.type === 'multi-upload') {
    return parseUploadedDocuments(merged[question.id]).length === 0
      ? 'Add at least one document and mark the question as complete'
      : 'Mark the question as complete'
  }
  if (question.type === 'fields') {
    const field = question.fields.find((f) => !f.optional && !isAnswered(merged[fieldKey(question.id, f)]))
    if (field) return messages.fields?.[field.key] ?? enterFieldMessage(field.label)
  }
  if (messages.required) return messages.required
  if (question.type === 'upload') return 'Upload a file'
  if (question.type === 'radios' || question.type === 'checkboxes') return 'Select an answer'
  return 'Enter an answer'
}

/** Field id the error summary links to for a question page. */
export function questionErrorFieldId(question: OnboardingQuestion, merged: TaskAnswers): string {
  if (question.type === 'date') {
    const value = merged[question.id]
    const missing = missingDateParts(value)
    if (missing.length > 0 && missing.length < 3) return `${question.id}-${missing[0]}`
    if (missing.length === 0 && (value ?? '').split('-')[0].length !== 4) return `${question.id}-year`
    return `${question.id}-day`
  }
  if (question.type === 'countries') return countryFieldId(question.id, countriesProblem(question, merged)?.row ?? 0)
  if (question.type === 'country-details') {
    return countryFieldId(question.id, countryDetailsProblem(question, merged)?.row ?? 0)
  }
  if (question.type === 'upload') {
    if (question.multiple || question.noReference || !uploadHasFile(question, merged)) return `${question.id}-file`
    if (!isAnswered(merged[`${question.id}${UPLOAD_REFERENCE_SUFFIX}`])) return `${question.id}${UPLOAD_REFERENCE_SUFFIX}`
    return `${question.id}-file`
  }
  if (question.type === 'multi-upload') {
    return parseUploadedDocuments(merged[question.id]).length === 0
      ? `${question.id}-file`
      : `${question.id}${MULTI_UPLOAD_CONFIRMED_SUFFIX}`
  }
  if (
    (question.type === 'radios' || question.type === 'checkboxes') &&
    optionFollowUp(question, merged[question.id]) &&
    !isAnswered(merged[otherDetailsKey(question.id)])
  ) {
    return otherDetailsKey(question.id)
  }
  if (question.type === 'radios' || question.type === 'checkboxes') {
    const first = question.options.find((o) => !o.hidden)
    return first ? `${question.id}-${first.value}` : question.id
  }
  if (question.type === 'fields') {
    const field =
      question.fields.find((f) => !f.optional && !isAnswered(merged[fieldKey(question.id, f)])) ?? question.fields[0]
    return field ? `${question.id}-${field.key}` : question.id
  }
  return question.id
}

const PRODUCT_NAME_TASK_ID = 'product-details'
const PRODUCT_NAME_QUESTION_ID = 'a2-product-name'
const INTENDED_USE_TASK_ID = 'value-proposition'
const INTENDED_USE_QUESTION_ID = 'b1-intended-use'

/** Option label for the intended-use answer, or the Other details when that option is selected. */
function intendedUsePhrase(answers: TaskAnswers): string {
  const question = ALL_TASKS.find((t) => t.id === INTENDED_USE_TASK_ID)?.questions.find((q) => q.id === INTENDED_USE_QUESTION_ID)
  const value = (answers[INTENDED_USE_QUESTION_ID] ?? '').trim()
  if (!question || question.type !== 'radios' || !value) return ''
  if (value === 'other') return (answers[otherDetailsKey(question.id)] ?? '').trim() || 'Other'
  return question.options.find((o) => o.value === value)?.label ?? ''
}

/** Questions that must keep the words "your product" rather than the product name. */
const SKIP_PRODUCT_NAME_SUBSTITUTION = new Set(['a2-product-name', 'd1-2-user-testing'])

/** Product name from the product-details task, or empty when not yet answered. */
export function knownProductName(answersFor: (taskId: string) => TaskAnswers): string {
  return (answersFor(PRODUCT_NAME_TASK_ID)[PRODUCT_NAME_QUESTION_ID] ?? '').trim()
}

/**
 * Replace "your product" / "the product" (and possessives) with the known product
 * name. Leaves the text unchanged when the name is not known. Word boundaries
 * avoid matching words like "production".
 */
export function substituteProductName(text: string, productName: string | undefined): string {
  const name = productName?.trim()
  if (!name || !text) return text
  return text
    .replace(/your product's\b/gi, `${name}'s`)
    .replace(/your product\b/gi, name)
    .replace(/the product's\b/gi, `${name}'s`)
    .replace(/the product\b/gi, name)
}

/**
 * Question heading with the product name (and, for the description, the
 * intended-use answer) filled in. Falls back to the stored label when neither
 * is available.
 */
export function questionDisplayLabel(
  question: OnboardingQuestion,
  answersFor: (taskId: string) => TaskAnswers,
): string {
  const productName = knownProductName(answersFor)
  if (question.id === 'b2-description') {
    const subject = productName || 'it'
    const use = intendedUsePhrase(answersFor(INTENDED_USE_TASK_ID))
    const forUse = use ? ` for ${use}` : ''
    return `Describe what ${subject} is designed to do and how it is expected to be used${forUse}?`
  }
  if (SKIP_PRODUCT_NAME_SUBSTITUTION.has(question.id) || !productName) return question.label
  return substituteProductName(question.label, productName)
}

/** Page heading with the product name filled in, when the question uses `pageTitle`. */
export function questionDisplayPageTitle(
  question: OnboardingQuestion,
  answersFor: (taskId: string) => TaskAnswers,
): string | undefined {
  if (!question.pageTitle) return undefined
  return substituteProductName(question.pageTitle, knownProductName(answersFor))
}

/** Hint body with "your product" replaced by the known product name. */
export function questionDisplayHint(
  question: OnboardingQuestion,
  answersFor: (taskId: string) => TaskAnswers,
): string | undefined {
  if (!question.hint) return undefined
  if (SKIP_PRODUCT_NAME_SUBSTITUTION.has(question.id)) return question.hint
  return substituteProductName(question.hint, knownProductName(answersFor))
}

/** Option label with "your product" replaced by the known product name. */
export function optionDisplayLabel(
  question: OnboardingQuestion,
  option: QuestionOption,
  answersFor: (taskId: string) => TaskAnswers,
): string {
  return substituteProductName(option.label, knownProductName(answersFor))
}

/** The question with the product name (and intended use) filled into every piece of displayed text. */
export function questionForDisplay(
  question: OnboardingQuestion,
  answersFor: (taskId: string) => TaskAnswers,
): OnboardingQuestion {
  const productName = knownProductName(answersFor)
  const display = {
    ...question,
    label: questionDisplayLabel(question, answersFor),
    pageTitle: questionDisplayPageTitle(question, answersFor),
    hint: questionDisplayHint(question, answersFor),
    fieldHint: question.fieldHint ? substituteProductName(question.fieldHint, productName) : question.fieldHint,
    details: question.details?.map((item) => ({
      ...item,
      summary: substituteProductName(item.summary, productName),
      text: substituteProductName(item.text, productName),
    })),
  } as OnboardingQuestion
  if (display.type === 'radios' || display.type === 'checkboxes') {
    return {
      ...display,
      options: display.options.map((o) => ({
        ...o,
        label: optionDisplayLabel(question, o, answersFor),
        hint: o.hint ? substituteProductName(o.hint, productName) : o.hint,
      })),
    }
  }
  return display
}

/* -------------------------------- routing ------------------------------- */

/** Selected value(s) of a question: checkboxes split on the separator; others a single value. */
export function selectedValues(q: OnboardingQuestion, answers: TaskAnswers): string[] {
  const raw = answers[q.id]
  if (!isAnswered(raw)) return []
  return q.type === 'checkboxes' ? raw!.split(CHECKBOX_SEPARATOR).filter(Boolean) : [raw!.trim()]
}

function conditionHolds(cond: AnswerCondition, task: OnboardingTask, answers: TaskAnswers): boolean {
  if ('anyOf' in cond) return cond.anyOf.some((c) => conditionHolds(c, task, answers))
  const parent = task.questions.find((q) => q.id === cond.questionId)
  // A hidden parent can hold a stale answer; it must never reveal its children.
  if (!parent || !isQuestionVisible(parent, task, answers)) return false
  const values = selectedValues(parent, answers)
  if (values.length === 0) return false
  if (cond.in && !values.some((v) => cond.in!.includes(v))) return false
  if (cond.notIn && values.some((v) => cond.notIn!.includes(v))) return false
  return true
}

/**
 * True when the question is on the supplier's current route: it has no
 * `showIf`, or every condition holds against answers in the same task
 * (transitively — the referenced question must itself be visible).
 */
export function isQuestionVisible(q: OnboardingQuestion, task: OnboardingTask, answers: TaskAnswers): boolean {
  if (!q.showIf) return true
  const conditions = Array.isArray(q.showIf) ? q.showIf : [q.showIf]
  return conditions.every((c) => conditionHolds(c, task, answers))
}

/** Questions on the current route, in page order, each with its physical 1-based step. */
export function visibleQuestions(
  task: OnboardingTask,
  answers: TaskAnswers,
): Array<{ question: OnboardingQuestion; step: number }> {
  return task.questions
    .map((question, i) => ({ question, step: i + 1 }))
    .filter(({ question }) => isQuestionVisible(question, task, answers))
}

/**
 * "Save and Next" target: the next visible question in this task, else the
 * first page of the next task in journey order (crossing section boundaries),
 * else `null` on the final page of the final task.
 */
export function nextPageHref(formId: string, task: OnboardingTask, step: number, answers: TaskAnswers): string | null {
  const next = visibleQuestions(task, answers).find((v) => v.step > step)
  if (next) return taskStepHref(formId, task, next.step)
  const index = ALL_TASKS.findIndex((t) => t.id === task.id)
  const nextTask = ALL_TASKS.slice(index + 1).find((t) => t.questions.length > 0)
  return nextTask ? taskHref(formId, nextTask) : null
}

/**
 * Back-link target: the previous visible question in this task, else the last
 * visible question of the previous task in journey order (crossing section
 * boundaries). Falls back to the task list on the first question of the form.
 *
 * `answersFor` supplies the answers used to resolve branching: the current
 * task should pass its draft-merged answers; earlier tasks their saved answers.
 */
export function prevPageHref(
  formId: string,
  task: OnboardingTask,
  step: number,
  answersFor: (taskId: string) => TaskAnswers,
): string {
  const before = visibleQuestions(task, answersFor(task.id)).filter((v) => v.step < step)
  const prev = before[before.length - 1]
  if (prev) return taskStepHref(formId, task, prev.step)

  const index = ALL_TASKS.findIndex((t) => t.id === task.id)
  for (let i = index - 1; i >= 0; i -= 1) {
    const prevTask = ALL_TASKS[i]
    if (prevTask.questions.length === 0) continue
    const visible = visibleQuestions(prevTask, answersFor(prevTask.id))
    const last = visible[visible.length - 1]
    if (last) return taskStepHref(formId, prevTask, last.step)
  }
  return formBasePath(formId)
}

/** True when every visible required question in the task has an answer. */
export function isTaskComplete(task: OnboardingTask, answers: TaskAnswers): boolean {
  const visible = visibleQuestions(task, answers)
  return visible.length > 0 && visible.every(({ question }) => question.optional || isQuestionAnswered(question, answers))
}
