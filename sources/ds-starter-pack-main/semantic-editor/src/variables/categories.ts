import {
  ArrowsOutLineHorizontal,
  BoundingBox,
  Cards,
  DotsThreeOutline,
  Lightning,
  Palette,
  Ruler,
  TextAa,
  type Icon,
} from '@phosphor-icons/react'

import type { RawVariable } from '../../../stories/base-ui/tokens/variables-model'

import type { EditorSection } from '../context/SemanticEditorContext'

export type Category = 'color' | 'size' | 'space' | 'radius' | 'type' | 'effect' | 'motion' | 'other'

export const CATEGORIES: { id: Category; label: string; icon: Icon }[] = [
  { id: 'color', label: 'Color', icon: Palette },
  { id: 'size', label: 'Size', icon: Ruler },
  { id: 'space', label: 'Space', icon: ArrowsOutLineHorizontal },
  { id: 'radius', label: 'Radius', icon: BoundingBox },
  { id: 'type', label: 'Type', icon: TextAa },
  { id: 'effect', label: 'Effects', icon: Cards },
  { id: 'motion', label: 'Motion', icon: Lightning },
  { id: 'other', label: 'Other', icon: DotsThreeOutline },
]

/** Kind of token, from its type and path. */
export function categoryOf(v: RawVariable): Category {
  if (v.type === 'COLOR') return 'color'
  const n = v.name
  if (/motion|duration|ease/.test(n)) return 'motion'
  if (/effect|shadow|blur|offset/.test(n)) return 'effect'
  if (/font|line-height|letter|weight|family|type-scale|label\/size|decoration|list\/style/.test(n)) return 'type'
  if (/radius/.test(n)) return 'radius'
  if (/space|gap|padding|margin|inset/.test(n)) return 'space'
  if (/size|scale|width|height|border/.test(n)) return 'size'
  return 'other'
}

/** The rail is shared by both views: these pairs keep the selection when switching. */
export const SECTION_TO_CATEGORY: Record<EditorSection, Category> = {
  color: 'color',
  type: 'type',
  radius: 'radius',
  spacing: 'space',
  shadow: 'effect',
}

export const CATEGORY_TO_SECTION: Partial<Record<Category, EditorSection>> = Object.fromEntries(
  Object.entries(SECTION_TO_CATEGORY).map(([section, category]) => [category, section]),
)
