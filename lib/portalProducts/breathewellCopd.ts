import type { ProductNarrative } from '@/lib/content/productModel'
import { ASSURANCE_SUPPORT_NOTE, LOCAL_ASSURANCE_SENTENCE } from '@/lib/content/productNarratives'
import { ALL_TASKS, serializeUploadedDocuments, type TaskAnswers } from '@/lib/supplierOnboarding'
import { fillTaskWithSamples } from '@/lib/supplierOnboardingSampleAnswers'
import { SAMPLE_SUPPLIER } from '@/lib/supplierPortal'

/**
 * BreatheWell COPD — the fictional product Aurora Health has already onboarded.
 *
 * Three things are held for it:
 *  - BREATHEWELL_APP: catalogue-shaped data the HealthStore holds (condition,
 *    device class, NICE guidance, funding, sites, evidence). `condition_tags`
 *    includes `copd`, so the PDP's COPD local-impact and worth models apply.
 *  - BREATHEWELL_NARRATIVE: the parts of the product page the supplier does not
 *    write (generic COPD funding levers and tariff note, how to commission).
 *  - BREATHEWELL_ANSWERS: the submitted onboarding form, flat by question id.
 *
 * Nothing here is real.
 */

const SUBMITTED_AT = '2026-06-03T10:00:00.000Z'

export const BREATHEWELL_APP = {
  id: 'breathewell-copd',
  slug: 'breathewell-copd',
  app_name: 'BreatheWell COPD',
  short_name: 'BreatheWell',
  supplier_name: SAMPLE_SUPPLIER.name,
  supplier_contact_name: SAMPLE_SUPPLIER.contactName,
  supplier_contact_email: SAMPLE_SUPPLIER.email,
  condition_tags: ['copd'],
  device_class: 'Class IIa',
  dtac_status: 'passed',
  one_line_value_proposition:
    'Remote monitoring and supported self-management for people with COPD, with a community respiratory team reviewing daily symptom scores and acting on early warning signs.',
  target_patients:
    'Adults with moderate to severe COPD, especially those with an exacerbation or admission in the past 12 months.',
  why_it_matters_locally:
    'Supports local respiratory pathway goals to reduce emergency admissions and readmissions for people with COPD.',
  nice_guidance_refs: [
    {
      ref: 'NICE NG115',
      type: 'Guideline',
      date: 'July 2019',
      url: 'https://www.nice.org.uk/guidance/ng115',
      note: 'Chronic obstructive pulmonary disease in over 16s: diagnosis and management.',
    },
  ],
  linked_funding_ids: ['nhse-copd-wave2'],
  dcb0160_boilerplate_available: true,
  implementation_prerequisites: [
    'Named respiratory clinical lead to own the service',
    'Referral and patient selection criteria agreed with the community respiratory team',
  ],
  deployment_register: [
    {
      site: 'Leeds Community Healthcare NHS Trust',
      icb: 'NHS West Yorkshire ICB',
      care_setting: 'Community respiratory service',
      delivery: 'Remote monitoring and self-management',
      status: 'live',
      confidence: 'high',
    },
    {
      site: 'Calderdale and Huddersfield NHS Foundation Trust',
      icb: 'NHS West Yorkshire ICB',
      care_setting: 'Early supported discharge',
      delivery: 'Post-discharge monitoring',
      status: 'pilot',
      confidence: 'medium',
    },
  ],
  case_studies: [
    {
      title: 'Leeds community respiratory service',
      setting: 'Leeds Community Healthcare NHS Trust',
      sample_size: 640,
      outcome:
        'Over 12 months, 29% fewer COPD-related emergency admissions among monitored patients compared with the year before enrolment.',
      source: 'Service evaluation, Leeds Community Healthcare, 2025',
      type_label: 'Service evaluation',
    },
  ],
  clinical_evidence_detailed: [
    {
      id: 'breathewell-rct',
      type: 'RCT',
      type_label: 'Randomised controlled trial',
      ref: 'Remote monitoring with supported self-management after COPD exacerbation: a pragmatic randomised controlled trial',
      journal: 'Thorax',
      year: 2025,
      n: 412,
      setting: '4 NHS trusts in England',
      key_results:
        '90-day readmissions fell from 27% to 19% in the intervention group. Patients also reported better quality of life (CAT score down 3.1 points).',
      peer_reviewed: true,
    },
  ],
  demo_variants: [] as { label: string; url: string; type?: string }[],
}

export type PortalApp = typeof BREATHEWELL_APP

const GENERIC_COPD_TARIFF_NOTE =
  'Emergency COPD admissions attract the emergency tariff (HRG DZ65A-F, approximately £2,500 to £5,500 per spell). Avoided admissions reduce commissioner spend at tariff price, while provider income falls in parallel, so model this as a system benefit that needs aligned incentives. QOF indicator COPD007 rewards a review within 3 months of an exacerbation, which remote monitoring makes achievable at scale.'

const GENERIC_COPD_FUNDING_LEVERS = [
  {
    label: 'Emergency tariff avoidance',
    status: 'Live',
    note: 'Each avoided admission saves £2,500 to £5,500 at national tariff where the reduction in activity is sustained.',
  },
  {
    label: 'Virtual ward tariff',
    status: 'Live 2026/27',
    note: 'Patients who meet the NHS England virtual ward definition attract the virtual ward tariff.',
  },
  {
    label: 'QOF — COPD007',
    status: 'Supports achievement',
    note: 'A post-exacerbation review within 3 months is a QOF indicator. Monitoring data gives an auditable record of the review.',
  },
  {
    label: 'Elective recovery',
    status: 'Live',
    note: 'Freed bed capacity can be converted to elective activity paid at full tariff.',
  },
]

