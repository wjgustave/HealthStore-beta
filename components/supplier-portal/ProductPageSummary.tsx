'use client'

import Link from 'next/link'
import type { PortalApp } from '@/lib/portalProducts'
import {
  PATHWAY_CHANGES,
  PUBLICATION_TYPES,
  SITE_STATUSES,
  isBlankItem,
  parseList,
  withName,
  type CaseStudyInput,
  type PageRow,
  type PageValues,
  type PathwayStepInput,
  type ProductPageSection,
  type PublicationInput,
  type SiteInput,
} from '@/lib/supplierProductPage'

const NOT_PROVIDED = <span className="nhsuk-u-secondary-text-color">Not provided</span>

const optionLabel = (options: { value: string; label: string }[], value: string) =>
  options.find((o) => o.value === value)?.label ?? value

/** A product page value as it reads in a summary list. */
export function PageRowValue({ row, value }: { row: PageRow; value: string | undefined }) {
  const raw = (value ?? '').trim()
  if (!raw) return NOT_PROVIDED

  switch (row.kind) {
    case 'text':
      return <span style={{ whiteSpace: 'pre-wrap' }}>{raw}</span>
    case 'url':
      return (
        <a className="nhsuk-link" href={raw} target="_blank" rel="noopener noreferrer">
          {raw} (opens in new tab)
        </a>
      )
    case 'bullets': {
      const items = parseList<string>(raw).filter((s) => s.trim())
      if (items.length === 0) return NOT_PROVIDED
      return (
        <ul className="nhsuk-list nhsuk-list--bullet nhsuk-u-margin-bottom-0">
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )
    }
    case 'steps': {
      const steps = parseList<PathwayStepInput>(raw).filter((s) => s.label?.trim())
      if (steps.length === 0) return NOT_PROVIDED
      return (
        <ol className="nhsuk-list nhsuk-list--number nhsuk-u-margin-bottom-0">
          {steps.map((step, i) => (
            <li key={i}>
              {step.label}
              {step.change && step.change !== 'unchanged' && (
                <span className="nhsuk-u-secondary-text-color"> ({optionLabel(PATHWAY_CHANGES, step.change).toLowerCase()})</span>
              )}
            </li>
          ))}
        </ol>
      )
    }
    case 'publications': {
      const items = parseList<PublicationInput>(raw).filter((p) => !isBlankItem(p))
      if (items.length === 0) return NOT_PROVIDED
      return (
        <ul className="nhsuk-list nhsuk-u-margin-bottom-0">
          {items.map((p, i) => (
            <li key={i}>
              <strong>{p.title}</strong>
              <br />
              <span className="nhsuk-u-secondary-text-color">
                {optionLabel(PUBLICATION_TYPES, p.type)}, {p.setting}
              </span>
            </li>
          ))}
        </ul>
      )
    }
    case 'case-studies': {
      const items = parseList<CaseStudyInput>(raw).filter((c) => !isBlankItem(c))
      if (items.length === 0) return NOT_PROVIDED
      return (
        <ul className="nhsuk-list nhsuk-u-margin-bottom-0">
          {items.map((c, i) => (
            <li key={i}>
              <strong>{c.title}</strong>
              <br />
              <span className="nhsuk-u-secondary-text-color">{c.setting}</span>
            </li>
          ))}
        </ul>
      )
    }
    case 'sites': {
      const items = parseList<SiteInput>(raw).filter((s) => !isBlankItem(s))
      if (items.length === 0) return NOT_PROVIDED
      return (
        <ul className="nhsuk-list nhsuk-u-margin-bottom-0">
          {items.map((s, i) => (
            <li key={i}>
              {s.site} ({optionLabel(SITE_STATUSES, s.status).toLowerCase()})
            </li>
          ))}
        </ul>
      )
    }
  }
}

/** Items the HealthStore already holds for list rows, shown read-only beside what the supplier adds. */
export function heldItems(app: PortalApp, row: PageRow): { title: string; detail: string }[] {
  if (row.kind === 'publications') {
    return (app.clinical_evidence_detailed ?? []).map((p) => ({
      title: p.ref,
      detail: [p.type_label, p.journal && `${p.journal} ${p.year ?? ''}`.trim(), p.setting].filter(Boolean).join(', '),
    }))
  }
  if (row.kind === 'case-studies') {
    return (app.case_studies ?? []).map((c) => ({ title: c.title, detail: c.setting }))
  }
  if (row.kind === 'sites') {
    return (app.deployment_register ?? []).map((s) => ({
      title: s.site,
      detail: [s.care_setting, optionLabel(SITE_STATUSES, s.status)].filter(Boolean).join(', '),
    }))
  }
  return []
}

const HELD_LABEL: Partial<Record<PageRow['kind'], string>> = {
  publications: 'Publications we hold',
  'case-studies': 'Case studies we hold',
  sites: 'Sites we hold',
}

/** The held items for a list row, as an NHS summary list row without a Change link. */
export function HeldItemsRow({ app, row }: { app: PortalApp; row: PageRow }) {
  const items = heldItems(app, row)
  const label = HELD_LABEL[row.kind]
  if (!label || items.length === 0) return null
  return (
    <div className="nhsuk-summary-list__row">
      <dt className="nhsuk-summary-list__key">{label}</dt>
      <dd className="nhsuk-summary-list__value">
        <ul className="nhsuk-list nhsuk-u-margin-bottom-0">
          {items.map((item, i) => (
            <li key={i}>
              <strong>{item.title}</strong>
              <br />
              <span className="nhsuk-u-secondary-text-color">{item.detail}</span>
            </li>
          ))}
        </ul>
      </dd>
      <dd className="nhsuk-summary-list__actions" />
    </div>
  )
}

/**
 * One product page section as an NHS Summary list with Change links.
 * [Provenance: NHS Summary list]
 */
export function ProductPageSectionSummary({
  section,
  app,
  name,
  values,
  changeHref,
  rows = section.rows,
  showHeld = true,
}: {
  section: ProductPageSection
  app: PortalApp
  name: string
  values: PageValues
  changeHref: (row: PageRow) => string
  rows?: PageRow[]
  showHeld?: boolean
}) {
  return (
    <dl className="nhsuk-summary-list">
      {rows.map((row) => {
        const label = withName(row.label, name)
        return [
          showHeld ? <HeldItemsRow key={`${row.key}-held`} app={app} row={row} /> : null,
          <div key={row.key} className="nhsuk-summary-list__row">
            <dt className="nhsuk-summary-list__key">{label}</dt>
            <dd className="nhsuk-summary-list__value">
              <PageRowValue row={row} value={values[row.key]} />
            </dd>
            <dd className="nhsuk-summary-list__actions">
              <Link className="hs-link-button" href={changeHref(row)}>
                Change<span className="nhsuk-u-visually-hidden"> {label.toLowerCase()}</span>
              </Link>
            </dd>
          </div>,
        ]
      })}
    </dl>
  )
}
