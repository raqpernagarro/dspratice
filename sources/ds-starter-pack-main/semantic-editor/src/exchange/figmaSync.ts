/**
 * Figma → system: what changed in a Figma file, and recording the changes the designer keeps.
 *
 * Three sides are compared, value by value (by name, as the change set addresses them):
 *  - the file now (the plugin export),
 *  - the file right after the last sync (the plugin's memory, in the export's `sync`),
 *  - the system (what the next change set would send).
 * Without memory (a file synced by an older plugin) only the file and the system are compared.
 *
 * Kept changes become part of the theme: values as variable edits, rebound layers as component
 * overrides, new variables as added variables. They're saved with the next version and travel
 * back to Figma with the next change set.
 */
import { repoAnatomy, slotForBinding } from '../../../stories/base-ui/tokens/component-anatomy'
import { GENERATED_MARKER, type AnatomyBinding, type ChangeValue, type FigmaCollectionJson, type VariablesExport } from '../../../stories/base-ui/tokens/exchange-format'
import { brandKey, collectionKey, fileValues, modeKey, valueId, valueKey, variantKey, type FileValue, type SyncBase } from '../../../stories/base-ui/tokens/figma-sync'
import { MODE_NAMES, type ThemeConfig } from '../../../stories/base-ui/tokens/theme-config'
import { isAlias, REPO_DATA, variableGraph as graph, type RawCollection, type RawValue, type RawVariable, type VariableEdits } from '../../../stories/base-ui/tokens/variables-model'
import { buildChangeSet } from './changeset'

const REPO_IDS = new Set(REPO_DATA.variables.map((v) => v.id))

/**
 * figma: changed in Figma since the last sync · both: changed in Figma and in the system ·
 * new: a variable the system doesn't have · different: differs from the system (no memory to tell who changed it).
 */
export type SyncStatus = 'figma' | 'both' | 'new' | 'different'

export interface SyncItem {
  id: string
  section: 'values' | 'new' | 'components'
  status: SyncStatus
  label: string
  /** In Figma now. */
  figma: string
  /** In the system (what the next change set sends), when it has it. */
  system?: string
  /** Right after the last sync, when the file remembers it. */
  before?: string
  /** Suggested choice: keep Figma's (true) or use the system's. */
  keep: boolean
  /** Why it can't be recorded (shown, never kept). */
  blocked?: string
  ref: { kind: 'value'; value: FileValue } | { kind: 'binding'; token: string; variable: string }
}

export interface SyncReview {
  base: SyncBase | null
  items: SyncItem[]
  /** Values the system changed since the last sync: they go to Figma with the next change set. */
  systemChanged: number
}

/* ---------------------------------------------------------- the system */

/** A collection of the system's graph by its comparison key. */
function graphCollection(key: string): RawCollection | undefined {
  if (key === 'semantic') return graph.semantic
  if (key.startsWith('brand:')) return graph.brandCollection(key.slice(6))
  return graph.collections.find((c) => c.name === key)
}

const keyOfGraphCollection = (c: RawCollection) => (c.id === graph.semantic.id ? 'semantic' : c.extends === graph.semantic.id ? `brand:${brandKey(c.name)}` : c.name)

function rawToChange(raw: RawValue | undefined): ChangeValue | null {
  if (raw === undefined || raw === null) return null
  if (!isAlias(raw)) return raw
  const t = graph.vars.get(raw.a)
  if (!t) return null
  const opacity = raw.o === undefined ? undefined : typeof raw.o === 'string' ? graph.vars.get(raw.o)?.name : raw.o
  return { alias: t.name, ...(opacity !== undefined ? { opacity } : {}) }
}

/** Every value the system would send, by comparison id. */
function systemValues(theme: ThemeConfig) {
  const out = new Map<string, ChangeValue>()
  const cs = buildChangeSet(theme)
  for (const v of graph.vars.values()) {
    const col = graph.collection(v.collection)
    if (!col || col.id === graph.semantic.id) continue
    const key = keyOfGraphCollection(col)
    for (const m of col.modes) {
      const cv = rawToChange(v.values[m.id])
      if (cv !== null) out.set(valueId(key, v.name, modeKey(key, col.modes.length, m.name)), cv)
    }
  }
  for (const p of cs.primitives) out.set(valueId(p.collection, p.name, '*'), typeof p.value === 'object' ? { alias: p.value.alias, opacity: p.value.opacity } : p.value)
  const brandNames = new Set(theme.brands.slice(1).map((b) => b.name))
  for (const c of cs.values) {
    const key = c.collection === 'semantic' ? 'semantic' : brandNames.has(c.collection) ? `brand:${brandKey(c.collection)}` : c.collection
    const col = graphCollection(key)
    out.set(valueId(key, c.variable, modeKey(key, col?.modes.length ?? 1, c.mode)), c.value)
  }
  for (const o of cs.components ?? []) if (o.kind !== 'text-style') out.set(valueId(o.collection, o.token, '*'), { alias: o.alias })
  return out
}

