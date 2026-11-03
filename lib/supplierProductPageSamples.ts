import { serializeList, type ProductPageSectionId } from './supplierProductPage'

/**
 * "Fill with sample" content for the product page editor, written for the
 * fictional BreatheWell COPD. Nothing here is real.
 */
export const PRODUCT_PAGE_SAMPLES: Record<ProductPageSectionId, Record<string, string>> = {
  'the-problem': {
    problem:
      'One in five people admitted to hospital with a COPD exacerbation are readmitted within 30 days. Early warning signs such as rising breathlessness, more sputum or falling oxygen saturation usually appear days before an admission, but between appointments nobody is watching for them. Community respiratory teams only find out once the patient is already in A&E.',
  },
  'how-it-helps': {
    how_bullets: serializeList([
      'Patients record symptoms, oxygen saturation and inhaler use in the app each day',
      'The community respiratory team sees a daily risk score for every patient on one dashboard',
      'Nurses contact patients whose scores show early signs of an exacerbation and start rescue treatment at home',
      'Self-management education and breathing exercises are built into the app',
    ]),
    pathway_current: serializeList([
      { label: 'Discharge after COPD admission' },
      { label: 'Routine review in 6 to 12 weeks' },
      { label: 'Patient deteriorates at home unnoticed' },
      { label: 'Emergency admission' },
    ]),
    pathway_future: serializeList([
      { label: 'Discharge after COPD admission', change: 'unchanged' },
      { label: 'Daily symptom and oxygen monitoring in the app', change: 'added' },
      { label: 'Respiratory nurse reviews daily risk scores', change: 'added' },
      { label: 'Early contact and rescue treatment at home', change: 'changed' },
      { label: 'Routine review with monitoring data to hand', change: 'changed' },
    ]),
  },
  publications: {
    publications: serializeList([
      {
        type: 'observational',
        title: 'Patient engagement and self-management confidence with app-based COPD monitoring: a mixed-methods study',
        setting: 'University of Leeds, with 3 community respiratory services in West Yorkshire',
        outcome:
          '87% of 286 patients were still submitting readings at 6 months. Self-management confidence scores rose by 18% and patients aged over 75 engaged as well as younger patients.',
        url: 'https://www.aurora-health.example/breathewell/engagement-study',
      },
    ]),
  },
  implementation: {
    impl_human_wrapper:
      'BreatheWell needs a community respiratory team to review daily risk scores on working days and contact patients who flag amber or red. Out of hours, patients see self-management advice and are told to call NHS 111 if symptoms worsen. Aurora Health provides the software, alert rules and training; the local team provides the clinical review and any rescue treatment.',
    impl_workforce:
      'About 0.5 WTE band 6 respiratory nurse per 250 monitored patients for daily review. Respiratory consultant oversight for escalation protocols. Admin support (0.2 WTE) for invitations and device issue in the first 3 months. Patients need a smartphone or tablet; Aurora Health can supply loan devices and pulse oximeters.',
    impl_timescale:
      '10 to 14 weeks from contract to steady state. Weeks 1 to 4: information governance, DCB0160 safety case and escalation protocol. Weeks 5 to 6: staff training and pathway set-up. Weeks 7 to 10: pilot with 50 patients. Weeks 11 to 14: scale up to the full eligible cohort.',
  },
  'supplier-support': {
    support_owner: 'community respiratory service lead',
    support_steps: serializeList([
      'Kick-off and information governance support',
      'Escalation protocol and alert thresholds agreed with your clinicians',
      'Staff training (2-hour session per team)',
      'Patient invitation and device issue',
    ]),
    support_ongoing: 'Monthly account review and service reports',
    support_note: 'A named implementation manager supports your team through go-live and the first 6 months.',
  },
  'nhs-experience': {
    nhs_sites: serializeList([
      {
        site: 'Bradford Teaching Hospitals NHS Foundation Trust',
        icb: 'NHS West Yorkshire ICB',
        care_setting: 'Respiratory virtual ward',
        status: 'pilot',
      },
    ]),
  },
  'case-studies': {
    case_studies: serializeList([
      {
        title: 'Calderdale early supported discharge pilot',
        setting: 'Calderdale and Huddersfield NHS Foundation Trust',
        sample_size: '120',
        outcome: '30-day readmissions fell from 21% to 13% over the 6-month pilot.',
        source: 'Pilot report, Calderdale and Huddersfield NHS Foundation Trust, 2026',
      },
    ]),
  },
  resources: {
    demo_url: 'https://www.aurora-health.example/breathewell/demo',
    documentation_url: 'https://docs.aurora-health.example/breathewell',
  },
}
