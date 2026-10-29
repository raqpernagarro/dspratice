/**
 * REST token files: empty components + shared state layer in color collection.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const spec = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../stories/base-ui/tokens/component-button-token-spec.json'), 'utf8'),
)

function nest(pathStr, value) {
  const parts = pathStr.split('/')
  let root = {}
  let cur = root
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i]
    if (i === parts.length - 1) {
      cur[p] = value
    } else {
      cur[p] = cur[p] ?? {}
      cur = cur[p]
    }
  }
  return root
}

function merge(a, b) {
  for (const [k, v] of Object.entries(b)) {
    if (v && typeof v === 'object' && !v.$type && a[k]) merge(a[k], v)
    else a[k] = v
  }
  return a
}

function compositeToken(name, [color, opacity]) {
  return nest(name, {
    $type: 'color',
    $value: `{${color}}`,
    $description: `Composite with opacity {${opacity}}`,
    $extensions: {
      'com.figma': {},
      'com.nagarro.ds': { compositeOpacity: `{${opacity}}` },
    },
  })
}

const outDir = path.resolve(__dirname, '../variables-github-action/tokens')
fs.mkdirSync(outDir, { recursive: true })

const componentsFile = {}
fs.writeFileSync(path.join(outDir, 'components.Mode 1.json'), JSON.stringify(componentsFile, null, 2))

let colorFile = {}
for (const [name, pair] of Object.entries(spec.sharedOverlay ?? spec.sharedStateLayer ?? {})) {
  merge(colorFile, compositeToken(name, pair))
}
fs.writeFileSync(path.join(outDir, 'color.Mode 1.json'), JSON.stringify(colorFile, null, 2))

fs.writeFileSync(
  path.resolve(__dirname, '../stories/base-ui/tokens/figma-rebind-map.json'),
  JSON.stringify(spec.sharedOverlay ?? spec.sharedStateLayer ?? {}, null, 2),
)

console.log('Wrote components.Mode 1.json (empty) and color.Mode 1.json shared overlay composites')
