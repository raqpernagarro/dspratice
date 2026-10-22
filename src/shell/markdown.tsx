// A tiny markdown renderer for drafts and exports: headings, paragraphs, lists, bold, italic,
// inline code and links. Text is never injected as HTML.
import type { ReactNode } from 'react'
import { cx } from './ui'

function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = []
  const re = /(\*\*[^*]+\*\*|_[^_\n]+_|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const t = m[0]
    const k = `${key}-${i++}`
    if (t.startsWith('**')) out.push(<strong key={k}>{t.slice(2, -2)}</strong>)
    else if (t.startsWith('_')) out.push(<em key={k}>{t.slice(1, -1)}</em>)
    else if (t.startsWith('`')) out.push(<code key={k}>{t.slice(1, -1)}</code>)
    else {
      const mm = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(t)!
      const safe = /^(https?:|mailto:|\/)/.test(mm[2])
      out.push(safe ? <a key={k} href={mm[2]} target={mm[2].startsWith('/') ? undefined : '_blank'} rel="noreferrer">{mm[1]}</a> : mm[1])
    }
    last = m.index + t.length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

export function MarkdownLite({ text, className }: { text: string; className?: string }) {
  const blocks: ReactNode[] = []
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  let list: { ordered: boolean; items: string[] } | null = null
  let para: string[] = []
  const flushPara = () => {
    if (para.length) blocks.push(<p key={`p${blocks.length}`}>{inline(para.join(' '), `p${blocks.length}`)}</p>)
    para = []
  }
  const flushList = () => {
    if (!list) return
    const items = list.items.map((it, i) => <li key={i}>{inline(it, `l${blocks.length}-${i}`)}</li>)
    blocks.push(list.ordered ? <ol key={`l${blocks.length}`}>{items}</ol> : <ul key={`l${blocks.length}`}>{items}</ul>)
    list = null
  }
  for (const raw of lines) {
    const line = raw.trimEnd()
    const h = /^(#{1,3})\s+(.*)$/.exec(line)
    const ul = /^\s*[-*•]\s+(.*)$/.exec(line)
    const ol = /^\s*\d+[.)]\s+(.*)$/.exec(line)
    if (!line.trim()) {
      flushPara()
      flushList()
    } else if (h) {
      flushPara()
      flushList()
      const level = h[1].length
      const content = inline(h[2], `h${blocks.length}`)
      blocks.push(level === 1 ? <h3 key={`h${blocks.length}`}>{content}</h3> : <h4 key={`h${blocks.length}`}>{content}</h4>)
    } else if (ul || ol) {
      flushPara()
      const ordered = Boolean(ol)
      if (!list || list.ordered !== ordered) {
        flushList()
        list = { ordered, items: [] }
      }
      list.items.push((ul ?? ol)![1])
    } else {
      flushList()
      para.push(line.trim())
    }
  }
  flushPara()
  flushList()
  return <div className={cx('prose', 'prose--md', className)}>{blocks}</div>
}
