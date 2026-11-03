/**
 * Splits `clinical_evidence_detailed` across the hybrid PDP surfaces for
 * curated-narrative products (matt_demo "Assurance and evidence" migration):
 *
 *  - publications:    peer-reviewed studies, RCT/observational records, and
 *                     service evaluations → "Clinical publications and evaluations"
 *                     (excludes NICE HT/HTE/HTG/MTG assessments).
 *  - niceEvidence:    all `nice_assessment` entries — kept out of the PDP; HTG / MTG
 *                     guidance held shows under Regulatory position (niceTechGuidanceRefs).
 *  - experienceEvals: real-world NHS programme write-ups → rendered as
 *                     case-study cards in the NHS experience section (entries
 *                     flagged `superseded_by_case_study` are skipped because a
 *                     richer curated case study already covers them).
 *  - tab:             anything left over (grey lit, implementation science,
 *                     evidence gaps…) stays in the Clinical evidence tab.
 *
 * Non-narrative products keep the full record in the tab (pass
 * `showNarrativeSpine: false`).
 */
export type PdpEvidenceSplit = {
  publications: any[]
  niceEvidence: any[]
  experienceEvals: any[]
  tab: any[]
}

/** NICE HT/HTE/HTG/MTG/EVA/EAG guidance — not a Clinical publication. */
function isNiceGuidanceRecord(study: any): boolean {
  if (study.type === 'nice_assessment') return true
  const text = `${study.ref ?? ''} ${study.type_label ?? ''}`
  return /\bNICE\b/i.test(text) && /\b(HTE|HTG|HT|MTG|EVA|EAG)\b/i.test(text)
}

/** Study-grade records for the Clinical publications and evaluations subsection. */
function isPublicationRecord(study: any): boolean {
  return (
    !isNiceGuidanceRecord(study) &&
    (study.peer_reviewed ||
      study.supplier_provided ||
      study.type === 'RCT' ||
      study.type === 'observational' ||
      study.type === 'service_eval')
  )
}

export type NiceTechGuidanceRef = { ref: string; url?: string; date?: string; note?: string }

/** HTG / MTG codes in a NICE reference, e.g. "NICE HTE19 (HTG736)" → ["HTG736"]. */
function techGuidanceCodes(text: string | undefined): string[] {
  return (text ?? '').toUpperCase().match(/\b(?:HTG|MTG)\d+\b/g) ?? []
}

/**
 * NICE HealthTech (HTG) and medical technologies (MTG) guidance held for a product,
 * from `nice_guidance_refs`. Shown under Regulatory position. Entries whose code is
 * already the narrative's headline NICE reference are skipped.
 */
export function niceTechGuidanceRefs(
  app: { nice_guidance_refs?: (NiceTechGuidanceRef & { type?: string })[] },
  headlineRef?: string,
): NiceTechGuidanceRef[] {
  const refs = Array.isArray(app.nice_guidance_refs) ? app.nice_guidance_refs : []
  const headline = new Set(techGuidanceCodes(headlineRef))
  return refs
    .filter((r) => r?.ref && /\b(HTG|MTG)\d*\b/i.test(`${r.ref} ${r.type ?? ''}`))
    .filter((r) => !techGuidanceCodes(r.ref).some((code) => headline.has(code)))
    .map((r) => ({ ref: r.ref, url: r.url, date: r.date, note: r.note }))
}

export function splitPdpEvidence(
  app: any,
  opts: { showNarrativeSpine: boolean; hasNhsExperience: boolean },
): PdpEvidenceSplit {
  const all: any[] = Array.isArray(app.clinical_evidence_detailed) ? app.clinical_evidence_detailed : []

  if (!opts.showNarrativeSpine) {
    const publications = all.filter(
      (s) => !isNiceGuidanceRecord(s) && s.type === 'service_eval',
    )
    const niceEvidence = all.filter((s) => isNiceGuidanceRecord(s))
    const tab = all.filter((s) => !publications.includes(s) && !niceEvidence.includes(s))
    return { publications, niceEvidence, experienceEvals: [], tab }
  }

  const publications = all.filter(isPublicationRecord)
  const niceEvidence = all.filter((s) => isNiceGuidanceRecord(s))
  const realWorld = all.filter((s) => s.type === 'real_world' && !publications.includes(s))
  const experienceEvals = opts.hasNhsExperience
    ? realWorld.filter((s) => !s.superseded_by_case_study)
    : []

  const tab = all.filter(
    (s) =>
      !publications.includes(s) &&
      !niceEvidence.includes(s) &&
      // Real-world entries move to NHS experience when that section renders
      // (including superseded duplicates, which are covered by curated case studies).
      !(opts.hasNhsExperience && s.type === 'real_world'),
  )

  return { publications, niceEvidence, experienceEvals, tab }
}
