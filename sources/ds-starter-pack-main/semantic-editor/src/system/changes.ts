import type { ProjectFile } from '../../../stories/base-ui/tokens/project-file'
import { APPEARANCES, isSeparate, MODE_NAMES, type Appearance } from '../../../stories/base-ui/tokens/theme-config'
import { describeChanges } from '../agent/themeAgent'
import type { ProjectDoc } from '../app/store'
import { computeChanges } from '../variables/changes'

/** What the draft changes compared with the saved system, in plain lines for the save dialog. */
export interface DraftSummary {
  dirty: boolean
  lines: { label: string; detail: string }[]
  /** Variables whose value differs from the saved system. */
  variables: number
  themeChanged: boolean
  /** A suggested one-line note for the version. */
  suggestion: string
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

const modesText = (modes: Appearance[]) =>
  modes.length > 1 ? `${modes.map((m) => MODE_NAMES[m]).join(' and ')}, ${MODE_NAMES[modes[0]].toLowerCase()} first` : `${MODE_NAMES[modes[0]]} only`

export function summarizeDraft(doc: ProjectDoc, saved: ProjectFile): DraftSummary {
  const lines: DraftSummary['lines'] = []
  // The mode being previewed isn't a change to the system.
  // The mode and brand being previewed aren't changes to the system.
  const themeChanged = !same({ ...doc.theme, name: '', appearance: '', brand: '' }, { ...saved.theme, name: '', appearance: '', brand: '' })
  let variables = 0
  if (themeChanged) {
    // Variables are counted for the main brand; other brands are listed by name below.
    const before = computeChanges({ ...saved.theme, brand: null }).byName
    const after = computeChanges({ ...doc.theme, brand: null }).byName
    const names = new Set([...before.keys(), ...after.keys()])
    // Compared per mode both versions ship: adding, removing or reordering modes is its own line.
    const shared = APPEARANCES.filter((m) => saved.theme.modes.includes(m) && doc.theme.modes.includes(m))
    for (const n of names) if (shared.some((m) => before.get(n)?.values[m] !== after.get(n)?.values[m])) variables++
    if (!same(saved.theme.modes, doc.theme.modes)) lines.push({ label: 'Modes', detail: modesText(doc.theme.modes) })
    // A mode set up separately (or linked again), and changes to a separate mode's own colors.
    for (const m of doc.theme.modes.slice(1)) {
      const was = isSeparate({ ...saved.theme, brand: null }, m)
      const now = isSeparate({ ...doc.theme, brand: null }, m)
      if (was !== now) lines.push({ label: `${MODE_NAMES[m]} mode`, detail: now ? 'Set up separately' : `Follows ${MODE_NAMES[doc.theme.modes[0]].toLowerCase()}` })
      else if (now && !same(saved.theme.separate[m], doc.theme.separate[m])) lines.push({ label: `${MODE_NAMES[m]} colors`, detail: 'Changed' })
    }
    const meta = (t: typeof doc.theme) => t.brands.map((b) => ({ id: b.id, name: b.name, description: b.description, appType: b.appType }))
    if (!same(meta(saved.theme), meta(doc.theme))) {
      lines.push({ label: 'Brands', detail: doc.theme.brands.length ? doc.theme.brands.map((b) => b.name).join(', ') : 'One brand' })
    }
    for (const b of doc.theme.brands.slice(1)) {
      const was = saved.theme.brands.find((x) => x.id === b.id)
      if (was && !same(was.own, b.own)) lines.push({ label: `${b.name} look`, detail: 'Changed' })
    }
    for (const c of describeChanges({ ...saved.theme, brand: null }, { ...doc.theme, brand: null }, doc.theme.extras)) {
      if (c.label === 'Appearance') continue
      if (c.label === 'Borders' || c.label === 'Shadows' || c.label === 'Buttons' || c.label === 'Heading weight') {
        if (!same(saved.theme.extras, doc.theme.extras)) lines.push({ label: c.label, detail: c.after })
      } else lines.push({ label: c.label, detail: `${c.before} → ${c.after}` })
    }
    if (!lines.length) lines.push({ label: 'Theme', detail: 'Variable edits and component overrides' })
  }
  const changedPages = Object.keys({ ...doc.pages, ...saved.pages }).filter((id) => doc.pages[id] !== saved.pages[id])
  if (changedPages.length) lines.push({ label: 'Written pages', detail: `${changedPages.length} page${changedPages.length === 1 ? '' : 's'} edited` })
  const savedIds = new Set(saved.prototypes.map((p) => p.id))
  const added = doc.prototypes.filter((p) => !savedIds.has(p.id)).length
  const removed = saved.prototypes.filter((p) => !doc.prototypes.some((d) => d.id === p.id)).length
  const edited = doc.prototypes.filter((p) => savedIds.has(p.id) && !same(p, saved.prototypes.find((s) => s.id === p.id))).length
  if (added || removed || edited) lines.push({ label: 'Screens', detail: [added && `${added} added`, edited && `${edited} changed`, removed && `${removed} removed`].filter(Boolean).join(', ') })
  if (!same(doc.info, saved.project)) lines.push({ label: 'Settings', detail: 'Name, product or links' })

  const suggestion = themeChanged
    ? `Theme: ${lines.filter((l) => l.label !== 'Written pages' && l.label !== 'Screens' && l.label !== 'Settings').map((l) => l.label.toLowerCase()).slice(0, 3).join(', ')} updated`
    : changedPages.length
      ? 'Docs: guidance updated'
      : added
        ? 'Patterns: new example screen'
        : 'Settings updated'
  return { dirty: lines.length > 0, lines, variables, themeChanged, suggestion }
}
