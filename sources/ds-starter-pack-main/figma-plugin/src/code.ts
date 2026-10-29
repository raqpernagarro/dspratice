/**
 * DS Configurator — Figma plugin (runs inside Figma, any paid plan; no REST API needed).
 *
 *  Export: local variables → JSON (REST-shaped) for the configurator / code sync, plus the
 *          anatomy of every component set (which variable each variant's layers use).
 *  Import: configurator change set → preview → apply (after saving a version). Component
 *          overrides create a component token and bind the matching layers to it.
 */
import {
  CHANGESET_FORMAT,
  GENERATED_MARKER,
  OVERRIDE_MARKER,
  VARIABLES_FORMAT,
  type AnatomyBinding,
  type ChangeSet,
  type ChangeValue,
  type ComponentAnatomy,
  type FigmaCollectionJson,
  type FigmaVariableJson,
  type VariablesExport,
} from '../../stories/base-ui/tokens/exchange-format'
import {
  bindingsHash,
  collectionKey,
  fileValues,
  modeKey,
  SYNC_BINDINGS_KEY,
  SYNC_NAMESPACE,
  SYNC_ROOT_KEY,
  SYNC_VALUES_KEY,
  valueId,
  valueKey,
  variantKey,
  type SyncBase,
  type SyncSection,
} from '../../stories/base-ui/tokens/figma-sync'

figma.showUI(__html__, { width: 440, height: 600, themeColors: true })

/* -------------------------------------------------------------- export */

async function exportVariables(): Promise<VariablesExport> {
  const collections = await figma.variables.getLocalVariableCollectionsAsync()
  const variables = await figma.variables.getLocalVariablesAsync()
  const out: VariablesExport = {
    format: VARIABLES_FORMAT,
    fileName: figma.root.name,
    exportedAt: new Date().toISOString(),
    meta: { variables: {}, variableCollections: {} },
  }
  for (const c of collections) {
    const ext = c as VariableCollection & {
      isExtension?: boolean
      parentVariableCollectionId?: string
      variableOverrides?: Record<string, Record<string, VariableValue>>
    }
    const json: FigmaCollectionJson = {
      id: c.id,
      name: c.name,
      modes: c.modes.map((m) => {
        const mode = m as { modeId: string; name: string; parentModeId?: string }
        return { modeId: mode.modeId, name: mode.name, parentModeId: mode.parentModeId }
      }),
      defaultModeId: c.defaultModeId,
      variableIds: [...c.variableIds],
    }
    if (ext.isExtension) {
      json.isExtension = true
      json.parentVariableCollectionId = ext.parentVariableCollectionId
      json.variableOverrides = JSON.parse(JSON.stringify(ext.variableOverrides ?? {}))
    }
    out.meta.variableCollections[c.id] = json
  }
  for (const v of variables) {
    const json: FigmaVariableJson = {
      id: v.id,
      name: v.name,
      variableCollectionId: v.variableCollectionId,
      resolvedType: v.resolvedType,
      description: v.description || undefined,
      scopes: [...v.scopes],
      valuesByMode: JSON.parse(JSON.stringify(v.valuesByMode)),
    }
    out.meta.variables[v.id] = json
  }
  const scan = await scanComponents(variables)
  out.components = scan.anatomy
  out.sync = readSync(variables, scan.rebound)
  return out
}

/* --------------------------------------------------------------- memory */

/** What the file remembers of the last sync: the values each variable held, and which variants changed bindings since. */
function readSync(variables: Variable[], rebound: string[]): SyncSection {
  let base: SyncBase | null = null
  try {
    const raw = figma.root.getSharedPluginData(SYNC_NAMESPACE, SYNC_ROOT_KEY)
    base = raw ? (JSON.parse(raw) as SyncBase) : null
  } catch {
    base = null
  }
  const values: Record<string, string> = {}
  if (base)
    for (const v of variables) {
      const raw = v.getSharedPluginData(SYNC_NAMESPACE, SYNC_VALUES_KEY)
      if (!raw) continue
      try {
        for (const [where, key] of Object.entries(JSON.parse(raw) as Record<string, string>)) {
          const [collection, mode] = where.split('|')
          values[valueId(collection, v.name, mode)] = key
        }
      } catch {
        // A damaged note: that variable counts as new.
      }
    }
  return { base, values, rebound: base ? rebound : [] }
}

