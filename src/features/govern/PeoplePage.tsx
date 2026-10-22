import { Bot, UserPlus } from 'lucide-react'
import { useStore } from '@/state/store'
import { act, useSys } from '@/state/hooks'
import { PageHead } from '@/shell/PageHead'
import { Btn, Callout, Chip, Panel } from '@/shell/ui'

export function PeoplePage() {
  const people = useSys((s) => s.people)
  const actingAs = useStore((x) => x.ui.actingAs)
  return (
    <div className="page">
      <PageHead
       
        title="Who can do what"
        lead="Roles follow the repository: approvals use its code owners and existing reviews, not a second permission system. Agents are listed too, because they work in the same repository."
        actions={
          <Btn variant="secondary" onClick={() => act().pushToast({ kind: 'sim', title: 'Invites are simulated', detail: 'In an engagement, people are added through the repository (CODEOWNERS) and the Figma team.' })}>
            <UserPlus /> Invite people
          </Btn>
        }
      />
      <Panel flush>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Who</th>
                <th>Role</th>
                <th>Can</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {people.map((p) => (
                <tr key={p.id}>
                  <td>
                    <span className="row">
                      {p.isAgent && <Bot style={{ width: 16, color: 'var(--n-ai)' }} />}
                      <strong>{p.name}</strong>
                    </span>
                  </td>
                  <td>
                    <Chip tone={p.role === 'owner' ? 'ink' : p.role === 'agent' ? 'ai' : 'outline'}>{p.role}</Chip>
                  </td>
                  <td className="small">{p.can}</td>
                  <td className="num">
                    {!p.isAgent && (
                      <Btn size="sm" variant={actingAs === p.id ? 'primary' : 'ghost'} onClick={() => act().setActingAs(p.id)}>
                        {actingAs === p.id ? 'Acting as' : 'Act as'}
                      </Btn>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Callout tone="ai">Agents follow the trust levels set by the owner. A patrol agent suggests; a publisher agent regenerates channels after a merge. Neither can merge.</Callout>
    </div>
  )
}
