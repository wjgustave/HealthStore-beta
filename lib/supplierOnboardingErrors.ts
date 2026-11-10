/**
 * Error messages for each onboarding question, written to the GOV.UK error
 * message guidance: https://design-system.service.gov.uk/components/error-message/
 *
 *  - reuse the words of the question so the message makes sense in the error summary
 *  - instructions for empty answers ("Enter…", "Select…", "Upload…"), descriptions for
 *    answers that are wrong ("… must be 500 characters or less")
 *  - uploads use "Upload…", not "Select…"
 *  - radios never suggest an answer: "Select whether…", "Select how…", "Select which…", never "Select yes if…"
 *  - no "please", "valid", "invalid" or "can't"
 *
 * "your product" and "the product" are replaced with the product name when it is
 * known, as they are in the question headings.
 */
export type QuestionErrorMessages = {
  /** Nothing entered, selected or uploaded. */
  required?: string
  /** The input revealed by the selected option is empty. */
  followUp?: string
  /** Names the answer in descriptions: "<subject> must be 500 characters or less", "<subject> must be a real date". */
  subject?: string
  /** `fields` questions: the message for each empty required field, by field key. */
  fields?: Record<string, string>
}

export const QUESTION_ERRORS: Record<string, QuestionErrorMessages> = {
  // A — Product details
  'a2-product-name': { required: 'Enter the name of your product' },
  'a3-product-version': { required: 'Enter which version number of your product this form is for' },
  'a4-product-type': { required: 'Select what type of product it is', followUp: 'Enter the type of product' },

  // B — Value proposition
  'b1-intended-use': { required: "Select the product's intended use", followUp: "Enter the product's intended use" },
  'b2-description': {
    required: 'Describe what your product is designed to do and how it is expected to be used',
    subject: 'Description of what your product is designed to do',
  },
  'b3-users-benefits': {
    required: 'Describe the intended users and proven benefits, and confirm if and how those benefits have been validated',
    subject: 'Description of the intended users and proven benefits',
  },
  'b4-data-flow': {
    required: 'Select whether you can provide information about the data flow between the product and the health IT system',
  },
  'b4-data-flow-upload': { required: 'Upload a file showing your journey maps and data flows' },

  // C1 — Clinical safety
  'c1-1-1-samd': { required: 'Select whether your product qualifies as software or AI as a medical device under UK MDR 2002' },
  'c1-1-1-paq-upload': { required: 'Upload your Pre-acquisition questionnaire (PAQ)' },
  'c1-1-2-standalone': { required: 'Select what your product is classified as' },
  'c1-2-direct-care': { required: 'Select whether your product is designed to support or manage real-time or direct care' },
  'c1-2-1-justification': {
    required: 'Explain why the product is out of scope of DCB0129',
    subject: 'Explanation of why the product is out of scope of DCB0129',
  },
  'c1-2-2-crm-activities': {
    required: 'Select whether you have undertaken clinical risk management activities complying with DCB0129',
  },
  'c1-2-3-crm-system-can-provide': { required: 'Select whether you can provide your clinical risk management system document' },
  'c1-2-3-crm-system': { required: 'Upload your clinical risk management system document' },
  'c1-2-4-safety-case-can-provide': { required: 'Select whether you can provide your Clinical Safety Case Report' },
  'c1-2-4-safety-case': { required: 'Upload your Clinical Safety Case Report' },
  'c1-2-4-hazard-log-can-provide': { required: 'Select whether you can provide your Hazard Log' },
  'c1-2-4-hazard-log': { required: 'Upload your Hazard Log' },
  'c1-2-5-cso': {
    fields: {
      'full-name': "Enter your Clinical Safety Officer's full name",
      profession: "Enter your Clinical Safety Officer's profession",
      'registration-number': "Enter your Clinical Safety Officer's registration number",
    },
  },

  // C2 — Data protection
  'c2-1-dspt': { required: 'Select whether you are compliant with the annual Data Security and Protection Toolkit (DSPT) assessment' },
  'c2-2-personal-data': { required: 'Select whether the product processes personal data or data about deceased individuals' },
  'c2-2-1-ico-can-provide': {
    required: "Select whether you can provide evidence of current Information Commissioner's Office (ICO) registration",
  },
  'c2-2-1-ico': { required: "Upload evidence of your current Information Commissioner's Office (ICO) registration" },
  'c2-2-1-ico-expiry': {
    required: "Enter the expiry date on your Information Commissioner's Office (ICO) registration document",
    subject: 'Expiry date on your ICO registration document',
  },
  'c2-2-2-dpia-can-provide': {
    required: 'Select whether you can provide the Data Protection Impact Assessment (DPIA) for your product',
  },
  'c2-2-2-dpia': { required: 'Upload the Data Protection Impact Assessment (DPIA) for your product' },
  'c2-2-3-privacy-notice': {
    required: 'Select how you will provide your transparency information',
    followUp: 'Enter the URL for your transparency information',
  },
  'c2-2-3-privacy-notice-upload': { required: "Upload a document that shows your product's transparency information" },
  'c2-2-4-terms': {
    required: "Select how you will provide your product's terms and conditions",
    followUp: "Enter the URL for your product's terms and conditions",
  },
  'c2-2-4-terms-upload': {
    required: 'Upload documentation for user data, an end user licence agreement (EULA) or equivalent',
  },
  'c2-2-5-data-location': { required: 'Select where your product stores and processes data' },
  'c2-2-6-outside-uk': { required: 'Enter a country where data is stored or processed' },

  // C3 — Technical security
  'c3-1-cyber-essentials-can-provide': { required: 'Select whether you can provide a Cyber Essentials certificate' },
  'c3-1-cyber-essentials': { required: 'Upload your Cyber Essentials certificate' },
  'c3-1-cyber-essentials-expiry': {
    required: 'Enter the Cyber Essentials certificate expiry date',
    subject: 'Cyber Essentials certificate expiry date',
  },
  'c3-2-charter': { required: 'Select whether you have signed the Cyber Security Charter for Suppliers to the NHS' },
  'c3-3-pen-test-can-provide': {
    required: 'Select whether you can provide an external penetration test summary report from the last 12 months',
  },
  'c3-3-pen-test': { required: 'Upload an external penetration test summary report from the last 12 months' },
  'c3-4-code-of-practice': {
    required: 'Select whether you can confirm your product adheres to the DSIT and NCSC Software Security Code of Practice',
  },
  'c3-5-mfa-plan': {
    required: 'Select whether you have a plan for implementing multi-factor authentication (MFA) across all accounts',
  },
  'c3-5-1-privileged-mfa': {
    required:
      'Select whether all supplier accounts with privileged access to the product have multi-factor authentication (MFA) or equivalent',
  },
  'c3-6-logging': { required: 'Select whether logging and reporting requirements have been defined' },

  // C4 — Interoperability
  'c4-1-apis': { required: 'Select whether your product exposes any APIs or integration channels for other health products' },
  'c4-1-1-standards': {
    required: "List the standards relevant to the product's use case and explain why they are appropriate",
    subject: 'Your list of standards and why they are appropriate',
  },
  'c4-1-2-open-api': {
    required: 'Select whether you can confirm your APIs follow GDS Open API guidance and are openly documented',
  },
  'c4-1-3-documentation': {
    required: 'Enter details of how your APIs are documented and made available to third parties',
    subject: 'Details of how your APIs are documented',
  },
  'c4-2-data-sharing': {
    required: 'Select whether your product is intended to share or receive data from national or local care systems',
  },
  'c4-2-1-nhs-number': {
    required: 'Select whether your product can use an NHS number to identify patient data when exchanging data',
  },
  'c4-2-2-pds': {
    required:
      'Select whether your product integrates with the NHS Personal Demographics Service (PDS) or local systems to validate NHS numbers',
  },
  'c4-2-3-identification': {
    required: 'Enter details of your current approach to correctly identifying patient records',
    subject: 'Details of your approach to identifying patient records',
  },
  'c4-2-4-nhs-login': { required: 'Select whether you use NHS login to verify identity and authenticate users' },
  'c4-2-5-dapb3051': { required: 'Select whether the product supports the DAPB3051 identity standard' },
  'c4-2-6-authentication': {
    required: 'Enter details of your authentication approach and data protection measures',
    subject: 'Details of your authentication approach and data protection measures',
  },

  // D — Usability and accessibility
  'd1-1-pathways': {
    required:
      'Select whether you can provide information about how the product fits into existing systems such as care pathways or staff journeys',
  },
  'd1-1-pathways-upload': { required: 'Upload your care pathways or staff journey documentation' },
  'd1-2-user-testing': { required: 'Select whether you test your product with intended users to validate its useability' },
  'd1-3-ais': {
    required:
      'Select whether you have read the Accessible Information Standard and considered its design requirement in regards to your product',
  },
  'd1-4-web-or-mobile': { required: 'Select whether your product is a web or mobile application' },
  'd1-4-platforms': { required: 'Select which digital platforms your product supports' },
  'd1-4-1-wcag': { required: 'Select whether your product complies with WCAG 2.2 at level AA or higher' },
  'd1-4-2-timescale': {
    required: 'Enter when you plan to be compliant with Web Content Accessibility Guidelines (WCAG) 2.2',
    subject: 'When you plan to be compliant with WCAG 2.2',
  },
  'd1-4-3-accessibility-statement': { required: 'Enter a link to your published accessibility statement' },
  'd1-5-availability': { required: 'Enter your average service availability over the past 12 months' },
}
