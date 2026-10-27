// Recording a DS Starter Pack set-up: the hub reads the Starter's own project file, keeps what it can
// hold, says what it leaves, and refuses anything that is not a project file. When the Starter Pack
// source is installed, its own makeProjectFile and colour maths are the reference.
import { describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { DEFAULT_THEME } from '@/fixtures/demo-brand/system'
import { fromStarterProject, oklchToHex } from './fromStarterProject'

const HAS_STARTER = ['sources', '../demo tools'].some((d) => existsSync(resolve(process.cwd(), d, 'ds-starter-pack-main/stories/base-ui/tokens/project-file.ts')))

const file = (over: Record<string, unknown> = {}) => ({
  format: 'ds-configurator/project',
  version: 1,
  exportedAt: '2026-10-23T10:00:00.000Z',
  project: { name: 'Acme Insights', description: 'Analytics for field teams', appType: 'admin', githubUrl: 'github.com/acme/ds', figmaUrl: 'figma.com/design/abc/Acme', color: '#8b7cff' },
  theme: {
    name: 'Acme',
    modes: ['dark', 'light'],
    separate: { light: { color: {}, depth: null } },
    brands: [
      { id: 'acme', name: 'Acme', description: '', appType: 'admin', own: null },
      { id: 'field', name: 'Field', description: '', appType: 'mobile', own: { colors: { color: { main: { l: 0.6, c: 0.15, h: 30 }, accent: '#ff3e9d' }, separate: {} }, fonts: { type: {} } } },
    ],
    color: { main: { l: 0.55, c: 0.12, h: 250 }, accent: '#1f6feb', neutralTint: 0.1, status: { info: null, success: '#1f7a4d', warning: null, error: null } },
    type: { body: { family: 'Inter', weights: '400;600' }, heading: null, baseSize: 16, scale: 1.2 },
    radius: 12,
    density: 0.9,
    depth: 0.5,
    extras: { buttonShape: 'pill', headingWeight: 600 },
    variables: { 'v-1': { light: '#fff' } },
    components: {},
    added: [],
  },
  prototypes: [{ id: 'p1' }],
  pages: {},
  versions: [{ version: '1.2', note: 'Field brand', date: '2026-10-22' }],
  ...over,
})

describe('fromStarterProject', () => {
  it('keeps the profile and main choices of a multi-brand, dark-first system', () => {
    const imp = fromStarterProject(JSON.stringify(file()), DEFAULT_THEME)
    expect(imp.patch).toMatchObject({
      name: 'Acme Insights',
      tagline: 'Analytics for field teams',
      appearance: 'both',
      designedFirst: 'dark',
      secondMode: 'separate',
      productType: 'admin',
      activeBrand: 'acme',
      color: { main: oklchToHex({ l: 0.55, c: 0.12, h: 250 }), accent: '#1f6feb', neutralTint: 0.1 },
      type: { heading: 'Inter', body: 'Inter', baseSize: 16, headingWeight: 600 },
      radius: 12,
      density: 0.9,
      depth: 0.5,
      buttonShape: 'pill',
      repoUrl: 'github.com/acme/ds',
      figmaUrl: 'figma.com/design/abc/Acme',
    })
    expect(imp.patch.brands.map((b) => [b.id, b.name, b.isDefault ?? false])).toEqual([['acme', 'Acme', true], ['field', 'Field', false]])
    expect(imp.patch.brands[1]).toMatchObject({ main: oklchToHex({ l: 0.6, c: 0.15, h: 30 }), accent: '#ff3e9d' })
    expect(imp.source).toEqual({ version: '1.2', exportedAt: '2026-10-23T10:00:00.000Z' })
    const notKept = imp.notKept.join(' | ')
    expect(notKept).toMatch(/light mode’s own colours/)
    expect(notKept).toMatch(/Fonts or shape owned by 1 brand/)
    expect(notKept).toMatch(/1 status colour/)
    expect(notKept).toMatch(/1 variable edit/)
    expect(notKept).toMatch(/1 saved prototype/)
  })

  it('falls back to the workspace’s own values where the Starter left its defaults', () => {
    const imp = fromStarterProject(file({ theme: { modes: ['light'] }, project: { name: 'Solo' }, versions: [] }), DEFAULT_THEME)
    expect(imp.patch).toMatchObject({ name: 'Solo', appearance: 'light', color: { main: DEFAULT_THEME.color.main }, type: DEFAULT_THEME.type, radius: DEFAULT_THEME.radius, repoUrl: DEFAULT_THEME.repoUrl })
    expect(imp.patch.brands).toEqual([{ id: 'solo', name: 'Solo', main: DEFAULT_THEME.color.main, accent: DEFAULT_THEME.color.main, isDefault: true }])
    expect(imp.source.version).toBe('1.0')
  })

  it('refuses what is not a project file, or one from a newer configurator', () => {
    expect(() => fromStarterProject('{nope', DEFAULT_THEME)).toThrow(/not valid JSON/)
    expect(() => fromStarterProject({ format: 'ds-configurator/changes@1' }, DEFAULT_THEME)).toThrow(/not a DS Starter Pack project file/)
    expect(() => fromStarterProject(file({ version: 2 }), DEFAULT_THEME)).toThrow(/newer DS Configurator/)
  })

  it.skipIf(!HAS_STARTER)('reads a file made by the Starter Pack’s own makeProjectFile, with the same colours', async () => {
    const { makeProjectFile, DEFAULT_PROJECT_INFO } = await import('@ds-tokens/project-file')
    const { withDefaults } = await import('@ds-tokens/theme-config')
    const { oklchToHex: starterHex } = await import('@ds-tokens/color-math')
    const main = { l: 0.62, c: 0.17, h: 145 }
    const real = makeProjectFile({ ...DEFAULT_PROJECT_INFO, name: 'Starter made', appType: 'ecommerce' }, withDefaults({ name: 'Starter made', modes: ['light', 'dark'], color: { ...withDefaults(null).color, main } }))
    const imp = fromStarterProject(JSON.stringify(real), DEFAULT_THEME)
    expect(imp.patch).toMatchObject({ name: 'Starter made', productType: 'ecommerce', appearance: 'both', designedFirst: 'light', secondMode: 'follows' })
    expect(imp.patch.color.main).toBe(starterHex({ ...main, alpha: 1 }))
  })
})
