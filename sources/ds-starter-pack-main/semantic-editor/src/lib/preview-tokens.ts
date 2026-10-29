import { tokensUsed } from '../../../stories/base-ui/spec'
import { buttonSpec } from '../../../stories/base-ui/components/button/button.spec'
import { iconButtonSpec } from '../../../stories/base-ui/components/icon-button/icon-button.spec'
import { checkboxSpec } from '../../../stories/base-ui/components/checkbox/checkbox.spec'
import { fieldSpec } from '../../../stories/base-ui/components/field/field.spec'
import { inputSpec } from '../../../stories/base-ui/components/input/input.spec'
import { menuItemSpec } from '../../../stories/base-ui/components/menu/menu-item.spec'
import { menuSpec } from '../../../stories/base-ui/components/menu/menu.spec'
import { switchSpec } from '../../../stories/base-ui/components/switch/switch.spec'
import { radioSpec } from '../../../stories/base-ui/components/radio/radio.spec'
import { radioGroupSpec } from '../../../stories/base-ui/components/radio-group/radio-group.spec'
import { checkboxGroupSpec } from '../../../stories/base-ui/components/checkbox-group/checkbox-group.spec'
import { toggleSpec } from '../../../stories/base-ui/components/toggle/toggle.spec'
import { toggleGroupSpec } from '../../../stories/base-ui/components/toggle-group/toggle-group.spec'
import { numberFieldSpec } from '../../../stories/base-ui/components/number-field/number-field.spec'
import { otpSlotSpec } from '../../../stories/base-ui/components/otp-field/otp-slot.spec'
import { sliderSpec } from '../../../stories/base-ui/components/slider/slider.spec'
import { fieldsetSpec } from '../../../stories/base-ui/components/fieldset/fieldset.spec'
import { formSpec } from '../../../stories/base-ui/components/form/form.spec'
import { popoverSpec } from '../../../stories/base-ui/components/popover/popover.spec'
import { tooltipSpec } from '../../../stories/base-ui/components/tooltip/tooltip.spec'
import { previewCardSpec } from '../../../stories/base-ui/components/preview-card/preview-card.spec'
import { selectSpec } from '../../../stories/base-ui/components/select/select.spec'
import { listboxSpec } from '../../../stories/base-ui/components/listbox/listbox.spec'
import { optionSpec } from '../../../stories/base-ui/components/listbox/option.spec'
import { comboboxSpec } from '../../../stories/base-ui/components/combobox/combobox.spec'
import { menubarSpec } from '../../../stories/base-ui/components/menubar/menubar.spec'
import { menubarItemSpec } from '../../../stories/base-ui/components/menubar/menubar-item.spec'
import { navigationMenuSpec } from '../../../stories/base-ui/components/navigation-menu/navigation-menu.spec'
import { navigationMenuItemSpec } from '../../../stories/base-ui/components/navigation-menu/navigation-menu-item.spec'
import { dialogSpec } from '../../../stories/base-ui/components/dialog/dialog.spec'
import { alertDialogSpec } from '../../../stories/base-ui/components/alert-dialog/alert-dialog.spec'
import { drawerSpec } from '../../../stories/base-ui/components/drawer/drawer.spec'
import { toastSpec } from '../../../stories/base-ui/components/toast/toast.spec'
import { accordionItemSpec } from '../../../stories/base-ui/components/accordion/accordion-item.spec'
import { accordionSpec } from '../../../stories/base-ui/components/accordion/accordion.spec'
import { avatarSpec } from '../../../stories/base-ui/components/avatar/avatar.spec'
import { collapsibleSpec } from '../../../stories/base-ui/components/collapsible/collapsible.spec'
import { meterSpec } from '../../../stories/base-ui/components/meter/meter.spec'
import { progressSpec } from '../../../stories/base-ui/components/progress/progress.spec'
import { scrollAreaSpec } from '../../../stories/base-ui/components/scroll-area/scroll-area.spec'
import { emptyStateSpec } from '../../../stories/base-ui/components/empty-state/empty-state.spec'
import { paginationSpec } from '../../../stories/base-ui/components/pagination/pagination.spec'
import { breadcrumbSpec } from '../../../stories/base-ui/components/breadcrumb/breadcrumb.spec'
import { breadcrumbItemSpec } from '../../../stories/base-ui/components/breadcrumb/breadcrumb-item.spec'
import { skeletonSpec } from '../../../stories/base-ui/components/skeleton/skeleton.spec'
import { cardSpec } from '../../../stories/base-ui/components/card/card.spec'
import { badgeSpec } from '../../../stories/base-ui/components/badge/badge.spec'
import { separatorSpec } from '../../../stories/base-ui/components/separator/separator.spec'
import { tabSpec } from '../../../stories/base-ui/components/tabs/tab.spec'
import { tabsSpec } from '../../../stories/base-ui/components/tabs/tabs.spec'
import { toolbarSpec } from '../../../stories/base-ui/components/toolbar/toolbar.spec'

