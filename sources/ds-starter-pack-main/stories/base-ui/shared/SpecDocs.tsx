import type { ReactNode } from 'react'

import { PROPERTIES, bindingCombos, figmaProps, partClass, valueOf, type Binding, type ComponentSpec } from '../spec'
import './docs-markdown.css'

/**
 * Design-system documentation for a spec-driven component, rendered from its spec: guidance,
 * anatomy (Base UI part ↔ Figma layer ↔ CSS class), variants and every token binding. Because it
 * reads the spec, it can't drift from the code or from what the Figma parity check enforces.
 */
export function SpecDocs({ spec }: { spec: ComponentSpec }) {
  const { docs } = spec
  return (
    <div className="base-ui-docs">
      <p>{docs.summary}</p>

      {docs.usage?.length ? <Section title="Usage" items={docs.usage} /> : null}
      {docs.dont?.length ? <Section title="Don’t" items={docs.dont} /> : null}
      {docs.accessibility?.length ? <Section title="Accessibility" items={docs.accessibility} /> : null}

      <h2>Anatomy</h2>
      <table>
        <thead>
          <tr>
            <th>Part</th>
            <th>Base UI</th>
            <th>Figma layer</th>
            <th>CSS class</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {spec.parts.map((p) => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.baseUi ? <code>{p.baseUi}</code> : '—'}</td>
              <td>{codes([p.figma].flat().map((l) => l || '(variant)'))}</td>
              <td>
                {/* Drawn by another part's element (or its pseudo-element); instances carry their own component's class. */}
                {p.instanceOf ? '—' : <code>.{partClass(spec, p.element ?? p.id)}{p.element ? (p.pseudo ?? '') : ''}</code>}
              </td>
              <td>{p.description}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Variants</h2>
      <table>
        <thead>
          <tr>
            <th>Figma property</th>
            <th>Values</th>
            <th>Code</th>
          </tr>
        </thead>
        <tbody>
          {spec.axes.map((a) => (
            <tr key={a.id}>
              <td>{a.figma}</td>
              <td>{a.values.map((v) => v.figma).join(' · ')}</td>
              <td>
                {a.kind === 'prop' ? (
                  <>
                    prop <code>{a.prop ?? a.id}</code> → <code>{a.attr ?? `data-${a.id}`}</code>
                  </>
                ) : (
                  codes(a.values.map((v) => `${v.code}: ${v.css?.join(', ') || '(default)'}`))
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {spec.figmaProps?.length ? (
        <>
          <h2>Figma properties</h2>
          <p>Set them on an instance instead of detaching it. Slots take any content; the suggested components are one click away.</p>
          <table>
            <thead>
              <tr>
                <th>Property</th>
                <th>Type</th>
                <th>Default / suggested</th>
                <th>In code</th>
              </tr>
            </thead>
            <tbody>
              {spec.figmaProps.map((p) => (
                <tr key={p.kind + p.name}>
                  <td>{p.name}</td>
                  <td>{{ slot: 'Slot', boolean: 'Boolean', text: 'Text', expose: 'Nested instance' }[p.kind]}</td>
                  <td>
                    {p.kind === 'slot'
                      ? codes(p.preferred ?? [])
                      : p.kind === 'boolean'
                        ? p.default
                          ? 'On'
                          : 'Off'
                        : p.kind === 'text'
                          ? p.default
                          : 'Its properties show on this component'}
                  </td>
                  <td>{p.code ? <code>{p.code}</code> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : null}

      <h2>Tokens</h2>
      <p>
        What each part is bound to, in Figma and in code. Overridable properties can be changed per component in the configurator; the override token
        takes the place of the semantic one.
      </p>
      <table>
        <thead>
          <tr>
            <th>Part</th>
            <th>Property</th>
            <th>Semantic token</th>
            <th>Override token</th>
          </tr>
        </thead>
        <tbody>
          {spec.bindings.map((b, i) => (
            <tr key={i}>
              <td>{b.part}</td>
              <td>
                {b.property}
                {b.on && b.on !== 'both' ? <em> ({b.on} only)</em> : null}
              </td>
              <td>
                <Values spec={spec} b={b} />
              </td>
              <td>{b.override ? <code>{b.override.token}</code> : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        Figma fields per property:{' '}
        {[...new Set(spec.bindings.map((b) => b.property))].map((p, i) => (
          <span key={p}>
            {i ? ' · ' : ''}
            {p} → {PROPERTIES[p].figma.join(', ')}
          </span>
        ))}
      </p>
    </div>
  )
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <>
      <h2>{title}</h2>
      <ul>
        {items.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
    </>
  )
}

const codes = (xs: string[]): ReactNode =>
  xs.map((x, i) => (
    <span key={x}>
      {i ? ', ' : ''}
      <code>{x}</code>
    </span>
  ))

/** One token, or a per-variant list (grouped when several variants share a token). */
function Values({ spec, b }: { spec: ComponentSpec; b: Binding }) {
  const rows = bindingCombos(spec, b).map((v) => ({ v, token: valueOf(b, v) }))
  const distinct = [...new Set(rows.map((r) => r.token))]
  if (!b.by.length || distinct.length === 1) return <code>{distinct[0]}</code>
  return (
    <details>
      <summary>
        {distinct.length} tokens by {b.by.join(' × ')}
      </summary>
      <table>
        <tbody>
          {rows.map(({ v, token }) => (
            <tr key={JSON.stringify(v)}>
              <td>{Object.values(figmaProps(spec, v)).join(' · ')}</td>
              <td>
                <code>{token}</code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  )
}
