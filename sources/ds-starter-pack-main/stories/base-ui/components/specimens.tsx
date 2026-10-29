import type { CSSProperties, ReactNode } from 'react'
import { ArrowArcLeft, ArrowArcRight, ArrowRight, BookOpen, Compass, FolderSimple, Heart, House, Plus, TextAlignCenter, TextAlignLeft, TextAlignRight, TextB, TextItalic } from '@phosphor-icons/react'

import { Badge, type BadgeSize, type BadgeType } from './badge/Badge'
import { Card, type CardType } from './card/Card'
import { Skeleton, type SkeletonShape } from './skeleton/Skeleton'
import { Breadcrumb } from './breadcrumb/Breadcrumb'

import { Pagination, type PaginationSize } from './pagination/Pagination'
import { EmptyState } from './empty-state/EmptyState'
import type { VariantValues } from '../spec'
import { Button, type ButtonSize, type ButtonType } from './button/Button'
import { Checkbox, type CheckboxSize } from './checkbox/Checkbox'
import { Field as BaseField } from '@base-ui/react/field'
import { Field, type FieldSize } from './field/Field'
import { Input, type InputSize } from './input/Input'
import { IconButton } from './icon-button/IconButton'
import { MenuItemPreview, MenuPreview, type MenuItemType } from './menu/Menu'
import { NumberField, type NumberFieldSize } from './number-field/NumberField'
import { Fieldset } from './fieldset/Fieldset'
import { Form, FormActions } from './form/Form'
import { OtpField } from './otp-field/OtpField'
import { Slider, type SliderSize } from './slider/Slider'
import { CheckboxGroup } from './checkbox-group/CheckboxGroup'
import { Radio, type RadioSize } from './radio/Radio'
import { RadioGroup } from './radio-group/RadioGroup'
import { Switch, type SwitchSize } from './switch/Switch'
import { Toggle, type ToggleSize } from './toggle/Toggle'
import { ToggleGroup } from './toggle-group/ToggleGroup'
import { AlertDialogPreview } from './alert-dialog/AlertDialog'
import { ComboboxFieldPreview, type ComboboxSize } from './combobox/Combobox'
import { DialogPreview } from './dialog/Dialog'
import { DrawerPreview, type DrawerSide } from './drawer/Drawer'
import { ListboxPreview, OptionPreview } from './listbox/Listbox'
import { MenubarItemPreview, MenubarPreview } from './menubar/Menubar'
import { NavigationMenuItemPreview, NavigationMenuPreview, type NavigationMenuItemType } from './navigation-menu/NavigationMenu'
import { PopoverPreview } from './popover/Popover'
import { PreviewCardPreview } from './preview-card/PreviewCard'
import { SelectTriggerPreview, type SelectSize } from './select/Select'
import { ToastPreview, type ToastType } from './toast/Toast'
import type { PopupSide } from './shared/popup'
import { TooltipPreview } from './tooltip/Tooltip'
import { Accordion, AccordionItemPreview } from './accordion/Accordion'
import { Avatar, type AvatarSize } from './avatar/Avatar'
import { CollapsiblePreview } from './collapsible/Collapsible'
import { Meter } from './meter/Meter'
import { Progress } from './progress/Progress'
import { ScrollArea } from './scroll-area/ScrollArea'
import { Separator } from './separator/Separator'
import { TabPreview, Tabs, type TabsSize } from './tabs/Tabs'
import { Toolbar } from './toolbar/Toolbar'

// A local picture for avatar specimens (no network).
export const AVATAR_PICTURE =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><defs><linearGradient id="g" x2="1" y2="1"><stop offset="0" stop-color="#fcd34d"/><stop offset="1" stop-color="#f472b6"/></linearGradient></defs><rect width="96" height="96" fill="url(#g)"/><circle cx="48" cy="38" r="17" fill="#fff" opacity=".85"/><ellipse cx="48" cy="92" rx="32" ry="26" fill="#fff" opacity=".85"/></svg>',
  )

/** Hides a label from sight but not from screen readers: specimens that have no visible label still get a name. */
const visuallyHidden: CSSProperties = { position: 'absolute', width: 1, height: 1, margin: -1, padding: 0, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0 }

