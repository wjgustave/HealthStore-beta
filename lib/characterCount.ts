/**
 * NHS character count. [Provenance: NHS]
 * https://service-manual.nhs.uk/design-system/components/character-count
 *
 * Counts user-perceived characters (grapheme clusters), matching the NHS
 * component's `data-count-type="characters"`.
 */

export const TEXTAREA_CHARACTER_LIMIT = 500

export function countCharacters(value: string): number {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    return [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(value)].length
  }
  return value.length
}

/** "You have 4 characters remaining", including the at-limit and over-limit forms. */
export function characterCountStatus(count: number, limit = TEXTAREA_CHARACTER_LIMIT): string {
  const remaining = limit - count
  if (remaining === 0) return 'You have 0 characters remaining'
  const over = remaining < 0
  const amount = Math.abs(remaining)
  const unit = amount === 1 ? 'character' : 'characters'
  return over ? `You have ${amount} ${unit} too many` : `You have ${amount} ${unit} remaining`
}

/** Error shown above the field when an answer is submitted over the limit. */
export function characterLimitMessage(subject: string, limit = TEXTAREA_CHARACTER_LIMIT): string {
  return `${subject} must be ${limit} characters or less`
}
