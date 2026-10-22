// HTML → markdown-ish text without a DOM (works in Node scripts and the browser): headings become
// #, list items "- ", paragraphs and breaks newlines; scripts, styles and tags are dropped.

const ENT: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', hellip: '…', middot: '·', rarr: '→', times: '×' }

export function htmlToMarkdown(html: string): string {
  let s = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style|svg|noscript|head)[\s\S]*?<\/\1>/gi, '')
  s = s.replace(/<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/gi, (_m, l, t) => `\n${'#'.repeat(Number(l))} ${t.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}\n`)
  s = s.replace(/<h[4-6][^>]*>([\s\S]*?)<\/h[4-6]>/gi, (_m, t) => `\n**${t.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}**\n`)
  s = s.replace(/<li[^>]*>/gi, '\n- ').replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|section|article|li|tr|ul|ol|table|header|footer)>/gi, '\n').replace(/<\/t[dh]>/gi, ' · ')
  s = s.replace(/<[^>]+>/g, '')
  s = s.replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (m, e: string) => (e[0] === '#' ? String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)) : ENT[e.toLowerCase()] ?? m))
  return s.split('\n').map((l) => l.replace(/[ \t]+/g, ' ').trim()).filter((l, i, a) => l || (a[i - 1] ?? '') !== '').join('\n').trim()
}
