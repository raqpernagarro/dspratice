import { useState } from 'react'
import { Link } from 'react-router'
import { Save } from 'lucide-react'
import { useStore } from '@/state/store'
import { act, usePaths, useScope, useSystem } from '@/state/hooks'
import { effectiveActingAs } from '@/state/scope'
import { roleOf } from '@/state/selectors'
import { PageHead } from '@/shell/PageHead'
import { Btn, Callout, Panel } from '@/shell/ui'
import { TRUST_ACTION_LABELS } from '@/fixtures/demo-brand/system'
import type { TrustAction, TrustLevel } from '@/state/types'

const LEVELS: { id: TrustLevel; label: string; hint: string }[] = [
  { id: 'suggest', label: 'Suggest', hint: 'Agent proposes; a person approves.' },
  { id: 'autofix', label: 'Auto-fix', hint: 'Applies on its own, with undo.' },
  { id: 'never', label: 'Never', hint: 'Agents may not touch this.' },
]

export function TrustPage() {
  const sys = useSystem()
  const r = usePaths()
  const scope = useScope()
  const ui = useStore((x) => x.ui)
  const [draft, setDraft] = useState<Record<TrustAction, TrustLevel>>({ ...sys.trust })
  const role = roleOf(sys, effectiveActingAs({ ui }, scope))
  const dirty = (Object.keys(draft) as TrustAction[]).some((k) => draft[k] !== sys.trust[k])

  return (
    <div className="page page--narrow">
      <PageHead title="What agents may do on their own" lead="Set per action, not per agent. Mechanical fixes can apply on their own, with an undo; anything that changes meaning waits for a person; some things agents never do." />
      <Panel>
        <div className="trust-row" style={{ fontWeight: 500, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--n-fg-muted)' }}>
          <span>Action</span>
          {LEVELS.map((l) => (
            <span key={l.id} style={{ textAlign: 'center' }} title={l.hint}>
              {l.label}
            </span>
          ))}
        </div>
        {(Object.keys(TRUST_ACTION_LABELS) as TrustAction[]).map((a) => (
          <div key={a} className="trust-row">
            <span className="small">{TRUST_ACTION_LABELS[a]}</span>
            {LEVELS.map((l) => (
              <label key={l.id} title={l.hint}>
                <input type="radio" name={a} checked={draft[a] === l.id} onChange={() => setDraft({ ...draft, [a]: l.id })} disabled={role !== 'owner'} />
              </label>
            ))}
          </div>
        ))}
        <div className="row row--between">
          <span className="xs muted">{role === 'owner' ? 'Saved levels apply to pending proposals immediately.' : 'Only the design system owner sets trust levels.'}</span>
          <Btn
            disabled={!dirty || role !== 'owner'}
            onClick={() => {
              for (const k of Object.keys(draft) as TrustAction[]) if (draft[k] !== sys.trust[k]) act().setTrustLevel(k, draft[k])
            }}
          >
            <Save /> Save trust levels
          </Btn>
        </div>
      </Panel>
      <Callout tone="ai">
        Try it: set “Write guidance text” to Never, save, then open the <Link to={r.inbox}>Agent inbox</Link>. The Card guidance proposal shows as blocked.
      </Callout>
    </div>
  )
}