export type PreviewTokenKind = 'surface' | 'stroke' | 'label' | 'spacing' | 'typography' | 'other'

export interface PreviewToken {
  path: string
  kind: PreviewTokenKind
}

export function figmaTokenKind(path: string): PreviewTokenKind {
  if (path.startsWith('color/background') || path.startsWith('color/overlay')) return 'surface'
  if (path.startsWith('color/border')) return 'stroke'
  if (path.startsWith('color/foreground')) return 'label'
  if (path.startsWith('scale/') || path.startsWith('space/') || path.startsWith('size/')) return 'spacing'
  if (path.startsWith('shape/')) return 'spacing'
  if (path.startsWith('font/')) return 'typography'
  return 'other'
}

/** Paths whose demos read them (directly or via the --ds-* aliases in ds-aliases.css). */
function tokens(...paths: string[]): PreviewToken[] {
  return uniqueSorted(paths)
}

function uniqueSorted(paths: string[]): PreviewToken[] {
  return [...new Set(paths)].sort((a, b) => a.localeCompare(b)).map((path) => ({
    path,
    kind: figmaTokenKind(path),
  }))
}

/** Every token a spec-driven component reads (from its spec). */
function specTokens(spec: Parameters<typeof tokensUsed>[0]): PreviewToken[] {
  return uniqueSorted(tokensUsed(spec))
}

const CONTROL = [
  'color/background/neutral/primary',
  'color/foreground/neutral/primary',
  'color/border/interactive/default',
  'color/border/interactive/disabled',
  'color/foreground/interactive/disabled',
  'color/background/interactive/subtle/hover',
  'color/background/interactive/subtle/pressed',
  'color/shadow/focus-ring/primary',
  'font/family/primary',
  'font/size/body/md',
  'shape/radius/md',
]

const COLOR = [
  'color/background/neutral/primary',
  'color/background/neutral/secondary',
  'color/background/neutral/tertiary',
  'color/background/surface/low',
  'color/background/surface/medium',
  'color/background/surface/high',
  'color/background/inverted/primary',
  'color/foreground/neutral/primary',
  'color/foreground/neutral/secondary',
  'color/foreground/neutral/tertiary',
  'color/foreground/accent',
  'color/foreground/interactive/default',
  'color/background/interactive/primary/default',
  'color/background/interactive/secondary/default',
  'color/background/interactive/subtle/hover',
  'color/background/accent/default',
  'color/background/interactive/danger/default',
  'color/background/interactive/disabled',
  'color/border/neutral/subtle',
  'color/border/neutral/regular',
  'color/border/neutral/strong',
  'color/border/interactive/default',
  'color/border/interactive/selected',
]

const STATUS = ['info', 'success', 'warning', 'error'].flatMap((k) => [
  `color/background/${k}/subtle`,
  `color/background/${k}/strong`,
  `color/foreground/${k}`,
  `color/border/${k}`,
  `color/foreground/on-${k}/primary`,
])

