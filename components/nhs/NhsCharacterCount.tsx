'use client'

import { Textarea } from '@/components/ui/FormField'
import { TEXTAREA_CHARACTER_LIMIT, characterCountStatus, countCharacters } from '@/lib/characterCount'
import type { TextareaHTMLAttributes } from 'react'

/**
 * NHS character count. [Provenance: NHS]
 * https://service-manual.nhs.uk/design-system/components/character-count
 *
 * The count sits under the textarea. It does not stop typing past the limit:
 * going over turns the count into an error so the answer can be edited down.
 * Without JavaScript the visually hidden message still states the limit.
 */
export function NhsCharacterCount({
  id,
  value,
  onChange,
  describedBy,
  maxLength = TEXTAREA_CHARACTER_LIMIT,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { describedBy?: string; maxLength?: number }) {
  const text = typeof value === 'string' ? value : ''
  const over = countCharacters(text) > maxLength
  const infoId = `${id}-info`
  const status = characterCountStatus(countCharacters(text), maxLength)
  const described = [infoId, describedBy].filter(Boolean).join(' ')

  return (
    <>
      <Textarea
        {...props}
        id={id}
        value={value}
        onChange={onChange}
        className={['nhsuk-js-character-count', props.className].filter(Boolean).join(' ')}
        aria-describedby={described}
        aria-invalid={props['aria-invalid'] || over ? true : undefined}
      />
      <div id={infoId} className="nhsuk-hint nhsuk-character-count__message nhsuk-u-visually-hidden">
        You can enter up to {maxLength} characters
      </div>
      <div className={`nhsuk-character-count__status ${over ? 'nhsuk-error-message' : 'nhsuk-hint'}`} aria-hidden="true">
        {status}
      </div>
      <div className="nhsuk-character-count__sr-status nhsuk-u-visually-hidden" aria-live="polite">
        {status}
      </div>
    </>
  )
}
