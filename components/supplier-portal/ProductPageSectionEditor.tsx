'use client'

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BackLink } from '@/components/BackLink'
import { ErrorSummary } from '@/components/eoi/journey/shared'
import { NhsRadios } from '@/components/nhs/NhsRadios'
import PathwayDiagram from '@/components/product/PathwayDiagram'
import { Button } from '@/components/ui/Button'
import { FormField, Textarea, TextInput } from '@/components/ui/FormField'
import type { PortalProductRecord } from '@/lib/portalProducts'
import { publishedProductHref, publishedProductPreviewHref } from '@/lib/supplierPortal'
import {
  PUBLICATION_TYPES,
  SITE_STATUSES,
  cleanSectionValues,
  findProductPageSection,
  parseList,
  serializeList,
  validateSection,
  withName,
  type CaseStudyInput,
  type PageFieldError,
  type PageRow,
  type PageValues,
  type PathwayStepInput,
  type PublicationInput,
  type ProductPageSectionId,
  type SiteInput,
} from '@/lib/supplierProductPage'
import { PRODUCT_PAGE_SAMPLES } from '@/lib/supplierProductPageSamples'
import { AddAnotherList } from './AddAnotherList'
import { PathwayStepsEditor } from './PathwayStepsEditor'
import { heldItems } from './ProductPageSummary'
import { useProductPage } from './useProductPage'
import { useSupplierPortal } from './useSupplierPortal'

/** Hint text per row. `{name}` is the product name. */
const HINTS: Record<string, string> = {
  problem:
    'Describe the problem in the NHS that {name} helps with: who it affects, how often, and what happens to patients and services today. Commissioners read this first, so use plain English and give numbers where you can.',
  how_bullets: 'Add one point for each thing {name} does. Keep each point to one sentence.',
  pathway_current: 'Add each step of the pathway as it is today, in order. For example, "GP referral".',
  pathway_future:
    'Add each step of the pathway when {name} is in use, in order. Say whether each step is unchanged, changed or new compared with the current pathway.',
  publications:
    'Add published studies and evaluations we do not already hold. Commissioners will see them in Peer and patient experience.',
  impl_human_wrapper:
    'Explain who does what around {name}. Include which clinicians review data or alerts, how often, who patients contact, what happens out of hours, and what the supplier does compared with the local team.',
  impl_workforce:
    'List what a site needs to provide. Include staff roles and time (for example, WTE and banding), equipment or devices, clinical oversight, and any local IT or integration work.',
  impl_timescale:
    'Describe how long it usually takes to go live and what happens in each phase. For example, information governance, training, pilot and full roll-out, with the number of weeks for each.',
  prerequisites:
    'We have added prerequisites from your product information. Remove any that do not apply and add anything else a site must have in place before going live.',
  support_owner: 'The role at the site that should own the service. For example, "community respiratory service lead".',
  support_steps: 'Add each stage of your onboarding support, in order.',
  support_ongoing: 'What support you give once the service is live. For example, "Monthly account review".',
  support_note: 'Optional. Anything else commissioners should know about your support.',
  nhs_sites: 'Add NHS sites using {name} that we do not already hold.',
  case_studies: 'Add case studies and local evaluations that we do not already hold.',
  demo_url: 'A link to a video or interactive demo of {name}. Must start with https://',
  documentation_url: 'A link to product or implementation documentation. Must start with https://',
}

/** Extra guidance (NHS Details) for the long implementation answers. */
const WHAT_TO_INCLUDE: Record<string, string[]> = {
  impl_human_wrapper: [
    'the clinical roles that review alerts or data, and how often',
    'how patients are contacted and by whom',
    'how escalations work, including out of hours',
    'what the supplier provides and what the local team provides',
  ],
  impl_workforce: [
    'staff roles, banding and time needed (for example, 0.5 WTE band 6 nurse per 250 patients)',
    'clinical leadership and governance',
    'equipment, devices or connectivity patients need',
    'local IT, integration or information governance work',
  ],
  impl_timescale: [
    'the total time from contract to go-live',
    'each phase and how long it takes',
    'when patients start using the product',
    'what can delay go-live',
  ],
}

