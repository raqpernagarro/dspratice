import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const demosDir = path.join(root, 'stories/base-ui/demos/official')

function stripDarkModeBlocks(css) {
  let result = css
  const needle = '@media (prefers-color-scheme: dark)'
  while (result.includes(needle)) {
    const start = result.indexOf(needle)
    const braceStart = result.indexOf('{', start)
    let depth = 0
    let end = braceStart
    for (let i = braceStart; i < result.length; i++) {
      if (result[i] === '{') depth++
      if (result[i] === '}') {
        depth--
        if (depth === 0) {
          end = i + 1
          break
        }
      }
    }
    result = result.slice(0, start) + result.slice(end)
  }
  return result
}

const valueReplacements = [
  [/oklch\(14\.5% 0 0deg\)/g, 'var(--ds-fg-default)'],
  [/oklch\(97% 0 0deg\)/g, 'var(--ds-control-bg-hover)'],
  [/oklch\(92\.2% 0 0deg\)/g, 'var(--ds-control-bg-active)'],
  [/oklch\(26\.9% 0 0deg\)/g, 'var(--ds-control-bg-hover)'],
  [/oklch\(37\.1% 0 0deg\)/g, 'var(--ds-control-bg-active)'],
  [/oklch\(55\.6% 0 0deg\)/g, 'var(--ds-control-fg-disabled)'],
  [/oklch\(70\.8% 0 0deg\)/g, 'var(--ds-control-fg-disabled)'],
  [/oklch\(50\.5% 0\.213 27\.518deg\)/g, 'var(--ds-color-error)'],
  [/oklch\(70\.4% 0\.191 22\.216deg\)/g, 'var(--ds-color-error)'],
  [/background-color:\s*white/g, 'background-color: var(--ds-control-bg)'],
  [/background:\s*white/g, 'background: var(--ds-control-bg)'],
  [/color:\s*white(?![-\w])/g, 'color: var(--ds-control-fg)'],
  [/border:\s*1px solid white/g, 'border: 1px solid var(--ds-control-border)'],
  [/outline-color:\s*white/g, 'outline-color: var(--ds-focus-ring)'],
  [/outline:\s*2px solid oklch\([^)]+\)/g, 'outline: 2px solid var(--ds-focus-ring)'],
  [/border-radius:\s*0(?=;)/g, 'border-radius: var(--ds-radius-control)'],
  [/font-size:\s*0\.875rem/g, 'font-size: var(--ds-font-size-md)'],
  [/line-height:\s*1\.25rem/g, 'line-height: calc(var(--ds-font-size-md) * 1.25)'],
  [/font-weight:\s*400(?=;)/g, 'font-weight: var(--ds-font-weight-regular)'],
  [/font-weight:\s*700(?=;)/g, 'font-weight: var(--ds-font-weight-strong)'],
]

for (const file of fs.readdirSync(demosDir).filter((f) => f.endsWith('.module.css'))) {
  const filePath = path.join(demosDir, file)
  let css = fs.readFileSync(filePath, 'utf8')
  css = stripDarkModeBlocks(css)
  for (const [pattern, replacement] of valueReplacements) {
    css = css.replace(pattern, replacement)
  }
  fs.writeFileSync(filePath, css)
  console.log('updated', file)
}
