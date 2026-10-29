/**
 * Compact example cards for the system overview. Built from Base UI parts with the same demo
 * stylesheets the component tiles use, so they stay unopinionated and follow every theme change.
 */
import { Avatar } from '@base-ui/react/avatar'
import { Field } from '@base-ui/react/field'
import { Meter } from '@base-ui/react/meter'
import { OTPField } from '@base-ui/react/otp-field'
import { Progress } from '@base-ui/react/progress'
import { Separator } from '@base-ui/react/separator'
import { Toggle } from '@base-ui/react/toggle'
import { ToggleGroup } from '@base-ui/react/toggle-group'
import { ChartPieSlice, Cube, GearSix, House, Trash, X } from '@phosphor-icons/react'

import { Button } from '../../../stories/base-ui/components/button/Button'
import { Checkbox } from '../../../stories/base-ui/components/checkbox/Checkbox'
import { Field as DsField } from '../../../stories/base-ui/components/field/Field'
import { Input } from '../../../stories/base-ui/components/input/Input'
import { MenuItemPreview } from '../../../stories/base-ui/components/menu/Menu'
import { SPECIMENS } from '../../../stories/base-ui/components/specimens'
import { IconButton } from '../../../stories/base-ui/components/icon-button/IconButton'
import { oklchToHex, ramp, toOklch } from '../../../stories/base-ui/tokens/color-math'
import { neutralChroma, neutralHue } from '../../../stories/base-ui/tokens/theme-generator'
import avatarStyles from '../../../stories/base-ui/demos/official/avatar.module.css'
import dialogStyles from '../../../stories/base-ui/demos/official/dialog.module.css'
import fieldStyles from '../../../stories/base-ui/demos/official/field.module.css'
import meterStyles from '../../../stories/base-ui/demos/official/meter.module.css'
import otpStyles from '../../../stories/base-ui/demos/official/otp-field.module.css'
import progressStyles from '../../../stories/base-ui/demos/official/progress.module.css'
import toastStyles from '../../../stories/base-ui/demos/official/toast.module.css'
import toggleGroupStyles from '../../../stories/base-ui/demos/official/toggle-group.module.css'
import { useSemanticEditor } from '../context/SemanticEditorContext'
import { toHex } from '../lib/color'
import { primaryFamily, tv, useTokens } from './useThemeVars'

/* ------------------------------------------------------------- Palette */

export function PaletteCard() {
  const { modeTheme: theme } = useSemanticEditor()
  const t = useTokens()
  const k = theme.color.rampContrast ?? 1
  const primary = toHex(t('color/background/interactive/primary/default') || '#000').slice(0, 7)
  const accent = toHex(t('color/foreground/accent') || '#000').slice(0, 7)
  const seed = (toOklch(primary)?.c ?? 0) > 0.03 ? primary : accent
  const brand = Object.values(ramp(seed, k))
  const nh = neutralHue(theme)
  const tint = theme.color.neutralTint ?? 0
  const neutral = [0.985, 0.955, 0.91, 0.85, 0.77, 0.68, 0.58, 0.48, 0.38, 0.28, 0.18].map((l) =>
    oklchToHex({ l: Math.min(0.99, Math.max(0.12, 0.6 + (l - 0.6) * k)), c: neutralChroma(l, tint), h: nh, alpha: 1 }),
  )
  const status = ['error', 'warning', 'success', 'info'].map((s) => t(`color/foreground/${s}`))

  return (
    <div className="dc-palette">
      <div className="dc-palette__ramp dc-palette__ramp--brand">
        {brand.map((c, i) => (
          <span key={i} style={{ background: c }} title={c} />
        ))}
      </div>
      <div className="dc-palette__ramp">
        {neutral.map((c, i) => (
          <span key={i} style={{ background: c }} title={c} />
        ))}
      </div>
      <div className="dc-palette__status">
        {status.map((c, i) => (
          <span key={i} style={{ background: c }} />
        ))}
      </div>
    </div>
  )
}

/* ---------------------------------------------------------- Type specimen */

