/**
 * Countries (not territories) outside the UK, from GOV.UK's country and
 * territory register via govuk-country-and-territory-autocomplete.
 * Regenerate with `node scripts/generate-countries.cjs`.
 */
import COUNTRY_DATA from './countries.generated.json'

type Country = { name: string; synonyms: string[] }

const COUNTRIES = COUNTRY_DATA as Country[]

export const COUNTRY_NAMES: string[] = COUNTRIES.map((c) => c.name)

const BY_LOWER_NAME = new Map(COUNTRIES.map((c) => [c.name.toLowerCase(), c.name]))

/** The register's spelling of a country name, matched case-insensitively; undefined when it is not a country. */
export function canonicalCountryName(value: string | undefined): string | undefined {
  return value ? BY_LOWER_NAME.get(value.trim().toLowerCase()) : undefined
}

/**
 * Country names matching a typed query, best first: names starting with it,
 * then names with a word starting with it, then names containing it, then
 * names with a matching synonym or common misspelling (e.g. "USA", "Eire").
 */
export function searchCountries(query: string): string[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const ranked: Array<{ name: string; rank: number }> = []
  for (const country of COUNTRIES) {
    const name = country.name.toLowerCase()
    let rank = -1
    if (name.startsWith(q)) rank = 0
    else if (name.split(/[\s,()-]+/).some((word) => word.startsWith(q))) rank = 1
    else if (name.includes(q)) rank = 2
    else if (country.synonyms.some((s) => s.toLowerCase().startsWith(q))) rank = 3
    if (rank >= 0) ranked.push({ name: country.name, rank })
  }
  return ranked.sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name)).map((r) => r.name)
}
