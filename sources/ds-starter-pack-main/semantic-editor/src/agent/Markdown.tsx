import { Fragment, type ReactNode } from 'react'

/** Inline `code`, **bold** and [links](url). */
function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = []
  const re = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const t = m[0]
    if (t.startsWith('`')) out.push(<code key={`${key}-${i++}`}>{t.slice(1, -1)}</code>)
    else if (t.startsWith('**')) out.push(<strong key={`${key}-${i++}`}>{t.slice(2, -2)}</strong>)
    else {
      const [, label, href] = t.match(/\[([^\]]+)\]\(([^)]+)\)/) ?? []
      out.push(
        /^https?:\/\//.test(href ?? '') ? (
          <a key={`${key}-${i++}`} href={href} target="_blank" rel="noreferrer">
            {label}
          </a>
        ) : (
          <Fragment key={`${key}-${i++}`}>{label}</Fragment>
        ),
      )
    }
    last = m.index + t.length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

/** A small, safe Markdown renderer for agent answers: paragraphs, headings, lists and code blocks. */
export function Markdown({ text }: { text: string }) {
  const blocks: ReactNode[] = []
  const lines = text.split('\n')
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim()
      const code: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) code.push(lines[i++])
      i++
      // ```do / ```dont: a pair of guidance cards.
      if (lang === 'do' || lang === 'dont') {
        blocks.push(
          <div key={blocks.length} className={`md-${lang}`}>
            <small>{lang === 'do' ? 'Do' : 'Don’t'}</small>
            <Markdown text={code.join('\n')} />
          </div>,
        )
        continue
      }
      blocks.push(
        <pre key={blocks.length}>
          <code>{code.join('\n')}</code>
        </pre>,
      )
      continue
    }
    // Pipe tables: | a | b |, then |---|---|, then rows.
    if (/^\s*\|.*\|\s*$/.test(line) && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1] ?? '')) {
      const cells = (l: string) => l.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, '|'))
      const head = cells(line)
      const rows: string[][] = []
      i += 2
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) rows.push(cells(lines[i++]))
      blocks.push(
        <div key={blocks.length} className="md-table">
          <table>
            <thead>
              <tr>
                {head.map((h, j) => (
                  <th key={j} scope="col">
                    {inline(h, `th${i}-${j}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri}>
                  {r.map((c, j) => (
                    <td key={j}>{inline(c, `td${i}-${ri}-${j}`)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      )
      continue
    }
    if (line.startsWith('> ')) {
      const quote: string[] = []
      while (i < lines.length && lines[i].startsWith('> ')) quote.push(lines[i++].slice(2))
      blocks.push(
        <blockquote key={blocks.length} className="md-callout">
          {inline(quote.join(' '), `q${i}`)}
        </blockquote>,
      )
      continue
    }
    if (/^#{1,4}\s/.test(line)) {
      const level = Math.min(4, Math.max(2, line.match(/^#+/)![0].length))
      const Tag = `h${level}` as 'h2'
      blocks.push(<Tag key={blocks.length}>{inline(line.replace(/^#+\s/, ''), `h${i}`)}</Tag>)
      i++
      continue
    }
    if (/^\s*([-*]|\d+\.)\s/.test(line)) {
      const ordered = /^\s*\d+\./.test(line)
      const items: string[] = []
      while (i < lines.length && /^\s*([-*]|\d+\.)\s/.test(lines[i])) items.push(lines[i++].replace(/^\s*([-*]|\d+\.)\s/, ''))
      const ListTag = ordered ? 'ol' : 'ul'
      blocks.push(
        <ListTag key={blocks.length}>
          {items.map((it, j) => (
            <li key={j}>{inline(it, `l${i}-${j}`)}</li>
          ))}
        </ListTag>,
      )
      continue
    }
    if (!line.trim()) {
      i++
      continue
    }
    const para: string[] = []
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|```|>\s|\s*\||\s*([-*]|\d+\.)\s)/.test(lines[i])) para.push(lines[i++])
    blocks.push(<p key={blocks.length}>{inline(para.join(' '), `p${i}`)}</p>)
  }
  return <div className="md">{blocks}</div>
}