export function TypeSpecimenCard() {
  const t = useTokens()
  const heading = primaryFamily(t('font/family/secondary'))
  const body = primaryFamily(t('font/family/primary'))
  return (
    <div className="dc-specimen">
      <div className="dc-specimen__glyphs">
        Aa
        <br />
        123
        <br />
        #&amp;!
      </div>
      <div className="dc-specimen__info">
        <span className="dc-muted">{heading === body ? body : `${heading} · ${body}`}</span>
        <span style={{ fontWeight: tv('font/weight/body/regular') as unknown as number }}>Regular</span>
        <span style={{ fontWeight: tv('font/weight/body/strong') as unknown as number }}>Strong</span>
        <span style={{ fontWeight: tv('font/weight/heading/strong') as unknown as number }}>Heading</span>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- Buttons */

export function ButtonsCard() {
  return (
    <div className="dc-stack">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <hr className="dc-divider" />
      <div className="dc-row">
        <Button variant="primary" destructive>
          Delete
        </Button>
        <Button variant="ghost" destructive>
          Cancel
        </Button>
        <Button variant="primary" disabled>
          Disabled
        </Button>
      </div>
    </div>
  )
}

export function IconButtonsCard() {
  return (
    <div className="dc-row dc-row--center">
      {(['primary', 'secondary', 'outline', 'ghost'] as const).map((v) => (
        <IconButton key={v} variant={v} label={v} icon={<House weight="fill" />} />
      ))}
      <IconButton variant="primary" destructive label="Delete" icon={<Trash weight="fill" />} />
    </div>
  )
}

/* ---------------------------------------------------------------- Sign up */

export function SignUpCard() {
  return (
    <div className="dc-stack">
      <div>
        <h4 className="dc-title">Create an account</h4>
        <p className="dc-muted">Sign in to continue to your workspace.</p>
      </div>
      <Field.Root className={fieldStyles.Field}>
        <Field.Label className={fieldStyles.Label}>Email</Field.Label>
        <Field.Control className={fieldStyles.Input} defaultValue="maya@acme.design" />
      </Field.Root>
      <Field.Root className={fieldStyles.Field}>
        <Field.Label className={fieldStyles.Label}>Password</Field.Label>
        <Field.Control className={fieldStyles.Input} type="password" defaultValue="password" />
        <Field.Description className={fieldStyles.Description}>At least 8 characters</Field.Description>
      </Field.Root>
      <Button variant="primary">Get started</Button>
      <Button variant="secondary">Continue with Google</Button>
    </div>
  )
}

/* ----------------------------------------------------------------- Verify */

export function VerifyCard() {
  return (
    <div className={`${otpStyles.Field} dc-otp`}>
      <label className={otpStyles.Label}>Verification code</label>
      <OTPField.Root length={6} className={otpStyles.Root} defaultValue="8249">
        {Array.from({ length: 6 }, (_, i) => (
          <OTPField.Input key={i} className={otpStyles.Input} aria-label={`Character ${i + 1} of 6`} />
        ))}
      </OTPField.Root>
      <p className={otpStyles.Description}>Enter the code we sent to your device.</p>
    </div>
  )
}

/* ----------------------------------------------------------------- Status */

export function BadgesCard() {
  return (
    <ul className="dc-list">
      {(
        [
          ['success', 'Deployed', 'Production'],
          ['warning', 'Degraded', 'Search API'],
          ['error', 'Failed', 'Nightly build'],
          ['info', 'Queued', 'Preview'],
        ] as const
      ).map(([kind, state, name]) => (
        <li key={name}>
          <span>{name}</span>
          <span className="dc-status">
            <i style={{ background: tv(`color/foreground/${kind}`) }} />
            {state}
          </span>
        </li>
      ))}
    </ul>
  )
}

/* -------------------------------------------------------------------- Nav */

export function NavCard() {
  const items = [
    { icon: House, label: 'Overview' },
    { icon: Cube, label: 'Tokens', active: true },
    { icon: ChartPieSlice, label: 'Components' },
    { icon: GearSix, label: 'Settings' },
  ]
  return (
    <nav className="dc-nav">
      {items.map(({ icon: IconCmp, label, active }) => (
        <a key={label} className={active ? 'is-active' : ''} aria-current={active ? 'page' : undefined}>
          <IconCmp />
          {label}
        </a>
      ))}
    </nav>
  )
}

/* ------------------------------------------------------------------ Usage */

export function StatCard() {
  return (
    <div className="dc-stack dc-stack--loose">
      <Meter.Root className={meterStyles.Meter} value={72}>
        <Meter.Label className={meterStyles.Label}>Storage used</Meter.Label>
        <Meter.Value className={meterStyles.Value} />
        <Meter.Track className={meterStyles.Track}>
          <Meter.Indicator className={meterStyles.Indicator} />
        </Meter.Track>
      </Meter.Root>
      <Progress.Root className={progressStyles.Progress} value={60}>
        <Progress.Label className={progressStyles.Label}>Uploading files</Progress.Label>
        <Progress.Value className={progressStyles.Value} />
        <Progress.Track className={progressStyles.Track}>
          <Progress.Indicator className={progressStyles.Indicator} />
        </Progress.Track>
      </Progress.Root>
    </div>
  )
}

/* ----------------------------------------------------------------- Dialog */

/** Base UI dialog content, rendered in place instead of in a portal. */
export function DialogCard() {
  return (
    <div className="dc-popup">
      <h4 className={dialogStyles.Title}>Unsaved changes</h4>
      <p className={dialogStyles.Description}>Do you want to save or discard your changes?</p>
      <div className={dialogStyles.Actions}>
        <button type="button" className={dialogStyles.Button}>
          Discard
        </button>
        <button type="button" className={dialogStyles.Button}>
          Save
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Toast */

export function ToastCard() {
  return (
    <div className="dc-popup dc-popup--toast">
      <div>
        <p className={toastStyles.Title}>Changes saved</p>
        <p className={toastStyles.Description}>Your theme was updated.</p>
      </div>
      <button type="button" className={toastStyles.Close} aria-label="Close">
        <X />
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------- Team */

export function TagsCard() {
  return (
    <div className="dc-stack">
      <div className="dc-row">
        {['MA', 'JS', 'LT', 'RK'].map((n) => (
          <Avatar.Root key={n} className={avatarStyles.Root}>
            {n}
          </Avatar.Root>
        ))}
      </div>
      <Separator className="dc-separator" />
      <div className="dc-wrap">
        {['tokens', 'figma', 'base-ui'].map((tag) => (
          <span key={tag} className="dc-tag">
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- Filters */

export function SegmentsCard() {
  return (
    <ToggleGroup className={toggleGroupStyles.Panel} defaultValue={['all']}>
      {['All', 'Drafts', 'Published'].map((label) => (
        <Toggle key={label} value={label.toLowerCase()} className={`${toggleGroupStyles.Button} dc-toggle-text`}>
          {label}
        </Toggle>
      ))}
    </ToggleGroup>
  )
}

/* ------------------------------------------------- spec-driven controls */

export function CheckboxCard() {
  return (
    <div className="dc-stack">
      <Checkbox defaultChecked>Email me about updates</Checkbox>
      <Checkbox indeterminate>Select all</Checkbox>
      <Checkbox>Remember this device</Checkbox>
      <Checkbox disabled>Unavailable</Checkbox>
    </div>
  )
}

export function InputCard() {
  return (
    <div className="dc-stack">
      <Input placeholder="Search" aria-label="Search" />
      <Input defaultValue="Colm Tuite" showIcon={false} aria-label="Name" />
    </div>
  )
}

export function FieldCard() {
  return (
    <DsField label="Name" description="Visible on your profile" error="Please enter your name">
      <Input required placeholder="Required" />
    </DsField>
  )
}

export { LiveMenu as MenuCard } from './live'

export function MenuItemsCard() {
  return (
    <div className="dc-stack" style={{ width: 220 }}>
      <MenuItemPreview>Rename</MenuItemPreview>
      <MenuItemPreview state="highlighted">Duplicate</MenuItemPreview>
      <MenuItemPreview type="checkbox" checked>
        Show grid
      </MenuItemPreview>
      <MenuItemPreview type="radio" checked>
        Sort by name
      </MenuItemPreview>
      <MenuItemPreview type="submenu">Move to</MenuItemPreview>
      <MenuItemPreview state="disabled">Delete</MenuItemPreview>
    </div>
  )
}

/** A spec-driven component as its specimen in one variant (same as the Storybook matrices). */
const specimen = (slug: string, values: Record<string, string> = {}) =>
  function SpecimenCard() {
    return <>{SPECIMENS[slug]({ size: 'md', state: 'default', ...values })}</>
  }

export { LiveSwitch as SwitchCard } from './live'
export const RadioGroupCard = specimen('radio-group')
export { LiveRadio as RadioCard } from './live'
export const CheckboxGroupCard = specimen('checkbox-group')
export { LiveToggle as ToggleCard } from './live'
export const ToggleGroupCard = specimen('toggle-group')
export { LiveNumberField as NumberFieldCard } from './live'
export const OtpFieldCard = specimen('otp-field')
export { LiveSlider as SliderCard } from './live'
export const FieldsetCard = specimen('fieldset')
export const FormCard = specimen('form')
export { LivePopover as PopoverCard } from './live'
export { LiveTooltip as TooltipCard } from './live'
export { LivePreviewCard as PreviewCardCard } from './live'
export { LiveSelect as SelectCard } from './live'
export const ListboxCard = specimen('listbox')
export const OptionCard = specimen('option', { state: 'highlighted', selected: 'true' })
export { LiveCombobox as ComboboxCard } from './live'
export const AutocompleteCard = specimen('autocomplete')
export { LiveMenubar as MenubarCard } from './live'
export { LiveNavigationMenu as NavigationMenuCard } from './live'
export { LiveDialog as DialogComponentCard } from './live'
export { LiveAlertDialog as AlertDialogCard } from './live'
export { LiveDrawer as DrawerCard } from './live'
export { LiveToast as ToastComponentCard } from './live'
export const SeparatorCard = specimen('separator')
export const AvatarCard = specimen('avatar', { type: 'image' })
export const ProgressCard = specimen('progress')
export const MeterCard = specimen('meter')
export const TabsCard = specimen('tabs')
export const AccordionCard = specimen('accordion')
export { LiveCollapsible as CollapsibleCard } from './live'
export const ToolbarCard = specimen('toolbar')
export const ScrollAreaCard = specimen('scroll-area')
export const BadgeCard = specimen('badge', { type: 'success' })
export const CardCard = specimen('card')
export const SkeletonCard = specimen('skeleton')
export const BreadcrumbItemCard = specimen('breadcrumb-item', { state: 'current' })
export const BreadcrumbCard = specimen('breadcrumb')
export const PaginationCard = specimen('pagination')
export const EmptyStateCard = specimen('empty-state')
