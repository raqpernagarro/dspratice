import { describe, expect, it } from 'vitest'

import { DEFAULT_PROJECT_INFO, makeProjectFile } from '../../../stories/base-ui/tokens/project-file'
import { DEFAULT_THEME_CONFIG, groupOf, separateMode } from '../../../stories/base-ui/tokens/theme-config'
import { projectFromFile } from '../app/store'
import { summarizeDraft } from './changes'

const saved = makeProjectFile({ ...DEFAULT_PROJECT_INFO, name: 'Acme' }, DEFAULT_THEME_CONFIG, [], {}, [{ version: '1.0', note: 'First', date: '' }])
const draft = () => projectFromFile(saved)

describe('what a draft changes', () => {
  it('an untouched draft has nothing to save', () => {
    const s = summarizeDraft(draft(), saved)
    expect(s.dirty).toBe(false)
    expect(s.lines).toEqual([])
    expect(s.variables).toBe(0)
  })

  it('a theme edit counts the variables it changes', () => {
    const doc = { ...draft(), theme: { ...DEFAULT_THEME_CONFIG, radius: 16 } }
    const s = summarizeDraft(doc, saved)
    expect(s.dirty).toBe(true)
    expect(s.themeChanged).toBe(true)
    expect(s.variables).toBeGreaterThan(0)
    expect(s.suggestion).toMatch(/^Theme: /)
  })

  it('an edited page is listed and suggests a docs note', () => {
    const doc = { ...draft(), pages: { voice: '# Our voice' } }
    const s = summarizeDraft(doc, saved)
    expect(s.lines).toEqual([{ label: 'Written pages', detail: '1 page edited' }])
    expect(s.themeChanged).toBe(false)
    expect(s.suggestion).toBe('Docs: guidance updated')
  })

  it('a new screen is listed as added', () => {
    const screen = { id: 'p1', title: 'Users', prompt: '', tree: { type: 'Stack', children: [] }, createdAt: '' }
    const doc = { ...draft(), prototypes: [screen] }
    const s = summarizeDraft(doc, saved)
    expect(s.lines).toEqual([{ label: 'Screens', detail: '1 added' }])
    expect(s.suggestion).toBe('Patterns: new example screen')
  })

  it('a settings change is listed', () => {
    const doc = { ...draft(), info: { ...saved.project, description: 'Calmer' } }
    expect(summarizeDraft(doc, saved).lines).toEqual([{ label: 'Settings', detail: 'Name, product or links' }])
  })

  it('reordering modes is one line, not changed variables', () => {
    const doc = { ...draft(), theme: { ...DEFAULT_THEME_CONFIG, modes: ['dark', 'light'] as ('light' | 'dark')[] } }
    const s = summarizeDraft(doc, saved)
    expect(s.variables).toBe(0)
    expect(s.lines).toContainEqual({ label: 'Modes', detail: 'Dark and Light, dark first' })
  })

  it('dropping a mode is listed', () => {
    const doc = { ...draft(), theme: { ...DEFAULT_THEME_CONFIG, modes: ['light'] as ('light' | 'dark')[] } }
    expect(summarizeDraft(doc, saved).lines).toContainEqual({ label: 'Modes', detail: 'Light only' })
  })

  it('a mode change never lists the previewed mode as a change', () => {
    const doc = { ...draft(), theme: { ...DEFAULT_THEME_CONFIG, modes: ['dark', 'light'] as ('light' | 'dark')[], appearance: 'dark' as const } }
    expect(summarizeDraft(doc, saved).lines.map((l) => l.label)).toEqual(['Modes'])
  })

  it('previewing the other mode is not a change', () => {
    const doc = { ...draft(), theme: { ...DEFAULT_THEME_CONFIG, appearance: 'dark' as const } }
    expect(summarizeDraft(doc, saved).dirty).toBe(false)
  })

  it('setting a mode up separately is listed, and so are later changes to its colors', () => {
    const sep = separateMode({ ...DEFAULT_THEME_CONFIG }, 'dark')
    expect(summarizeDraft({ ...draft(), theme: sep }, saved).lines).toContainEqual({ label: 'Dark mode', detail: 'Set up separately' })
    const savedSep = { ...saved, theme: sep }
    const tuned = { ...sep, separate: { dark: { ...sep.separate.dark!, depth: 0.8 } } }
    expect(summarizeDraft({ ...draft(), theme: tuned }, savedSep).lines).toContainEqual({ label: 'Dark colors', detail: 'Changed' })
  })

  it('brands are listed by name, a brand’s own look when it changes, and previewing a brand is not a change', () => {
    const base = { ...DEFAULT_THEME_CONFIG }
    const brands = [
      { id: 'a', name: 'Acme A', description: '', appType: 'dashboard', own: null },
      { id: 'b', name: 'Acme B', description: '', appType: 'mobile', own: { shape: groupOf(base, 'shape') as never } },
    ]
    const withBrands = { ...base, brands }
    expect(summarizeDraft({ ...draft(), theme: withBrands }, saved).lines).toContainEqual({ label: 'Brands', detail: 'Acme A, Acme B' })
    const savedB = { ...saved, theme: withBrands }
    expect(summarizeDraft({ ...draft(), theme: { ...withBrands, brand: 'b' } }, savedB).dirty).toBe(false)
    const tuned = { ...withBrands, brands: [brands[0], { ...brands[1], own: { shape: { ...(brands[1].own as { shape: object }).shape, radius: 30 } as never } }] }
    expect(summarizeDraft({ ...draft(), theme: tuned }, savedB).lines).toContainEqual({ label: 'Acme B look', detail: 'Changed' })
  })
})
