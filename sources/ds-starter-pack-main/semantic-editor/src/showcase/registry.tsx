import type { ComponentType } from 'react'

import type { EditorSection } from '../context/SemanticEditorContext'
import {
  BadgesCard,
  ButtonsCard,
  CheckboxGroupCard,
  FieldsetCard,
  FormCard,
  NumberFieldCard,
  OtpFieldCard,
  RadioCard,
  RadioGroupCard,
  SliderCard,
  SwitchCard,
  ToggleCard,
  ToggleGroupCard,
  CheckboxCard,
  FieldCard,
  InputCard,
  MenuCard,
  MenuItemsCard,
  DialogCard,
  IconButtonsCard,
  NavCard,
  PaletteCard,
  SegmentsCard,
  SignUpCard,
  StatCard,
  TagsCard,
  ToastCard,
  TypeSpecimenCard,
  VerifyCard,
  AlertDialogCard,
  AutocompleteCard,
  ComboboxCard,
  DialogComponentCard,
  DrawerCard,
  ListboxCard,
  MenubarCard,
  NavigationMenuCard,
  OptionCard,
  PopoverCard,
  PreviewCardCard,
  SelectCard,
  ToastComponentCard,
  TooltipCard,
  AccordionCard,
  AvatarCard,
  CollapsibleCard,
  MeterCard,
  ProgressCard,
  ScrollAreaCard,
  SeparatorCard,
  TabsCard,
  ToolbarCard,
  BadgeCard,
  CardCard,
  SkeletonCard,
  BreadcrumbItemCard,
  BreadcrumbCard,
  PaginationCard,
  EmptyStateCard,
} from './cards'
import {
  ColorFoundation,
  ElevationFoundation,
  IconsFoundation,
  RadiusFoundation,
  SpacingFoundation,
  TypographyFoundation,
} from './foundations'
import { CardPattern, StatusPattern } from './patterns'

/**
 * The fewest card widths a tile spans on the canvas (1 = a regular card). Tiles also widen to fit their preview
 * (Tile measures it), so set this only for content that should read wide (a palette, a type scale).
 */
export type TileSpan = 1 | 2

export type ShowcaseGroup = 'foundations' | 'components' | 'patterns'

export interface ShowcaseItem {
  id: string
  title: string
  group: ShowcaseGroup
  span?: TileSpan
  /** One short line next to the title. */
  meta?: string
  /** Panel section the tile's "Edit" action opens. */
  edit?: EditorSection
  /** Key into PREVIEW_SECTION_TOKENS for the token inspector. */
  tokens?: string
  /** Overridable component (token slug): clicking the tile opens its component editor. */
  component?: string
  /** Center the content inside the tile body. */
  center?: boolean
  /** A drawing of one part (an option, a menu item): shown as a picture, not usable. */
  static?: boolean
  render: ComponentType
}

export const SHOWCASE_GROUPS: { id: ShowcaseGroup; label: string }[] = [
  { id: 'foundations', label: 'Foundations' },
  { id: 'components', label: 'Components' },
  { id: 'patterns', label: 'Patterns' },
]

/**
 * Everything shown on the canvas, in order. Add an entry here to showcase something new.
 * The canvas packs them into justified rows of similar heights (pack.ts), so order sets priority, not exact position.
 */