/** Tokens referenced by each showcase tile (semantic paths, see Tokens-semantic-v2). */
export const PREVIEW_SECTION_TOKENS: Record<string, PreviewToken[]> = {
  color: tokens(...COLOR),
  typography: tokens(
    'font/family/primary',
    'font/family/secondary',
    ...['heading/xl', 'heading/lg', 'heading/md', 'body/lg', 'body/md', 'caption/md'].flatMap((s) => [`font/size/${s}`, `font/line-height/${s}`]),
    'font/weight/heading/strong',
    'font/weight/body/regular',
  ),
  spacing: tokens(...['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'].map((s) => `space/${s}`)),
  radius: tokens('shape/radius/sm', 'shape/radius/md', 'shape/radius/lg', 'shape/radius/full'),
  elevation: tokens(
    ...['low', 'medium', 'high'].flatMap((l) => [`effect/shadow/elevation/${l}`, `color/shadow/elevation/${l}`, `color/background/surface/${l}`]),
  ),
  icons: tokens('size/xs', 'size/sm', 'size/md', 'color/foreground/neutral/primary'),
  card: tokens(
    'color/background/surface/low',
    'color/background/neutral/secondary',
    'color/border/neutral/subtle',
    'color/foreground/neutral/primary',
    'color/foreground/neutral/secondary',
    'color/foreground/accent',
    'color/foreground/success',
    'color/background/success/subtle',
    'shape/radius/lg',
    'effect/shadow/elevation/low',
    'space/lg',
  ),
  status: tokens(...STATUS, 'shape/radius/md', 'effect/shadow/elevation/medium'),
  button: specTokens(buttonSpec),
  iconButton: specTokens(iconButtonSpec),
  form: tokens(...CONTROL, 'color/foreground/error', 'font/weight/body/strong'),
  input: specTokens(inputSpec),
  field: specTokens(fieldSpec),
  checkbox: specTokens(checkboxSpec),
  menu: specTokens(menuSpec),
  menuItem: specTokens(menuItemSpec),
  switch: specTokens(switchSpec),
  radio: specTokens(radioSpec),
  radioGroup: specTokens(radioGroupSpec),
  checkboxGroup: specTokens(checkboxGroupSpec),
  toggle: specTokens(toggleSpec),
  toggleGroup: specTokens(toggleGroupSpec),
  numberField: specTokens(numberFieldSpec),
  otpField: specTokens(otpSlotSpec),
  slider: specTokens(sliderSpec),
  fieldset: specTokens(fieldsetSpec),
  formSpec: specTokens(formSpec),
  tabs: [...specTokens(tabsSpec), ...specTokens(tabSpec)],
  separator: specTokens(separatorSpec),
  avatar: specTokens(avatarSpec),
  progress: specTokens(progressSpec),
  meter: specTokens(meterSpec),
  accordion: [...specTokens(accordionSpec), ...specTokens(accordionItemSpec)],
  collapsible: specTokens(collapsibleSpec),
  toolbar: specTokens(toolbarSpec),
  scrollArea: specTokens(scrollAreaSpec),
  emptyState: specTokens(emptyStateSpec),
  pagination: specTokens(paginationSpec),
  breadcrumb: specTokens(breadcrumbSpec),
  breadcrumbItem: specTokens(breadcrumbItemSpec),
  skeleton: specTokens(skeletonSpec),
  cardComponent: specTokens(cardSpec),
  badge: specTokens(badgeSpec),
  tooltip: specTokens(tooltipSpec),
  popover: specTokens(popoverSpec),
  previewCard: specTokens(previewCardSpec),
  select: specTokens(selectSpec),
  listbox: specTokens(listboxSpec),
  option: specTokens(optionSpec),
  combobox: specTokens(comboboxSpec),
  autocomplete: [...specTokens(inputSpec), ...specTokens(listboxSpec), ...specTokens(optionSpec)],
  menubar: [...specTokens(menubarSpec), ...specTokens(menubarItemSpec)],
  navigationMenu: [...specTokens(navigationMenuSpec), ...specTokens(navigationMenuItemSpec)],
  dialog: specTokens(dialogSpec),
  alertDialog: specTokens(alertDialogSpec),
  drawer: specTokens(drawerSpec),
  toast: specTokens(toastSpec),
}
