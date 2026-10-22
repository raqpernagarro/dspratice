import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

// Every path comes from src/app/routes.ts. A literal `/panel`, `/demo` or `/handbook` route in a
// page would break one of the two workspaces, so this test keeps them out for good.

function walk(dir: string, out: string[] = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (/\.(tsx?|css)$/.test(name) && !name.endsWith('.test.ts') && !name.endsWith('.test.tsx')) out.push(p)
  }
  return out
}

describe('no legacy route literals', () => {
  it('src/features and src/shell build every path from the route families', () => {
    const files = walk(join(__dirname, '..', 'features')).concat(walk(join(__dirname, '..', 'shell')))
    const offenders: string[] = []
    for (const f of files) {
      const text = readFileSync(f, 'utf8')
      const lines = text.split('\n')
      lines.forEach((line, i) => {
        if (/(['"`])\/panel(\/|\1)/.test(line) || /(['"`])\/demo(\/|\1|\?)/.test(line) || /(['"`])\/handbook(\/|\1)/.test(line)) offenders.push(`${f.replace(/.*\/src\//, 'src/')}:${i + 1}`)
      })
    }
    expect(offenders).toEqual([])
  })
})
