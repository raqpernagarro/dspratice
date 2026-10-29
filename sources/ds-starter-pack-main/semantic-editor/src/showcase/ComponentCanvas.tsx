import { ArrowLeft, X } from '@phosphor-icons/react'
import { useEffect, type ReactNode } from 'react'

import { SPECIMENS } from '../../../stories/base-ui/components/specimens'
import {
  allSlots,
  anatomyOf,
  existingOverrides,
  kindTitle,
  selectionValues,
  sizesOf,
  slotBindings,
  statesOf,
  variantCount,
  variantKinds,
  type Selection,
} from '../../../stories/base-ui/tokens/component-anatomy'
import { OVERRIDABLE, type OverridableComponent } from '../../../stories/base-ui/tokens/component-tokens'
import { defaultAlias } from '../components/ComponentsPanel'
import { variableGraph } from '../../../stories/base-ui/tokens/variables-model'
import { useSemanticEditor } from '../context/SemanticEditorContext'

/** The coded component in one variant; hover / pressed are shown statically. */
function Specimen({ component, look }: { component: OverridableComponent; look: Selection }) {
  const render = SPECIMENS[component.slug]
  return render ? <>{render(selectionValues(component, look))}</> : null
}

function Cell({ active, onSelect, label, children }: { active: boolean; onSelect: () => void; label: string; children: ReactNode }) {
  return (
    // A div, not a <button>: the specimens inside are buttons themselves.
    <div
      role="button"
      tabIndex={0}
      className={`cc-cell${active ? ' is-active' : ''}`}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
      aria-pressed={active}
      aria-label={label}
    >
      {children}
    </div>
  )
}

/** Where a component token points (one alias hop), by name. */
function aliasOf(token: string) {
  const v = variableGraph.byName(token)
  const val = v ? Object.values(v.values)[0] : null
  return val && typeof val === 'object' && 'a' in val ? (variableGraph.vars.get(val.a)?.name ?? null) : null
}

