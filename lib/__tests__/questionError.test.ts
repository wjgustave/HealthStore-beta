import { describe, expect, it } from 'vitest'
import { TEXTAREA_CHARACTER_LIMIT, characterLimitMessage } from '@/lib/characterCount'
import {
  ALL_TASKS,
  CONFIRMED_VALUE,
  MULTI_UPLOAD_CONFIRMED_SUFFIX,
  UPLOAD_REFERENCE_SUFFIX,
  otherDetailsKey,
  questionError,
  questionErrorFieldId,
  questionHasConditionalInput,
  serializeCountries,
  serializeUploadedDocuments,
  type OnboardingQuestion,
} from '@/lib/supplierOnboarding'
import { QUESTION_ERRORS } from '@/lib/supplierOnboardingErrors'

const text: OnboardingQuestion = { id: 'x-name', type: 'text', label: 'Product name' }
const radios: OnboardingQuestion = {
  id: 'x-type',
  type: 'radios',
  label: 'Type',
  options: [
    { value: 'saas', label: 'SaaS' },
    { value: 'other', label: 'Other' },
  ],
}
const fields: OnboardingQuestion = {
  id: 'a8-address',
  type: 'fields',
  label: 'Address',
  fields: [
    { key: 'line1', label: 'Address line 1' },
    { key: 'line2', label: 'Address line 2', optional: true },
    { key: 'town', label: 'Town' },
  ],
}
const upload: OnboardingQuestion = { id: 'c1-paq', type: 'upload', label: 'Upload' }
const multi: OnboardingQuestion = { id: 'c3-dtac', type: 'multi-upload', label: 'DTAC' }

describe('questionError fallbacks for questions without their own messages', () => {
  it('asks for an answer on empty text', () => {
    expect(questionError(text, {})).toBe('Enter an answer')
    expect(questionErrorFieldId(text, {})).toBe('x-name')
  })

  it('rejects a textarea over 500 characters', () => {
    const area: OnboardingQuestion = { id: 'x-description', type: 'textarea', label: 'Describe the product' }
    const over = 'a'.repeat(TEXTAREA_CHARACTER_LIMIT + 1)
    expect(questionError(area, { 'x-description': over })).toBe(characterLimitMessage('Describe the product'))
    expect(questionError(area, { 'x-description': 'a'.repeat(TEXTAREA_CHARACTER_LIMIT) })).toBeUndefined()
  })

  it('asks for a radio selection and links to the first option', () => {
    expect(questionError(radios, {})).toBe('Select an answer')
    expect(questionErrorFieldId(radios, {})).toBe('x-type-saas')
  })

  it('asks for follow-up details and links to that input', () => {
    const answers = { 'x-type': 'other' }
    expect(questionError(radios, answers)).toBe('Enter details')
    expect(questionErrorFieldId(radios, answers)).toBe(otherDetailsKey('x-type'))
  })

  it('asks for the first empty required field', () => {
    const answers = { 'a8-address__line1': '1 High Street' }
    expect(questionError(fields, answers)).toBe('Enter town')
    expect(questionErrorFieldId(fields, answers)).toBe('a8-address-town')
  })

  it('splits file and reference upload errors', () => {
    expect(questionError(upload, {})).toBe('Upload a file and enter a reference name')
    expect(questionErrorFieldId(upload, {})).toBe('c1-paq-file')
    expect(questionError(upload, { 'c1-paq': 'paq.pdf' })).toBe('Enter a reference name')
    expect(questionErrorFieldId(upload, { 'c1-paq': 'paq.pdf' })).toBe(`c1-paq${UPLOAD_REFERENCE_SUFFIX}`)
  })

  it('asks to mark multi-upload complete once a document is listed', () => {
    const listed = serializeUploadedDocuments([{ name: 'dtac.pdf', size: 1, reference: 'DTAC', uploadedAt: '2026-01-01' }])
    const answers = { 'c3-dtac': listed }
    expect(questionError(multi, {})).toBe('Add at least one document and mark the question as complete')
    expect(questionErrorFieldId(multi, {})).toBe('c3-dtac-file')
    expect(questionError(multi, answers)).toBe('Mark the question as complete')
    expect(questionErrorFieldId(multi, answers)).toBe(`c3-dtac${MULTI_UPLOAD_CONFIRMED_SUFFIX}`)
    expect(questionError(multi, { ...answers, [`c3-dtac${MULTI_UPLOAD_CONFIRMED_SUFFIX}`]: CONFIRMED_VALUE })).toBeUndefined()
  })
})

