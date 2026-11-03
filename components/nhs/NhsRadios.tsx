'use client'

/**
 * NHS Radios as a controlled React component. [Provenance: NHS]
 * https://service-manual.nhs.uk/design-system/components/radios
 */
export function NhsRadios({
  id,
  name,
  legend,
  legendSize = 's',
  hint,
  error,
  options,
  value,
  onChange,
  inline = false,
}: {
  id: string
  name?: string
  legend: string
  legendSize?: 's' | 'm' | 'l'
  hint?: string
  error?: string
  options: { value: string; label: string }[]
  value: string | undefined
  onChange: (value: string) => void
  inline?: boolean
}) {
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined
  return (
    <div className={`nhsuk-form-group${error ? ' nhsuk-form-group--error' : ''}`}>
      <fieldset className="nhsuk-fieldset" aria-describedby={describedBy}>
        <legend className={`nhsuk-fieldset__legend nhsuk-fieldset__legend--${legendSize}`}>{legend}</legend>
        {hint && (
          <div className="nhsuk-hint" id={hintId}>
            {hint}
          </div>
        )}
        {error && (
          <span className="nhsuk-error-message" id={errorId}>
            <span className="nhsuk-u-visually-hidden">Error:</span> {error}
          </span>
        )}
        <div className={`nhsuk-radios${inline ? ' nhsuk-radios--inline' : ''}`}>
          {options.map((option, i) => {
            const inputId = i === 0 ? id : `${id}-${i + 1}`
            return (
              <div key={option.value} className="nhsuk-radios__item">
                <input
                  className="nhsuk-radios__input"
                  id={inputId}
                  name={name ?? id}
                  type="radio"
                  value={option.value}
                  checked={value === option.value}
                  onChange={() => onChange(option.value)}
                />
                <label className="nhsuk-label nhsuk-radios__label" htmlFor={inputId}>
                  {option.label}
                </label>
              </div>
            )
          })}
        </div>
      </fieldset>
    </div>
  )
}
