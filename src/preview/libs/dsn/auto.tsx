// Loads a DSN component by its folder and renders it with sample props: hand-written samples where
// the component needs data, a heuristic from the registry props otherwise.

import type { ComponentType, ReactNode } from 'react'
import type { RegistryEntry } from '@/library/generated/registry.types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyComponent = ComponentType<any>
export type Mods = Record<string, AnyComponent>

const modules = import.meta.glob('@dsn/components/**/index.ts') as Record<string, () => Promise<Record<string, unknown>>>

/** `src/components/atoms/Button/Button.tsx` → the folder barrel's loader. */
export function folderLoader(importPath: string) {
  const folder = importPath.replace(/\/[^/]+$/, '')
  const key = Object.keys(modules).find((k) => k.endsWith(`/${folder}/index.ts`))
  return key ? modules[key] : undefined
}

/** Loads every export of a component folder as a component map. */
export async function loadFolder(importPath: string): Promise<Mods> {
  const loader = folderLoader(importPath)
  if (!loader) throw new Error(`No module for ${importPath}`)
  const mod = await loader()
  const out: Mods = {}
  for (const [k, v] of Object.entries(mod)) if (typeof v === 'function' || (v && typeof v === 'object')) out[k] = v as AnyComponent
  return out
}

const TEXT: Record<string, string> = {
  label: 'Label',
  title: 'Title',
  description: 'A short description of what this does.',
  placeholder: 'Type here…',
  helperText: 'Helper text',
  legend: 'Group',
  name: 'Lena Hartmann',
  initials: 'LH',
  fileName: 'brand-guidelines.pdf',
  fileSize: '2.4 MB',
  content: 'Tooltip text',
  subtitle: 'Nothing here yet.',
  message: 'Are you sure?',
  value: 'Value',
  timeLabel: '2 min ago',
}

/** Sample props from the registry: first enum value, text for strings, nothing for callbacks and data. */
export function heuristicProps(entry: RegistryEntry): Record<string, unknown> {
  const p: Record<string, unknown> = {}
  for (const prop of entry.props) {
    if (prop.name.startsWith('on') || prop.name === 'className' || prop.name.startsWith('aria')) continue
    if (prop.values && prop.values.length) {
      p[prop.name] = prop.values[0]
      continue
    }
    const t = prop.type.replace(/\s/g, '')
    if (t === 'string') {
      if (prop.required || prop.name in TEXT) p[prop.name] = TEXT[prop.name] ?? entry.sourceName
    } else if (t === 'number') {
      if (/value|page|progress|count/i.test(prop.name)) p[prop.name] = 42
      else if (/total|max|length/i.test(prop.name)) p[prop.name] = 100
    } else if (t === 'boolean') {
      if (/^show(Label|Content|Header|Title|Description)$/.test(prop.name) || prop.name === 'hasTitle' || prop.name === 'hasIcon') p[prop.name] = true
    }
  }
  if (entry.props.some((x) => x.name === 'children') && !('children' in p)) p.children = entry.sourceName
  return p
}

export interface Sample {
  render: (M: Mods, props: Record<string, unknown>, emit: (name: string, detail?: unknown) => void) => ReactNode
  /** Extra folders to load (by their first component's import path) when the sample composes other components. */
  also?: string[]
  block?: boolean
  minHeight?: number
}
