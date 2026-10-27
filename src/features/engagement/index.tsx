import { Link } from 'react-router'
import { PageHead } from '@/shell/PageHead'
import { Panel } from '@/shell/ui'
import { practice } from '@/app/routes'

/** Engagement: advocating design at Nagarro. Round 7 phase 5 fills it with the posts board and Marketing Studio. */
export function EngagementPage() {
  return (
    <div className="page">
      <PageHead
        title="Engagement"
        lead="Share what the practice does: posts for the Nagarro Design page and our own accounts, social cuts of our demos, and Hugo França's Marketing Studio to plan and draft them."
      />
      <Panel>
        <p style={{ margin: 0 }}>
          Not built yet. The posts board (starting from Nuno Almeida's 17 Starter Pack posts) and the Marketing Studio tab come in the next part of this round. Until then, the demos to film live in <Link to={practice.demos}>Demos</Link>.
        </p>
      </Panel>
    </div>
  )
}