/** Props that show an interaction state statically: disabled, or data-preview-state for hover / pressed. */
export function previewState(state: string | undefined) {
  return {
    disabled: state === 'disabled',
    'data-preview-state': state === 'hover' || state === 'pressed' ? (state as 'hover' | 'pressed') : undefined,
  }
}

/**
 * Every spec-driven component rendered in one variant (code values from its spec's axes). Used by
 * the Storybook matrices and the configurator's component editor, so both show the same thing.
 */
export const SPECIMENS: Record<string, (v: VariantValues) => ReactNode> = {
  button: (v) => (
    <Button
      variant={v.type as ButtonType}
      size={v.size as ButtonSize}
      destructive={v.destructive === 'true'}
      leadIcon={<Plus weight="bold" />}
      trailIcon={<ArrowRight weight="fill" />}
      tabIndex={-1}
      {...previewState(v.state)}
    >
      Button
    </Button>
  ),
  'icon-button': (v) => (
    <IconButton
      variant={v.type as ButtonType}
      size={v.size as ButtonSize}
      destructive={v.destructive === 'true'}
      label="Home"
      icon={<House weight="fill" />}
      tabIndex={-1}
      {...previewState(v.state)}
    />
  ),
  checkbox: (v) => (
    <Checkbox
      size={v.size as CheckboxSize}
      checked={v.checked === 'checked'}
      indeterminate={v.checked === 'indeterminate'}
      tabIndex={-1}
      {...previewState(v.state)}
    >
      Label
    </Checkbox>
  ),
  input: (v) => (
    // Field.Root drives Base UI's data-invalid / data-disabled on the control.
    <BaseField.Root invalid={v.invalid === 'true'} disabled={v.state === 'disabled'} style={{ width: 200 }}>
      <Input
        size={v.size as InputSize}
        placeholder="Placeholder"
        defaultValue={v.filled === 'true' ? 'Value' : undefined}
        tabIndex={-1}
        data-preview-state={v.state === 'hover' || v.state === 'focused' ? v.state : undefined}
      />
    </BaseField.Root>
  ),
  field: (v) => (
    <Field label="Label" description="Description" error="Error message" size={v.size as FieldSize} invalid={v.invalid === 'true'} style={{ width: 240 }}>
      <Input placeholder="Placeholder" tabIndex={-1} />
    </Field>
  ),
  'menu-item': (v) => (
    <div style={{ width: 220 }}>
      <MenuItemPreview type={v.type as MenuItemType} state={v.state as 'default' | 'highlighted' | 'disabled'} checked={v.checked === 'true'} />
    </div>
  ),
  menu: () => <MenuPreview />,
  switch: (v) => (
    <Switch size={v.size as SwitchSize} checked={v.checked === 'true'} tabIndex={-1} {...previewState(v.state)}>
      Label
    </Switch>
  ),
  radio: (v) => (
    // A radio needs a group; a one-option group shows it checked or not.
    <RadioGroup value={v.checked === 'true' ? 'a' : ''} disabled={v.state === 'disabled'}>
      <Radio size={v.size as RadioSize} value="a" tabIndex={-1} data-preview-state={v.state === 'hover' || v.state === 'pressed' ? v.state : undefined}>
        Label
      </Radio>
    </RadioGroup>
  ),
  'radio-group': (v) => (
    <RadioGroup label="Delivery" size={v.size as RadioSize} defaultValue="standard">
      <Radio value="standard">Standard</Radio>
      <Radio value="express">Express</Radio>
      <Radio value="pickup">Pick up in store</Radio>
    </RadioGroup>
  ),
  'checkbox-group': (v) => (
    <CheckboxGroup label="Notifications" size={v.size as RadioSize} defaultValue={['email']}>
      <Checkbox value="email">Email</Checkbox>
      <Checkbox value="sms">SMS</Checkbox>
      <Checkbox value="push">Push</Checkbox>
    </CheckboxGroup>
  ),
  toggle: (v) => (
    <Toggle
      icon={Heart}
      label="Favorite"
      size={v.size as ToggleSize}
      pressed={v.selected === 'true'}
      tabIndex={-1}
      {...previewState(v.state)}
    />
  ),
  'toggle-group': (v) => (
    <ToggleGroup size={v.size as ToggleSize} defaultValue={['left']}>
      <Toggle value="left" icon={TextAlignLeft} label="Align left" />
      <Toggle value="center" icon={TextAlignCenter} label="Align center" />
      <Toggle value="right" icon={TextAlignRight} label="Align right" />
    </ToggleGroup>
  ),
  'number-field': (v) => (
    // Field.Root drives Base UI's data-invalid / data-disabled, like for Input.
    <BaseField.Root invalid={v.invalid === 'true'} disabled={v.state === 'disabled'}>
      <NumberField size={v.size as NumberFieldSize} defaultValue={100} aria-label="Amount" data-preview-state={v.state === 'hover' || v.state === 'focused' ? v.state : undefined} />
    </BaseField.Root>
  ),
  'otp-slot': (v) => (
    // One slot, alone: a length-1 field in the given state.
    <BaseField.Root invalid={v.invalid === 'true'} disabled={v.state === 'disabled'}>
      <BaseField.Label style={visuallyHidden}>Code</BaseField.Label>
      <OtpField
        length={1}
        size={v.size as SliderSize}
        defaultValue={v.filled === 'true' ? '4' : ''}
        data-preview-state={v.state === 'hover' || v.state === 'focused' ? v.state : undefined}
      />
    </BaseField.Root>
  ),
  'otp-field': (v) => (
    <BaseField.Root>
      <BaseField.Label style={visuallyHidden}>Verification code</BaseField.Label>
      <OtpField size={v.size as SliderSize} defaultValue="48" />
    </BaseField.Root>
  ),
  slider: (v) => (
    <Slider
      size={v.size as SliderSize}
      defaultValue={40}
      disabled={v.state === 'disabled'}
      thumbLabels={['Volume']}
      data-preview-state={v.state === 'hover' || v.state === 'focused' ? v.state : undefined}
    />
  ),
  fieldset: (v) => (
    <Fieldset legend="Billing details" size={v.size as SliderSize} style={{ width: 240 }}>
      <Field label="Company">
        <Input placeholder="Acme Inc." showIcon={false} />
      </Field>
      <Field label="Tax ID">
        <Input placeholder="EU123456789" showIcon={false} />
      </Field>
    </Fieldset>
  ),
  popover: (v) => <PopoverPreview side={(v.side ?? 'bottom') as PopupSide} />,
  tooltip: (v) => <TooltipPreview side={(v.side ?? 'bottom') as PopupSide} />,
  'preview-card': (v) => <PreviewCardPreview side={(v.side ?? 'bottom') as PopupSide} />,
  option: (v) => (
    <div style={{ width: 220 }}>
      <OptionPreview state={v.state as 'default' | 'highlighted' | 'disabled'} selected={v.selected === 'true'} />
    </div>
  ),
  listbox: () => <ListboxPreview />,
  select: (v) => (
    <div style={{ width: 200 }}>
      <SelectTriggerPreview
        size={v.size as SelectSize}
        state={v.state as 'default' | 'hover' | 'focused' | 'disabled'}
        filled={v.filled === 'true'}
        invalid={v.invalid === 'true'}
      />
    </div>
  ),
  combobox: (v) => (
    <div style={{ width: 200 }}>
      <ComboboxFieldPreview
        size={v.size as ComboboxSize}
        filled={v.filled === 'true'}
        invalid={v.invalid === 'true'}
        disabled={v.state === 'disabled'}
        previewState={v.state === 'hover' || v.state === 'focused' ? v.state : undefined}
      />
    </div>
  ),
  autocomplete: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 220 }}>
      <Input placeholder="e.g. feature" defaultValue="fe" tabIndex={-1} data-preview-state="focused" />
      <ListboxPreview indicator={false} />
    </div>
  ),
  'menubar-item': (v) => <MenubarItemPreview state={v.state as 'default' | 'hover' | 'open' | 'disabled'} />,
  menubar: () => <MenubarPreview />,
  'navigation-menu-item': (v) => (
    <NavigationMenuItemPreview type={v.type as NavigationMenuItemType} state={v.state as 'default' | 'hover'} active={v.active === 'true'} icon={House} />
  ),
  'navigation-menu': () => <NavigationMenuPreview icons={[House, Compass, BookOpen]} />,
  dialog: () => <DialogPreview />,
  'alert-dialog': () => <AlertDialogPreview />,
  drawer: (v) => <DrawerPreview side={(v.side ?? 'right') as DrawerSide} />,
  toast: (v) => <ToastPreview type={(v.type ?? 'neutral') as ToastType} />,
  'menu-group-label': () => (
    <div className="ds-menu" style={{ width: 220 }}>
      <div className="ds-menu-group-label">Library</div>
    </div>
  ),
  'menu-separator': () => (
    <div className="ds-menu" style={{ width: 220 }}>
      <div className="ds-menu-separator" />
    </div>
  ),
  'navigation-menu-link': (v) => (
    <div style={{ width: 280 }}>
      <span className="ds-navigation-menu-link" data-preview-state={v.state === 'hover' ? 'hover' : undefined}>
        <span className="ds-navigation-menu-link__title">Quick start</span>
        <span className="ds-navigation-menu-link__description">Install and assemble your first component.</span>
      </span>
    </div>
  ),
  separator: (v) =>
    v.orientation === 'vertical' ? (
      <div style={{ display: 'flex', gap: 12, height: 20, alignItems: 'center' }}>
        <span>Left</span>
        <Separator orientation="vertical" />
        <span>Right</span>
      </div>
    ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 240 }}>
        <span>Above</span>
        <Separator />
        <span>Below</span>
      </div>
    ),
  avatar: (v) => <Avatar size={v.size as AvatarSize} initials="LT" src={v.type === 'image' ? AVATAR_PICTURE : undefined} alt="" />,
  progress: (v) => (
    <div style={{ width: 240 }}>
      <Progress label="Export data" value={Number(v.value ?? 50)} />
    </div>
  ),
  meter: (v) => (
    <div style={{ width: 240 }}>
      <Meter label="Storage used" value={Number(v.value ?? 75)} />
    </div>
  ),
  tab: (v) => <TabPreview size={v.size as TabsSize} selected={v.selected === 'true'} state={v.state as 'default' | 'hover' | 'disabled'} />,
  tabs: (v) => (
    <Tabs.Root size={v.size as TabsSize} defaultValue="overview" style={{ width: 260 }}>
      <Tabs.List>
        <Tabs.Tab value="overview">Overview</Tabs.Tab>
        <Tabs.Tab value="projects">Projects</Tabs.Tab>
        <Tabs.Tab value="account">Account</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="overview">Workspace stats and activity.</Tabs.Panel>
      <Tabs.Panel value="projects">Milestones and deadlines.</Tabs.Panel>
      <Tabs.Panel value="account">Profile and preferences.</Tabs.Panel>
    </Tabs.Root>
  ),
  'accordion-item': (v) => (
    <div style={{ width: 300 }}>
      <AccordionItemPreview open={v.open === 'true'} state={v.state as 'default' | 'hover' | 'disabled'} />
    </div>
  ),
  accordion: () => (
    <div style={{ width: 320 }}>
      <Accordion.Root defaultValue={[0]}>
        <Accordion.Item value={0} title="What is Base UI?">
          A library of unstyled React components for design systems and web apps.
        </Accordion.Item>
        <Accordion.Item value={1} title="How do I get started?">
          Head to the Quick start guide in the docs.
        </Accordion.Item>
        <Accordion.Item value={2} title="Can I use it for my project?">
          Of course: it’s free and open source.
        </Accordion.Item>
      </Accordion.Root>
    </div>
  ),
  collapsible: (v) => (
    <div style={{ width: 220 }}>
      <CollapsiblePreview open={v.open === 'true'} state={v.state as 'default' | 'hover' | 'pressed' | 'disabled'} />
    </div>
  ),
  toolbar: () => (
    <Toolbar.Root aria-label="Formatting">
      <Toolbar.Group aria-label="History">
        <Toolbar.Button render={<IconButton variant="ghost" label="Undo" icon={<ArrowArcLeft weight="fill" />} />} />
        <Toolbar.Button render={<IconButton variant="ghost" label="Redo" icon={<ArrowArcRight weight="fill" />} />} />
      </Toolbar.Group>
      <Toolbar.Separator />
      <Toolbar.Group aria-label="Style">
        <Toolbar.Button render={<Toggle icon={TextB} label="Bold" defaultPressed />} />
        <Toolbar.Button render={<Toggle icon={TextItalic} label="Italic" />} />
      </Toolbar.Group>
      <Toolbar.Separator />
      <Toolbar.ToggleGroup aria-label="Alignment" defaultValue={['left']}>
        <Toolbar.Button render={<Toggle value="left" icon={TextAlignLeft} label="Align left" />} />
        <Toolbar.Button render={<Toggle value="center" icon={TextAlignCenter} label="Align center" />} />
        <Toolbar.Button render={<Toggle value="right" icon={TextAlignRight} label="Align right" />} />
      </Toolbar.ToggleGroup>
    </Toolbar.Root>
  ),
  'scroll-area': () => (
    <ScrollArea style={{ width: 320, height: 136 }}>
      <p>
        Vernacular architecture is building done outside any academic tradition, and without professional guidance. It is not a particular
        architectural movement or style, but rather a broad category.
      </p>
      <p>
        This type of architecture usually serves immediate, local needs, is constrained by the materials available in its region and reflects local
        traditions and cultural practices.
      </p>
    </ScrollArea>
  ),
  form: () => (
    <Form style={{ width: 240 }} onSubmit={(e) => e.preventDefault()}>
      <Field label="Email" error="Enter a valid email">
        <Input type="email" placeholder="you@company.com" showIcon={false} required />
      </Field>
      <Field label="Password">
        <Input type="password" placeholder="At least 8 characters" showIcon={false} required />
      </Field>
      <FormActions>
        <Button type="submit">Sign in</Button>
        <Button variant="ghost" type="button">Cancel</Button>
      </FormActions>
    </Form>
  ),
  badge: (v) => <Badge type={v.type as BadgeType} size={v.size as BadgeSize}>{v.type === 'neutral' ? 'Draft' : v.type.charAt(0).toUpperCase() + v.type.slice(1)}</Badge>,
  card: (v) => (
    <Card type={v.type as CardType} title="Starter plan" description="For small teams getting started." footer={<Button size="sm">Choose plan</Button>} style={{ width: 280 }}>
      Up to 5 projects and 10 GB of storage.
    </Card>
  ),
  skeleton: (v) => <div style={{ width: v.shape === 'circle' ? undefined : 160 }}><Skeleton shape={v.shape as SkeletonShape} height={v.shape === 'block' ? 64 : undefined} /></div>,
  'breadcrumb-item': (v) => (
    <ol style={{ display: 'flex', margin: 0, padding: 0, listStyle: 'none' }}>
      <Breadcrumb.Item href="#" current={v.state === 'current'} data-preview-state={v.state === 'hover' ? 'hover' : undefined}>
        Projects
      </Breadcrumb.Item>
    </ol>
  ),
  breadcrumb: () => (
    <Breadcrumb.Root>
      <Breadcrumb.Item href="#">Home</Breadcrumb.Item>
      <Breadcrumb.Item href="#">Projects</Breadcrumb.Item>
      <Breadcrumb.Item current>Design system</Breadcrumb.Item>
    </Breadcrumb.Root>
  ),
  pagination: (v) => <Pagination size={v.size as PaginationSize} pageCount={10} defaultPage={5} aria-label={`Pagination, ${v.size ?? "md"}`} />,
  'empty-state': () => (
    <EmptyState
      style={{ width: 360 }}
      icon={<FolderSimple weight="fill" />}
      title="No projects yet"
      description="Create a project to start designing with the system."
      actions={<Button size="sm" leadIcon={<Plus weight="bold" />}>New project</Button>}
    />
  ),
}
