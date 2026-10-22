// Nagarro knowledge export: the ONE text extractor, shared by every way we read Figma.
//   • figma-plugin/code.js (our development plugin; built by scripts/build-figma-plugin.mjs)
//   • scripts/figma-cli-extract.mjs (figma-cli `eval`, Safe or Browser mode)
//   • Claude Code's Figma MCP `use_figma` (read-only, text only: a few thousand tokens per file)
// Read only: it never changes the file. Output format: figma-text@1 (src/knowledge/extract/figmaText.ts).
//
// options: { pageId?, nodeIds?, fileKey?, capturedBy?, exclude?: [{ pattern, reason }], drop?: [regex source] }
async function extractCapture(options) {
  const opts = options || {}
  const page = opts.pageId ? await figma.getNodeByIdAsync(opts.pageId) : figma.currentPage
  if (!page || page.type !== 'PAGE') throw new Error('Page not found: ' + opts.pageId)
  if (page !== figma.currentPage) await figma.setCurrentPageAsync(page)
  let frames = page.children
  if (opts.nodeIds && opts.nodeIds.length) {
    const found = await Promise.all(opts.nodeIds.map((id) => figma.getNodeByIdAsync(id)))
    frames = found.filter(Boolean)
  }
  const drop = (opts.drop || ['^prepared for\\b', '^©\\s?\\d{4}', '^\\d{1,3}$']).map((s) => new RegExp(s, 'i'))
  const out = []
  const excluded = []
  for (const f of frames) {
    const rule = (opts.exclude || []).find((e) => new RegExp(e.pattern, 'i').test(f.name))
    if (rule) {
      excluded.push({ nodeId: f.id, name: f.name, reason: rule.reason })
      continue
    }
    const texts = []
    const visit = (n) => {
      if (n.visible === false) return
      let chars = null
      if (n.type === 'TEXT') chars = n.characters
      else if ((n.type === 'STICKY' || n.type === 'SHAPE_WITH_TEXT') && n.text) chars = n.text.characters
      if (chars && chars.trim() && !drop.some((re) => re.test(chars.trim()))) {
        const box = n.absoluteBoundingBox
        const size = n.type === 'TEXT' && typeof n.fontSize === 'number' ? Math.round(n.fontSize) : undefined
        texts.push({ text: chars.trim(), fontSize: size, x: box ? Math.round(box.x) : undefined, y: box ? Math.round(box.y) : undefined })
      }
      if ('children' in n) for (const c of n.children) visit(c)
    }
    visit(f)
    out.push({ nodeId: f.id, name: f.name, type: f.type, texts })
  }
  return {
    schema: 'figma-text@1',
    fileKey: opts.fileKey || figma.fileKey || '',
    fileName: figma.root.name,
    editorType: figma.editorType,
    page: { id: page.id, name: page.name },
    capturedAt: new Date().toISOString(),
    capturedBy: opts.capturedBy || 'figma-plugin',
    frames: out,
    excluded,
  }
}
