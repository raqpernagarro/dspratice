import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { BRAND_KEYS, DEFAULT_THEME_CONFIG, withModeIntents, writeIntents, type ThemeConfig } from '../../../stories/base-ui/tokens/theme-config'
import { applyTheme } from '../../../stories/base-ui/tokens/theme-generator'
import { loadStoredTheme, saveStoredTheme } from '../../../stories/base-ui/tokens/theme-storage'
import type { VariablesExport } from '../../../stories/base-ui/tokens/exchange-format'
import {
  REPO_DATA,
  graphDataFromExport,
  variableGraph,
  type RawValue,
  type VariableSource,
} from '../../../stories/base-ui/tokens/variables-model'
import { defaultSelection, setComponentAnatomy, type Selection } from '../../../stories/base-ui/tokens/component-anatomy'
import { OVERRIDABLE, type OverrideSection } from '../../../stories/base-ui/tokens/component-tokens'
import { clearImport, loadImport, saveImport } from '../exchange/import-store'

export type EditorSection = 'color' | 'type' | 'radius' | 'spacing' | 'shadow'
/** Theme = intent controls + system canvas. Variables = Figma-style variable table. */
export type EditorView = 'theme' | 'variables'

interface SemanticEditorContextValue {
  theme: ThemeConfig
  /**
   * The choices that apply in the previewed mode. Same as `theme`, except in a mode set up
   * separately, where colors and shadow depth are that mode's own. Read colors and depth from here.
   */
  modeTheme: ThemeConfig
  /** Functional update of the whole theme. */
  updateTheme: (fn: (prev: ThemeConfig) => ThemeConfig) => void
  section: EditorSection
  setSection: (section: EditorSection) => void
  patchTheme: (patch: Partial<ThemeConfig>) => void
  patchNested: <K extends 'color' | 'type'>(key: K, patch: Partial<ThemeConfig[K]>) => void
  resetTheme: () => void
  /** Swaps in a whole theme (agent results, undo). */
  replaceTheme: (theme: ThemeConfig) => void
  view: EditorView
  setView: (view: EditorView) => void
  /** Sets (or with `undefined`, clears) a manual variable edit for the given mode ids. */
  setVariableEdit: (variableId: string, modeIds: string[], value: RawValue | undefined) => void
  clearVariableEdits: () => void
  /** Token path → value for every token the theme currently overrides. */
  overrides: Record<string, string>
  /** Increments after the theme is applied to the document, so readers can re-measure. */
  appliedVersion: number
  /** Plugin export currently driving the editor, or null for the repo's own variables. */
  source: VariableSource | null
  /** Loads a Figma plugin export. Variable edits are cleared (they belong to the previous file). */
  importVariables: (data: VariablesExport) => void
  /** Goes back to the repo's own variables. */
  resetToRepoVariables: () => void
  /** Component editor (a level below the system): token slug of the open component, or null. */
  editingComponent: string | null
  openComponent: (slug: string) => void
  closeComponent: () => void
  componentSection: OverrideSection
  setComponentSection: (section: OverrideSection) => void
  /** Which size / type / state the component editor points at. */
  selection: Selection
  patchSelection: (patch: Partial<Selection>) => void
  /** Sets (or with `undefined`, clears) a component override: token → semantic token. */
  setComponentOverride: (token: string, alias: string | undefined) => void
}

const SemanticEditorContext = createContext<SemanticEditorContextValue | null>(null)

interface SemanticEditorProviderProps {
  children: ReactNode
  /** The project's theme. Without it the editor starts from the theme saved in this browser. */
  initialTheme?: ThemeConfig
  /** Called after every theme change (the project store saves it). */
  onThemeChange?: (theme: ThemeConfig) => void
}

