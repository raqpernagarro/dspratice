/**
 * Google Fonts catalog → semantic-editor/src/data/google-fonts.json
 *
 *   npm run fonts:sync
 *
 * Compact rows: [family, category, uprightWeights, isVariable], most popular first.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const out = path.resolve(__dirname, '../semantic-editor/src/data/google-fonts.json')

const res = await fetch('https://fonts.google.com/metadata/fonts')
if (!res.ok) throw new Error(`Google Fonts metadata: HTTP ${res.status}`)
const { familyMetadataList } = await res.json()

const rows = familyMetadataList
  .filter((f) => f.isOpenSource !== false)
  .sort((a, b) => a.popularity - b.popularity)
  .map((f) => {
    const weights = Object.keys(f.fonts)
      .filter((k) => !k.endsWith('i'))
      .map(Number)
      .sort((a, b) => a - b)
    const variable = (f.axes ?? []).some((a) => a.tag === 'wght')
    return [f.family, f.category, weights, variable]
  })

fs.mkdirSync(path.dirname(out), { recursive: true })
fs.writeFileSync(out, JSON.stringify(rows))
console.log(`Wrote ${rows.length} families to ${path.relative(process.cwd(), out)}`)
