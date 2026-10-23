// The practice's tools inside the hub: the catalog on the Tools page, and one page per tool that
// opens it (src/fixtures/experiences.ts). Journeys link here rather than copying the tools.

import { useEffect } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowRight } from 'lucide-react'
import { practice } from '@/app/routes'
import { EXPERIENCES, JOURNEY_LABEL, experience, serverOf } from '@/fixtures/experiences'
import { useTools } from '@/integrations/tools'
import { PageHead } from '@/shell/PageHead'
import { Panel } from '@/shell/ui'
import { ExperienceFrame, RunChip } from './ExperienceFrame'

export { ExperienceFrame } from './ExperienceFrame'

/** The Tools page's first section: every tool the hub can open, and whether it is running. */
export function ToolCatalog() {
  const run = useTools((s) => s.run)
  const checkAll = useTools((s) => s.checkAll)
  useEffect(() => {
    void checkAll()
  }, [checkAll])
  return (
    <Panel title="Open a tool" flush>
      <ul className="tool-list" data-testid="tool-catalog">
        {EXPERIENCES.map((e) => {
          const s = serverOf(e)
          return (
            <li key={e.id}>
              <Link to={practice.tool(e.id)} className="tool-list__row" data-testid={`open-${e.id}`}>
                <span className="tool-list__main">
                  <strong>{e.name}</strong>
                  <span className="small muted">
                    {s.name} · {s.owner} · {JOURNEY_LABEL[e.journey]}
                  </span>
                </span>
                <RunChip state={run[s.id].state} />
                <ArrowRight className="tool-list__arrow" />
              </Link>
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}

export function ToolPage() {
  const { id = '' } = useParams()
  const e = experience(id)
  if (!e) {
    return (
      <div className="page">
        <PageHead title="No such tool" crumbs={[{ label: 'Tools', to: practice.tools }, { label: id }]} />
        <p>
          <Link to={practice.tools}>See every tool</Link>
        </p>
      </div>
    )
  }
  return (
    <div className="page page--tool">
      <PageHead title={e.name} lead={`${e.what} You get: ${e.get}`} crumbs={[{ label: 'Tools', to: practice.tools }, { label: e.name }]} />
      {e.note && <p className="small muted">{e.note}</p>}
      <ExperienceFrame e={e} />
    </div>
  )
}
