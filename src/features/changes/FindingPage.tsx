import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ArrowRight, MessageSquare, Wrench, XCircle, RotateCcw } from 'lucide-react'
import { useStore } from '@/state/store'
import { act, useIsClient, usePaths, useScope, useSystem } from '@/state/hooks'
import { effectiveActingAs } from '@/state/scope'
import { roleOf } from '@/state/selectors'
import { practice } from '@/app/routes'
import { PageHead } from '@/shell/PageHead'
import { Btn, Callout, Chip, FindingStatusChip, Panel, SeverityChip, Sheet, Swatch, Kv } from '@/shell/ui'
import { DemoScope } from '@/demo-system/DemoScope'
import { DsButton } from '@/demo-system/components'
import { HERO_TOKEN_ID } from '@/fixtures/demo-brand/tokens'

export function FindingPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const sys = useSystem()
  const r = usePaths()
  const rules = useStore((x) => x.practice.rules)
  const scope = useScope()
  const actingAs = useStore((x) => effectiveActingAs(x, scope))
  const client = useIsClient()
  const f = sys.findings.find((x) => x.id === id)
  const [dismissSheet, setDismissSheet] = useState(false)
  const [askSheet, setAskSheet] = useState(false)
  const [reason, setReason] = useState('')
  if (!f) return <div className="empty">Finding not found.</div>
  const rule = rules.find((x) => x.id === f.ruleId)!
  const ruleEnabled = sys.contract.rulesEnabled[rule.id] !== false
  const hero = f.id === 'f-hover-dark'
  const heroDefault = sys.tokens.find((t) => t.id === 'color-background-interactive-primary-default')!
  const heroHover = sys.tokens.find((t) => t.id === HERO_TOKEN_ID)!
  const evidence = hero
    ? [
        { label: 'default · dark', value: heroDefault.values.dark.toUpperCase(), swatch: heroDefault.values.dark, note: heroDefault.figmaName },
        { label: 'hover · dark', value: heroHover.values.dark.toUpperCase(), swatch: heroHover.values.dark, note: heroHover.figmaName },
        { label: 'Result', value: heroDefault.values.dark === heroHover.values.dark ? '= same value' : '≠ differs', note: 'Rule: hover must differ from default in every theme' },
      ]
    : f.evidence
  const canWrite = roleOf(sys, actingAs) !== 'viewer'

  return (
    <div className="page">
      <PageHead
        screen="finding"
        crumbs={[{ label: 'Changes', to: r.changes }, { label: 'Finding' }]}
        title={f.title}
        lead={f.summary}
        eyebrow={
          <>
            <SeverityChip severity={f.severity} />
            <FindingStatusChip status={f.status} />
            <Chip tone="outline">Fix side: {f.fixSide}</Chip>
          </>
        }
        actions={
          <>
            {f.prNumber && (
              <Link to={r.pr(f.prNumber)} className="btn btn--secondary">
                Pull request #{f.prNumber} <ArrowRight />
              </Link>
            )}
            {f.status === 'proposed' && f.changeId && (
              <Link to={r.impact(f.changeId)} className="btn btn--secondary">
                See the impact <ArrowRight />
              </Link>
            )}
          </>
        }
      />

      <div className="grid grid--side">
        <div className="stack">
          <Panel title="Evidence">
            <div className="evidence">
              {evidence.map((e, i) => (
                <div key={i} className="evidence__item">
                  <span className="evidence__label">{e.label}</span>
                  <span className="evidence__value">
                    {e.swatch && <Swatch color={e.swatch} />}
                    {e.value}
                  </span>
                  {e.note && <span className="evidence__note">{e.note}</span>}
                </div>
              ))}
            </div>
            {hero && (
              <DemoScope mode="dark" style={{ padding: 16, borderRadius: 12, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <DsButton>Default</DsButton>
                <DsButton state="hover">Hover</DsButton>
                <span style={{ fontSize: 12, color: 'var(--color-foreground-neutral-muted)' }}>Dark mode, live from the token values.</span>
              </DemoScope>
            )}
            {f.componentIds.length > 0 && (
              <div className="row">
                <span className="small muted">Also in:</span>
                {f.componentIds.map((cid) => (
                  <Link key={cid} to={r.component(cid)} className="chip chip--outline">
                    {sys.components.find((c) => c.id === cid)?.name}
                  </Link>
                ))}
              </div>
            )}
          </Panel>

          <div data-demo-focus="rule-panel">
          <Panel title={`Rule: ${rule.title}`} actions={<Chip tone={ruleEnabled ? 'ok' : 'outline'}>{ruleEnabled ? 'enabled' : 'switched off'}</Chip>}>
            <p className="small">{rule.description}</p>
            <Kv
              rows={[
                ['Source', `${rule.source} · ${rule.sourceDetail}`],
                ['Category', rule.category],
                ['Default severity', rule.severity],
              ]}
            />
            <span className="xs muted">
              Your team can switch rules off in the <Link to={r.contract}>contract</Link>. A switched-off rule still appears in the assessment report, marked as accepted.
            </span>
          </Panel>
          </div>
        </div>

        <div className="stack">
          <Panel title="Suggested fix" tight>
            {f.suggestedFix ? (
              <>
                <p className="small">{f.suggestedFix.description}</p>
                {f.suggestedFix.tokenChanges?.map((tc) => (
                  <div key={tc.tokenId + tc.mode} className="row small">
                    <Swatch color={tc.from} /> <code className="xs">{tc.from}</code> → <Swatch color={tc.to} /> <code className="xs">{tc.to}</code> <span className="muted">({tc.mode})</span>
                  </div>
                ))}
              </>
            ) : (
              <span className="small muted">No automatic fix. This goes to the readout as a decision.</span>
            )}
            {f.status === 'open' && (
              <div className="stack" style={{ gap: 8 }}>
                <Btn
                  disabled={!f.suggestedFix || !canWrite}
                  onClick={() => {
                    const cid = act().proposeFix(f.id)
                    if (cid) navigate(r.impact(cid))
                  }}
                >
                  <Wrench /> Propose a fix
                </Btn>
                <Btn variant="secondary" onClick={() => setDismissSheet(true)} disabled={!canWrite}>
                  <XCircle /> Dismiss with a reason
                </Btn>
                <Btn variant="ghost" onClick={() => setAskSheet(true)}>
                  <MessageSquare /> Ask a specialist
                </Btn>
                {!canWrite && <span className="xs muted">Viewers cannot propose or dismiss.</span>}
              </div>
            )}
            {f.status === 'dismissed' && (
              <Callout tone="default">
                Dismissed: “{f.dismissReason}”
                <div style={{ marginTop: 8 }}>
                  <Btn size="sm" variant="secondary" onClick={() => act().reopenFinding(f.id)}>
                    <RotateCcw /> Reopen
                  </Btn>
                </div>
              </Callout>
            )}
            {f.status === 'merged' && <Callout tone="ok">Resolved{f.prNumber ? ` in pull request #${f.prNumber}` : ''}.</Callout>}
          </Panel>
          <Panel tight>
            <Kv
              rows={[
                ['Found by', f.source === 'patrol' ? 'Patrol agent' : f.source === 'scan' ? 'Assessment scan' : 'CI audit'],
                ['Drift items', String(f.count ?? 1)],
                ['Tokens', f.tokenIds.length ? f.tokenIds.map((t) => <Link key={t} to={r.token(t)} className="xs" style={{ display: 'block' }}>{sys.tokens.find((x) => x.id === t)?.figmaName}</Link>) : '—'],
              ]}
            />
          </Panel>
        </div>
      </div>

      {dismissSheet && (
        <Sheet
          title="Dismiss with a reason"
          onClose={() => setDismissSheet(false)}
          actions={
            <>
              <Btn variant="secondary" onClick={() => setDismissSheet(false)}>
                Cancel
              </Btn>
              <Btn
                disabled={!reason.trim()}
                onClick={() => {
                  act().dismissFinding(f.id, reason.trim())
                  setDismissSheet(false)
                }}
              >
                Dismiss
              </Btn>
            </>
          }
        >
          <p className="small muted">The reason is recorded in the audit trail and shown in the assessment report. Dismissed findings do not count as fixed.</p>
          <textarea className="textarea" placeholder="e.g. Accepted: dark hover is intentionally flat for this brand until the Q1 refresh." value={reason} onChange={(e) => setReason(e.target.value)} />
        </Sheet>
      )}
      {askSheet && (
        <Sheet title="Ask a specialist" onClose={() => setAskSheet(false)} actions={<Btn onClick={() => setAskSheet(false)}>Close</Btn>}>
          <p className="small">
            In an engagement this opens a thread with the Nagarro specialist assigned to {sys.theme.name} (readouts, naming decisions, adapter fixes). In this demo there is no messaging.{!client && <> The <Link to={practice.clients}>client systems view</Link> shows which client needs a specialist this week.</>}
          </p>
        </Sheet>
      )}
    </div>
  )
}
