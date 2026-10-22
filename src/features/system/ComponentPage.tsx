import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ArrowRight, ExternalLink, Pencil } from 'lucide-react'
import { useStore } from '@/state/store'
import { usePaths, useSystem } from '@/state/hooks'
import { PageHead } from '@/shell/PageHead'
import { Btn, Chip, Code, Kv, Panel, Segmented, SimBadge, Swatch, Tabs, FindingStatusChip } from '@/shell/ui'
import { agentJson, guidancePct, openComponentFindings, componentFindings, tokenInSync } from '@/state/selectors'
import { DemoScope } from '@/demo-system/DemoScope'
import { ComponentPreview, DsButton } from '@/demo-system/components'
import type { BrandId, Mode } from '@/state/types'

type Tab = 'usage' | 'tokens' | 'figma' | 'checks'

export function ComponentPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const sys = useSystem()
  const r = usePaths()
  const rules = useStore((x) => x.practice.rules)
  const c = sys.components.find((x) => x.id === id)
  const [tab, setTab] = useState<Tab>('usage')
  const [mode, setMode] = useState<Mode>('light')
  const [brand, setBrand] = useState<BrandId>('demo')

  if (!c) return <div className="empty">Component not found.</div>

  const open = openComponentFindings(sys, c.id)
  const all = componentFindings(sys, c.id)
  const tokens = c.tokenRefs.map((ref) => sys.tokens.find((t) => t.id === ref)).filter(Boolean) as NonNullable<ReturnType<typeof sys.tokens.find>>[]
  const tokenIssues = new Set(open.flatMap((f) => f.tokenIds))
  const parityIssues = open.filter((f) => ['variant-parity', 'value-naming', 'token-collision'].includes(f.ruleId)).length

  return (
    <div className="page">
      <PageHead
       
        crumbs={[{ label: 'Components', to: r.components }, { label: c.name }]}
        title={c.name}
        lead={c.description}
        eyebrow={
          <>
            <Chip tone="outline">{c.category}</Chip>
            {c.figmaNodeId && (
              <Chip tone="ai" icon={<ExternalLink />} title={`Figma node ${c.figmaNodeId} in Demo Brand UI Kit (demo link, does not open Figma)`}>
                Figma ↗
              </Chip>
            )}
            <Chip tone="outline" icon={<ExternalLink />} title={`src/components/${c.category}/${c.name.replace(/\s/g, '')} (demo link)`}>
              Code ↗
            </Chip>
          </>
        }
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

      <div data-demo-focus="component-stage">
      <Panel flush>
        <DemoScope brand={brand} mode={mode} className="component-stage">
          {c.id === 'button' ? (
            <>
              <DsButton>Default</DsButton>
              <DsButton state="hover">Hover</DsButton>
              <DsButton state="active">Active</DsButton>
              <DsButton variant="secondary">Secondary</DsButton>
              <DsButton variant="ghost">Ghost</DsButton>
              <DsButton disabled>Disabled</DsButton>
            </>
          ) : c.rendered ? (
            <ComponentPreview id={c.id} />
          ) : (
            <div className="stack" style={{ alignItems: 'center', color: 'var(--color-foreground-neutral-muted)' }}>
              <ComponentPreview id={c.id} />
              <span className="xs">Data entry: this component is described in the contract but not rendered in the demo kit.</span>
            </div>
          )}
        </DemoScope>
        <div className="row row--between" style={{ padding: '10px 20px', borderTop: 'var(--n-hairline) solid var(--n-line)', fontSize: 12, color: 'var(--n-fg-muted)' }}>
          <span>
            {c.storyCount} stories · used in {c.usedIn} places · {c.props?.length ?? 0} props
          </span>
          {c.id === 'button' && mode === 'dark' && open.some((f) => f.id === 'f-hover-dark') && <span style={{ color: 'var(--n-err)' }}>Default and hover render identically in dark mode.</span>}
        </div>
      </Panel>
      </div>

      <Tabs
        value={tab}
        tabs={[
          { id: 'usage', label: 'Usage' },
          { id: 'tokens', label: 'Tokens', badge: tokenIssues.size ? <Chip tone="warn">{tokenIssues.size}</Chip> : undefined },
          { id: 'figma', label: 'Figma' },
          { id: 'checks', label: 'Checks', badge: open.length ? <Chip tone={open.some((f) => f.severity === 'error') ? 'err' : 'warn'}>{open.length}</Chip> : undefined },
        ]}
        onChange={setTab}
      />

      {tab === 'usage' && (
        <div className="grid grid--side">
          <Panel
            title="Guidance"
            actions={
              <Btn variant="secondary" size="sm" onClick={() => navigate(r.guidance(c.id))}>
                <Pencil /> Edit guidance
              </Btn>
            }
          >
            <Kv
              rows={[
                ['When to use', c.guidance.whenToUse || <span className="muted">missing</span>],
                ['When not to use', c.guidance.whenNotToUse || <Chip tone="warn">Missing: agents will guess</Chip>],
                ['Anti-patterns', c.guidance.antiPatterns.length ? c.guidance.antiPatterns.join(' · ') : <span className="muted">none listed</span>],
                ['Accessibility', c.guidance.a11y || <span className="muted">missing</span>],
              ]}
            />
            <span className="small muted">
              Guidance {guidancePct(c)}% · when to use {c.guidance.whenToUse ? '✓' : '✗'} · when not to use {c.guidance.whenNotToUse ? '✓' : 'missing'} · accessibility {c.guidance.a11y ? '✓' : '✗'}
            </span>
          </Panel>
          <Panel title="Props" tight>
            {c.props?.length ? (
              <table className="table">
                <tbody>
                  {c.props.map((p) => (
                    <tr key={p.name}>
                      <td>
                        <code>{p.name}</code>
                      </td>
                      <td className="xs muted">{p.values ? p.values.join(' · ') : p.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <span className="small muted">Props are read from the Storybook manifest when present. This component has no manifest entry in the demo.</span>
            )}
            {c.variants && (
              <div className="row">
                {c.variants.map((v) => (
                  <Chip key={v} tone="outline">
                    {v}
                  </Chip>
                ))}
              </div>
            )}
          </Panel>
        </div>
      )}

      {tab === 'tokens' && (
        <Panel flush>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Token</th>
                  <th>Light</th>
                  <th>Dark</th>
                  <th>Figma ↔ code</th>
                </tr>
              </thead>
              <tbody>
                {tokens.map((t) => {
                  const issue = tokenIssues.has(t.id)
                  const sync = tokenInSync(t) && !issue
                  return (
                    <tr key={t.id} className="is-clickable" onClick={() => navigate(r.token(t.id))}>
                      <td className="small">{t.path.split('.').slice(1, 3).join(' · ')}</td>
                      <td>
                        <code className="xs">{t.figmaName.replace(/^semantic\//, '')}</code>
                      </td>
                      <td>
                        <span className="row">
                          {t.type === 'color' && <Swatch color={t.values.light} />}
                          <code className="xs">{t.values.light}</code>
                        </span>
                      </td>
                      <td>
                        <span className="row">
                          {t.type === 'color' && <Swatch color={t.values.dark} />}
                          <code className="xs">{t.values.dark}</code>
                        </span>
                      </td>
                      <td>
                        {sync ? (
                          <Chip tone="ok">✓ in sync</Chip>
                        ) : (
                          <Chip tone="warn">⚠ {issue ? 'Figma and code differ in dark' : `Figma holds ${Object.values(t.figmaDrift ?? {})[0]}`}</Chip>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {tab === 'figma' && (
        <div className="grid grid--2">
          <Panel title="Figma component set">
            <Kv
              rows={[
                ['File', 'Demo Brand UI Kit'],
                ['Node', c.figmaNodeId ? <code>{c.figmaNodeId}</code> : <span className="muted">not in Figma (code only)</span>],
                ['Code Connect', c.codeConnect ? <Chip tone="ok">mapped</Chip> : <Chip tone="warn">not mapped</Chip>],
                ['Bound layers', `${tokens.reduce((n, t) => n + (t.usedBy.includes(c.id) ? Math.round(t.figmaLayerCount / Math.max(1, t.usedBy.length)) : 0), 0)} layers bound to tokens`],
              ]}
            />
            <div className="row">
              <SimBadge what="Demo link" detail="Figma links are illustrative; the demo does not open a Figma file." />
            </div>
          </Panel>
          <Panel title="Parity">
            {parityIssues ? (
              <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>
                {open
                  .filter((f) => ['variant-parity', 'value-naming', 'token-collision'].includes(f.ruleId))
                  .map((f) => (
                    <li key={f.id}>
                      <Link to={r.finding(f.id)}>{f.title}</Link>
                    </li>
                  ))}
              </ul>
            ) : (
              <span className="small muted">Figma variants, props and bound variables match the code.</span>
            )}
            <span className="xs muted">Checked by the parity gate on every pull request (Starter Pack check-figma-parity; kit binding-parity).</span>
          </Panel>
        </div>
      )}

      {tab === 'checks' && (
        <div className="grid grid--side">
          <Panel title="Findings" tight>
            {all.length === 0 ? (
              <div className="empty">No findings for {c.name}.</div>
            ) : (
              <div className="list">
                {all.map((f) => (
                  <Link key={f.id} to={r.finding(f.id)} className="list__item list__item--link">
                    <div className="list__body">
                      <span className="list__title">{f.title}</span>
                      <span className="list__meta">Rule: {rules.find((rule) => rule.id === f.ruleId)?.title}</span>
                    </div>
                    <FindingStatusChip status={f.status} />
                    <ArrowRight style={{ width: 14, color: 'var(--n-fg-subtle)' }} />
                  </Link>
                ))}
              </div>
            )}
          </Panel>
          <div className="stack">
            <Panel tight>
              <Kv
                rows={[
                  ['Accessibility', <Chip tone="ok">pass</Chip>],
                  ['Figma parity', parityIssues ? <Chip tone="warn">{parityIssues} issue{parityIssues > 1 ? 's' : ''}</Chip> : <Chip tone="ok">pass</Chip>],
                  ['Contrast', open.some((f) => f.ruleId === 'contrast-aa') ? <Chip tone="warn">1 fail</Chip> : <Chip tone="ok">AA</Chip>],
                  ['Guidance', c.guidance.whenNotToUse ? <Chip tone="ok">complete</Chip> : <Chip tone="warn">incomplete</Chip>],
                ]}
              />
            </Panel>
            {open.some((f) => f.suggestedFix && f.status === 'open') && (
              <Btn onClick={() => navigate(r.finding(open.find((f) => f.suggestedFix && f.status === 'open')!.id))}>
                See {open.filter((f) => f.suggestedFix && f.status === 'open').length} suggestion{open.filter((f) => f.suggestedFix && f.status === 'open').length > 1 ? 's' : ''} <ArrowRight />
              </Btn>
            )}
          </div>
        </div>
      )}

      <Panel title="What agents see" tight actions={<Chip tone="ai">published to 6 channels</Chip>}>
        <Code>{JSON.stringify(agentJson(c, sys.tokens), null, 2)}</Code>
      </Panel>
    </div>
  )
}