/** After an apply: notes what every variable now holds and each variant's bindings, and what it was synced to. */
async function rememberSync(cs: ChangeSet, notApplied: PlanItem[]) {
  const variables = await figma.variables.getLocalVariablesAsync()
  const exp = await exportVariables()
  const held = new Map<string, Set<string>>()
  for (const i of notApplied) if (i.holds) held.set(i.holds.varId, (held.get(i.holds.varId) ?? new Set()).add(i.holds.where))
  const notes = new Map<string, Record<string, string>>()
  for (const fv of fileValues(exp)) {
    const note = notes.get(fv.varId) ?? {}
    note[`${fv.collection}|${fv.mode}`] = valueKey(fv.value)
    notes.set(fv.varId, note)
  }
  for (const v of variables) {
    const note = notes.get(v.id) ?? {}
    const keep = held.get(v.id)
    if (keep) {
      let before: Record<string, string> = {}
      try {
        before = JSON.parse(v.getSharedPluginData(SYNC_NAMESPACE, SYNC_VALUES_KEY) || '{}') as Record<string, string>
      } catch {
        before = {}
      }
      // No earlier note: drop it, so the value reads as new rather than synced.
      for (const where of keep) {
        if (before[where] !== undefined) note[where] = before[where]
        else delete note[where]
      }
    }
    v.setSharedPluginData(SYNC_NAMESPACE, SYNC_VALUES_KEY, JSON.stringify(note))
  }
  await scanComponents(variables, true, new Set(notApplied.map((i) => i.holdsComponent).filter((c): c is string => Boolean(c))))
  const base: SyncBase = { syncedAt: new Date().toISOString(), source: cs.source, ...(cs.version ? { version: cs.version } : {}) }
  figma.root.setSharedPluginData(SYNC_NAMESPACE, SYNC_ROOT_KEY, JSON.stringify(base))
}

/* ------------------------------------------------------------ anatomy */

async function componentSets() {
  await figma.loadAllPagesAsync()
  return figma.root.findAllWithCriteria({ types: ['COMPONENT_SET'] })
}

/**
 * Every component set, with every variant's bound variables, layer by layer. Components bind
 * semantic tokens and only get component tokens as overrides, so a set without any is still
 * scanned (the parity check and the configurator need its anatomy).
 */
async function scanComponents(variables: Variable[], remember = false, keepSets: Set<string> = new Set()): Promise<{ anatomy: ComponentAnatomy[]; rebound: string[] }> {
  const nameById = new Map(variables.map((v) => [v.id, v.name]))
  // Styles are recorded by name: text styles as-is ('Body/MD'), effect styles as their token path
  // ('Shadow/Focus Ring/Primary' → 'effect/shadow/focus-ring/primary'), like the component specs.
  const textStyleName = new Map((await figma.getLocalTextStylesAsync()).map((s) => [s.id, s.name]))
  const effectToken = new Map(
    (await figma.getLocalEffectStylesAsync()).map((s) => [s.id, `effect/${s.name.trim().toLowerCase().replace(/\s+/g, '-')}`]),
  )
  const FONT_FIELDS = ['fontSize', 'lineHeight', 'fontWeight', 'fontFamily', 'letterSpacing']
  const out: ComponentAnatomy[] = []
  /** Variants whose bindings differ from the last sync's fingerprint. */
  const rebound: string[] = []
  for (const set of await componentSets()) {
    const axes: Record<string, string[]> = {}
    for (const [key, def] of Object.entries(set.componentPropertyDefinitions)) {
      if (def.type === 'VARIANT') axes[key] = [...(def.variantOptions ?? [])]
    }
    const variants: ComponentAnatomy['variants'] = []
    for (const variant of set.children) {
      if (variant.type !== 'COMPONENT') continue
      const bindings: AnatomyBinding[] = []
      const walk = (n: SceneNode, layer: string) => {
        const bound = (n as { boundVariables?: Record<string, VariableAlias | VariableAlias[]> }).boundVariables ?? {}
        for (const [field, value] of Object.entries(bound)) {
          if (field === 'fills' || field === 'strokes' || field === 'componentProperties' || field === 'effects') continue
          // Font fields bound through a text style belong to the style, not the layer.
          const styled = n.type === 'TEXT' && typeof n.textStyleId === 'string' && n.textStyleId !== ''
          if (styled && FONT_FIELDS.includes(field)) continue
          for (const a of Array.isArray(value) ? value : [value]) {
            const name = a && nameById.get(a.id)
            if (name) bindings.push({ layer, nodeType: n.type, field, variable: name })
          }
        }
        for (const field of ['fills', 'strokes'] as const) {
          const paints = (n as unknown as Record<string, unknown>)[field]
          if (!Array.isArray(paints)) continue
          for (const p of paints as Paint[]) {
            const id = p.type === 'SOLID' ? p.boundVariables?.color?.id : undefined
            const name = id && nameById.get(id)
            if (name) bindings.push({ layer, nodeType: n.type, field, variable: name })
          }
        }
        const effect = 'effectStyleId' in n && typeof n.effectStyleId === 'string' ? effectToken.get(n.effectStyleId) : undefined
        if (effect) bindings.push({ layer, nodeType: n.type, field: 'effectStyle', variable: effect })
        const text = n.type === 'TEXT' && typeof n.textStyleId === 'string' ? textStyleName.get(n.textStyleId) : undefined
        if (text) bindings.push({ layer, nodeType: n.type, field: 'textStyle', variable: text })
        if ('children' in n) for (const c of n.children) walk(c, layer ? `${layer} › ${c.name}` : c.name)
      }
      walk(variant, '')
      const props = { ...(variant.variantProperties ?? {}) }
      variants.push({ props, bindings })
      const hash = bindingsHash(bindings)
      // A set with an override left unapplied keeps its earlier fingerprints.
      if (remember) {
        if (!keepSets.has(set.name)) variant.setSharedPluginData(SYNC_NAMESPACE, SYNC_BINDINGS_KEY, hash)
      }
      else {
        const was = variant.getSharedPluginData(SYNC_NAMESPACE, SYNC_BINDINGS_KEY)
        if (was && was !== hash) rebound.push(variantKey(set.name, props))
      }
    }
    out.push({ name: set.name, axes, variants })
  }
  return { anatomy: out, rebound }
}

