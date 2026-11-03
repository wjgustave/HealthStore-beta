import type { ReactNode } from 'react'
import Link from 'next/link'
import {
  CHECKBOX_SEPARATOR,
  CONFIRMED_VALUE,
  MULTI_UPLOAD_CONFIRMED_SUFFIX,
  UPLOAD_REFERENCE_SUFFIX,
  countriesFor,
  fieldKey,
  isQuestionAnswered,
  isValidIsoDate,
  otherDetailsKey,
  parseCountries,
  parseCountryDetails,
  parseUploadedDocuments,
  questionForDisplay,
  taskTitleWithCode,
  visibleQuestions,
  type OnboardingQuestion,
  type OnboardingTask,
  type TaskAnswers,
} from '@/lib/supplierOnboarding'

const NOT_PROVIDED = 'Not provided'

/**
 * One onboarding task's answers as an NHS Summary list. [Provenance: NHS Summary list]
 *
 * Shared by the onboarding Check your answers page and Manage products, so an
 * onboarded product reads exactly like the form it was submitted with. Only
 * questions on the supplier's route are shown; info and stop pages never are.
 */
export function AnswerSummaryList({
  task,
  answersFor,
  changeHref,
  include,
  showTaskTitle = 'auto',
  showTaskCode = false,
  showQuestionCode = true,
  taskLabel,
  replaceUploads = false,
}: {
  task: OnboardingTask
  /** Answers for any task (the product name and intended use come from other tasks). */
  answersFor: (taskId: string) => TaskAnswers
  /** Change link for the question on physical page `step`. Omit for a read-only list. */
  changeHref?: (step: number, question: OnboardingQuestion) => string
  /** Extra filter, e.g. only changed answers on Check your answers. */
  include?: (question: OnboardingQuestion) => boolean
  /** 'auto' hides the title when the task's only question repeats it. */
  showTaskTitle?: boolean | 'auto'
  /** Prefix the task title with its DTAC code (A, B, C1…). */
  showTaskCode?: boolean
  /** Show each question's DTAC code above its row. */
  showQuestionCode?: boolean
  /** Heading text when it differs from the task title, for example "Clinical safety (C1)". */
  taskLabel?: string
  /** Label held documents' links "Replace" rather than "Change". */
  replaceUploads?: boolean
}) {
  const answers = answersFor(task.id)
  const rows = visibleQuestions(task, answers).filter(
    ({ question }) => !question.hideInSummary && question.type !== 'info' && question.type !== 'blocked' && (!include || include(question)),
  )
  if (rows.length === 0) return null
  const display = rows.map(({ question, step }) => ({ question: questionForDisplay(question, answersFor), step, original: question }))
  const heading = taskLabel ?? (showTaskCode ? taskTitleWithCode(task) : task.title)
  const titleShown = showTaskTitle === 'auto' ? display.length !== 1 || display[0].question.label !== heading : showTaskTitle

  return (
    <div className="nhsuk-u-margin-bottom-5">
      {titleShown && (
        <h3 className="nhsuk-heading-s nhsuk-u-margin-bottom-2">{heading}</h3>
      )}
      <dl className="nhsuk-summary-list">
        {display.map(({ question, step, original }) => (
          <div key={question.id} className="nhsuk-summary-list__row">
            <dt className="nhsuk-summary-list__key">
              {showQuestionCode && question.code && (
                <span className="nhsuk-u-secondary-text-color nhsuk-body-s nhsuk-u-margin-bottom-0" style={{ display: 'block' }}>
                  {question.code}
                </span>
              )}
              {question.label}
            </dt>
            <dd className="nhsuk-summary-list__value">{formatAnswer(question, answers)}</dd>
            {changeHref && (
              <dd className="nhsuk-summary-list__actions">
                <Link className="hs-link-button" href={changeHref(step, original)}>
                  {replaceUploads && question.type === 'upload' && isQuestionAnswered(question, answers) ? 'Replace' : 'Change'}
                  <span className="nhsuk-u-visually-hidden">
                    {' '}
                    {question.code ? `${question.code} ` : ''}
                    {question.label}
                  </span>
                </Link>
              </dd>
            )}
          </div>
        ))}
      </dl>
    </div>
  )
}

/** Option label, with nested follow-up text appended when that option reveals a field. */
function choiceLabel(question: OnboardingQuestion, value: string, answers: TaskAnswers): string | undefined {
  if (question.type !== 'radios' && question.type !== 'checkboxes') return undefined
  const option = question.options.find((o) => o.value === value)
  if (!option) return undefined
  const followUp = option.followUp || (value === 'other' ? { label: 'Give details' } : undefined)
  if (!followUp) return option.label
  const details = (answers[otherDetailsKey(question.id)] ?? '').trim()
  return details ? `${option.label}: ${details}` : option.label
}

