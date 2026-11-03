'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { PdpShareRegion } from '@/components/PdpSharePrintContext'

/**
 * Heading mode for PdpSection. On a page made of a single section, that section's
 * heading becomes the page H1 (page title, with the product name as a caption);
 * otherwise the route renders the H1 and every section keeps an H2.
 * Provided by PdpSectionHeadingProvider on the section route.
 */
export type PdpSectionHeading = {
  /** Section id that should render as the page H1. */
  h1SectionId?: string
  /** Text of the H1 when it replaces the section title (the page name). */
  pageTitle?: string
  /** Caption shown above the H1 (the product name). */
  caption?: string
}

const PdpSectionHeadingContext = createContext<PdpSectionHeading | null>(null)

export function PdpSectionHeadingProvider({
  value,
  children,
}: {
  value: PdpSectionHeading
  children: ReactNode
}) {
  return <PdpSectionHeadingContext.Provider value={value}>{children}</PdpSectionHeadingContext.Provider>
}

/**
 * Flat PDP section (no collapse). Registers with share/print via PdpShareRegion.
 * Renders an H2 by default; becomes the page H1 (with caption) when the
 * surrounding PdpSectionHeadingProvider names this section.
 */
export function PdpSection({
  shareKey,
  label,
  description,
  title,
  id,
  children,
  className = '',
}: {
  shareKey: string
  /** Share modal label (defaults to title). */
  label?: string
  description?: string
  title: string
  id?: string
  children: ReactNode
  className?: string
}) {
  const heading = useContext(PdpSectionHeadingContext)
  const isPageTitle = !!heading && !!id && heading.h1SectionId === id

  return (
    <PdpShareRegion
      shareKey={shareKey}
      label={label ?? title}
      description={description}
      className={`${isPageTitle ? 'nhsuk-u-margin-bottom-6' : 'nhsuk-u-margin-bottom-8'} ${className}`.trim()}
    >
      <section id={id}>
        {/* NHS typography: page title = heading-xl with the product name as a caption under it;
            section titles = heading-l; descriptions sit in body text. */}
        {isPageTitle ? (
          <>
            <h1 className="nhsuk-heading-xl">{heading.pageTitle ?? title}</h1>
            {heading.caption ? <span className="nhsuk-caption-xl hs-caption-below">{heading.caption}</span> : null}
          </>
        ) : (
          <h2 className="nhsuk-heading-l hs-pdp-heading">{title}</h2>
        )}
        {description ? (
          <p className="nhsuk-body-m" style={{ color: 'var(--text-secondary)' }}>
            {description}
          </p>
        ) : null}
        <div>{children}</div>
      </section>
    </PdpShareRegion>
  )
}
