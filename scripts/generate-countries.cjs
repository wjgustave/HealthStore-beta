#!/usr/bin/env node
/**
 * Builds lib/countries.generated.json from govuk-country-and-territory-autocomplete:
 * current countries only (no territories), without the United Kingdom, each with the
 * synonyms and common misspellings from the package's location graph.
 *
 *   node scripts/generate-countries.cjs
 */
const fs = require('fs')
const path = require('path')

const dist = path.join(__dirname, '..', 'node_modules', 'govuk-country-and-territory-autocomplete', 'dist')
const canonical = require(path.join(dist, 'location-autocomplete-canonical-list.json'))
const graph = require(path.join(dist, 'location-autocomplete-graph.json'))

const synonyms = {}
for (const [key, node] of Object.entries(graph)) {
  if (!key.startsWith('nym:')) continue
  const name = node.names['en-GB']
  for (const from of node.edges.from) {
    if (from.startsWith('country:')) (synonyms[from] ??= new Set()).add(name)
  }
}

/** The UK, and countries that no longer exist (still in the register with an end date). */
const EXCLUDED = new Set(['country:GB', 'country:CS', 'country:DD', 'country:SU', 'country:YU'])

const countries = canonical
  .filter(([, code]) => code.startsWith('country:') && !EXCLUDED.has(code))
  .map(([name, code]) => ({
    name,
    synonyms: [...(synonyms[code] ?? [])].filter((s) => s !== name).sort(),
  }))
  .sort((a, b) => a.name.localeCompare(b.name))

const out = path.join(__dirname, '..', 'lib', 'countries.generated.json')
fs.writeFileSync(out, `${JSON.stringify(countries)}\n`)
console.log(`Wrote ${countries.length} countries to ${path.relative(process.cwd(), out)}`)
