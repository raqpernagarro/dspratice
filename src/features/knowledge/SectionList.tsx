import { ExternalLink } from 'lucide-react'
import { Details } from '@/motion'
import { MarkdownLite } from '@/shell/markdown'
import { Chip, cx } from '@/shell/ui'
import type { KnowledgeDocument, KnowledgeSection } from '@/state/types'

export function refLabel(s: KnowledgeSection) {
  const r = s.ref
  if (r.frame) return `${r.page ? `${r.page} › ` : ''}${r.frame}`
  if (r.pageNumber) return `Page ${r.pageNumber}`
  if (r.line) return `${r.path ?? ''}:${r.line}`
  return r.path ?? ''
}

export function SectionList({ doc, highlightId, compact, limit }: { doc: KnowledgeDocument; highlightId?: string; compact?: boolean; limit?: number }) {
  const sections = highlightId ? [...doc.sections.filter((s) => s.id === highlightId), ...doc.sections.filter((s) => s.id !== highlightId)] : doc.sections
  return (
    <ul className="list section-list">
      {sections.slice(0, limit ?? sections.length).map((s) => (
        <li key={s.id} className={cx('list__item', s.id === highlightId && 'is-highlight')} id={s.id} data-testid={`section-${s.id}`}>
          <div className="list__body" style={{ width: '100%' }}>
            <div className="row row--between" style={{ gap: 8 }}>
              <span className="list__title">{s.heading}</span>
              <span className="row" style={{ gap: 6 }}>
                <Chip tone="outline">{refLabel(s)}</Chip>
                {s.ref.url && (
                  <a className="xs" href={s.ref.url} target="_blank" rel="noreferrer" title="Open this frame in Figma">
                    Open <ExternalLink style={{ width: 12 }} />
                  </a>
                )}
              </span>
            </div>
            {compact || s.id !== highlightId ? (
              <>
                <p className="small muted" style={{ margin: '4px 0' }}>{s.text.slice(0, 240)}{s.text.length > 240 ? '…' : ''}</p>
                {s.text.length > 240 && (
                  <Details summary="Full text">
                    <MarkdownLite text={s.text} className="prose--sm" />
                  </Details>
                )}
              </>
            ) : (
              <MarkdownLite text={s.text} className="prose--sm" />
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
