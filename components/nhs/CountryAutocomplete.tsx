'use client'

import { useEffect, useRef } from 'react'
import 'accessible-autocomplete/dist/accessible-autocomplete.min.css'
import { searchCountries } from '@/lib/countries'

/**
 * Country autocomplete. [Provenance: GOV.UK country and territory autocomplete]
 * https://github.com/alphagov/govuk-country-and-territory-autocomplete
 *
 * Renders alphagov/accessible-autocomplete into a container (it is not a React
 * component), searching countries only with the register's synonyms. The input
 * is uncontrolled: `value` seeds it when it mounts (or `id` changes), so
 * remount (change `key`) to replace the value from outside.
 */
export function CountryAutocomplete({
  id,
  value,
  onChange,
  error,
  autoFocus,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  error?: boolean
  /** Focus the input once it has mounted, e.g. after "Add another country". */
  autoFocus?: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const valueRef = useRef(value)
  valueRef.current = value
  const focusOnMount = useRef(autoFocus)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    let cancelled = false
    let input: HTMLInputElement | null = null
    const handleInput = (e: Event) => onChangeRef.current((e.target as HTMLInputElement).value)

    import('accessible-autocomplete').then(({ default: accessibleAutocomplete }) => {
      if (cancelled) return
      accessibleAutocomplete({
        element: container,
        id,
        name: id,
        defaultValue: valueRef.current,
        source: (query: string, populate: (results: string[]) => void) => populate(searchCountries(query)),
        minLength: 2,
        autoselect: true,
        displayMenu: 'overlay',
        dropdownArrow: () => '',
        tNoResults: () => 'No countries found',
        onConfirm: (confirmed: string | undefined) => {
          if (confirmed) onChangeRef.current(confirmed)
        },
      })
      input = container.querySelector('input.autocomplete__input')
      input?.addEventListener('input', handleInput)
      if (focusOnMount.current) input?.focus()
      focusOnMount.current = false
    })

    return () => {
      cancelled = true
      input?.removeEventListener('input', handleInput)
      container.replaceChildren()
    }
  }, [id])

  return <div ref={containerRef} className={`hs-autocomplete${error ? ' hs-autocomplete--error' : ''}`} />
}