export const BREATHEWELL_NARRATIVE: ProductNarrative = {
  regulatory_position: {
    device_class: 'Class IIa medical device',
    assurance_speed_note: ASSURANCE_SUPPORT_NOTE,
    nice: {
      ref: 'NICE NG115',
      url: 'https://www.nice.org.uk/guidance/ng115',
      status: 'Referenced guideline for COPD diagnosis and management',
      last_updated: '26 July 2019',
    },
  },
  commercial_readiness: {
    proposition_type: 'Software with community respiratory team review',
    route_status: 'PA23 software procurement route — NHS HealthStore buyer pack attached',
    commercial_status: 'Buyer selection pack ready',
    buyer_pack_status: 'Core pack with route note, assurance passport and price schedule',
    healthstore_role: `The NHS HealthStore provides your buyer pack, pricing transparency, contract templates and support through the purchase. ${LOCAL_ASSURANCE_SENTENCE}`,
  },
  commissioner_economics: {
    headline: 'Illustrative value is worked out from the COPD cohort for your area.',
    cash_vs_capacity:
      'Avoided admissions free beds and clinician time first. That is capacity, not cash, until it is converted.',
    settings: [],
    tariff_note: GENERIC_COPD_TARIFF_NOTE,
    funding_levers: GENERIC_COPD_FUNDING_LEVERS,
  },
  publishing: { content_owner: 'Aurora Health Limited', review_date: '2026-06-03', next_review: '2026-12-03' },
}

const DOC = (name: string) =>
  serializeUploadedDocuments([{ name, size: 1_284_000, reference: '', uploadedAt: SUBMITTED_AT }])

/** Answers that differ from the generic onboarding samples (which describe Respira CBT). */
const BREATHEWELL_OVERRIDES: TaskAnswers = {
  'a2-product-name': 'BreatheWell COPD',
  'a3-product-version': '2.4.1',
  'a4-product-type': 'standalone-application',
  'b1-intended-use': 'patient-care-support',
  'b2-description':
    'BreatheWell COPD is a remote monitoring and supported self-management app for adults with COPD. Patients record symptoms, oxygen saturation and inhaler use each day. A community respiratory team reviews the scores on a dashboard and contacts patients whose readings show early signs of an exacerbation.',
  'b3-users-benefits':
    'Intended users: adults with moderate to severe COPD and the community respiratory nurses who review them. Benefits: 90-day readmissions fell from 27% to 19% in a pragmatic RCT across 4 NHS trusts (n=412, Thorax 2025), and a 12-month service evaluation in Leeds (n=640) found 29% fewer COPD-related emergency admissions.',
  'b4-data-flow': 'yes',
  'b4-data-flow-upload': DOC('Aurora-Health-BreatheWell-Data-Flow.pdf'),
  'c1-1-1-paq-upload': 'Aurora-Health-BreatheWell-PAQ-v1.0.pdf',
  'c1-2-3-crm-system': 'Aurora-Health-Clinical-Risk-Management-System-v2.pdf',
  'c1-2-4-safety-case': 'BreatheWell-DCB0129-Safety-Case-v3.2.pdf',
  'c1-2-4-hazard-log': DOC('BreatheWell-DCB0129-Hazard-Log-v3.2.xlsx'),
  'c1-2-5-cso__full-name': 'Dr Priya Raman',
  'c1-2-5-cso__profession': 'Respiratory Physician',
  'c1-2-5-cso__registration-number': 'GMC 7012345',
  'c2-2-1-ico': 'Aurora-Health-ICO-Registration-2026.pdf',
  'c2-2-1-ico-expiry': '2027-05-14',
  'c2-2-2-dpia': 'BreatheWell-DPIA-v2.pdf',
  'c2-2-3-privacy-notice': 'link',
  'c2-2-3-privacy-notice__other-details': 'https://www.aurora-health.example/breathewell/privacy',
  'c2-2-4-terms': 'link',
  'c2-2-4-terms__other-details': 'https://www.aurora-health.example/breathewell/terms',
  'c2-2-5-data-location': 'uk-only',
  'c3-1-cyber-essentials': 'Aurora-Health-Cyber-Essentials-Plus-2026.pdf',
  'c3-1-cyber-essentials-expiry': '2027-11-30',
  'c3-2-charter': 'no',
  'c3-3-pen-test': 'BreatheWell-Pen-Test-Summary-Feb-2026.pdf',
  'c4-1-apis': 'yes',
  'c4-1-1-standards':
    'Our APIs use HL7 FHIR R4 (UK Core profiles) to send observations and care plan updates to community clinical systems, and OAuth 2.0 / OpenID Connect for authorisation.',
  'c4-1-2-open-api': 'confirm',
  'c4-2-data-sharing': 'yes',
  'c4-2-1-nhs-number': 'yes',
  'c4-2-2-pds': 'yes',
  'c4-2-4-nhs-login': 'yes',
  'd1-1-pathways': 'yes',
  'd1-1-pathways-upload': DOC('BreatheWell-Care-Pathway-and-Instructions-for-Use.pdf'),
  'd1-4-1-wcag': 'yes',
  'd1-4-3-accessibility-statement': 'https://www.aurora-health.example/breathewell/accessibility',
  'd1-5-availability': '99.95',
}

/** The submitted onboarding form for BreatheWell COPD, flat by question id. */
export const BREATHEWELL_ANSWERS: TaskAnswers = Object.assign(
  {},
  ...ALL_TASKS.map((task) => fillTaskWithSamples(task, BREATHEWELL_OVERRIDES)),
)