/** Human-readable replay of one answer, per question type. Shared with Company information. */
export function formatAnswer(question: OnboardingQuestion, answers: TaskAnswers): ReactNode {
  const raw = answers[question.id] ?? ''
  const empty = <span className="nhsuk-u-secondary-text-color">{NOT_PROVIDED}</span>

  switch (question.type) {
    case 'radios':
      return choiceLabel(question, raw, answers) ?? empty

    case 'checkboxes': {
      const chosen = raw.split(CHECKBOX_SEPARATOR).filter(Boolean)
      const labels = chosen
        .map((value) => choiceLabel(question, value, answers))
        .filter((label): label is string => !!label)
      return labels.length > 0 ? labels.join(', ') : empty
    }

    case 'textarea':
      return raw.trim() ? <span style={{ whiteSpace: 'pre-wrap' }}>{raw.trim()}</span> : empty

    case 'text': {
      const value = raw.trim()
      if (!value) return empty
      if (question.inputType === 'url' && /^https?:\/\//i.test(value)) {
        return (
          <a className="nhsuk-link" href={value} target="_blank" rel="noopener noreferrer" style={{ wordBreak: 'break-all' }}>
            {value}
            <span className="nhsuk-u-visually-hidden"> (opens in new tab)</span>
          </a>
        )
      }
      return question.suffix ? `${value}${question.suffix}` : value
    }

    case 'fields': {
      // One line per field; `inline` fields join the previous line (e.g. "First Last").
      const lines: string[] = []
      for (const field of question.fields) {
        const value = (answers[fieldKey(question.id, field)] ?? '').trim()
        if (!value) continue
        if (field.inline && lines.length > 0) lines[lines.length - 1] += ` ${value}`
        else lines.push(value)
      }
      if (lines.length === 0) return empty
      return (
        <>
          {lines.map((line, i) => (
            <span key={i}>
              {i > 0 && <br />}
              {line}
            </span>
          ))}
        </>
      )
    }

    case 'date': {
      if (!isValidIsoDate(raw)) return empty
      const [y, m, d] = raw.split('-').map(Number)
      return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    }

    case 'upload': {
      if (question.multiple) {
        const docs = parseUploadedDocuments(raw)
        if (docs.length === 0) return empty
        return (
          <ul className="nhsuk-list nhsuk-u-margin-bottom-0">
            {docs.map((doc, i) => (
              <li key={`${doc.uploadedAt}-${i}`}>{doc.name}</li>
            ))}
          </ul>
        )
      }
      if (!isQuestionAnswered(question, answers)) return empty
      if (question.noReference) return raw
      return (
        <>
          {answers[`${question.id}${UPLOAD_REFERENCE_SUFFIX}`]}
          <br />
          <span>{raw}</span>
        </>
      )
    }

    case 'countries': {
      const countries = parseCountries(raw).map((c) => c.trim()).filter(Boolean)
      return countries.length > 0 ? countries.join(', ') : empty
    }

    case 'country-details': {
      const countries = countriesFor(question, answers)
      const details = parseCountryDetails(raw)
      const given = countries.filter((c) => details[c]?.trim())
      if (given.length === 0) return empty
      return (
        <>
          {given.map((country, i) => (
            <p key={country} className={i === given.length - 1 ? 'nhsuk-u-margin-bottom-0' : 'nhsuk-u-margin-bottom-3'}>
              <strong>{country}</strong>
              <br />
              <span style={{ whiteSpace: 'pre-wrap' }}>{details[country].trim()}</span>
            </p>
          ))}
        </>
      )
    }

    case 'blocked':
    case 'info':
      return empty

    case 'multi-upload': {
      const docs = parseUploadedDocuments(raw)
      const confirmed = answers[`${question.id}${MULTI_UPLOAD_CONFIRMED_SUFFIX}`] === CONFIRMED_VALUE
      if (docs.length === 0) return empty
      return (
        <>
          <ul className="nhsuk-list nhsuk-u-margin-bottom-2">
            {docs.map((doc, i) => (
              <li key={`${doc.uploadedAt}-${i}`}>
                {doc.reference}
                <br />
                <span>{doc.name}</span>
              </li>
            ))}
          </ul>
          <span className="nhsuk-body-m nhsuk-u-margin-bottom-0">
            {docs.length} {docs.length === 1 ? 'document' : 'documents'}
            {confirmed ? ', marked as complete' : ''}
          </span>
        </>
      )
    }
  }
}
