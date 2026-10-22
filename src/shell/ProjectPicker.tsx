import { useNavigate } from 'react-router'
import { useStore } from '@/state/store'
import { act, useProject } from '@/state/hooks'
import { nagarro } from '@/app/routes'
import { hasUnpublishedChanges } from '@/state/scope'

/** Nagarro only: which engagement the project pages show. Stays on the same kind of page when switching. */
export function ProjectPicker() {
  const projects = useStore((s) => s.projects)
  const project = useProject()
  const navigate = useNavigate()
  const dirty = hasUnpublishedChanges(project)
  return (
    <div className="project-pick" title="Selected engagement">
      <select
        className="select project-pick__select"
        value={project.id}
        aria-label="Selected engagement"
        onChange={(e) => {
          const next = projects[e.target.value]
          if (!next) return
          act().selectProject(next.id)
          navigate(nagarro(next.slug).home)
        }}
      >
        {Object.values(projects).map((p) => (
          <option key={p.id} value={p.id} style={{ color: '#000' }}>
            {p.client.name} · {p.engagement.package}
          </option>
        ))}
      </select>
      <span className={dirty ? 'publish-pill is-dirty' : 'publish-pill'} title={dirty ? 'The draft has changes the client experience does not show yet' : 'The client experience shows the latest draft'}>
        {project.published ? (dirty ? `Draft ahead of v${project.published.version}` : `Published v${project.published.version}`) : 'Not published'}
      </span>
    </div>
  )
}
