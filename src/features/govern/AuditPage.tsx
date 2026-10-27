import { useSys } from '@/state/hooks'
import { PageHead } from '@/shell/PageHead'
import { Chip, Panel } from '@/shell/ui'
import { relTime } from '@/state/selectors'

export function AuditPage() {
  const history = useSys((s) => s.history)
  return (
    <div className="page">
      <PageHead title="Audit trail" lead="Every action by a person or an agent, in order, with simulated actions marked. Steering groups and security teams usually ask for this." />
      <Panel flush>
        <div className="list" style={{ padding: '0 20px' }}>
          {history.map((h) => (
            <div key={h.id} className="list__item">
              <div className="list__body">
                <span className="list__title">{h.text}</span>
                <span className="list__meta">
                  {h.actor} · {relTime(h.ts)}
                  {h.entity && ` · ${h.entity.type} ${h.entity.id}`}
                </span>
              </div>
              {h.simulated && <Chip tone="dashed">local</Chip>}
            </div>
          ))}
          {history.length === 0 && <div className="empty">Nothing yet.</div>}
        </div>
      </Panel>
    </div>
  )
}
