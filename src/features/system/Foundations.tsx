import { useState } from 'react'
import { Link } from 'react-router'
import { Settings, Search, Check, ChevronRight, Plus, Bell, Trash2, Star, Home, User, Calendar } from 'lucide-react'
import { usePaths, useSystem } from '@/state/hooks'
import { PageHead } from '@/shell/PageHead'
import { Panel, Segmented, Swatch, Tabs, Chip } from '@/shell/ui'
import { DemoScope } from '@/demo-system/DemoScope'
import { DsButton, DsCard, DsInput, DsBadge } from '@/demo-system/components'
import { Reveal, Stagger } from '@/motion'
import { tokenValue } from '@/state/selectors'
import type { BrandId, Mode } from '@/state/types'

type Tab = 'colour' | 'typography' | 'radius' | 'spacing' | 'shadows' | 'icons' | 'themes' | 'density'

export function Foundations() {
  const sys = useSystem()
  const r = usePaths()
  const [tab, setTab] = useState<Tab>('colour')
  const [brand, setBrand] = useState<BrandId>('demo')
  const [mode, setMode] = useState<Mode>('light')
  const [density, setDensity] = useState<'compact' | 'standard' | 'comfortable'>('standard')
  const colour = sys.tokens.filter((t) => t.type === 'color' && t.tier === 'semantic')
  const prims = sys.tokens.filter((t) => t.type === 'color' && t.tier === 'primitive')
  const groups = Array.from(new Set(colour.map((t) => t.path.split('.').slice(1, 3).join(' · '))))
  const dims = (prefix: string) => sys.tokens.filter((t) => t.path.startsWith(prefix))

  return (
    <div className="page">
      <PageHead
        title="Foundations"
        lead="The visual language behind every component: colour, typography, radius, spacing, shadows, icons, themes and density. All values come from the tokens; nothing here is typed by hand."
        actions={
          <>
            <Segmented value={brand} options={sys.theme.brands.map((b) => ({ id: b.id, label: b.name }))} onChange={setBrand} />
            <Segmented
              value={mode}
              options={[
                { id: 'light', label: 'Light' },
                { id: 'dark', label: 'Dark' },
              ]}
              onChange={setMode}
            />
          </>
        }
      />

      <Tabs
        value={tab}
        tabs={[
          { id: 'colour', label: 'Colour' },
          { id: 'typography', label: 'Typography' },
          { id: 'radius', label: 'Radius' },
          { id: 'spacing', label: 'Spacing' },
          { id: 'shadows', label: 'Shadows' },
          { id: 'icons', label: 'Icons' },
          { id: 'themes', label: 'Themes' },
          { id: 'density', label: 'Density' },
        ]}
        onChange={setTab}
      />

      {tab === 'colour' && (
        <div className="stack stack--lg">
          <Reveal>
            <Panel title="Primitive ramps" tight>
              <div className="swatch-grid">
                {prims.map((t) => (
                  <Link key={t.id} to={r.token(t.id)} className="swatch-cell" title={t.path}>
                    <span className="swatch swatch--lg" style={{ background: t.values.light }} />
                    <span className="xs">{t.path.split('.').slice(1).join(' ')}</span>
                    <code className="xs muted">{t.values.light}</code>
                  </Link>
                ))}
              </div>
            </Panel>
          </Reveal>
          {groups.map((g, gi) => (
            <Reveal key={g} index={gi}>
              <Panel title={`Semantic · ${g}`} tight>
                <div className="swatch-grid">
                  {colour
                    .filter((t) => t.path.split('.').slice(1, 3).join(' · ') === g)
                    .map((t) => {
                      const v = tokenValue(t, brand, mode)
                      return (
                        <Link key={t.id} to={r.token(t.id)} className="swatch-cell" title={t.cssName}>
                          <span className="swatch swatch--lg" style={{ background: v }} />
                          <span className="xs">{t.path.split('.').slice(3).join(' ')}</span>
                          <code className="xs muted">{v}</code>
                        </Link>
                      )
                    })}
                </div>
              </Panel>
            </Reveal>
          ))}
        </div>
      )}

      {tab === 'typography' && (
        <div className="grid grid--2">
          <Reveal>
            <Panel title="Demo Brand type" tight>
              <DemoScope brand={brand} mode={mode} style={{ padding: 20, borderRadius: 12 }}>
                <div style={{ fontFamily: 'var(--font-family-heading)', fontSize: 32, fontWeight: 600, lineHeight: 1.1 }}>Heading · {sys.theme.type.heading}</div>
                <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 'var(--font-size-lg)', marginTop: 8 }}>Large body · {sys.theme.type.body}</div>
                <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 'var(--font-size-md)', marginTop: 4 }}>Body text at the base size. The quick brown fox jumps over the lazy dog.</div>
                <div style={{ fontFamily: 'var(--font-family-body)', fontSize: 'var(--font-size-sm)', marginTop: 4, color: 'var(--color-foreground-neutral-muted)' }}>Small text for metadata and table cells.</div>
              </DemoScope>
              <table className="table">
                <tbody>
                  {dims('font.').map((t) => (
                    <tr key={t.id}>
                      <td>
                        <code className="xs">{t.cssName}</code>
                      </td>
                      <td className="small muted">{t.values.light}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          </Reveal>
          <Reveal index={1}>
            <Panel title="Nagarro shell type (this tool)" tight>
              <div className="stack" style={{ gap: 6 }}>
                <span style={{ fontFamily: 'var(--n-font-display)', fontSize: 40, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.05 }}>Equip Extended Medium</span>
                <span style={{ fontFamily: 'var(--n-font-body)', fontSize: 18 }}>Equip Regular for body text, navigation, labels and UI.</span>
                <span style={{ fontFamily: 'var(--n-font-body)', fontSize: 18, fontWeight: 500 }}>Equip Medium for emphasis.</span>
                <span style={{ fontFamily: 'var(--n-font-body)', fontSize: 18, fontWeight: 700 }}>Equip Bold for strong statements.</span>
                <span style={{ fontFamily: 'var(--n-font-body)', fontSize: 18, fontStyle: 'italic' }}>Equip Italic for quotes.</span>
              </div>
              <span className="xs muted">The Nagarro shell and the client preview use different type on purpose. Client-brand fonts appear only inside the scoped preview.</span>
            </Panel>
          </Reveal>
        </div>
      )}

      {tab === 'radius' && (
        <Reveal>
          <Panel title="Radius scale" tight>
            <Stagger className="row" style={{ gap: 24, alignItems: 'flex-end' }}>
              {dims('shape.radius').map((t) => (
                <div key={t.id} className="stack" style={{ alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 72, height: 72, borderRadius: t.values.light, background: 'var(--n-ink)' }} />
                  <span className="xs">{t.path.split('.').pop()}</span>
                  <code className="xs muted">{t.values.light}</code>
                </div>
              ))}
            </Stagger>
            <DemoScope brand={brand} mode={mode} style={{ padding: 16, borderRadius: 12, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <DsButton>Control radius</DsButton>
              <DsInput label="Field" />
              <DsBadge>Badge radius</DsBadge>
            </DemoScope>
          </Panel>
        </Reveal>
      )}

      {tab === 'spacing' && (
        <Reveal>
          <Panel title="Space scale" tight>
            <Stagger className="stack" style={{ gap: 10 }}>
              {dims('space.').map((t) => (
                <div key={t.id} className="row" style={{ gap: 16 }}>
                  <span className="xs" style={{ width: 60 }}>
                    {t.path.split('.').pop()}
                  </span>
                  <span className="m-grow" style={{ height: 14, width: `calc(${t.values.light} * 6)`, background: 'var(--n-mint)', borderRadius: 3 }} />
                  <code className="xs muted">{t.values.light}</code>
                </div>
              ))}
            </Stagger>
            <span className="xs muted">Off-scale values (18px) are flagged by the space-scale rule. Density multiplies the scale and snaps to a 4px grid.</span>
          </Panel>
        </Reveal>
      )}

      {tab === 'shadows' && (
        <Reveal>
          <Panel title="Elevation" tight>
            <DemoScope brand={brand} mode={mode} style={{ padding: 24, borderRadius: 12, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <DsCard title="Flat" body="No shadow: default card." />
              <DsCard title="Elevated" body="effect.shadow.md" variant="elevated" />
            </DemoScope>
            <table className="table">
              <tbody>
                {dims('effect.').map((t) => (
                  <tr key={t.id}>
                    <td>
                      <code className="xs">{t.cssName}</code>
                    </td>
                    <td className="small muted">{tokenValue(t, brand, mode)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </Reveal>
      )}

      {tab === 'icons' && (
        <Reveal>
          <Panel title="Icons" tight>
            <p className="small muted">Demo Brand uses a 16 / 20 / 24px icon set on a 2px stroke. Icons reinforce meaning next to text and are never the only label.</p>
            <Stagger className="row" style={{ gap: 18 }}>
              {[Settings, Search, Check, ChevronRight, Plus, Bell, Trash2, Star, Home, User, Calendar].map((I, i) => (
                <span key={i} className="stack" style={{ alignItems: 'center', gap: 4 }}>
                  <I style={{ width: 24, height: 24 }} />
                  <I style={{ width: 16, height: 16, color: 'var(--n-fg-muted)' }} />
                </span>
              ))}
            </Stagger>
          </Panel>
        </Reveal>
      )}

      {tab === 'themes' && (
        <div className="grid grid--2">
          {sys.theme.brands.map((b, i) => (
            <Reveal key={b.id} index={i}>
              <Panel title={b.name} tight actions={b.isDefault ? <Chip tone="outline">default</Chip> : undefined}>
                <div className="row">
                  <Swatch color={b.main} lg /> <Swatch color={b.accent} lg />
                  <span className="xs muted">
                    brand {b.main} · accent {b.accent}
                  </span>
                </div>
                <div className="grid grid--2">
                  {(['light', 'dark'] as Mode[]).map((m) => (
                    <DemoScope key={m} brand={b.id} mode={m} style={{ padding: 14, borderRadius: 10, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <DsButton>Primary</DsButton>
                      <DsBadge tone="success">{m}</DsBadge>
                    </DemoScope>
                  ))}
                </div>
              </Panel>
            </Reveal>
          ))}
        </div>
      )}

      {tab === 'density' && (
        <Reveal>
          <Panel title="Density" tight actions={<Segmented value={density} options={[{ id: 'compact', label: 'Compact' }, { id: 'standard', label: 'Standard' }, { id: 'comfortable', label: 'Comfortable' }]} onChange={setDensity} />}>
            <DemoScope brand={brand} mode={mode} density={density} style={{ padding: 20, borderRadius: 12, display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <DsButton>Save changes</DsButton>
              <DsButton variant="secondary">Cancel</DsButton>
              <DsInput />
              <DsCard title="Card" body="Padding and control heights scale with density." />
            </DemoScope>
            <span className="xs muted">Compact ×0.85 · Standard ×1 · Comfortable ×1.15. In Figma a density collection; in code a multiplier snapped to a 4px grid.</span>
          </Panel>
        </Reveal>
      )}
    </div>
  )
}