/** Nodes at a layer path inside a variant ("" = the variant). Same-named siblings all match. */
function nodesAt(root: SceneNode, layer: string): SceneNode[] {
  if (!layer) return [root]
  let level: SceneNode[] = [root]
  for (const name of layer.split(' › ')) {
    const next: SceneNode[] = []
    for (const n of level) if ('children' in n) for (const c of n.children) if (c.name === name) next.push(c)
    level = next
  }
  return level
}

const PAINT_FIELDS = new Set(['fills', 'strokes'])

/** Variable id a layer property is bound to (first paint / first text range). */
function boundId(node: SceneNode, field: string): string | undefined {
  if (PAINT_FIELDS.has(field)) {
    const paints = (node as unknown as Record<string, unknown>)[field]
    if (!Array.isArray(paints)) return undefined
    const solid = (paints as Paint[]).find((p) => p.type === 'SOLID') as SolidPaint | undefined
    return solid?.boundVariables?.color?.id
  }
  const value = ((node as { boundVariables?: Record<string, VariableAlias | VariableAlias[]> }).boundVariables ?? {})[field]
  return (Array.isArray(value) ? value[0] : value)?.id
}

async function bindField(node: SceneNode, field: string, variable: Variable) {
  if (PAINT_FIELDS.has(field)) {
    const target = node as GeometryMixin
    const paints = target[field as 'fills' | 'strokes']
    if (!Array.isArray(paints)) return
    const next = (paints as Paint[]).map((p) => (p.type === 'SOLID' ? figma.variables.setBoundVariableForPaint(p, 'color', variable) : p))
    if (field === 'fills') target.fills = next
    else target.strokes = next
    return
  }
  if (node.type === 'TEXT') {
    const fonts = node.characters.length ? node.getRangeAllFontNames(0, node.characters.length) : []
    await Promise.all(fonts.map((f) => figma.loadFontAsync(f)))
  }
  ;(node as SceneNode & { setBoundVariable(field: string, variable: Variable | null): void }).setBoundVariable(field, variable)
}

/* ------------------------------------------------------------- planning */

type Action = 'create' | 'update' | 'skip' | 'error'

interface PlanItem {
  id: number
  group: 'Modes' | 'Brands' | 'Primitives' | 'Values' | 'Components' | 'Cleanup'
  action: Action | 'remove'
  label: string
  detail: string
  reason?: string
  apply?: () => Promise<void>
  /** A value this item sets ("<variable id>" and "<collection>|<mode>" as the memory notes it). */
  holds?: { varId: string; where: string }
  /** A component set this item rebinds. */
  holdsComponent?: string
}

let plan: PlanItem[] = []
/** The change set the plan came from (remembered as the last sync once applied). */
let planSource: ChangeSet | null = null

function parseColor(input: string): RGBA | null {
  const s = input.trim()
  const hex = s.match(/^#([0-9a-f]{3,8})$/i)
  if (hex) {
    let h = hex[1]
    if (h.length === 3) h = h.split('').map((c) => c + c).join('')
    const n = (i: number) => parseInt(h.slice(i, i + 2), 16) / 255
    return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) : 1 }
  }
  const rgb = s.match(/^rgba?\(([^)]+)\)$/i)
  if (rgb) {
    const [r, g, b, a = '1'] = rgb[1].split(/[\s,/]+/).filter(Boolean)
    return { r: +r / 255, g: +g / 255, b: +b / 255, a: +a }
  }
  return null
}

const hex2 = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0')
function colorText(c: RGB | RGBA) {
  const a = 'a' in c ? c.a : 1
  return `#${hex2(c.r)}${hex2(c.g)}${hex2(c.b)}${a < 1 ? hex2(a) : ''}`
}

async function describe(value: VariableValue | undefined): Promise<string> {
  if (value === undefined) return '—'
  if (typeof value === 'object' && value !== null && 'type' in value && value.type === 'VARIABLE_ALIAS') {
    const t = await figma.variables.getVariableByIdAsync(value.id)
    return t ? `→ ${t.name}` : '→ (missing)'
  }
  if (typeof value === 'object' && value !== null && 'r' in value) return colorText(value)
  if (typeof value === 'object' && value !== null && 'color' in value) {
    const c = value as { color: VariableAlias; opacity?: VariableAlias }
    const base = await describe(c.color as VariableValue)
    const op = c.opacity !== undefined && c.opacity !== null ? await describe(c.opacity as VariableValue) : ''
    return `${base}${op !== '' ? ` · ${op.replace(/^→ /, '')}` : ''}`
  }
  return String(value)
}

function sameLiteral(a: VariableValue | undefined, b: VariableValue) {
  if (typeof a === 'object' && a && 'r' in a && typeof b === 'object' && b && 'r' in b) {
    return colorText(a) === colorText(b)
  }
  return JSON.stringify(a) === JSON.stringify(b)
}

