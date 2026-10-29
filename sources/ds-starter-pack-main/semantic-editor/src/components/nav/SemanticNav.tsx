import {
  PencilSimpleLine,
  ArrowsOutLineHorizontal,
  BoundingBox,
  Cards,
  Palette,
  TextAa,
  type Icon,
} from '@phosphor-icons/react'

import { useSemanticEditor, type EditorSection } from '../../context/SemanticEditorContext'
import { OVERRIDABLE, sectionOf, type OverrideSection } from '../../../../stories/base-ui/tokens/component-tokens'
import { CATEGORIES } from '../../variables/categories'
import { useVariablesUi } from '../../variables/VariablesContext'

const NAV_ITEMS: { id: EditorSection; label: string; icon: Icon }[] = [
  { id: 'color', label: 'Color', icon: Palette },
  { id: 'type', label: 'Type', icon: TextAa },
  { id: 'radius', label: 'Radius', icon: BoundingBox },
  { id: 'spacing', label: 'Spacing', icon: ArrowsOutLineHorizontal },
  { id: 'shadow', label: 'Shadows', icon: Cards },
]

export function SemanticNav() {
  const { section, setSection, view } = useSemanticEditor()
  if (view === 'variables') return <VariablesNav />

  return (
    <nav className="semantic-nav" aria-label="Token categories">
      <ul className="semantic-nav__list">
        {NAV_ITEMS.map(({ id, label, icon: IconCmp }) => {
          const active = section === id
          return (
            <li key={id}>
              <button
                type="button"
                className={`semantic-nav__item${active ? ' is-active' : ''}`}
                aria-current={active ? 'page' : undefined}
                onClick={() => setSection(id)}
              >
                <span className="semantic-nav__icon">
                  <IconCmp size={20} weight={active ? 'fill' : 'regular'} />
                </span>
                <span className="semantic-nav__label">{label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/** In the Variables view the rail filters the table: everything the theme changed, or one kind of token. */
function VariablesNav() {
  const { category, setCategory, changes, changedOnly, setChangedOnly, changedByCategory } = useVariablesUi()
  return (
    <nav className="semantic-nav" aria-label="Token types">
      <ul className="semantic-nav__list">
        <li>
          <button
            type="button"
            className={`semantic-nav__item semantic-nav__item--changed${changedOnly ? ' is-active' : ''}`}
            aria-pressed={changedOnly}
            onClick={() => setChangedOnly(!changedOnly)}
            title="Every variable the theme or you changed"
          >
            <span className="semantic-nav__icon">
              <PencilSimpleLine size={20} weight={changedOnly ? 'fill' : 'regular'} />
              {changes.count ? <b className="semantic-nav__count">{changes.count > 999 ? '999+' : changes.count}</b> : null}
            </span>
            <span className="semantic-nav__label">Changed</span>
          </button>
        </li>
        <li className="semantic-nav__divider" aria-hidden="true" />
        {CATEGORIES.map(({ id, label, icon: IconCmp }) => {
          const active = !changedOnly && category === id
          const changed = changedByCategory[id] ?? 0
          return (
            <li key={id}>
              <button
                type="button"
                className={`semantic-nav__item${active ? ' is-active' : ''}`}
                aria-pressed={active}
                onClick={() => setCategory(id)}
                title={changed ? `${changed} changed` : undefined}
              >
                <span className="semantic-nav__icon">
                  <IconCmp size={20} weight={active ? 'fill' : 'regular'} />
                  {changed ? <i className="semantic-nav__dot" aria-label={`${changed} changed`} /> : null}
                </span>
                <span className="semantic-nav__label">{label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

const SECTION_NAV: { id: OverrideSection; label: string; icon: Icon }[] = [
  { id: 'color', label: 'Color', icon: Palette },
  { id: 'size', label: 'Size', icon: BoundingBox },
  { id: 'type', label: 'Type', icon: TextAa },
]

/** Inside a component editor the rail switches between that component's sections. */
export function ComponentNav() {
  const { editingComponent, componentSection, setComponentSection } = useSemanticEditor()
  const component = OVERRIDABLE.find((c) => c.slug === editingComponent)
  const present = new Set(component?.properties.map(sectionOf))
  return (
    <nav className="semantic-nav" aria-label={`${component?.name ?? 'Component'} sections`}>
      <ul className="semantic-nav__list">
        {SECTION_NAV.filter((s) => present.has(s.id)).map(({ id, label, icon: IconCmp }) => {
          const active = componentSection === id
          return (
            <li key={id}>
              <button
                type="button"
                className={`semantic-nav__item${active ? ' is-active' : ''}`}
                aria-current={active ? 'page' : undefined}
                onClick={() => setComponentSection(id)}
              >
                <span className="semantic-nav__icon">
                  <IconCmp size={20} weight={active ? 'fill' : 'regular'} />
                </span>
                <span className="semantic-nav__label">{label}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