/* ---------------------------------------------------------- review */

/** What changed in the Figma file, against the system and the file's memory of the last sync. */
export function reviewFigmaFile(exp: VariablesExport, theme: ThemeConfig): SyncReview {
  const sys = systemValues(theme)
  const memory = exp.sync?.base ? exp.sync : null
  const brands = new Map(theme.brands.slice(1).map((b) => [`brand:${brandKey(b.name)}`, b.name]))
  const modes = new Set(theme.modes.map((m) => MODE_NAMES[m]))
  const items: SyncItem[] = []
  let systemChanged = 0

  for (const f of fileValues(exp)) {
    const colored = f.collection === 'semantic' || f.collection.startsWith('brand:')
    // Only what the system ships: its brands, its modes, and the shared collections.
    if (f.collection.startsWith('brand:') && !brands.has(f.collection)) continue
    if (colored && !modes.has(f.mode)) continue
    if (!colored && f.collection !== 'primitives' && f.collection !== 'components') continue

    const id = valueId(f.collection, f.variable, f.mode)
    const figma = valueKey(f.value)
    const sysValue = sys.get(id)
    const system = sysValue === undefined ? undefined : valueKey(sysValue)
    if (system === figma) continue
    const generated = (exp.meta.variables[f.varId]?.description ?? '').includes(GENERATED_MARKER)

    let status: SyncStatus
    let before: string | undefined
    if (system === undefined) {
      // Only Figma has it (made in Figma, before or after the sync); a leftover generated color isn't a designer's change.
      if (generated) continue
      before = memory?.values[id]
      status = 'new'
    } else if (memory) {
      before = memory.values[id]
      if (before === figma) {
        // Untouched in Figma; the system moved on and sends its value next time.
        systemChanged++
        continue
      }
      status = before === undefined || system === before ? 'figma' : 'both'
    } else {
      status = 'different'
    }

    const brand = brands.get(f.collection)
    const label = `${f.variable}${f.mode === '*' ? '' : ` · ${f.mode}`}${brand ? ` · ${brand}` : ''}`
    const blocked =
      f.collection.startsWith('brand:') && !graphCollection(f.collection)
        ? `${brand}’s own values can’t be recorded yet: the repo has no collection for this brand.`
        : undefined
    items.push({
      id,
      section: status === 'new' ? 'new' : 'values',
      status,
      label,
      figma,
      system,
      before,
      keep: !blocked && status !== 'different',
      blocked,
      ref: { kind: 'value', value: f },
    })
  }

  items.push(...reviewBindings(exp, theme, memory?.rebound ?? null))
  return { base: memory?.base ?? null, items, systemChanged }
}

/** Layers bound to another variable than the system's components use. */
function reviewBindings(exp: VariablesExport, theme: ThemeConfig, rebound: string[] | null): SyncItem[] {
  const repo = new Map(repoAnatomy().flatMap((c) => c.variants.map((v) => [variantKey(c.name, v.props), v.bindings] as const)))
  const changed = rebound ? new Set(rebound) : null
  const byField = (list: AnatomyBinding[]) => {
    const m = new Map<string, string>()
    for (const b of list) m.set(`${b.layer}|${b.field}`, b.variable)
    return m
  }
  const groups = new Map<string, { item: SyncItem; variants: number }>()
  for (const comp of exp.components ?? []) {
    for (const variant of comp.variants) {
      const key = variantKey(comp.name, variant.props)
      if (changed && !changed.has(key)) continue
      const was = repo.get(key)
      if (!was) continue
      const before = byField(was)
      for (const [where, variable] of byField(variant.bindings)) {
        const old = before.get(where)
        if (old === undefined || old === variable) continue
        const [layer, field] = where.split('|')
        const slot = slotForBinding(comp.name, variant.props, layer, field)
        // Bound to its own override token, or already recorded.
        if (slot && (variable === slot.token || theme.components[slot.token] === variable)) continue
        const target = graph.byName(variable)
        const blocked = !slot
          ? 'The code has no setting for this layer yet, so this stays a Figma-only change.'
          : target?.collection !== graph.semantic.id
            ? 'Bound to a variable that isn’t a semantic token; only semantic tokens can be recorded.'
            : undefined
        const groupId = `${slot?.token ?? `${comp.name}|${layer}|${field}`}|${variable}`
        const existing = groups.get(groupId)
        if (existing) {
          existing.variants++
          continue
        }
        // "Secondary · Hover", flags by name ("Destructive") and only when on.
        const parts = slot ? Object.entries(slot.variants).flatMap(([axis, v]) => (v === 'True' ? [axis] : v === 'False' ? [] : [v])) : []
        const scope = parts.length ? ` · ${parts.join(' · ')}` : ''
        groups.set(groupId, {
          variants: 1,
          item: {
            id: `binding|${groupId}`,
            section: 'components',
            status: changed ? 'figma' : 'different',
            label: slot ? `${comp.name} · ${slot.property.label}${scope}` : `${comp.name} · ${layer || 'variant'} · ${field}`,
            figma: `→ ${variable}`,
            system: `→ ${old}`,
            keep: !blocked && Boolean(changed),
            blocked,
            ref: { kind: 'binding', token: slot?.token ?? '', variable },
          },
        })
      }
    }
  }
  return [...groups.values()].map(({ item, variants }) => (variants > 1 ? { ...item, label: `${item.label} · ${variants} variants` } : item))
}

