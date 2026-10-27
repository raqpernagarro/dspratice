// The practice's tools inside the workspace: one page per tool, opened from a journey, that
// opens it (src/fixtures/experiences.ts). Journeys link here rather than copying the tools.

import { Link, useParams } from 'react-router'
import { practice } from '@/app/routes'
import { experience } from '@/fixtures/experiences'
import { PageHead } from '@/shell/PageHead'
import { ExperienceFrame } from './ExperienceFrame'

export { ExperienceFrame } from './ExperienceFrame'

export function ToolPage() {
  const { id = '' } = useParams()
  const e = experience(id)
  if (!e) {
    return (
      <div className="page">
        <PageHead title="No such tool" crumbs={[{ label: 'Home', to: practice.home }, { label: id }]} />
        <p>
          <Link to={practice.home}>Back to Home</Link>
        </p>
      </div>
    )
  }
  return (
    <div className="page page--tool">
      <PageHead title={e.name} lead={`${e.what} You get: ${e.get}`} crumbs={[{ label: 'Home', to: practice.home }, { label: e.name }]} />
      {e.note && <p className="small muted">{e.note}</p>}
      <ExperienceFrame e={e} />
    </div>
  )
}
