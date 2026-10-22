import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Copy, Figma, Sparkles } from 'lucide-react'
import { act, useJob, useSystem } from '@/state/hooks'
import { PageHead } from '@/shell/PageHead'
import { Btn, Callout, CheckIcon, Chip, Panel, Segmented, SimBadge } from '@/shell/ui'
import { DemoScope } from '@/demo-system/DemoScope'
import { ComponentPreview } from '@/demo-system/components'
import type { Mode } from '@/state/types'

const DEMO_PROMPT = 'A settings page with notifications and a danger zone. Use --color-brand-pop for the header and 18px gaps between rows.'

export function PrototypePage() {
  const [params] = useSearchParams()
  const sys = useSystem()
  const [prompt, setPrompt] = useState(params.get('demo') ? DEMO_PROMPT : 'A settings page with notifications and a danger zone')
  const [mode, setMode] = useState<Mode>('light')
  const job = useJob('prototype')
  const running = job?.status === 'running'
  const proto = sys.prototypes[0]

  useEffect(() => {
    if (params.get('demo')) setPrompt(DEMO_PROMPT)
  }, [params])

  const code = proto
    ? `import { ${Array.from(new Set(proto.blocks.map((b) => pascal(b.componentId)))).join(', ')} } from '@demo-brand/design-system'\n\nexport function Screen() {\n  return (\n    <>\n${proto.blocks.map((b) => `      <${pascal(b.componentId)}${b.props ? ' ' + Object.entries(b.props).map(([k, v]) => `${k}="${v}"`).join(' ') : ''}>${b.label}</${pascal(b.componentId)}>`).join('\n')}\n    </>\n  )\n}`
    : ''

  return (
    <div className="page">
      <PageHead
       
        title="Build a screen with the system"
        lead="Describe a screen. It is built only from the system’s real components and tokens; anything the system doesn’t have is refused, with the nearest real alternative."
      />

      <Panel>
        <div className="row">
          <input className="input" value={prompt} onChange={(e) => setPrompt(e.target.value)} style={{ flex: 1, minWidth: 240 }} aria-label="Prompt" />
          <Btn onClick={() => act().generatePrototype(prompt)} loading={running} disabled={!prompt.trim()}>
            <Sparkles /> {running ? job?.stages[job.stageIndex]?.label : 'Build it'}
          </Btn>
        </div>
        <div className="row">
          <SimBadge what="Rule-based planner" detail="A local planner picks components from the index and validates token references. In DSN this is the MCP + a model; in the Starter Pack the prototype agent." />
          <button className="btn btn--ghost btn--sm" onClick={() => setPrompt(DEMO_PROMPT)}>
            Try the prompt with an invented token
          </button>
        </div>
      </Panel>

      {proto && (
        <div className="grid grid--side">
          <Panel flush>
            <div className="preview-frame__bar">
              <span>Built from {proto.blocks.length} real components · {new Date(proto.createdAt).toLocaleTimeString()}</span>
              <Segmented
                value={mode}
                options={[
                  { id: 'light', label: 'Light' },
                  { id: 'dark', label: 'Dark' },
                ]}
                onChange={setMode}
              />
            </div>
            <DemoScope mode={mode} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {proto.blocks.map((b, i) => (
                <div key={i}>
                  <ComponentPreview id={b.componentId} label={b.label} props={b.props} />
                </div>
              ))}
            </DemoScope>
          </Panel>

          <div className="stack">
            <Panel title="Checks" tight>
              <div className="list">
                {proto.checks.map((c) => (
                  <div key={c.id} className="list__item">
                    <CheckIcon status={c.status === 'pass' ? 'pass' : c.status === 'warn' ? 'warn' : 'fail'} />
                    <div className="list__body">
                      <span className="list__title">{c.label}</span>
                      <span className="list__meta">{c.detail}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
            {proto.refused.length > 0 && <div data-demo-focus="refusal" className="stack">
            {proto.refused.map((r) => (
              <Callout key={r.token} tone="err">
                <strong>Refused: {r.token}</strong>
                <div className="small">{r.reason}.</div>
                {r.nearest && (
                  <div className="small">
                    Nearest real token: <code>{r.nearest}</code>
                  </div>
                )}
                <div className="xs muted">Rule: {r.rule === 'absence' ? 'agents may only reference tokens that exist (ds-index absences)' : 'closed vocabulary (banned word)'}</div>
              </Callout>
            ))}
            </div>}
            <Panel title="Built from" tight>
              <div className="row">
                {Array.from(new Set(proto.blocks.map((b) => b.componentId))).map((id) => (
                  <Chip key={id} tone="outline">
                    {sys.components.find((c) => c.id === id)?.name ?? id}
                  </Chip>
                ))}
              </div>
              <div className="row">
                <Btn
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard?.writeText(code)
                    act().pushToast({ kind: 'ok', title: 'Code copied', detail: 'React code using the real components. This copy is real.' })
                  }}
                >
                  <Copy /> Copy code
                </Btn>
                <Btn variant="secondary" size="sm" onClick={() => act().pushToast({ kind: 'sim', title: 'Open in Figma is simulated', detail: 'In a real set-up, an AI tool connected to Figma would place the library’s real components on the canvas. Not connected in this demo.' })}>
                  <Figma /> Open in Figma
                </Btn>
              </div>
            </Panel>
          </div>
        </div>
      )}

      {proto && (
        <Panel title="Code" tight>
          <pre className="code">{code}</pre>
        </Panel>
      )}
    </div>
  )
}

function pascal(id: string) {
  return id
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('')
    .replace(/Pattern$/, '')
}
