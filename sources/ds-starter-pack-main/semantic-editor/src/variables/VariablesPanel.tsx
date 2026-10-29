import { CaretRight, Folder, Stack } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'

import { brandSlug, variableGraph } from '../../../stories/base-ui/tokens/variables-model'
import { PanelTabs } from '../components/PanelTabs'
import { useSemanticEditor } from '../context/SemanticEditorContext'
import { groupOf, useVariablesUi } from './VariablesContext'

interface GroupNode {
  path: string
  label: string
  count: number
  children: GroupNode[]
}

function buildTree(names: string[]): GroupNode[] {
  const root: GroupNode = { path: '', label: '', count: 0, children: [] }
  for (const name of names) {
    const parts = groupOf(name).split('/').filter(Boolean)
    let node = root
    let path = ''
    for (const part of parts) {
      path = path ? `${path}/${part}` : part
      let child = node.children.find((c) => c.label === part)
      if (!child) {
        child = { path, label: part, count: 0, children: [] }
        node.children.push(child)
      }
      child.count++
      node = child
    }
  }
  return root.children
}

function TreeNode({ node, depth }: { node: GroupNode; depth: number }) {
  const { group, setGroup } = useVariablesUi()
  const [open, setOpen] = useState(depth < 1 || (group?.startsWith(node.path) ?? false))
  const active = group === node.path
  return (
    <li>
      <div className={`vtree__row${active ? ' is-active' : ''}`} style={{ paddingLeft: 8 + depth * 14 }}>
        {node.children.length ? (
          <button type="button" className={`vtree__caret${open ? ' is-open' : ''}`} onClick={() => setOpen((o) => !o)} aria-label={open ? 'Collapse' : 'Expand'}>
            <CaretRight size={10} weight="bold" />
          </button>
        ) : (
          <span className="vtree__caret" />
        )}
        <button type="button" className="vtree__label" onClick={() => setGroup(active ? null : node.path)}>
          <Folder size={13} weight={active ? 'fill' : 'regular'} />
          <span>{node.label}</span>
          <em>{node.count}</em>
        </button>
      </div>
      {open && node.children.length ? (
        <ul>
          {node.children.map((c) => (
            <TreeNode key={c.path} node={c} depth={depth + 1} />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

/** Left panel in Variables view: collections, then the selected collection's groups. */
export function VariablesPanel() {
  const { collectionId, setCollectionId, group, setGroup, inCollection, changes, changedOnly, setChangedOnly } = useVariablesUi()
  const tree = useMemo(() => buildTree(inCollection.map((v) => v.name)), [inCollection])
  const { theme } = useSemanticEditor()
  const editedIn = (colId: string) => {
    const col = variableGraph.collection(colId)
    // A brand extension only carries the theme's changes when the theme uses that brand.
    if (col?.extends && brandSlug(col.name) !== theme.brand) return 0
    const sourceId = col?.extends ?? colId
    let n = 0
    for (const name of changes.byName.keys()) {
      const v = variableGraph.byName(name)
      // Component variables load on demand; until then, component overrides belong to "components".
      if (v ? v.collection === sourceId : col?.name === 'components') n++
    }
    return n
  }
  const counts = useMemo(() => {
    const out: Record<string, number> = {}
    for (const v of variableGraph.vars.values()) out[v.collection] = (out[v.collection] ?? 0) + 1
    return out
  }, [inCollection])

  return (
    <aside className="semantic-panel vpanel" aria-label="Collections">
      <PanelTabs />
      <div className="vpanel__section">
        <h3 className="vpanel__title">Collections</h3>
        <ul className="vpanel__collections">
          {variableGraph.collections.map((c) => {
            const edited = editedIn(c.id)
            const count = c.count || (c.extends ? counts[c.extends] : counts[c.id])
            return (
              <li key={c.id}>
                <button
                  type="button"
                  className={c.id === collectionId ? 'is-active' : ''}
                  onClick={() => setCollectionId(c.id)}
                  style={{ paddingLeft: c.extends ? 26 : 10 }}
                >
                  <Stack size={14} weight={c.id === collectionId ? 'fill' : 'regular'} />
                  <span className="vpanel__name">{c.name}</span>
                  {edited ? <i className="vpanel__edited" title={`${edited} changed`} /> : null}
                  <em>{count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count}</em>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
      <div className="vpanel__section vpanel__section--grow">
        <h3 className="vpanel__title">Groups</h3>
        <div className="vtree">
          <div className={`vtree__row${group === null ? ' is-active' : ''}`} style={{ paddingLeft: 8 }}>
            <span className="vtree__caret" />
            <button type="button" className="vtree__label" onClick={() => setGroup(null)}>
              <Folder size={13} weight={group === null ? 'fill' : 'regular'} />
              <span>All</span>
              <em>{inCollection.length}</em>
            </button>
          </div>
          <ul>
            {tree.map((n) => (
              <TreeNode key={n.path} node={n} depth={0} />
            ))}
          </ul>
        </div>
      </div>
      <footer className="semantic-panel__footer">
        <span className="saved-indicator">Saved locally</span>
        {changes.count ? (
          <button type="button" className="semantic-panel__footnote semantic-panel__footnote--link" aria-pressed={changedOnly} onClick={() => setChangedOnly(!changedOnly)}>
            {changes.count} variables changed{changedOnly ? '' : ' →'}
          </button>
        ) : (
          <span className="semantic-panel__footnote">No changes yet</span>
        )}
      </footer>
    </aside>
  )
}
