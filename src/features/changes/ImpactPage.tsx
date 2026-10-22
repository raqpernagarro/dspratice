import { Link, useNavigate, useParams } from 'react-router'
import { ArrowRight, GitPullRequest, Trash2 } from 'lucide-react'
import { useStore } from '@/state/store'
import { act, usePaths, useScope, useSystem } from '@/state/hooks'
import { effectiveActingAs } from '@/state/scope'
import { PageHead } from '@/shell/PageHead'
import { Btn, Callout, Chip, Panel, SimBadge, Swatch } from '@/shell/ui'
import { DemoScope } from '@/demo-system/DemoScope'
import { ComponentPreview } from '@/demo-system/components'
import { roleOf } from '@/state/selectors'

export function ImpactPage() {
  const { changeId } = useParams()
  const navigate = useNavigate()
  const sys = useSystem()
  const r = usePaths()
  const scope = useScope()
  const actingAs = useStore((x) => effectiveActingAs(x, scope))
  const change = sys.changes.find((c) => c.id === changeId)
  if (!change) return <div className="empty">Change not found.</div>
  const finding = change.findingId ? sys.findings.find((f) => f.id === change.findingId) : undefined
  const role = roleOf(sys, actingAs)
  const im = change.impact

  return (
    <div className="page">
      <PageHead
       
        crumbs={[{ label: 'Findings and changes', to: r.changes }, ...(finding ? [{ label: finding.title, to: r.finding(finding.id) }] : []), { label: 'What it affects' }]}
        title={`What this change affects: ${change.title}`}
        lead="Everything the change touches, before anything merges: components, Figma layers, documentation pages and the files AI tools read."
        eyebrow={
          <>
            <Chip tone={change.status === 'draft' ? 'info' : change.status === 'in_pr' ? 'ai' : 'ok'}>{change.status === 'in_pr' ? 'in pull request' : change.status}</Chip>
            {finding && (
              <Link to={r.finding(finding.id)} className="chip chip--outline">
                from: {finding.title}
              </Link>
            )}
          </>
        }
      />

      <div className="impact" data-demo-focus="impact-numbers">
        <div className="impact__cell">
          <span className="impact__n">{im.componentIds.length}</span>
          <span className="impact__label">Components</span>
          <span className="impact__detail">{im.componentIds.map((id) => sys.components.find((c) => c.id === id)?.name).join(', ')}</span>
        </div>
        <div className="impact__cell">
          <span className="impact__n">{im.figmaLayers}</span>
          <span className="impact__label">Figma layers</span>
          <span className="impact__detail">{im.figmaLayers ? `in ${im.figmaFiles} files, only layers bound to this variable` : 'no Figma change'}</span>
        </div>
        <div className="impact__cell">
          <span className="impact__n">{im.docsPages.length}</span>
          <span className="impact__label">Documentation pages</span>
          <span className="impact__detail">{im.docsPages.join(', ') || 'none'}</span>
        </div>
        <div className="impact__cell">
          <span className="impact__n">{im.channels}</span>
          <span className="impact__label">Files AI tools read</span>
          <span className="impact__detail">regenerated on merge: Specs, Make, Storybook MCP, Claude Design, v0, DESIGN.md, AGENTS.md</span>
        </div>
      </div>

      <div className="grid grid--side">
        <Panel title="What changes">
          {change.tokenChanges.map((tc) => {
            const t = sys.tokens.find((x) => x.id === tc.tokenId)!
            return (
              <div key={tc.tokenId + tc.mode} className="row row--between" style={{ padding: '8px 0', borderBottom: 'var(--n-hairline) solid var(--n-line)' }}>
                <span className="small">
                  <code className="xs">{t.figmaName}</code> · {tc.mode}
                </span>
                <span className="row small">
                  <Swatch color={tc.from} /> <code className="xs">{tc.from}</code> → <Swatch color={tc.to} /> <code className="xs">{tc.to}</code>
                </span>
              </div>
            )
          })}
          {change.guidanceChanges.map((g, i) => (
            <div key={i} className="stack" style={{ padding: '8px 0', borderBottom: 'var(--n-hairline) solid var(--n-line)', gap: 4 }}>
              <span className="small">
                <strong>{sys.components.find((c) => c.id === g.componentId)?.name}</strong> · {g.field}
              </span>
              <span className="xs muted" style={{ textDecoration: 'line-through' }}>
                {g.from || '(empty)'}
              </span>
              <span className="small">{g.to}</span>
            </div>
          ))}
          {!change.tokenChanges.length && !change.guidanceChanges.length && <span className="small muted">This change has no automatic edit: it goes to the team as a task, with the finding attached.</span>}

          {im.componentIds.length > 0 && (
            <DemoScope mode="dark" style={{ padding: 16, borderRadius: 12, display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              {im.componentIds.slice(0, 7).map((id) => (
                <ComponentPreview key={id} id={id} label={sys.components.find((c) => c.id === id)?.name} />
              ))}
            </DemoScope>
          )}
        </Panel>

        <div className="stack">
          <Panel tight>
            <Callout tone={role === 'owner' ? 'ok' : 'info'}>{role === 'owner' ? 'You are the design system owner: you can propose and merge.' : 'You can propose. Merging needs the design system owner.'}</Callout>
            {change.status === 'draft' && (
              <>
                <Btn
                  onClick={() => {
                    const n = act().createPR(change.id)
                    if (n) navigate(r.pr(n))
                  }}
                  disabled={role === 'viewer'}
                >
                  <GitPullRequest /> Create PR + Figma change set
                </Btn>
                <SimBadge detail="A pull request and a Figma change set are created in local state. Nothing is pushed to GitHub or Figma." />
                <Btn
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    act().discardChange(change.id)
                    navigate(finding ? r.finding(finding.id) : r.changes)
                  }}
                >
                  <Trash2 /> Discard proposal
                </Btn>
              </>
            )}
            {change.prNumber && (
              <Link to={r.pr(change.prNumber)} className="btn">
                Pull request #{change.prNumber} <ArrowRight />
              </Link>
            )}
          </Panel>
        </div>
      </div>
    </div>
  )
}
