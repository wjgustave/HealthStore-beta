import type { ProductNarrative } from '@/lib/content/productModel'
import { ASSURANCE_SUPPORT_NOTE, LOCAL_ASSURANCE_SENTENCE } from '@/lib/content/productNarratives'
import { ALL_TASKS, type TaskAnswers } from '@/lib/supplierOnboarding'
import { fillTaskWithSamples } from '@/lib/supplierOnboardingSampleAnswers'
import { SAMPLE_SUPPLIER } from '@/lib/supplierPortal'
import type { PortalApp } from './breathewellCopd'

/**
 * Respira CBT — the fictional product in Aurora Health's onboarding form.
 *
 * It becomes a managed product once that form is submitted. Until then the
 * portal hides it. The submitted answers replace RESPIRA_ANSWERS (see
 * CheckAnswersPage); RESPIRA_ANSWERS fills anything they leave out, using the
 * onboarding sample answers, which are written for Respira CBT.
 *
 * Nothing here is real.
 */

export const RESPIRA_APP: PortalApp = {
  id: 'respira-cbt',
  slug: 'respira-cbt',
  app_name: 'Respira CBT',
  short_name: 'Respira',
  supplier_name: SAMPLE_SUPPLIER.name,
  supplier_contact_name: SAMPLE_SUPPLIER.contactName,
  supplier_contact_email: SAMPLE_SUPPLIER.email,
  condition_tags: ['anxiety'],
  device_class: 'Class I',
  dtac_status: 'passed',
  one_line_value_proposition:
    'Clinician-supported digital CBT for adults with generalised anxiety disorder, delivered between NHS Talking Therapies sessions with weekly therapist review.',
  target_patients:
    'Adults (18+) referred to NHS Talking Therapies with mild to moderate generalised anxiety disorder.',
  why_it_matters_locally:
    'Helps NHS Talking Therapies services shorten waits for first treatment and extend therapist capacity.',
  nice_guidance_refs: [
    {
      ref: 'NICE CG113',
      type: 'Guideline',
      date: 'January 2011',
      url: 'https://www.nice.org.uk/guidance/cg113',
      note: 'Generalised anxiety disorder and panic disorder in adults: management.',
    },
  ],
  linked_funding_ids: [],
  dcb0160_boilerplate_available: true,
  implementation_prerequisites: [
    'Named NHS Talking Therapies clinical lead to own the service',
    'Referral criteria agreed with the Talking Therapies team',
  ],
  deployment_register: [
    {
      site: 'Leeds and York Partnership NHS Foundation Trust',
      icb: 'NHS West Yorkshire ICB',
      care_setting: 'NHS Talking Therapies',
      delivery: 'Guided self-help between sessions',
      status: 'pilot',
      confidence: 'medium',
    },
  ],
  case_studies: [
    {
      title: 'Talking Therapies pilot services',
      setting: '3 NHS Talking Therapies services',
      sample_size: 1870,
      outcome: 'Time to first treatment fell from 9.4 weeks to 2.1 weeks in pilot services.',
      source: 'Service evaluation, Aurora Health, 2025',
      type_label: 'Service evaluation',
    },
  ],
  clinical_evidence_detailed: [
    {
      id: 'respira-rct',
      type: 'RCT',
      type_label: 'Randomised controlled trial',
      ref: 'Clinician-supported digital CBT for generalised anxiety disorder: a UK randomised controlled trial',
      journal: 'Lancet Digital Health',
      year: 2025,
      n: 412,
      setting: 'NHS Talking Therapies services in England',
      key_results: '61% of patients reached reliable recovery, compared with 44% with treatment as usual.',
      peer_reviewed: true,
    },
  ],
  demo_variants: [],
}

export const RESPIRA_NARRATIVE: ProductNarrative = {
  regulatory_position: {
    device_class: 'Class I medical device',
    assurance_speed_note: ASSURANCE_SUPPORT_NOTE,
    nice: {
      ref: 'NICE CG113',
      url: 'https://www.nice.org.uk/guidance/cg113',
      status: 'Referenced guideline for generalised anxiety disorder',
      last_updated: '26 January 2011',
    },
  },
  commercial_readiness: {
    proposition_type: 'Software with therapist review',
    route_status: 'PA23 software procurement route — NHS HealthStore buyer pack attached',
    commercial_status: 'Buyer selection pack ready',
    buyer_pack_status: 'Core pack with route note, assurance passport and price schedule',
    healthstore_role: `The NHS HealthStore provides your buyer pack, pricing transparency, contract templates and support through the purchase. ${LOCAL_ASSURANCE_SENTENCE}`,
  },
  publishing: { content_owner: 'Aurora Health Limited', review_date: '2026-09-22', next_review: '2027-03-22' },
}

/** Dummy onboarding answers for Respira CBT, flat by question id. */
export const RESPIRA_ANSWERS: TaskAnswers = Object.assign({}, ...ALL_TASKS.map((task) => fillTaskWithSamples(task, {})))