export function ComponentCanvas() {
  const { editingComponent, closeComponent, componentSection, selection, patchSelection, theme, setComponentOverride } = useSemanticEditor()
  const component = OVERRIDABLE.find((c) => c.slug === editingComponent) ?? OVERRIDABLE[0]
  const a = anatomyOf(component)

  // Esc goes back up to the system (unless a field is being edited).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const editingField = e.target instanceof Element && e.target.closest('input, select, textarea')
      if (e.key === 'Escape' && !editingField) closeComponent()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [closeComponent])

  const bar = (
    <div className="canvas__bar cc-bar">
      <button type="button" className="cc-bar__back" onClick={closeComponent}>
        <ArrowLeft size={14} weight="bold" />
        System
      </button>
      <span className="cc-bar__crumb" aria-hidden="true">
        /
      </span>
      <span className="cc-bar__title">{component.name}</span>
      <span className="cc-bar__scope">Edits apply to {component.name} only</span>
      <button type="button" className="cc-bar__close" onClick={closeComponent} aria-label={`Close ${component.name}`} title="Close (Esc)">
        <X size={14} weight="bold" />
      </button>
    </div>
  )
  if (!a) {
    return (
      <section className="canvas">
        {bar}
        <div className="cc-empty">No “{component.name}” component in this file.</div>
      </section>
    )
  }

  const kinds = variantKinds(component)
  const kind = kinds.find((k) => k.slug === selection.kind) ?? kinds[0]
  const sizes = sizesOf(component)
  const states = statesOf(component)
  const slots = allSlots()
  const overrides = Object.entries(theme.components).filter(([t]) => slots.get(t)?.component === component)
  const inFile = existingOverrides(component)
  const sizeFocus = componentSection !== 'color'
  // Components without a State axis (Menu) show one column.
  const columns = states.length ? states : ['']
  const matrixTitle = states.length ? `${kindTitle(component)} × states` : kinds.length > 1 ? kindTitle(component) : 'Preview'

  return (
    <section className="canvas" aria-label={`${component.name} editor`}>
      {bar}
      <div className="cc">
        {sizes.length ? (
          <section className={`cc-section${sizeFocus ? ' is-focus' : ''}`}>
            <header className="cc-section__head">
              <h3>Sizes</h3>
              <p>{kind.label} · Default — pick a size to edit its sizing.</p>
            </header>
            <div className="cc-sizes">
              {sizes.map((size) => (
                <Cell key={size} active={selection.size === size} onSelect={() => patchSelection({ size })} label={size}>
                  <span className="cc-cell__label">{size}</span>
                  <Specimen component={component} look={{ kind: kind.slug, size, state: 'Default' }} />
                </Cell>
              ))}
            </div>
          </section>
        ) : null}

        <section className={`cc-section${sizeFocus && sizes.length ? '' : ' is-focus'}`}>
          <header className="cc-section__head">
            <h3>{matrixTitle}</h3>
            <p>{sizes.length ? `${selection.size} — pick` : 'Pick'} a cell to edit its colors.</p>
          </header>
          <div className="cc-matrix" style={{ ['--cols' as string]: columns.length }}>
            <span />
            {columns.map((s) => (
              <span key={s} className="cc-matrix__col">
                {s}
              </span>
            ))}
            {kinds.map((k) => (
              <div key={k.slug} className="cc-matrix__row">
                <span className="cc-matrix__type">{k.label}</span>
                {columns.map((state) => (
                  <Cell
                    key={state}
                    active={selection.kind === k.slug && selection.state === state}
                    onSelect={() => patchSelection({ kind: k.slug, state })}
                    label={`${k.label} ${state}`}
                  >
                    <Specimen component={component} look={{ kind: k.slug, size: selection.size, state }} />
                  </Cell>
                ))}
              </div>
            ))}
          </div>
        </section>

        <section className="cc-section">
          <header className="cc-section__head">
            <h3>Overrides</h3>
            <p>Component tokens {component.name} uses instead of semantic tokens. Export sends your changes to Figma.</p>
          </header>
          {inFile.length || overrides.length ? (
            <table className="cc-table">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Points at</th>
                  <th>Applies to</th>
                  <th>Status</th>
                  <th aria-label="Reset" />
                </tr>
              </thead>
              <tbody>
                {inFile.map(({ token, bindings }) => {
                  const changed = theme.components[token]
                  return (
                    <tr key={token}>
                      <td>
                        <code>{token}</code>
                      </td>
                      <td>
                        {changed ? (
                          <>
                            <code className="cc-table__was">{aliasOf(token) ?? '—'}</code> → <code>{changed}</code>
                          </>
                        ) : (
                          <code>{aliasOf(token) ?? '—'}</code>
                        )}
                      </td>
                      <td className="cc-table__muted">{bindings} bindings</td>
                      <td>
                        <span className="override-badge override-badge--file">In Figma</span>
                        {changed ? <span className="override-badge">Changed</span> : null}
                      </td>
                      <td>
                        {changed ? (
                          <button type="button" className="cc-table__reset" onClick={() => setComponentOverride(token, undefined)}>
                            Reset
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  )
                })}
                {overrides
                  .filter(([token]) => !inFile.some((f) => f.token === token))
                  .map(([token, alias]) => {
                    const slot = slots.get(token)!
                    return (
                      <tr key={token}>
                        <td>
                          <code>{token}</code>
                        </td>
                        <td>
                          <code className="cc-table__was">{defaultAlias(slot).name ?? 'mixed'}</code> → <code>{alias}</code>
                        </td>
                        <td className="cc-table__muted">
                          {variantCount(slot)} variants · {slotBindings(slot).length} bindings
                        </td>
                        <td>
                          <span className="override-badge">New</span>
                        </td>
                        <td>
                          <button type="button" className="cc-table__reset" onClick={() => setComponentOverride(token, undefined)}>
                            Reset
                          </button>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          ) : (
            <p className="cc-empty-note">{component.name} uses semantic tokens only. Change a value in the panel to add an override.</p>
          )}
        </section>
      </div>
    </section>
  )
}
