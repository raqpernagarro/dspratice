import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { GitPullRequest, Sparkles } from 'lucide-react'
import { useStore } from '@/state/store'
import { act, usePaths, useScope, useSystem } from '@/state/hooks'
import { effectiveActingAs } from '@/state/scope'
import { PageHead } from '@/shell/PageHead'
import { Btn, Callout, Chip, Code, Field, Panel, SimBadge } from '@/shell/ui'
import { agentJson, roleOf } from '@/state/selectors'

export function GuidanceEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const sys = useSystem()
  const r = usePaths()
  const scope = useScope()
  const actingAs = useStore((x) => effectiveActingAs(x, scope))
  const c = sys.components.find((x) => x.id === id)
  const [whenToUse, setWhenToUse] = useState('')
  const [whenNotToUse, setWhenNotToUse] = useState('')
  const [anti, setAnti] = useState('')
  const [a11y, setA11y] = useState('')

  useEffect(() => {
    if (!c) return
    setWhenToUse(c.guidance.whenToUse ?? '')
    setWhenNotToUse(c.guidance.whenNotToUse ?? '')
    setAnti(c.guidance.antiPatterns.join('\n'))
    setA11y(c.guidance.a11y ?? '')
  }, [c])

  if (!c) return <div className="empty">Component not found.</div>

  const draft = { whenToUse, whenNotToUse, antiPatterns: anti.split('\n').map((x) => x.trim()).filter(Boolean), a11y }
  const dirty = whenToUse !== (c.guidance.whenToUse ?? '') || whenNotToUse !== (c.guidance.whenNotToUse ?? '') || anti !== c.guidance.antiPatterns.join('\n') || a11y !== (c.guidance.a11y ?? '')
  const preview = agentJson({ ...c, guidance: draft }, sys.tokens)
  const canWrite = roleOf(sys, actingAs) !== 'viewer'
  const patrolSuggestion = sys.agentProposals.find((p) => p.status === 'pending' && p.guidanceChanges?.some((g) => g.componentId === c.id))

  return (
    <div className="page">
      <PageHead
        screen="guidance"
        crumbs={[{ label: 'Components', to: r.components }, { label: c.name, to: r.component(c.id) }, { label: 'Guidance' }]}
        title={`${c.name} guidance`}
        lead="Usage guidance is part of the contract and machine-readable. The right column is exactly what agents receive. Saving creates a pull request."
        eyebrow={<SimBadge what="Local pull request" detail="Saving creates a pull request in local state; nothing is pushed." />}
      />

      {!canWrite && <Callout tone="warn">Viewers can read guidance but not propose changes. Switch “acting as” in the top bar to a contributor or the owner.</Callout>}

      <div className="grid grid--2">
        <Panel title="Edit">
          <Field label="When to use" id="g-use">
            <textarea id="g-use" className="textarea" value={whenToUse} onChange={(e) => setWhenToUse(e.target.value)} />
          </Field>
          <Field label="When not to use" id="g-notuse" hint={!whenNotToUse ? 'Missing: agents will guess. Rule: every component says when not to use it.' : undefined}>
            <textarea id="g-notuse" className={`textarea ${!whenNotToUse ? 'input--error' : ''}`} value={whenNotToUse} onChange={(e) => setWhenNotToUse(e.target.value)} />
          </Field>
          {patrolSuggestion && !whenNotToUse && (
            <Callout tone="ai">
              <span className="row row--between">
                <span>The patrol agent drafted a sentence for this field.</span>
                <Btn size="sm" variant="secondary" onClick={() => setWhenNotToUse(patrolSuggestion.guidanceChanges![0].to)}>
                  <Sparkles /> Use the draft
                </Btn>
              </span>
            </Callout>
          )}
          <Field label="Anti-patterns" id="g-anti" hint="One per line.">
            <textarea id="g-anti" className="textarea" value={anti} onChange={(e) => setAnti(e.target.value)} />
          </Field>
          <Field label="Accessibility" id="g-a11y">
            <textarea id="g-a11y" className="textarea" value={a11y} onChange={(e) => setA11y(e.target.value)} style={{ minHeight: 60 }} />
          </Field>
          <div className="row row--between">
            <Btn variant="ghost" onClick={() => navigate(r.component(c.id))}>
              Back to {c.name}
            </Btn>
            <Btn
              disabled={!dirty || !canWrite}
              onClick={() => {
                const n = act().saveGuidance(c.id, draft)
                if (n) navigate(r.pr(n))
              }}
            >
              <GitPullRequest /> Save as pull request
            </Btn>
          </div>
        </Panel>

        <Panel title="What agents see" actions={<Chip tone="ai">guidance JSON</Chip>}>
          <Code>{JSON.stringify(preview, null, 2)}</Code>
          <span className="xs muted">Published to Figma Specs + Make, Storybook MCP, Claude Design, the v0 registry, DESIGN.md and AGENTS.md on merge.</span>
        </Panel>
      </div>
    </div>
  )
}