async function buildPlan(cs: ChangeSet): Promise<PlanItem[]> {
  const collections = await figma.variables.getLocalVariableCollectionsAsync()
  const variables = await figma.variables.getLocalVariablesAsync()
  const colByName = new Map(collections.map((c) => [c.name, c]))
  const varKey = (colId: string, name: string) => `${colId}::${name}`
  const varByKey = new Map(variables.map((v) => [varKey(v.variableCollectionId, v.name), v]))
  const varsByName = new Map<string, Variable[]>()
  for (const v of variables) varsByName.set(v.name, [...(varsByName.get(v.name) ?? []), v])

  /** Extensions hold the parent's variables; resolve to the collection that owns them. */
  const owner = (c: VariableCollection) =>
    (c as { parentVariableCollectionId?: string }).parentVariableCollectionId ?? c.id

  const items: PlanItem[] = []
  let id = 0
  // Primitives created in this run, so values can alias them before they exist.
  const pending = new Map<string, () => Variable | undefined>()
  const findVar = (name: string) => {
    const found = varsByName.get(name)?.[0]
    if (found) return () => found
    return pending.get(name)
  }

  /* ---- modes: the system's modes on the semantic collection (brand extensions follow it) */
  const semantic = colByName.get('semantic')
  /** Modes this import adds, by lower-case name: values for them resolve once they exist. */
  const addedModes = new Set<string>()
  if (cs.modes?.length && semantic) {
    const wanted = cs.modes.map((m) => m.toLowerCase())
    for (const name of cs.modes) {
      if (semantic.modes.some((m) => m.name.toLowerCase() === name.toLowerCase())) continue
      addedModes.add(name.toLowerCase())
      items.push({
        id: id++,
        group: 'Modes',
        action: 'create',
        label: `Mode “${name}”`,
        detail: `Add to ${semantic.name}. It starts as a copy of ${semantic.modes[0].name}, and the values below fill it in.`,
        apply: async () => {
          semantic.addMode(name)
        },
      })
    }
    for (const m of semantic.modes) {
      if (wanted.includes(m.name.toLowerCase())) continue
      items.push({
        id: id++,
        group: 'Modes',
        action: 'remove',
        label: `Mode “${m.name}”`,
        detail: `The system doesn’t use it. Removes it from ${semantic.name} and its brand extensions, with its values. The version saved before the import keeps them.`,
        apply: async () => semantic.removeMode(m.modeId),
      })
    }
    const base = cs.modes[0]
    const first = semantic.modes.find((m) => m.modeId === semantic.defaultModeId)
    if (cs.modes.length > 1 && first && first.name.toLowerCase() !== base.toLowerCase()) {
      items.push({
        id: id++,
        group: 'Modes',
        action: 'skip',
        label: `${base} first`,
        detail: `The system is designed in ${base} first. Plugins can’t change Figma’s default mode: in the Variables panel, drag the ${base} column to the first place.`,
      })
    }
  }
  const modeIn = (col: VariableCollection, name: string) => col.modes.find((m) => m.name.toLowerCase() === name.toLowerCase())

  /* ---- brands: the system's extra brands, as collections extending the semantic one */
  /** Brand collections this import creates: values for them resolve once they exist. */
  const addedBrands = new Set<string>()
  /** "Gold Brand" and "Gold" are the same brand. */
  const slug = (name: string) => name.replace(/\s*brand\s*/i, '').trim().toLowerCase().replace(/\s+/g, '-')
  if (cs.brands && semantic) {
    const brandCols = collections.filter((c) => (c as { parentVariableCollectionId?: string }).parentVariableCollectionId === semantic.id)
    // A collection of the same brand under another name: rename it, keeping its values and layers.
    const renamed = new Set<VariableCollection>()
    for (const name of cs.brands) {
      if (brandCols.some((c) => c.name === name)) continue
      const same = brandCols.find((c) => !renamed.has(c) && !cs.brands!.includes(c.name) && slug(c.name) === slug(name))
      if (same) {
        renamed.add(same)
        const from = same.name
        colByName.set(name, same)
        items.push({
          id: id++,
          group: 'Brands',
          action: 'update',
          label: `Brand “${name}”`,
          detail: `Renames “${from}” to “${name}”, keeping its values and the layers that use it.`,
          apply: async () => {
            same.name = name
          },
        })
        continue
      }
      addedBrands.add(name)
      items.push({
        id: id++,
        group: 'Brands',
        action: 'create',
        label: `Brand “${name}”`,
        detail: `A new collection extending ${semantic.name}. It starts as a copy, and the values below make it ${name}.`,
        apply: async () => {
          semantic.extend(name)
        },
      })
    }
    for (const c of brandCols) {
      if (cs.brands.includes(c.name) || renamed.has(c)) continue
      items.push({
        id: id++,
        group: 'Brands',
        action: 'remove',
        label: `Brand “${c.name}”`,
        detail: `The system doesn’t have this brand. Removes the collection and its values. The version saved before the import keeps them.`,
        apply: async () => c.remove(),
      })
    }
  }

  for (const p of cs.primitives) {
    const col = colByName.get(p.collection)
    if (!col) {
      items.push({ id: id++, group: 'Primitives', action: 'error', label: p.name, detail: `The file has no “${p.collection}” collection` })
      continue
    }
    if (typeof p.value === 'object') {
      // Linked alpha: base color + opacity primitive (either may be created earlier in this run).
      const link = p.value
      const base = findVar(link.alias)
      const opacity = findVar(link.opacity)
      if (!base || !opacity) {
        items.push({ id: id++, group: 'Primitives', action: 'error', label: p.name, detail: `Needs ${!base ? link.alias : link.opacity}, which is missing` })
        continue
      }
      const existing = varByKey.get(varKey(col.id, p.name))
      const mode = col.defaultModeId
      const detail = `→ ${link.alias} · ${link.opacity}`
      if (existing && (await describe(existing.valuesByMode[mode])) === `→ ${link.alias} · ${link.opacity}`) {
        items.push({ id: id++, group: 'Primitives', action: 'skip', label: p.name, detail: 'Already up to date' })
        continue
      }
      let created: Variable | undefined = existing
      if (!existing) pending.set(p.name, () => created)
      items.push({
        id: id++,
        group: 'Primitives',
        action: existing ? 'update' : 'create',
        label: p.name,
        detail: existing ? `${await describe(existing.valuesByMode[mode])}  →  ${detail.replace(/^→ /, '')}` : `New color ${detail}`,
        apply: async () => {
          const b = base()
          const o = opacity()
          if (!b || !o) throw new Error('linked base or opacity was not created')
          if (!created) {
            created = figma.variables.createVariable(p.name, col, 'COLOR')
            if (p.description) created.description = p.description
            created.scopes = [...b.scopes]
          }
          const value = { color: figma.variables.createVariableAlias(b), opacity: figma.variables.createVariableAlias(o) }
          created.setValueForMode(mode, value as unknown as VariableValue)
        },
      })
      continue
    }
    const value = p.type === 'COLOR' ? parseColor(String(p.value)) : p.value
    if (value === null) {
      items.push({ id: id++, group: 'Primitives', action: 'error', label: p.name, detail: `Invalid color ${p.value}` })
      continue
    }
    const existing = varByKey.get(varKey(col.id, p.name))
    const mode = col.defaultModeId
    if (existing) {
      const current = existing.valuesByMode[mode]
      if (sameLiteral(current, value as VariableValue)) {
        items.push({ id: id++, group: 'Primitives', action: 'skip', label: p.name, detail: 'Already up to date' })
        continue
      }
      items.push({
        id: id++,
        group: 'Primitives',
        action: 'update',
        label: p.name,
        detail: `${await describe(current)}  →  ${p.value}`,
        apply: async () => existing.setValueForMode(mode, value as VariableValue),
      })
      continue
    }
    let created: Variable | undefined
    pending.set(p.name, () => created)
    items.push({
      id: id++,
      group: 'Primitives',
      action: 'create',
      label: p.name,
      detail: `New ${p.type.toLowerCase()} ${p.value} in ${p.collection}`,
      apply: async () => {
        created = figma.variables.createVariable(p.name, col, p.type)
        created.setValueForMode(mode, value as VariableValue)
        if (p.description) created.description = p.description
        // Match the scopes of a sibling in the same group, if any.
        const group = p.name.slice(0, p.name.lastIndexOf('/'))
        const sibling = variables.find((v) => v.variableCollectionId === col.id && v.name.startsWith(`${group}/`))
        if (sibling) created.scopes = [...sibling.scopes]
      },
    })
  }

  /** variable id | mode id → alias name it will point at after this import (null = literal). */
  const plannedRefs = new Map<string, string | null>()

  const resolveAlias = (v: { alias: string; collection?: string }) => {
    if (v.collection) {
      const col = colByName.get(v.collection)
      const found = col && varByKey.get(varKey(owner(col), v.alias))
      if (found) return () => found
    }
    const found = varsByName.get(v.alias)?.[0]
    if (found) return () => found
    return pending.get(v.alias)
  }

  /**
   * What a change sets: its text (as describe() writes the current value, to spot no-ops) and how to
   * make it. Aliases may carry an opacity (Figma's color + opacity composite).
   */
  const plannedValue = (value: ChangeValue, type: string): { text: string; make: () => VariableValue | null } | { error: string } => {
    if (typeof value === 'object') {
      const get = resolveAlias(value)
      if (!get) return { error: `Alias target "${value.alias}" not found` }
      if (value.opacity === undefined) {
        return {
          text: `→ ${value.alias}`,
          make: () => {
            const v = get()
            return v ? figma.variables.createVariableAlias(v) : null
          },
        }
      }
      const op = value.opacity
      const getOp = typeof op === 'string' ? (resolveAlias({ alias: op, collection: 'primitives' }) ?? findVar(op)) : undefined
      if (typeof op === 'string' && !getOp) return { error: `Opacity "${op}" not found` }
      return {
        text: `→ ${value.alias} · ${op}`,
        make: () => {
          const v = get()
          const o = getOp ? getOp() : undefined
          if (!v || (getOp && !o)) return null
          return { color: figma.variables.createVariableAlias(v), opacity: o ? figma.variables.createVariableAlias(o) : op } as unknown as VariableValue
        },
      }
    }
    if (type === 'COLOR') {
      const color = parseColor(String(value))
      if (!color) return { error: `Invalid color ${value}` }
      return { text: String(value), make: () => color }
    }
    return { text: String(value), make: () => value as VariableValue }
  }

  /** A brand collection by its name, or by the same brand under another name (older changes files say "Gold Brand"). */
  const brandCol = (name: string) =>
    colByName.get(name) ??
    [...colByName.entries()].find(([n, x]) => semantic && x !== semantic && owner(x) === semantic.id && slug(n) === slug(name))?.[1]
  for (const c of cs.values) {
    const label = `${c.variable} · ${c.mode}${c.collection !== 'semantic' ? ` · ${c.collection}` : ''}`
    const col = brandCol(c.collection)
    const addedAs = !col ? [...addedBrands].find((n) => slug(n) === slug(c.collection)) : undefined
    const target = col && varByKey.get(varKey(owner(col), c.variable))
    const mode = col ? modeIn(col, c.mode) : undefined
    const later = !col && semantic && addedAs ? 'brand' : col && target && !mode && addedModes.has(c.mode.toLowerCase()) ? 'mode' : null
    if (later) {
      // A brand or mode this import creates (they run first): set the value once it exists.
      const variable = later === 'brand' ? varByKey.get(varKey(semantic!.id, c.variable)) : target
      if (!variable) {
        items.push({ id: id++, group: 'Values', action: 'error', label, detail: 'Variable not found', reason: c.reason })
        continue
      }
      const planned = plannedValue(c.value, variable.resolvedType)
      if ('error' in planned) {
        items.push({ id: id++, group: 'Values', action: 'error', label, detail: planned.error, reason: c.reason })
        continue
      }
      items.push({
        id: id++,
        group: 'Values',
        action: 'update',
        label,
        detail: `New ${later}  →  ${planned.text.replace(/^→ /, '')}`,
        reason: c.reason,
        apply: async () => {
          const fresh =
            later === 'brand'
              ? (await figma.variables.getLocalVariableCollectionsAsync()).find((x) => x.name === addedAs)
              : ((await figma.variables.getVariableCollectionByIdAsync(col!.id)) ?? col)
          const m = fresh ? modeIn(fresh, c.mode) : undefined
          if (!fresh || !m) throw new Error(`${later} ${later === 'brand' ? addedAs : c.mode} was not created`)
          const next = planned.make()
          if (next === null) throw new Error('value could not be resolved')
          variable.setValueForMode(m.modeId, next)
        },
      })
      continue
    }
    if (!col || !target || !mode) {
      const why = !col
        ? `The file has no “${c.collection}” collection, so they stay as they are. Download the changes again from the configurator`
        : !target
          ? `The file has no variable with this name`
          : `The file has no “${c.mode}” mode in ${c.collection}`
      items.push({ id: id++, group: 'Values', action: 'error', label, detail: why, reason: c.reason })
      continue
    }
    const isExt = Boolean((col as { isExtension?: boolean }).isExtension)
    const overrides = (col as { variableOverrides?: Record<string, Record<string, VariableValue>> }).variableOverrides
    // A brand without its own value shows the main brand's, which this import may change: it only
    // counts as up to date when it holds the value itself.
    const own = isExt ? overrides?.[target.id]?.[mode.modeId] : undefined
    const current = isExt ? (own ?? target.valuesByMode[(mode as { parentModeId?: string }).parentModeId ?? '']) : target.valuesByMode[mode.modeId]
    const currentText = await describe(current)

    const planned = plannedValue(c.value, target.resolvedType)
    if ('error' in planned) {
      items.push({ id: id++, group: 'Values', action: 'error', label, detail: planned.error, reason: c.reason })
      continue
    }
    const nextText = planned.text
    const make = planned.make
    const inherits = isExt && own === undefined
    if (currentText === nextText && !inherits) {
      items.push({ id: id++, group: 'Values', action: 'skip', label, detail: 'Already up to date', reason: c.reason })
      continue
    }
    plannedRefs.set(`${target.id}|${mode.modeId}`, typeof c.value === 'object' ? c.value.alias : null)
    const colKey = collectionKey({ name: col.name, isExtension: isExt, parentVariableCollectionId: (col as { parentVariableCollectionId?: string }).parentVariableCollectionId }, semantic?.id)
    items.push({
      id: id++,
      group: 'Values',
      action: 'update',
      holds: { varId: target.id, where: `${colKey}|${modeKey(colKey, col.modes.length, mode.name)}` },
      label,
      detail: inherits && currentText === nextText ? `Its own value (now follows the main brand): ${nextText.replace(/^→ /, '')}` : `${currentText}  →  ${nextText.replace(/^→ /, '')}`,
      reason: c.reason,
      apply: async () => {
        const value = make()
        if (value === null) throw new Error('alias target was not created')
        target.setValueForMode(mode.modeId, value)
      },
    })
  }
  /* ---- component overrides: create/update the component token, then bind the matching layers */
  const overrides = cs.components ?? []
  const sets = overrides.length ? await componentSets() : []
  const textStyles = overrides.some((o) => o.kind === 'text-style') ? await figma.getLocalTextStylesAsync() : []
  for (const o of overrides) {
    const label = `${o.token}`
    if (o.kind === 'text-style') {
      // A text style isn't a variable: switch the matching layers from the old style to the new one.
      const style = textStyles.find((s) => s.name === o.alias)
      const set = sets.find((x) => x.name === o.component)
      if (!style || !set) {
        items.push({ id: id++, group: 'Components', action: 'error', label, detail: !style ? `Text style "${o.alias}" not found` : `Component "${o.component}" not found`, reason: o.reason })
        continue
      }
      const from = new Set(textStyles.filter((s) => o.from.includes(s.name)).map((s) => s.id))
      const variants = set.children.filter(
        (v): v is ComponentNode =>
          v.type === 'COMPONENT' && Object.entries(o.variants).every(([k, val]) => (v.variantProperties ?? {})[k] === undefined || (v.variantProperties ?? {})[k] === val),
      )
      const nodes: TextNode[] = []
      for (const v of variants) for (const l of o.layers) for (const node of nodesAt(v, l.layer)) if (node.type === 'TEXT' && typeof node.textStyleId === 'string' && from.has(node.textStyleId)) nodes.push(node)
      if (!nodes.length) {
        items.push({ id: id++, group: 'Components', action: 'skip', label, detail: 'No layers use the replaced style (already switched?)', reason: o.reason })
        continue
      }
      items.push({
        id: id++,
        group: 'Components',
        action: 'update',
        holdsComponent: o.component,
        label,
        detail: `Text style ${o.from.join(', ')} → ${o.alias} · ${nodes.length} layer${nodes.length === 1 ? '' : 's'} in ${variants.length} variant${variants.length === 1 ? '' : 's'}`,
        reason: o.reason,
        apply: async () => {
          await figma.loadFontAsync(style.fontName)
          for (const n of nodes) await n.setTextStyleIdAsync(style.id)
        },
      })
      continue
    }
    const col = colByName.get(o.collection)
    // Prefer the semantic token over a same-named variable elsewhere.
    const aliasVar = (varsByName.get(o.alias) ?? []).sort((a, b) => Number(a.variableCollectionId === col?.id) - Number(b.variableCollectionId === col?.id))[0]
    const set = sets.find((x) => x.name === o.component)
    const why = !col
      ? `Collection "${o.collection}" not found`
      : !aliasVar
        ? `Token "${o.alias}" not found`
        : !set
          ? `Component "${o.component}" not found`
          : null
    if (why || !col || !aliasVar || !set) {
      items.push({ id: id++, group: 'Components', action: 'error', label, detail: why ?? '', reason: o.reason })
      continue
    }
    const variants = set.children.filter(
      (v): v is ComponentNode =>
        v.type === 'COMPONENT' && Object.entries(o.variants).every(([k, val]) => (v.variantProperties ?? {})[k] === undefined || (v.variantProperties ?? {})[k] === val),
    )
    const targets: { node: SceneNode; field: string }[] = []
    for (const v of variants) for (const l of o.layers) for (const node of nodesAt(v, l.layer)) for (const field of l.fields) targets.push({ node, field })
    if (!targets.length) {
      items.push({ id: id++, group: 'Components', action: 'error', label, detail: `No matching layers in ${o.component}`, reason: o.reason })
      continue
    }
    const existing = varByKey.get(varKey(col.id, o.token))
    const modes = col.modes.map((m) => m.modeId)
    const valueOk = Boolean(existing) && (await Promise.all(modes.map((m) => describe(existing!.valuesByMode[m])))).every((d) => d === `→ ${o.alias}`)
    // Only properties bound to what the override replaces; hand-set or differently bound ones stay.
    const fromIds = new Set(o.from.map((n) => (varsByName.get(n) ?? []).map((v) => v.id)).reduce((a, b) => a.concat(b), [] as string[]))
    const toBind = targets.filter((t) => {
      const id = boundId(t.node, t.field)
      return id !== undefined && fromIds.has(id) && (!existing || id !== existing.id)
    })
    if (valueOk && !toBind.length) {
      items.push({ id: id++, group: 'Components', action: 'skip', label, detail: 'Already up to date', reason: o.reason })
      continue
    }
    const parts = [`${existing ? (valueOk ? 'Token unchanged' : 'Token') : 'New token'} → ${o.alias}`]
    if (toBind.length) parts.push(`bind ${toBind.length} layer propert${toBind.length === 1 ? 'y' : 'ies'} in ${variants.length} variant${variants.length === 1 ? '' : 's'}`)
    if (o.from.length) parts.push(`was ${o.from.join(', ')}`)
    items.push({
      id: id++,
      group: 'Components',
      action: existing ? 'update' : 'create',
      holdsComponent: o.component,
      label,
      detail: parts.join(' · '),
      reason: o.reason,
      apply: async () => {
        let token = existing
        if (!token) {
          token = figma.variables.createVariable(o.token, col, o.type)
          token.scopes = [...aliasVar.scopes]
          token.description = `${OVERRIDE_MARKER}${o.from.length ? ` (was ${o.from.join(', ')})` : ''}`
        }
        for (const m of modes) token.setValueForMode(m, figma.variables.createVariableAlias(aliasVar))
        for (const t of toBind) await bindField(t.node, t.field, token)
      },
    })
  }

  /* ---- cleanup: generated primitives nothing will reference after this import */
  const referenced = new Set<string>()
  const refName = (val: VariableValue | undefined) => {
    if (val && typeof val === 'object') {
      if ('type' in val && val.type === 'VARIABLE_ALIAS') {
        const t = variables.find((x) => x.id === val.id)
        if (t) referenced.add(t.name)
      } else if ('color' in val) {
        refName((val as { color: VariableValue }).color)
        refName((val as { opacity?: VariableValue }).opacity)
      }
    }
  }
  for (const v of variables) {
    for (const [modeId, val] of Object.entries(v.valuesByMode)) {
      const key = `${v.id}|${modeId}`
      if (plannedRefs.has(key)) {
        const next = plannedRefs.get(key)
        if (next) referenced.add(next)
      } else refName(val)
    }
  }
  for (const c of collections) {
    const overrides = (c as { variableOverrides?: Record<string, Record<string, VariableValue>> }).variableOverrides ?? {}
    for (const [vid, byMode] of Object.entries(overrides)) {
      for (const [modeId, val] of Object.entries(byMode)) {
        const key = `${vid}|${modeId}`
        if (plannedRefs.has(key)) {
          const next = plannedRefs.get(key)
          if (next) referenced.add(next)
        } else refName(val)
      }
    }
  }
  for (const p of cs.primitives) {
    if (typeof p.value === 'object') {
      referenced.add(p.value.alias)
      referenced.add(p.value.opacity)
    }
  }
  // Everything the change set's values point at (colors and the opacity of composites) stays.
  for (const c of cs.values) {
    if (typeof c.value !== 'object') continue
    referenced.add(c.value.alias)
    if (typeof c.value.opacity === 'string') referenced.add(c.value.opacity)
  }
  const createdHere = new Set(cs.primitives.map((p) => p.name))
  for (const v of variables) {
    if (!(v.description ?? '').includes(GENERATED_MARKER) || referenced.has(v.name) || createdHere.has(v.name)) continue
    items.push({
      id: id++,
      group: 'Cleanup',
      action: 'remove',
      label: v.name,
      detail: 'Generated earlier, no longer used — remove',
      apply: async () => v.remove(),
    })
  }
  return items
}

