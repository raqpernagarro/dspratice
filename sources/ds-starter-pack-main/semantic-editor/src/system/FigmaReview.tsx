import { useState } from 'react'

import type { SyncItem, SyncReview } from '../exchange/figmaSync'

const SECTIONS: { id: SyncItem['section']; title: string; hint: string }[] = [
  { id: 'values', title: 'Changed in Figma', hint: 'Values that differ from the system.' },
  { id: 'new', title: 'New in Figma', hint: 'Variables the system doesn’t have yet.' },
  { id: 'components', title: 'Rebound in components', hint: 'Layers bound to another variable than the system’s components use.' },
]

const SHOWN = 40

const when = (iso: string) => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

/** What changed in a Figma file, with Keep (Figma's) or the system's value for each change. */
export function FigmaReview({ review, keep, onKeep }: { review: SyncReview; keep: Set<string>; onKeep: (ids: string[], on: boolean) => void }) {
  const [all, setAll] = useState<Record<string, boolean>>({})
  const { base, items } = review
  const since = base ? `${base.source}${base.version ? ` v${base.version}` : ''}${when(base.syncedAt) ? `, ${when(base.syncedAt)}` : ''}` : ''

  return (
    <div className="sync-review">
      <p className="sync-review__lead">
        {base ? (
          <>
            Last synced with <b>{since}</b>. Since then:
          </>
        ) : (
          <>
            This file doesn’t remember a sync yet (an older plugin set it up), so this shows what differs from your system, with the system’s value suggested. From
            the next sync on, it can tell what you changed in Figma.
          </>
        )}
      </p>

      {items.length === 0 ? <p className="sync-review__empty">Figma matches your system: nothing to record.</p> : null}

      {SECTIONS.map((section) => {
        const rows = items.filter((i) => i.section === section.id)
        if (!rows.length) return null
        const open = rows.filter((i) => !i.blocked)
        const kept = open.filter((i) => keep.has(i.id)).length
        const shown = all[section.id] ? rows : rows.slice(0, SHOWN)
        // Without memory nobody knows who changed a value: it only differs.
        const title = section.id === 'values' && !base ? 'Different in Figma' : section.title
        const hint = section.id === 'values' && base ? 'Values you changed in Figma since the sync.' : section.hint
        return (
          <section key={section.id} className="sync-section" aria-label={title}>
            <header>
              <div>
                <strong>{title}</strong>
                <span>
                  {rows.length} · {kept} kept
                </span>
              </div>
              {open.length > 1 ? (
                <div className="sync-section__all">
                  <button type="button" className="doc-link" onClick={() => onKeep(open.map((i) => i.id), true)}>
                    Keep all
                  </button>
                  <button type="button" className="doc-link" onClick={() => onKeep(open.map((i) => i.id), false)}>
                    Use the system’s
                  </button>
                </div>
              ) : null}
            </header>
            <p className="sync-section__hint">{hint}</p>
            <ul>
              {shown.map((item) => (
                <li key={item.id} className={item.blocked ? 'is-blocked' : undefined}>
                  <label>
                    <input type="checkbox" checked={!item.blocked && keep.has(item.id)} disabled={Boolean(item.blocked)} onChange={(e) => onKeep([item.id], e.target.checked)} />
                    <span className="sync-row">
                      <code>{item.label}</code>
                      {item.status === 'both' ? <em className="sync-tag">Changed on both sides</em> : null}
                      <span className="sync-row__values">
                        <span>
                          Figma <b>{item.figma.replace(/^→ /, '')}</b>
                        </span>
                        {item.system !== undefined ? (
                          <span>
                            System <b>{item.system.replace(/^→ /, '')}</b>
                          </span>
                        ) : null}
                        {item.before !== undefined && item.status === 'both' ? (
                          <span>
                            At the sync <b>{item.before.replace(/^→ /, '')}</b>
                          </span>
                        ) : null}
                      </span>
                      {item.blocked ? <small>{item.blocked}</small> : null}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            {rows.length > shown.length ? (
              <button type="button" className="doc-link sync-section__more" onClick={() => setAll((a) => ({ ...a, [section.id]: true }))}>
                Show all {rows.length}
              </button>
            ) : null}
          </section>
        )
      })}

      {items.length ? (
        <p className="sync-review__note">
          Kept changes become part of the system as unsaved changes; save them as the next version. Anything not kept gets the system’s value with the next changes
          file.
        </p>
      ) : null}

      {review.systemChanged ? (
        <p className="sync-review__note">
          {review.systemChanged} value{review.systemChanged === 1 ? '' : 's'} changed in the system since the sync. Figma gets them with the next changes file.
        </p>
      ) : null}
    </div>
  )
}
