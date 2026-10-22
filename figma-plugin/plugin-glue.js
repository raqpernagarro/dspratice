// Plugin UI glue: export the current page (or the selected frames) as knowledge JSON.
figma.showUI(__html__, { width: 360, height: 300, themeColors: true })
figma.ui.onmessage = async (msg) => {
  if (msg.type !== 'export') return
  try {
    const sel = figma.currentPage.selection.filter((n) => n.parent && n.parent.type === 'PAGE')
    const capture = await extractCapture({ nodeIds: msg.selectionOnly && sel.length ? sel.map((n) => n.id) : undefined, fileKey: msg.fileKey || '', capturedBy: 'figma-plugin' })
    figma.ui.postMessage({ type: 'result', capture })
  } catch (e) {
    figma.ui.postMessage({ type: 'error', message: String((e && e.message) || e) })
  }
}