/* ---------------------------------------------------------- record */

export interface Recorded {
  theme: Pick<ThemeConfig, 'variables' | 'added' | 'components'>
  recorded: number
  failed: string[]
}

/** The kept items as theme changes: variable edits, added variables and component overrides. */
export function recordFigmaChanges(exp: VariablesExport, theme: ThemeConfig, kept: SyncItem[]): Recorded {
  const variables: VariableEdits = structuredClone(theme.variables)
  const added: RawVariable[] = [...theme.added]
  const components = { ...theme.components }
  const cols = Object.values(exp.meta.variableCollections)
  const colById = new Map(cols.map((c) => [c.id, c]))
  const semanticId = cols.find((c) => c.name === 'semantic')?.id
  const exportVars = Object.values(exp.meta.variables)
  const failed: string[] = []

  /** The system's id for a variable, copying it from the file (and anything it points at) when new. */
  const ensure = (name: string, collectionName: string | undefined, depth = 0): string | null => {
    const existing = [...graph.vars.values()].find((v) => v.name === name && (!collectionName || graph.collection(v.collection)?.name === collectionName || collectionName.startsWith('brand:')))
    if (existing) {
      // Kept from Figma earlier but not in this theme (a discarded or failed recording): keep it now.
      if (!REPO_IDS.has(existing.id) && !added.some((a) => a.id === existing.id)) added.push(existing)
      return existing.id
    }
    if (depth > 10) return null
    const ev = exportVars.find((v) => v.name === name && (!collectionName || colById.get(v.variableCollectionId)?.name === collectionName))
    const ecol = ev && colById.get(ev.variableCollectionId)
    if (!ev || !ecol) return null
    const col = graphCollection(collectionKey(ecol, semanticId))
    if (!col) return null
    const values: Record<string, RawValue> = {}
    for (const gm of col.modes) {
      const em = ecol.modes.find((m) => m.name === gm.name) ?? ecol.modes[0]
      const raw = toRaw(fileValueOf(ev.id, ecol, em.name), depth + 1)
      if (raw !== null) values[gm.id] = raw
    }
    const type = ev.resolvedType as RawVariable['type']
    const v: RawVariable = { id: ev.id, name: ev.name, collection: col.id, type, description: ev.description, values }
    added.push(v)
    graph.addVariables([v])
    return v.id
  }

  let all: Map<string, ChangeValue> | null = null
  const fileValueOf = (varId: string, col: FigmaCollectionJson, mode: string) => {
    all ??= new Map(fileValues(exp).map((f) => [`${f.varId}|${f.collection}|${f.mode}`, f.value]))
    const key = collectionKey(col, semanticId)
    return all.get(`${varId}|${key}|${modeKey(key, col.modes.length, mode)}`) ?? null
  }

  const toRaw = (cv: ChangeValue | null, depth = 0): RawValue => {
    if (cv === null) return null
    if (typeof cv !== 'object') return cv
    const a = ensure(cv.alias, cv.collection, depth)
    if (!a) return null
    const o = cv.opacity === undefined ? undefined : typeof cv.opacity === 'number' ? cv.opacity : (ensure(cv.opacity, 'primitives', depth) ?? undefined)
    return { a, ...(o !== undefined ? { o } : {}) }
  }

  let recorded = 0
  for (const item of kept) {
    if (item.blocked) continue
    if (item.ref.kind === 'binding') {
      if (!item.ref.token) continue
      components[item.ref.token] = item.ref.variable
      recorded++
      continue
    }
    const f = item.ref.value
    const owner = f.collection.startsWith('brand:') ? 'semantic' : f.collection
    const varId = ensure(f.variable, owner === 'semantic' ? 'semantic' : owner)
    const col = graphCollection(f.collection)
    const mode = col && (f.mode === '*' ? col.modes[0] : col.modes.find((m) => m.name === f.mode))
    const raw = toRaw(f.value)
    if (!varId || !mode || raw === null) {
      failed.push(item.label)
      continue
    }
    variables[varId] = { ...variables[varId], [mode.id]: raw }
    recorded++
  }
  return { theme: { variables, added, components }, recorded, failed }
}