/* ---------------------------------------------------------------- apply */

async function applyPlan(selected: number[]) {
  const chosen = new Set(selected)
  const todo = plan.filter((i) => chosen.has(i.id) && i.apply)
  await figma.saveVersionHistoryAsync('Before DS Configurator import', `${todo.length} change(s) from the configurator`)
  const failures: { label: string; error: string }[] = []
  let done = 0
  // Modes and brands first (so values for them have somewhere to go), then primitives (so aliases
  // resolve), values, component overrides, and cleanup of unused generated primitives.
  const order: PlanItem['group'][] = ['Modes', 'Brands', 'Primitives', 'Values', 'Components', 'Cleanup']
  const ordered = order.reduce<PlanItem[]>((all, g) => all.concat(todo.filter((i) => i.group === g)), [])
  const applied = new Set<number>()
  for (const item of ordered) {
    try {
      await item.apply!()
      applied.add(item.id)
      done++
    } catch (e) {
      failures.push({ label: item.label, error: e instanceof Error ? e.message : String(e) })
    }
  }
  // Changes left unticked or failed: Figma still holds its own value there, which must not pass for synced.
  const notApplied = plan.filter((i) => i.apply && !applied.has(i.id))
  return { done, failures, notApplied }
}

/* ------------------------------------------------------------- messages */

