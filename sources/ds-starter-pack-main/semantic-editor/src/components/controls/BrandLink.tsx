import { ownsGroup, setBrandGroup, type BrandGroup } from '../../../../stories/base-ui/tokens/theme-config'
import { useSemanticEditor } from '../../context/SemanticEditorContext'
import { FieldGroup, Segmented } from './Field'

const LABEL: Record<BrandGroup, { title: string; what: string }> = {
  colors: { title: 'Colors', what: 'colors' },
  fonts: { title: 'Fonts', what: 'fonts' },
  shape: { title: 'Shape', what: 'shape (corners, shadows and style)' },
}

/**
 * When another brand is being viewed: whether this group follows the main brand or is the brand's
 * own. Following, edits here change the main brand, and every brand that follows it.
 */
export function BrandLink({ group }: { group: BrandGroup }) {
  const { theme, updateTheme } = useSemanticEditor()
  if (!theme.brand || theme.brands.length < 2) return null
  const brand = theme.brands.find((b) => b.id === theme.brand)
  if (!brand) return null
  const main = theme.brands[0].name
  const own = ownsGroup(theme, brand.id, group)
  return (
    <FieldGroup
      title={`${brand.name}’s ${LABEL[group].what}`}
      hint={
        own
          ? `${brand.name} has its own ${LABEL[group].what}. Changes here only affect ${brand.name}.`
          : `Follows ${main}: changes here apply to ${main} and every brand that follows it.`
      }
    >
      <Segmented
        label={`${brand.name}’s ${LABEL[group].what}`}
        value={own ? 'own' : 'follows'}
        options={[
          { value: 'follows', label: `Follows ${main}` },
          { value: 'own', label: 'Own' },
        ]}
        onChange={(v) => updateTheme((prev) => setBrandGroup(prev, brand.id, group, v === 'own'))}
      />
    </FieldGroup>
  )
}

/** For system-wide settings: says so when another brand is being viewed. */
export function SharedNote({ what }: { what: string }) {
  const { theme } = useSemanticEditor()
  if (!theme.brand || theme.brands.length < 2) return null
  return <p className="field-group__hint shared-note">{what} is shared by every brand.</p>
}
