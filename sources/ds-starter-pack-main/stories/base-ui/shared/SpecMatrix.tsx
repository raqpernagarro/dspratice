import type { CSSProperties, ReactNode } from 'react'

import { combos, figmaProps, variantsOf, type ComponentSpec, type VariantValues } from '../spec'

export interface SpecMatrixProps {
  spec: ComponentSpec
  /** Renders the coded component in one variant (code values: { type, size, state, … }). */
  render: (v: VariantValues) => ReactNode
  /** Axis laid out as columns (default: 'state', else the first state axis). */
  columns?: string
  /** Axes that split the matrix into sections (default: 'size' when the spec has it). */
  sections?: string[]
}

const label: CSSProperties = { font: '500 11px/16px var(--font-family-primary, sans-serif)', color: 'var(--color-foreground-neutral-secondary)' }

/**
 * Every variant of a spec, laid out like the Figma component set: one section per size, rows for
 * the remaining axes, columns for state. Each cell carries `data-variant` (Figma variant name) so
 * tests and screenshots can address it.
 */
export function SpecMatrix({ spec, render, columns, sections }: SpecMatrixProps) {
  const colAxis = spec.axes.find((a) => a.id === (columns ?? 'state')) ?? spec.axes.find((a) => a.kind === 'state')
  const sectionAxes = sections ?? (spec.axes.some((a) => a.id === 'size') ? ['size'] : [])
  const rowAxes = spec.axes.filter((a) => a !== colAxis && !sectionAxes.includes(a.id)).map((a) => a.id)
  const exists = new Set(variantsOf(spec).map((v) => JSON.stringify(sortKeys(v))))
  const cols = colAxis?.values ?? [{ code: '', figma: '' }]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {combos(spec, sectionAxes).map((section) => (
        <section key={JSON.stringify(section)}>
          {sectionAxes.length ? (
            <h4 style={{ ...label, fontSize: 13, color: 'var(--color-foreground-neutral-primary)', margin: '0 0 12px' }}>
              {Object.values(figmaProps(spec, section)).join(' · ')}
            </h4>
          ) : null}
          <div style={{ display: 'grid', gridTemplateColumns: `max-content repeat(${cols.length}, max-content)`, gap: '12px 24px', alignItems: 'center' }}>
            <span />
            {cols.map((c) => (
              <span key={c.code} style={label}>
                {c.figma === 'True' || c.figma === 'False' ? `${colAxis?.figma} = ${c.figma}` : c.figma}
              </span>
            ))}
            {combos(spec, rowAxes)
              .filter((row) => cols.some((c) => exists.has(JSON.stringify(sortKeys({ ...section, ...row, ...(colAxis ? { [colAxis.id]: c.code } : {}) })))))
              .map((row) => (
                <Row key={JSON.stringify(row)} spec={spec} render={render} values={{ ...section, ...row }} colAxis={colAxis?.id} cols={cols} exists={exists} />
              ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function Row({ spec, render, values, colAxis, cols, exists }: { spec: ComponentSpec; render: SpecMatrixProps['render']; values: VariantValues; colAxis?: string; cols: { code: string }[]; exists: Set<string> }) {
  const rowLabel = variantLabel(spec, values, ['size'])
  return (
    <>
      <span style={label}>{rowLabel}</span>
      {cols.map((c) => {
        const v = colAxis ? { ...values, [colAxis]: c.code } : values
        if (!exists.has(JSON.stringify(sortKeys(v)))) return <span key={c.code} />
        const name = Object.entries(figmaProps(spec, v)).map(([k, x]) => `${k}=${x}`).join(', ')
        return (
          <div key={c.code} data-variant={name} style={{ display: 'flex' }}>
            {render(v)}
          </div>
        )
      })}
    </>
  )
}

const sortKeys = (v: VariantValues) => Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b)))

/**
 * A variant's name for people, values joined with ' · '. A true / false axis (Destructive) shows its
 * name or nothing; True / False options of a wider axis (Checked) show their code ('Unchecked').
 */
export function variantLabel(spec: ComponentSpec, values: VariantValues, skip: string[] = []) {
  const bool = (x: string) => x === 'True' || x === 'False'
  return spec.axes
    .filter((a) => values[a.id] !== undefined && !skip.includes(a.id))
    .map((a) => {
      const v = a.values.find((x) => x.code === values[a.id])!
      if (a.values.length === 2 && a.values.every((x) => bool(x.figma))) return v.figma === 'True' ? a.figma : null
      return bool(v.figma) ? v.code.charAt(0).toUpperCase() + v.code.slice(1) : v.figma
    })
    .filter(Boolean)
    .join(' · ')
}