export function SemanticEditorProvider({ children, initialTheme, onThemeChange }: SemanticEditorProviderProps) {
  const [theme, setTheme] = useState<ThemeConfig>(() => initialTheme ?? loadStoredTheme())
  const [section, setSection] = useState<EditorSection>('color')
  const [view, setView] = useState<EditorView>('theme')
  const [overrides, setOverrides] = useState<Record<string, string>>({})
  const [appliedVersion, setAppliedVersion] = useState(0)
  const [source, setSource] = useState<VariableSource | null>(null)
  const [editingComponent, setEditingComponent] = useState<string | null>(null)
  const [componentSection, setComponentSection] = useState<OverrideSection>('color')
  const [selection, setSelection] = useState<Selection>({ size: 'Medium', kind: 'primary', state: 'Default' })

  const adopt = useCallback((data: VariablesExport) => {
    variableGraph.replace(graphDataFromExport(data), { fileName: data.fileName, exportedAt: data.exportedAt })
    setComponentAnatomy(data.components)
    setSource(variableGraph.imported)
  }, [])

  // Restore the last import (if any) on load.
  useEffect(() => {
    loadImport().then((data) => {
      if (data) {
        try {
          adopt(data)
        } catch {
          clearImport()
        }
      }
    })
  }, [adopt])

  // Mirrored to the single-theme key too: Storybook reads it on the same origin.
  useEffect(() => {
    saveStoredTheme(theme)
    onThemeChange?.(theme)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- report theme changes only
  }, [theme])

  // Applied to <html> so Base UI popups (portaled to <body>) inherit the theme.
  useLayoutEffect(() => {
    setOverrides(applyTheme(document.documentElement, theme))
    setAppliedVersion((v) => v + 1)
  }, [theme, source])

  const importVariables = useCallback(
    (data: VariablesExport) => {
      adopt(data)
      saveImport(data)
      setTheme((prev) => ({
        ...prev,
        variables: {},
        brand: prev.brand && variableGraph.brandCollection(prev.brand) ? prev.brand : null,
      }))
    },
    [adopt],
  )

  const resetToRepoVariables = useCallback(() => {
    variableGraph.replace(REPO_DATA, null)
    setComponentAnatomy(null)
    clearImport()
    setSource(null)
    setTheme((prev) => ({ ...prev, variables: {} }))
  }, [])

  // Colors, fonts and shape belong to the previewed brand (and colors and depth, in a mode set up
  // separately, to that mode). Everything else is system-wide.
  const patchTheme = useCallback((patch: Partial<ThemeConfig>) => {
    setTheme((prev) => {
      const owned: Partial<ThemeConfig> = {}
      const rest: Partial<ThemeConfig> = {}
      for (const [k, v] of Object.entries(patch)) ((BRAND_KEYS as readonly string[]).includes(k) ? owned : rest)[k as 'name'] = v as never
      return writeIntents({ ...prev, ...rest }, owned as Parameters<typeof writeIntents>[1])
    })
  }, [])

  const patchNested = useCallback(
    <K extends 'color' | 'type'>(key: K, patch: Partial<ThemeConfig[K]>) => {
      setTheme((prev) => writeIntents(prev, { [key]: { ...withModeIntents(prev)[key], ...patch } }))
    },
    [],
  )

  const updateTheme = useCallback((fn: (prev: ThemeConfig) => ThemeConfig) => setTheme(fn), [])
  const modeTheme = useMemo(() => withModeIntents(theme), [theme])

  const setVariableEdit = useCallback((variableId: string, modeIds: string[], value: RawValue | undefined) => {
    setTheme((prev) => {
      const forVar = { ...prev.variables[variableId] }
      for (const m of modeIds) {
        if (value === undefined) delete forVar[m]
        else forVar[m] = value
      }
      const variables = { ...prev.variables }
      if (Object.keys(forVar).length) variables[variableId] = forVar
      else delete variables[variableId]
      return { ...prev, variables }
    })
  }, [])

  const openComponent = useCallback((slug: string) => {
    setEditingComponent(slug)
    setComponentSection('color')
    const component = OVERRIDABLE.find((c) => c.slug === slug)
    if (component) setSelection(defaultSelection(component))
  }, [])
  const closeComponent = useCallback(() => setEditingComponent(null), [])

  const patchSelection = useCallback((patch: Partial<Selection>) => setSelection((prev) => ({ ...prev, ...patch })), [])

  const setComponentOverride = useCallback((token: string, alias: string | undefined) => {
    setTheme((prev) => {
      const components = { ...prev.components }
      if (alias === undefined) delete components[token]
      else components[token] = alias
      return { ...prev, components }
    })
  }, [])

  const clearVariableEdits = useCallback(() => setTheme((prev) => ({ ...prev, variables: {} })), [])

  const replaceTheme = useCallback((next: ThemeConfig) => setTheme(next), [])

  const resetTheme = useCallback(() => {
    setTheme((prev) =>
      // Another brand resets its own look; the main brand resets the system, keeping its shape
      // (modes and brands).
      prev.brand
        ? writeIntents(prev, { color: DEFAULT_THEME_CONFIG.color, type: DEFAULT_THEME_CONFIG.type, radius: null, depth: null, extras: DEFAULT_THEME_CONFIG.extras })
        : { ...DEFAULT_THEME_CONFIG, name: prev.name, modes: prev.modes, appearance: prev.appearance, brands: prev.brands, brand: null },
    )
  }, [])

  const value = useMemo(
    () => ({
      theme,
      modeTheme,
      updateTheme,
      section,
      setSection,
      patchTheme,
      patchNested,
      resetTheme,
      replaceTheme,
      view,
      setView,
      setVariableEdit,
      clearVariableEdits,
      overrides,
      appliedVersion,
      source,
      importVariables,
      resetToRepoVariables,
      editingComponent,
      openComponent,
      closeComponent,
      componentSection,
      setComponentSection,
      selection,
      patchSelection,
      setComponentOverride,
    }),
    [
      editingComponent,
      openComponent,
      closeComponent,
      componentSection,
      selection,
      patchSelection,
      setComponentOverride,
      theme,
      modeTheme,
      updateTheme,
      section,
      patchTheme,
      patchNested,
      resetTheme,
      replaceTheme,
      view,
      setVariableEdit,
      clearVariableEdits,
      overrides,
      appliedVersion,
      source,
      importVariables,
      resetToRepoVariables,
    ],
  )

  return <SemanticEditorContext.Provider value={value}>{children}</SemanticEditorContext.Provider>
}

export function useSemanticEditor() {
  const ctx = useContext(SemanticEditorContext)
  if (!ctx) {
    throw new Error('useSemanticEditor must be used within SemanticEditorProvider')
  }
  return ctx
}

/** Wrapper for the preview canvas (the theme itself lives on <html>). */
export function ThemeScope({ children }: { children: ReactNode }) {
  return <div className="canvas-scope">{children}</div>
}

export type { ThemeConfig }
