import { useNavigate } from 'react-router'
import { PackageCheck, EyeOff } from 'lucide-react'
import type { Project } from '@/state/types'
import { act } from '@/state/hooks'
import { nagarro, practice } from '@/app/routes'

/** Shown in the client workspace when a project has nothing published (or its experience is switched off). */
export function PublishedRequired({ project, internal, disabled }: { project: Project; internal: boolean; disabled?: boolean }) {
  const navigate = useNavigate()
  return (
    <div className="page">
      <div className="panel" style={{ maxWidth: 640, margin: '48px auto', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', padding: 14, borderRadius: 999, background: 'var(--n-mint-10, rgba(70,214,172,.12))', marginBottom: 12 }}>{disabled ? <EyeOff /> : <PackageCheck />}</div>
        <h2 style={{ marginTop: 0 }}>{disabled ? `${project.client.name}'s client experience is switched off` : `${project.client.name} has nothing published yet`}</h2>
        {internal ? (
          <>
            <p className="muted">
              {disabled
                ? 'Switch it on in the engagement settings, or open it as a presenter to preview.'
                : 'The client experience shows an approved version of the system. Publish the current draft as v1 to open it; internal drafts keep working independently.'}
            </p>
            <div className="row" style={{ justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
              {!disabled && (
                <button
                  className="btn btn--primary"
                  onClick={() => {
                    act().publishProject(project.id, 'First published version')
                    act().startDemoSession(project.id)
                    navigate(`/client/${project.slug}`)
                  }}
                >
                  Publish v1 and open
                </button>
              )}
              {disabled && (
                <button
                  className="btn btn--primary"
                  onClick={() => {
                    act().setClientExperience(project.id, { enabled: true })
                    navigate(`/client/${project.slug}`)
                  }}
                >
                  Switch it on and open
                </button>
              )}
              <button className="btn btn--secondary" onClick={() => navigate(nagarro(project.slug).home)}>
                Back to the engagement
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="muted">Your Nagarro team has not shared this workspace yet. You will receive a link once a version is published.</p>
            <button className="btn btn--secondary" onClick={() => navigate(practice.welcome)}>
              Back
            </button>
          </>
        )}
      </div>
    </div>
  )
}
