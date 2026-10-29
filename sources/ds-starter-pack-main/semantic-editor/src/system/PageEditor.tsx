import { useState } from 'react'

import { Markdown } from '../agent/Markdown'
import { appType } from '../app/appTypes'
import { useProject } from '../app/AppContext'
import { fill, writtenPage } from './pages'

/** Full-screen Markdown editor for one written page, with a live preview in the system's theme. */
export function PageEditor({ id }: { id: string; onDone: () => void }) {
  const { doc, update } = useProject()
  const w = writtenPage(id)!
  const t = appType(doc.info.appType)
  const ctx = { name: doc.info.name, product: t.name.toLowerCase(), description: doc.info.description }
  const [text, setText] = useState(doc.pages[id] ?? fill(w.sample(ctx), ctx))
  const set = (value: string) => {
    setText(value)
    update((d) => ({ pages: { ...d.pages, [id]: value } }))
  }
  return (
    <div className="page-editor">
      <div className="page-editor__pane">
        <label htmlFor="page-md" className="page-editor__label">
          Markdown · <code>## Heading</code>, <code>- list</code>, <code>| tables |</code>, <code>```do</code> and <code>```dont</code> cards, <code>&gt; callout</code>
        </label>
        <textarea id="page-md" className="page-editor__input" value={text} onChange={(e) => set(e.target.value)} spellCheck />
        <button
          type="button"
          className="ui-btn ui-btn--ghost"
          onClick={() => {
            const sample = fill(w.sample(ctx), ctx)
            setText(sample)
            update((d) => {
              const pages = { ...d.pages }
              delete pages[id]
              return { pages }
            })
          }}
        >
          Back to the sample text
        </button>
      </div>
      <div className="page-editor__preview canvas-scope">
        <div className="doc-paper">
          <article className="doc-page">
            <header className="doc-hero">
              <h1>{w.title}</h1>
              <p className="doc-lede">{fill(w.summary, ctx)}</p>
            </header>
            <div className="doc-prose">
              <Markdown text={text} />
            </div>
          </article>
        </div>
      </div>
    </div>
  )
}