const SECTION_INTRO: Partial<Record<ProductPageSectionId, string>> = {
  'how-it-helps':
    'Explain what {name} does, then build the treatment pathway. We draw the pathway diagram and write the text version for you.',
  implementation:
    'Tell commissioners what it takes to run {name} at their site. These answers appear under "Clinical and human wrapper", "What you need locally" and "Timeline to go-live".',
}

const ITEM_NAME: Record<string, string> = {
  how_bullets: 'point',
  prerequisites: 'prerequisite',
  support_steps: 'step',
  publications: 'publication',
  case_studies: 'case study',
  nhs_sites: 'site',
}

const blank = {
  publication: (): PublicationInput => ({ type: '', title: '', setting: '', outcome: '', url: '' }),
  caseStudy: (): CaseStudyInput => ({ title: '', setting: '', sample_size: '', outcome: '', source: '' }),
  site: (): SiteInput => ({ site: '', icb: '', care_setting: '', status: '' }),
}

/**
 * Edit one section of the product page. [Provenance: NHS form components; list
 * rows use the bespoke AddAnotherList and PathwayStepsEditor]
 *
 * "Save and continue" saves a draft and returns to the product page hub;
 * nothing is published until the supplier submits from the hub.
 */
export default function ProductPageSectionEditor({
  productId,
  sectionId,
  base,
}: {
  productId: string
  sectionId: ProductPageSectionId
  base: PortalProductRecord
}) {
  const router = useRouter()
  const section = findProductPageSection(sectionId)!
  const { hydrated, name, current } = useProductPage(productId, base)
  const { saveDraft } = useSupplierPortal()
  const [form, setForm] = useState<PageValues | null>(null)
  const [errors, setErrors] = useState<PageFieldError[]>([])
  const headingRef = useRef<HTMLHeadingElement>(null)
  const hubHref = publishedProductHref(productId)

  useEffect(() => {
    if (!hydrated || form) return
    setForm(Object.fromEntries(section.rows.map((row) => [row.key, current[row.key] ?? ''])))
  }, [hydrated, form, section, current])

  useEffect(() => {
    if (!form) return
    const hash = window.location.hash.slice(1)
    const target = hash ? document.getElementById(hash) : null
    if (target) target.focus()
    else headingRef.current?.focus()
    // Focus once, after the form first renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form === null])

  if (!hydrated || !form) return null

  const set = (key: string, value: string) => setForm((f) => ({ ...f!, [key]: value }))
  const error = (field: string) => errors.find((e) => e.field === field)?.message
  const hint = (key: string) => (HINTS[key] ? withName(HINTS[key], name) : undefined)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const cleaned = cleanSectionValues(section, form!)
    const found = validateSection(section, cleaned)
    setErrors(found)
    if (found.length > 0) {
      setForm(cleaned)
      return
    }
    const changed = Object.fromEntries(Object.entries(cleaned).filter(([key, value]) => value !== (current[key] ?? '')))
    if (Object.keys(changed).length > 0) saveDraft('pages', productId, changed)
    router.push(hubHref)
  }

  function fillWithSample() {
    setForm((f) => ({ ...f!, ...PRODUCT_PAGE_SAMPLES[sectionId] }))
    setErrors([])
  }

  const renderRow = (row: PageRow): ReactNode => {
    const label = withName(row.label, name)
    const value = form[row.key] ?? ''
    switch (row.kind) {
      case 'text':
        return (
          <FormField key={row.key} id={row.key} label={<strong>{label}</strong>} hint={hint(row.key)} error={error(row.key)}>
            {(field) => (
              <>
                {WHAT_TO_INCLUDE[row.key] && <WhatToInclude items={WHAT_TO_INCLUDE[row.key]} />}
                <Textarea {...field} name={row.key} rows={row.key.startsWith('support_') ? 3 : 8} value={value} onChange={(e) => set(row.key, e.target.value)} />
              </>
            )}
          </FormField>
        )
      case 'url':
        return (
          <FormField key={row.key} id={row.key} label={<strong>{label}</strong>} hint={hint(row.key)} error={error(row.key)}>
            {(field) => (
              <TextInput {...field} name={row.key} type="url" spellCheck={false} value={value} onChange={(e) => set(row.key, e.target.value)} />
            )}
          </FormField>
        )
      case 'bullets':
        return (
          <ListRow key={row.key} row={row} label={label} hint={hint(row.key)} error={error(row.key)}>
            <AddAnotherList
              id={row.key}
              items={parseList<string>(value)}
              onChange={(items) => set(row.key, serializeList(items))}
              newItem={() => ''}
              itemName={ITEM_NAME[row.key] ?? 'item'}
              reorderable={row.key === 'support_steps'}
              renderItem={(item, i, update) => (
                <FormField
                  id={`${row.key}-${i}`}
                  label={<span className="nhsuk-u-visually-hidden">{`${label} ${i + 1}`}</span>}
                  error={error(`${row.key}-${i}`)}
                >
                  {(field) => <TextInput {...field} value={item} onChange={(e) => update(e.target.value)} />}
                </FormField>
              )}
            />
          </ListRow>
        )
      case 'steps':
        return (
          <ListRow key={row.key} row={row} label={label} hint={hint(row.key)} error={error(row.key)}>
            <PathwayStepsEditor
              id={row.key}
              steps={parseList<PathwayStepInput>(value)}
              onChange={(steps) => set(row.key, serializeList(steps))}
              markChanges={row.key === 'pathway_future'}
              errorFor={error}
            />
          </ListRow>
        )
      case 'publications':
        return (
          <ListRow key={row.key} row={row} label={label} hint={hint(row.key)} error={error(row.key)}>
            <HeldList app={base.app} row={row} heading="Publications we already hold" />
            <AddAnotherList
              id={row.key}
              items={parseList<PublicationInput>(value)}
              onChange={(items) => set(row.key, serializeList(items))}
              newItem={blank.publication}
              itemName="publication"
              renderItem={(p, i, update) => (
                <>
                  <NhsRadios
                    id={`${row.key}-${i}-type`}
                    legend="Type"
                    error={error(`${row.key}-${i}-type`)}
                    options={PUBLICATION_TYPES}
                    value={p.type}
                    onChange={(type) => update({ ...p, type })}
                  />
                  <ItemInput id={`${row.key}-${i}-title`} label="Title" error={error(`${row.key}-${i}-title`)} value={p.title} onChange={(title) => update({ ...p, title })} />
                  <ItemInput
                    id={`${row.key}-${i}-setting`}
                    label="Where the research or study took place"
                    hint="For example, the NHS trusts, universities or countries involved"
                    error={error(`${row.key}-${i}-setting`)}
                    value={p.setting}
                    onChange={(setting) => update({ ...p, setting })}
                  />
                  <ItemTextarea
                    id={`${row.key}-${i}-outcome`}
                    label="Summary of the outcome"
                    hint="The main results, with numbers where you can. For example, the change in admissions and the number of patients."
                    error={error(`${row.key}-${i}-outcome`)}
                    value={p.outcome}
                    onChange={(outcome) => update({ ...p, outcome })}
                  />
                  <ItemInput
                    id={`${row.key}-${i}-url`}
                    label="Link to the publication (optional)"
                    type="url"
                    error={error(`${row.key}-${i}-url`)}
                    value={p.url}
                    onChange={(url) => update({ ...p, url })}
                  />
                </>
              )}
            />
          </ListRow>
        )
      case 'case-studies':
        return (
          <ListRow key={row.key} row={row} label={label} hint={hint(row.key)} error={error(row.key)}>
            <HeldList app={base.app} row={row} heading="Case studies we already hold" />
            <AddAnotherList
              id={row.key}
              items={parseList<CaseStudyInput>(value)}
              onChange={(items) => set(row.key, serializeList(items))}
              newItem={blank.caseStudy}
              itemName="case study"
              renderItem={(c, i, update) => (
                <>
                  <ItemInput id={`${row.key}-${i}-title`} label="Title" error={error(`${row.key}-${i}-title`)} value={c.title} onChange={(title) => update({ ...c, title })} />
                  <ItemInput
                    id={`${row.key}-${i}-setting`}
                    label="Where it took place"
                    hint="For example, the NHS trust or ICB"
                    error={error(`${row.key}-${i}-setting`)}
                    value={c.setting}
                    onChange={(setting) => update({ ...c, setting })}
                  />
                  <ItemInput
                    id={`${row.key}-${i}-sample_size`}
                    label="Number of patients (optional)"
                    inputMode="numeric"
                    width="nhsuk-input--width-5"
                    error={error(`${row.key}-${i}-sample_size`)}
                    value={c.sample_size}
                    onChange={(sample_size) => update({ ...c, sample_size })}
                  />
                  <ItemTextarea
                    id={`${row.key}-${i}-outcome`}
                    label="Outcome"
                    hint="What changed for patients or services, with numbers where you can"
                    error={error(`${row.key}-${i}-outcome`)}
                    value={c.outcome}
                    onChange={(outcome) => update({ ...c, outcome })}
                  />
                  <ItemInput
                    id={`${row.key}-${i}-source`}
                    label="Source (optional)"
                    hint="For example, the report title, organisation and year"
                    value={c.source}
                    onChange={(source) => update({ ...c, source })}
                  />
                </>
              )}
            />
          </ListRow>
        )
      case 'sites':
        return (
          <ListRow key={row.key} row={row} label={label} hint={hint(row.key)} error={error(row.key)}>
            <HeldList app={base.app} row={row} heading="Sites we already hold" />
            <AddAnotherList
              id={row.key}
              items={parseList<SiteInput>(value)}
              onChange={(items) => set(row.key, serializeList(items))}
              newItem={blank.site}
              itemName="site"
              renderItem={(s, i, update) => (
                <>
                  <ItemInput
                    id={`${row.key}-${i}-site`}
                    label="Organisation"
                    hint="For example, Leeds Community Healthcare NHS Trust"
                    error={error(`${row.key}-${i}-site`)}
                    value={s.site}
                    onChange={(site) => update({ ...s, site })}
                  />
                  <ItemInput id={`${row.key}-${i}-icb`} label="ICB (optional)" value={s.icb} onChange={(icb) => update({ ...s, icb })} />
                  <ItemInput
                    id={`${row.key}-${i}-care_setting`}
                    label="Service or care setting (optional)"
                    hint="For example, community respiratory service"
                    value={s.care_setting}
                    onChange={(care_setting) => update({ ...s, care_setting })}
                  />
                  <NhsRadios
                    id={`${row.key}-${i}-status`}
                    legend="Status"
                    inline
                    error={error(`${row.key}-${i}-status`)}
                    options={SITE_STATUSES}
                    value={s.status}
                    onChange={(status) => update({ ...s, status })}
                  />
                </>
              )}
            />
          </ListRow>
        )
    }
  }

  const pathwayCurrent = parseList<PathwayStepInput>(form.pathway_current).filter((s) => s.label?.trim())
  const pathwayFuture = parseList<PathwayStepInput>(form.pathway_future).filter((s) => s.label?.trim())
  const intro = SECTION_INTRO[sectionId]

  return (
    <>
      <BackLink href={hubHref} />
      {errors.length > 0 && <ErrorSummary errors={errors} />}
      <h1 ref={headingRef} tabIndex={-1} className="nhsuk-heading-xl outline-none">
        {section.title(name)}
      </h1>
      <span className="nhsuk-caption-l hs-caption-below">{name} product page</span>
      {intro && <p className="nhsuk-body-m">{withName(intro, name)}</p>}
      <p className="nhsuk-body-m">
        <button
          type="button"
          className="nhsuk-link"
          onClick={fillWithSample}
          style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', textDecoration: 'underline', font: 'inherit' }}
        >
          Fill with sample
        </button>
      </p>

      <form noValidate onSubmit={handleSubmit}>
        {section.rows.map(renderRow)}

        {sectionId === 'how-it-helps' && (pathwayCurrent.length > 0 || pathwayFuture.length > 0) && (
          <div className="hs-pathway-editor-preview" aria-live="polite">
            <h2 className="nhsuk-heading-s">How the pathway will look</h2>
            <PathwayDiagram productName={name} currentSteps={toSteps(pathwayCurrent, 'c')} futureSteps={toSteps(pathwayFuture, 'f')} />
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Button type="submit">Save and continue</Button>
          <Link className="nhsuk-link" href={hubHref}>
            Cancel
          </Link>
        </div>
        <p className="nhsuk-body-s nhsuk-u-margin-top-4">
          Saving does not publish your changes.{' '}
          <a href={publishedProductPreviewHref(productId)} target="_blank" rel="noopener noreferrer">
            Preview page (opens in new tab)
          </a>{' '}
          to see saved changes.
        </p>
      </form>
    </>
  )
}

function toSteps(steps: PathwayStepInput[], prefix: string) {
  return steps.map((s, i) => ({ id: `${prefix}${i + 1}`, label: s.label.trim(), change: prefix === 'f' ? (s.change ?? 'unchanged') : undefined }))
}

function ListRow({
  row,
  label,
  hint,
  error,
  children,
}: {
  row: PageRow
  label: string
  hint?: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className={`nhsuk-form-group${error ? ' nhsuk-form-group--error' : ''}`} id={`${row.key}-group`}>
      <h2 id={row.key} tabIndex={-1} className="nhsuk-heading-s outline-none">
        {label}
      </h2>
      {hint && <p className="nhsuk-hint">{hint}</p>}
      {error && (
        <span className="nhsuk-error-message" id={`${row.key}-error`}>
          <span className="nhsuk-u-visually-hidden">Error:</span> {error}
        </span>
      )}
      {children}
    </div>
  )
}

function HeldList({ app, row, heading }: { app: PortalProductRecord['app']; row: PageRow; heading: string }) {
  const items = heldItems(app, row)
  if (items.length === 0) return null
  return (
    <div className="nhsuk-inset-text nhsuk-u-margin-top-2">
      <span className="nhsuk-u-visually-hidden">Information: </span>
      <h3 className="nhsuk-heading-xs nhsuk-u-margin-bottom-2">{heading}</h3>
      <ul className="nhsuk-list">
        {items.map((item, i) => (
          <li key={i}>
            <strong>{item.title}</strong>
            <br />
            <span className="nhsuk-u-secondary-text-color">{item.detail}</span>
          </li>
        ))}
      </ul>
      <p className="nhsuk-body-s nhsuk-u-margin-bottom-0">You do not need to add these again.</p>
    </div>
  )
}

function WhatToInclude({ items }: { items: string[] }) {
  return (
    <details className="nhsuk-details">
      <summary className="nhsuk-details__summary">
        <span className="nhsuk-details__summary-text">What to include</span>
      </summary>
      <div className="nhsuk-details__text">
        <ul className="nhsuk-list nhsuk-list--bullet nhsuk-u-margin-bottom-0">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </details>
  )
}

function ItemInput({
  id,
  label,
  hint,
  error,
  value,
  onChange,
  type = 'text',
  inputMode,
  width,
}: {
  id: string
  label: string
  hint?: string
  error?: string
  value: string
  onChange: (value: string) => void
  type?: string
  inputMode?: 'numeric'
  width?: string
}) {
  return (
    <FormField id={id} label={label} hint={hint} error={error}>
      {(field) => (
        <TextInput {...field} type={type} inputMode={inputMode} className={width} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
      )}
    </FormField>
  )
}

function ItemTextarea({
  id,
  label,
  hint,
  error,
  value,
  onChange,
}: {
  id: string
  label: string
  hint?: string
  error?: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <FormField id={id} label={label} hint={hint} error={error}>
      {(field) => <Textarea {...field} rows={4} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />}
    </FormField>
  )
}