export const SHOWCASE_ITEMS: ShowcaseItem[] = [
  { id: 'palette', title: 'Palette', group: 'foundations', span: 2, meta: 'Brand · neutral · states', edit: 'color', tokens: 'color', render: PaletteCard },
  { id: 'specimen', title: 'Type', group: 'foundations', span: 2, edit: 'type', tokens: 'typography', render: TypeSpecimenCard },
  { id: 'signup', title: 'Sign up', group: 'patterns', tokens: 'form', render: SignUpCard },
  { id: 'buttons', title: 'Buttons', group: 'components', tokens: 'button', component: 'button', render: ButtonsCard },
  { id: 'verify', title: 'Verify', group: 'patterns', tokens: 'form', render: VerifyCard },
  { id: 'badges', title: 'Status', group: 'patterns', tokens: 'status', render: BadgesCard },
  { id: 'nav', title: 'Navigation', group: 'patterns', render: NavCard },
  { id: 'stat', title: 'Usage', group: 'patterns', render: StatCard },
  { id: 'dialog', title: 'Dialog', group: 'patterns', render: DialogCard },
  { id: 'toast', title: 'Toast', group: 'patterns', render: ToastCard },
  { id: 'tags', title: 'Team', group: 'patterns', render: TagsCard },
  { id: 'segments', title: 'Filters', group: 'patterns', render: SegmentsCard },
  { id: 'iconButtons', title: 'Icon buttons', group: 'components', tokens: 'iconButton', component: 'icon-button', center: true, render: IconButtonsCard },
  { id: 'status', title: 'Alerts', group: 'patterns', span: 2, meta: 'Tint · solid', edit: 'color', tokens: 'status', render: StatusPattern },
  { id: 'color', title: 'Color roles', group: 'foundations', span: 2, edit: 'color', tokens: 'color', render: ColorFoundation },
  { id: 'card', title: 'Cards', group: 'patterns', span: 2, tokens: 'card', render: CardPattern },
  { id: 'typography', title: 'Type scale', group: 'foundations', span: 2, edit: 'type', tokens: 'typography', render: TypographyFoundation },
  { id: 'radius', title: 'Radius', group: 'foundations', edit: 'radius', tokens: 'radius', render: RadiusFoundation },
  { id: 'spacing', title: 'Spacing', group: 'foundations', edit: 'spacing', tokens: 'spacing', render: SpacingFoundation },
  { id: 'elevation', title: 'Elevation', group: 'foundations', span: 2, edit: 'shadow', tokens: 'elevation', render: ElevationFoundation },
  { id: 'icons', title: 'Icons', group: 'foundations', tokens: 'icons', render: IconsFoundation },
  { id: 'form', title: 'Form', group: 'components', tokens: 'formSpec', component: 'form', render: FormCard },
  { id: 'fieldset', title: 'Fieldset', group: 'components', tokens: 'fieldset', component: 'fieldset', render: FieldsetCard },
  { id: 'input', title: 'Input', group: 'components', tokens: 'input', component: 'input', center: true, render: InputCard },
  { id: 'field', title: 'Field', group: 'components', tokens: 'field', component: 'field', center: true, render: FieldCard },
  { id: 'select', title: 'Select', group: 'components', tokens: 'select', component: 'select', center: true, render: SelectCard },
  { id: 'listbox', title: 'Listbox', group: 'components', tokens: 'listbox', component: 'listbox', center: true, static: true, render: ListboxCard },
  { id: 'option', title: 'Option', group: 'components', tokens: 'option', component: 'option', center: true, static: true, render: OptionCard },
  { id: 'combobox', title: 'Combobox', group: 'components', tokens: 'combobox', component: 'combobox', center: true, render: ComboboxCard },
  { id: 'autocomplete', title: 'Autocomplete', group: 'components', tokens: 'autocomplete', center: true, render: AutocompleteCard },
  { id: 'tabs', title: 'Tabs', group: 'components', tokens: 'tabs', component: 'tabs', render: TabsCard },
  { id: 'checkbox', title: 'Checkbox', group: 'components', tokens: 'checkbox', component: 'checkbox', center: true, render: CheckboxCard },
  { id: 'switch', title: 'Switch', group: 'components', tokens: 'switch', component: 'switch', center: true, render: SwitchCard },
  { id: 'radio', title: 'Radio group', group: 'components', tokens: 'radioGroup', component: 'radio-group', center: true, render: RadioGroupCard },
  { id: 'radioItem', title: 'Radio', group: 'components', tokens: 'radio', component: 'radio', center: true, render: RadioCard },
  { id: 'checkboxGroup', title: 'Checkbox group', group: 'components', tokens: 'checkboxGroup', component: 'checkbox-group', center: true, render: CheckboxGroupCard },
  { id: 'toggleGroup', title: 'Toggle group', group: 'components', tokens: 'toggleGroup', component: 'toggle-group', center: true, render: ToggleGroupCard },
  { id: 'toggle', title: 'Toggle', group: 'components', tokens: 'toggle', component: 'toggle', center: true, render: ToggleCard },
  { id: 'numberField', title: 'Number field', group: 'components', tokens: 'numberField', component: 'number-field', center: true, render: NumberFieldCard },
  { id: 'otp', title: 'OTP field', group: 'components', tokens: 'otpField', component: 'otp-slot', center: true, render: OtpFieldCard },
  { id: 'slider', title: 'Slider', group: 'components', tokens: 'slider', component: 'slider', center: true, render: SliderCard },
  { id: 'progress', title: 'Progress', group: 'components', tokens: 'progress', component: 'progress', center: true, render: ProgressCard },
  { id: 'meter', title: 'Meter', group: 'components', tokens: 'meter', component: 'meter', center: true, render: MeterCard },
  { id: 'accordion', title: 'Accordion', group: 'components', tokens: 'accordion', component: 'accordion', center: true, render: AccordionCard },
  { id: 'avatar', title: 'Avatar', group: 'components', tokens: 'avatar', component: 'avatar', center: true, render: AvatarCard },
  { id: 'tooltip', title: 'Tooltip', group: 'components', tokens: 'tooltip', component: 'tooltip', center: true, render: TooltipCard },
  { id: 'popover', title: 'Popover', group: 'components', tokens: 'popover', component: 'popover', center: true, render: PopoverCard },
  { id: 'previewCard', title: 'Preview card', group: 'components', tokens: 'previewCard', component: 'preview-card', center: true, render: PreviewCardCard },
  { id: 'menu', title: 'Menu', group: 'components', tokens: 'menu', component: 'menu', center: true, render: MenuCard },
  { id: 'menuItems', title: 'Menu items', group: 'components', tokens: 'menuItem', component: 'menu-item', center: true, static: true, render: MenuItemsCard },
  { id: 'menubar', title: 'Menubar', group: 'components', tokens: 'menubar', component: 'menubar', center: true, render: MenubarCard },
  { id: 'navigationMenu', title: 'Navigation menu', group: 'components', tokens: 'navigationMenu', component: 'navigation-menu', center: true, render: NavigationMenuCard },
  { id: 'dialogComponent', title: 'Dialog', group: 'components', tokens: 'dialog', component: 'dialog', center: true, render: DialogComponentCard },
  { id: 'alertDialog', title: 'Alert dialog', group: 'components', tokens: 'alertDialog', component: 'alert-dialog', center: true, render: AlertDialogCard },
  { id: 'drawer', title: 'Drawer', group: 'components', tokens: 'drawer', component: 'drawer', center: true, render: DrawerCard },
  { id: 'toastComponent', title: 'Toast', group: 'components', tokens: 'toast', component: 'toast', center: true, render: ToastComponentCard },
  { id: 'collapsible', title: 'Collapsible', group: 'components', tokens: 'collapsible', component: 'collapsible', center: true, render: CollapsibleCard },
  { id: 'separator', title: 'Separator', group: 'components', tokens: 'separator', component: 'separator', center: true, render: SeparatorCard },
  { id: 'toolbar', title: 'Toolbar', group: 'components', tokens: 'toolbar', component: 'toolbar', center: true, render: ToolbarCard },
  { id: 'scrollArea', title: 'Scroll area', group: 'components', tokens: 'scrollArea', component: 'scroll-area', center: true, render: ScrollAreaCard },
  { id: 'badge', title: 'Badge', group: 'components', tokens: 'badge', component: 'badge', center: true, render: BadgeCard },
  { id: 'cardComponent', title: 'Card', group: 'components', tokens: 'cardComponent', component: 'card', center: true, render: CardCard },
  { id: 'skeleton', title: 'Skeleton', group: 'components', tokens: 'skeleton', component: 'skeleton', center: true, render: SkeletonCard },
  { id: 'breadcrumbItem', title: 'Breadcrumb item', group: 'components', tokens: 'breadcrumbItem', component: 'breadcrumb-item', center: true, static: true, render: BreadcrumbItemCard },
  { id: 'breadcrumb', title: 'Breadcrumb', group: 'components', tokens: 'breadcrumb', component: 'breadcrumb', center: true, render: BreadcrumbCard },
  { id: 'pagination', title: 'Pagination', group: 'components', tokens: 'pagination', component: 'pagination', center: true, render: PaginationCard },
  { id: 'emptyState', title: 'Empty state', group: 'components', tokens: 'emptyState', component: 'empty-state', center: true, render: EmptyStateCard },
]
