import type { ComponentType } from 'react'

import { SPECIMENS } from '../../../stories/base-ui/components/specimens'
import { SPECS, type ComponentSpec } from '../../../stories/base-ui/spec'
import { CATEGORIES } from '../../../stories/base-ui/spec/categories'
import { SHOWCASE_ITEMS } from '../showcase/registry'
import { WRITTEN_PAGES } from '../system/pages'

/**
 * Every docs page, in sections. Pages are of four kinds:
 *  - foundation: live tiles from the configurator's showcase (generated from the theme)
 *  - component: generated from the component spec (playground, usage, anatomy, tokens, code)
 *  - written: Markdown a person owns (tone of voice, best practices…), sample text until edited
 *  - generated: built from the system's own data (token naming, token reference, versions, screens)
 */

export type DocKind = 'foundation' | 'component' | 'written' | 'generated'

export interface DocPage {
  id: string
  kind: DocKind
  title: string
  /** Top-level section ("Foundations"). */
  section: string
  /** Sub-group inside a section (component categories). */
  group?: string
  summary: string
  /** Searchable text beyond the title. */
  keywords: string
  spec?: ComponentSpec
  tiles?: { title: string; render: ComponentType }[]
  demo?: ComponentType
}

const tile = (id: string) => {
  const item = SHOWCASE_ITEMS.find((i) => i.id === id)
  return item ? [{ title: item.title, render: item.render }] : []
}

const written = (id: string, section: string): DocPage => {
  const w = WRITTEN_PAGES.find((p) => p.id === id)!
  return { id, kind: 'written', title: w.title, section, summary: w.summary, keywords: w.sample({ name: '', product: '', description: '' }) }
}

const generated = (id: string, title: string, section: string, summary: string, keywords = ''): DocPage => ({ id, kind: 'generated', title, section, summary, keywords })

const foundation = (id: string, title: string, summary: string, keywords: string, tiles: { title: string; render: ComponentType }[]): DocPage => ({
  id,
  kind: 'foundation',
  title,
  section: 'Foundations',
  summary,
  keywords,
  tiles,
})

function componentPages(): DocPage[] {
  const pages: DocPage[] = []
  for (const [group, names] of Object.entries(CATEGORIES)) {
    for (const name of names) {
      const spec = SPECS.find((s) => s.name === name)
      if (!spec) continue
      const demo = SHOWCASE_ITEMS.find((i) => i.component === spec.slug && i.group === 'components')?.render
      pages.push({
        id: `c-${spec.slug}`,
        kind: 'component',
        title: spec.name,
        section: 'Components',
        group,
        summary: spec.docs?.summary ?? '',
        keywords: [...(spec.docs?.usage ?? []), ...(spec.docs?.dont ?? [])].join(' '),
        spec,
        demo,
      })
    }
  }
  return pages
}

export const SECTIONS = ['Get started', 'Foundations', 'Tokens', 'Components', 'Patterns', 'Content', 'Best practices'] as const

export const DOC_PAGES: DocPage[] = [
  written('introduction', 'Get started'),
  written('principles', 'Get started'),
  generated('installation', 'Installation', 'Get started', 'Install the package and load the theme.', 'install npm package setup css json tokens'),
  generated('figma', 'Keep Figma in sync', 'Get started', 'Send the theme to the Figma file, and screens as frames.', 'figma plugin variables sync handoff design'),
  written('contributing', 'Get started'),
  generated('changelog', 'What changed', 'Get started', 'Every saved version, newest first.', 'version release history changelog'),

  foundation('f-color', 'Color', 'Brand, neutral and status palettes, and the roles that use them.', 'palette brand neutral status accent', [...tile('palette'), ...tile('color'), ...tile('status')]),
  foundation('f-type', 'Typography', 'Typefaces, sizes and the text styles components use.', 'font type heading body text style scale', [...tile('specimen'), ...tile('typography')]),
  foundation('f-space', 'Spacing', 'The spacing steps between and inside components.', 'space gap padding density', tile('spacing')),
  foundation('f-radius', 'Radius', 'Corner roundness, from sharp to pill.', 'corner round shape', tile('radius')),
  foundation('f-elevation', 'Elevation', 'Shadows that lift surfaces off the page.', 'shadow depth elevation', tile('elevation')),
  written('iconography', 'Foundations'),

  generated('naming', 'How tokens are named', 'Tokens', 'Read any token name at a glance.', 'token naming grammar tier aspect role prominence state'),
  generated('reference', 'Token reference', 'Tokens', 'Every semantic token and its value in this theme.', 'token variable value css'),

  ...componentPages(),

  written('forms', 'Patterns'),
  written('states', 'Patterns'),
  generated('screens', 'Example screens', 'Patterns', 'Screens built in Prototype, saved with the system.', 'prototype screen example'),

  written('voice', 'Content'),
  written('writing', 'Content'),

  written('accessibility', 'Best practices'),
  written('theming', 'Best practices'),
]

export const hasSpecimen = (spec: ComponentSpec) => Boolean(SPECIMENS[spec.slug])

/** Simple ranked search: title starts-with > title contains > summary/keywords contain. */
export function searchPages(query: string, pages: DocPage[] = DOC_PAGES): DocPage[] {
  const q = query.trim().toLowerCase()
  if (!q) return pages.slice(0, 12)
  return pages
    .map((p) => {
      const t = p.title.toLowerCase()
      let score = 0
      if (t === q) score = 100
      else if (t.startsWith(q)) score = 80
      else if (t.includes(q)) score = 60
      else if (p.summary.toLowerCase().includes(q)) score = 30
      else if (p.keywords.toLowerCase().includes(q) || p.section.toLowerCase().includes(q) || (p.group ?? '').toLowerCase().includes(q)) score = 15
      return { p, score }
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.p)
}