const onboardingQuestions = ALL_TASKS.flatMap((t) => t.questions)
const findQuestion = (id: string) => onboardingQuestions.find((q) => q.id === id)!

describe('onboarding form error messages', () => {
  it('gives every onboarding question its own message', () => {
    for (const q of onboardingQuestions) {
      if (q.type === 'info' || q.type === 'blocked' || q.type === 'country-details') continue
      const messages = QUESTION_ERRORS[q.id]
      if (q.type === 'fields') {
        for (const f of q.fields.filter((field) => !field.optional)) expect(messages?.fields?.[f.key], `${q.id} ${f.key}`).toBeTruthy()
        continue
      }
      expect(messages?.required, q.id).toBeTruthy()
      if (q.type === 'textarea' || q.type === 'date') expect(messages?.subject, q.id).toBeTruthy()
      if (questionHasConditionalInput(q)) expect(messages?.followUp, q.id).toBeTruthy()
    }
  })

  it('avoids words the GOV.UK guidance rules out', () => {
    const banned = /\b(please|sorry|valid|invalid|can't|forgot)\b/i
    for (const [id, m] of Object.entries(QUESTION_ERRORS)) {
      for (const text of [m.required, m.followUp, m.subject, ...Object.values(m.fields ?? {})]) {
        if (text) expect(text, id).not.toMatch(banned)
      }
    }
  })

  it('asks for uploads with "Upload" and never leads a radio answer', () => {
    for (const q of onboardingQuestions) {
      const required = QUESTION_ERRORS[q.id]?.required
      if (!required) continue
      if (q.type === 'upload' || q.type === 'multi-upload') expect(required, q.id).toMatch(/^Upload /)
      if (q.type === 'radios') expect(required, q.id).not.toMatch(/\b(yes|no)\b/i)
    }
  })

  it('names the product when it is known', () => {
    const q = findQuestion('c4-1-apis')
    expect(questionError(q, {}, 'Respira CBT')).toBe(
      'Select whether Respira CBT exposes any APIs or integration channels for other health products',
    )
    expect(questionError(q, {})).toBe('Select whether your product exposes any APIs or integration channels for other health products')
  })

  it('asks for the follow-up link by name', () => {
    const q = findQuestion('c2-2-3-privacy-notice')
    expect(questionError(q, { 'c2-2-3-privacy-notice': 'link' })).toBe('Enter the URL for your transparency information')
  })

  it('names the answer when it is too long', () => {
    const q = findQuestion('c4-2-6-authentication')
    expect(questionError(q, { [q.id]: 'a'.repeat(TEXTAREA_CHARACTER_LIMIT + 1) })).toBe(
      `Details of your authentication approach and data protection measures must be ${TEXTAREA_CHARACTER_LIMIT} characters or less`,
    )
  })

  it('names the empty field of a grouped question', () => {
    const q = findQuestion('c1-2-5-cso')
    expect(questionError(q, { 'c1-2-5-cso__full-name': 'Dr Hannah Okafor' })).toBe(
      "Enter your Clinical Safety Officer's profession",
    )
  })

  it('uses the GOV.UK date input messages', () => {
    const q = findQuestion('c3-1-cyber-essentials-expiry')
    const id = q.id
    expect(questionError(q, {})).toBe('Enter the Cyber Essentials certificate expiry date')
    expect(questionError(q, { [id]: '2030--' })).toBe('Cyber Essentials certificate expiry date must include a day and month')
    expect(questionErrorFieldId(q, { [id]: '2030--' })).toBe(`${id}-day`)
    expect(questionError(q, { [id]: '2030-6-' })).toBe('Cyber Essentials certificate expiry date must include a day')
    expect(questionError(q, { [id]: '30-6-1' })).toBe('Year must include 4 numbers')
    expect(questionErrorFieldId(q, { [id]: '30-6-1' })).toBe(`${id}-year`)
    expect(questionError(q, { [id]: '2030-2-30' })).toBe('Cyber Essentials certificate expiry date must be a real date')
    expect(questionError(q, { [id]: '2001-1-1' })).toBe('Cyber Essentials certificate expiry date must be in the future')
    expect(questionError(q, { [id]: '2099-1-1' })).toBeUndefined()
  })

  it('asks for a country from the list and flags repeats', () => {
    const q = findQuestion('c2-2-6-outside-uk')
    expect(questionError(q, {})).toBe('Enter a country where data is stored or processed')
    expect(questionError(q, { [q.id]: serializeCountries(['Narnia']) })).toBe('Select a country from the list')
    expect(questionError(q, { [q.id]: serializeCountries(['France', 'France']) })).toBe(
      'You have already added France. Enter a different country or delete this row',
    )
  })
})
