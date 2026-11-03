import { describe, expect, it } from 'vitest'
import { TEXTAREA_CHARACTER_LIMIT, characterLimitMessage } from '@/lib/characterCount'
import {
  CONFIRMED_VALUE,
  MULTI_UPLOAD_CONFIRMED_SUFFIX,
  UPLOAD_REFERENCE_SUFFIX,
  otherDetailsKey,
  questionError,
  questionErrorFieldId,
  serializeUploadedDocuments,
  type OnboardingQuestion,
} from '@/lib/supplierOnboarding'

const text: OnboardingQuestion = { id: 'a2-product-name', type: 'text', label: 'Product name' }
const radios: OnboardingQuestion = {
  id: 'a4-product-type',
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

describe('questionError', () => {
  it('asks for an answer on empty text', () => {
    expect(questionError(text, {})).toBe('Enter an answer')
    expect(questionErrorFieldId(text, {})).toBe('a2-product-name')
  })

  it('rejects a textarea over 500 characters', () => {
    const area: OnboardingQuestion = { id: 'b2-description', type: 'textarea', label: 'Describe the product' }
    const over = 'a'.repeat(TEXTAREA_CHARACTER_LIMIT + 1)
    expect(questionError(area, { 'b2-description': over })).toBe(characterLimitMessage('Describe the product'))
    expect(questionError(area, { 'b2-description': 'a'.repeat(TEXTAREA_CHARACTER_LIMIT) })).toBeUndefined()
  })

  it('asks for a radio selection and links to the first option', () => {
    expect(questionError(radios, {})).toBe('Select an answer')
    expect(questionErrorFieldId(radios, {})).toBe('a4-product-type-saas')
  })

  it('asks for follow-up details and links to that input', () => {
    const answers = { 'a4-product-type': 'other' }
    expect(questionError(radios, answers)).toBe('Enter details')
    expect(questionErrorFieldId(radios, answers)).toBe(otherDetailsKey('a4-product-type'))
  })

  it('asks for the first empty required field', () => {
    const answers = { 'a8-address__line1': '1 High Street' }
    expect(questionError(fields, answers)).toBe('Complete the required fields')
    expect(questionErrorFieldId(fields, answers)).toBe('a8-address-town')
  })

  it('splits file and reference upload errors', () => {
    expect(questionError(upload, {})).toBe('Select a file and enter a reference name')
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
