import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import { variableGraph, type RawVariable } from '../../../stories/base-ui/tokens/variables-model'
import { useSemanticEditor } from '../context/SemanticEditorContext'
import { CATEGORY_TO_SECTION, SECTION_TO_CATEGORY, categoryOf, type Category } from './categories'
import { computeChanges, type ThemeChanges } from './changes'

interface VariablesUi {
  collectionId: string
  setCollectionId: (id: string) => void
  /** Path prefix ("color/background") or null for the whole collection. */
  group: string | null
  setGroup: (group: string | null) => void
  category: Category
  setCategory: (c: Category) => void
  query: string
  setQuery: (q: string) => void
  /** Variables shown for the current collection, after category + search (group not applied). */
  inCollection: RawVariable[]
  loading: boolean
  /** What the theme changes, shared by the Theme and Variables tabs. */
  changes: ThemeChanges
  /** Show only changed variables, across every category. */
  changedOnly: boolean
  setChangedOnly: (on: boolean) => void
  /** Changed variables per category (rail dots). */
  changedByCategory: Partial<Record<Category, number>>
}

const Ctx = createContext<VariablesUi | null>(null)
export function VariablesProvider({ children }: { children: ReactNode }) {
  const [collectionId, setCollectionIdState] = useState(variableGraph.semantic.id)
  const [group, setGroup] = useState<string | null>(null)
  const { view, section, setSection, source, theme } = useSemanticEditor()
  const changes = useMemo(() => computeChanges(theme), [theme, source])
  const [changedOnly, setChangedOnly] = useState(false)
  const [category, setCategoryState] = useState<Category>(SECTION_TO_CATEGORY[section])

  // A different file has different collection ids: start again from its semantic collection.
  useEffect(() => {
    setCollectionIdState(variableGraph.semantic.id)
    setGroup(null)
  }, [source])

  // Entering the Variables view lands on the filter matching the current Theme section.
  useEffect(() => {
    if (view === 'variables') {
      setCategoryState(SECTION_TO_CATEGORY[section])
      setGroup(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view])

  // Picking a filter also moves the Theme panel to the matching section (when there is one).
  const setCategory = useCallback(
    (c: Category) => {
      setCategoryState(c)
      setGroup(null)
      setChangedOnly(false)
      const s = CATEGORY_TO_SECTION[c]
      if (s) setSection(s)
    },
    [setSection],
  )
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [, setVersion] = useState(0)

  const setCollectionId = useCallback((id: string) => {
    setCollectionIdState(id)
    setGroup(null)
    const col = variableGraph.collection(id)
    const loaded = [...variableGraph.vars.values()].filter((v) => v.collection === id).length
    // The repo's components collection is split out; plugin imports already include everything.
    if (col?.name === 'components' && !variableGraph.imported && loaded < col.count) {
      setLoading(true)
      import('../../../stories/base-ui/tokens/figma-variables-components.json').then((m) => {
        variableGraph.addVariables((m.default as { variables: RawVariable[] }).variables)
        setLoading(false)
        setVersion((v) => v + 1)
      })
    }
  }, [])

  const col = variableGraph.collection(collectionId) ?? variableGraph.semantic
  // Brand extensions show the variables of the collection they extend.
  const sourceId = col.extends ?? col.id
  const inCollection = useMemo(() => {
    const q = query.trim().toLowerCase()
    return [...variableGraph.vars.values()]
      .filter((v) => v.collection === sourceId)
      .filter((v) => (changedOnly ? changes.byName.has(v.name) : categoryOf(v) === category))
      .filter((v) => !q || v.name.toLowerCase().includes(q))
      // Group first, then name, so each group's rows stay together under one header.
      .sort((a, b) => groupOf(a.name).localeCompare(groupOf(b.name)) || a.name.localeCompare(b.name))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceId, category, query, loading, source, changedOnly, changes])

  const changedByCategory = useMemo(() => {
    const out: Partial<Record<Category, number>> = {}
    for (const name of changes.byName.keys()) {
      const v = variableGraph.byName(name)
      if (v && v.collection === sourceId) out[categoryOf(v)] = (out[categoryOf(v)] ?? 0) + 1
    }
    return out
  }, [changes, sourceId])

  const value = useMemo(
    () => ({ collectionId, setCollectionId, group, setGroup, category, setCategory, query, setQuery, inCollection, loading, changes, changedOnly, setChangedOnly, changedByCategory }),
    [collectionId, setCollectionId, group, category, setCategory, query, inCollection, loading, changes, changedOnly, changedByCategory],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useVariablesUi() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useVariablesUi must be used within VariablesProvider')
  return ctx
}

/** "a/b/c/name" → "a/b/c". */
export const groupOf = (name: string) => name.slice(0, Math.max(0, name.lastIndexOf('/')))