figma.ui.onmessage = async (msg: { type: string; changeset?: ChangeSet; selected?: number[] }) => {
  try {
    if (msg.type === 'export') {
      const data = await exportVariables()
      figma.ui.postMessage({ type: 'export-result', data })
    } else if (msg.type === 'preview' && msg.changeset) {
      if (msg.changeset.format !== CHANGESET_FORMAT) throw new Error(`Not a configurator change set (expected ${CHANGESET_FORMAT})`)
      plan = await buildPlan(msg.changeset)
      planSource = msg.changeset
      figma.ui.postMessage({
        type: 'preview-result',
        source: msg.changeset.source,
        items: plan.map(({ apply: _apply, ...rest }) => rest),
      })
    } else if (msg.type === 'apply') {
      const { notApplied, ...result } = await applyPlan(msg.selected ?? [])
      // Remember what the file now holds, so the next export can say what changed in Figma since.
      // What wasn't applied keeps its earlier note (an edit made in Figma stays an edit).
      if (planSource && result.done) await rememberSync(planSource, notApplied)
      figma.ui.postMessage({ type: 'apply-result', ...result })
      figma.notify(`DS Configurator: ${result.done} change(s) applied${result.failures.length ? `, ${result.failures.length} failed` : ''}`)
    } else if (msg.type === 'close') {
      figma.closePlugin()
    }
  } catch (e) {
    figma.ui.postMessage({ type: 'error', message: e instanceof Error ? e.message : String(e) })
  }
}

