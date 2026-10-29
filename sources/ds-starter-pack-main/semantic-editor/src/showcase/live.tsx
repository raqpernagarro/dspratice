import { BookOpen, Compass, Heart, House, TextB, TextItalic, TextUnderline } from '@phosphor-icons/react'
import { useState } from 'react'

import { AlertDialog } from '../../../stories/base-ui/components/alert-dialog/AlertDialog'
import { Button } from '../../../stories/base-ui/components/button/Button'
import { Collapsible } from '../../../stories/base-ui/components/collapsible/Collapsible'
import { Combobox } from '../../../stories/base-ui/components/combobox/Combobox'
import { Dialog } from '../../../stories/base-ui/components/dialog/Dialog'
import { Drawer } from '../../../stories/base-ui/components/drawer/Drawer'
import { Field } from '../../../stories/base-ui/components/field/Field'
import { IconButton } from '../../../stories/base-ui/components/icon-button/IconButton'
import { Menu } from '../../../stories/base-ui/components/menu/Menu'
import { Menubar } from '../../../stories/base-ui/components/menubar/Menubar'
import { NavigationMenu } from '../../../stories/base-ui/components/navigation-menu/NavigationMenu'
import { NumberField } from '../../../stories/base-ui/components/number-field/NumberField'
import { Popover } from '../../../stories/base-ui/components/popover/Popover'
import { PreviewCard } from '../../../stories/base-ui/components/preview-card/PreviewCard'
import { Radio } from '../../../stories/base-ui/components/radio/Radio'
import { RadioGroup } from '../../../stories/base-ui/components/radio-group/RadioGroup'
import { Select } from '../../../stories/base-ui/components/select/Select'
import { Slider } from '../../../stories/base-ui/components/slider/Slider'
import { Switch } from '../../../stories/base-ui/components/switch/Switch'
import { Toast } from '../../../stories/base-ui/components/toast/Toast'
import { Toggle } from '../../../stories/base-ui/components/toggle/Toggle'
import { Tooltip } from '../../../stories/base-ui/components/tooltip/Tooltip'

/**
 * Working versions of the component tiles, so a component can be tried right on the canvas:
 * open the select, toggle the switch, open the dialog. Same usage as each component's
 * Storybook "Default" example. Editing the component is the tile's pencil button.
 */

export function LiveSwitch() {
  return <Switch defaultChecked>Notifications</Switch>
}

export function LiveRadio() {
  return (
    <RadioGroup label="Delivery" defaultValue="standard">
      <Radio value="standard">Standard</Radio>
      <Radio value="express">Express</Radio>
    </RadioGroup>
  )
}

export function LiveToggle() {
  return <Toggle icon={Heart} label="Favorite" defaultPressed />
}

export function LiveNumberField() {
  return <NumberField defaultValue={100} min={0} max={999} aria-label="Amount" />
}

export function LiveSlider() {
  return (
    <div style={{ width: 200 }}>
      <Slider defaultValue={40} thumbLabels={['Volume']} />
    </div>
  )
}

const apples = [
  { label: 'Gala', value: 'gala' },
  { label: 'Fuji', value: 'fuji' },
  { label: 'Honeycrisp', value: 'honeycrisp' },
  { label: 'Granny Smith', value: 'granny-smith' },
]

export function LiveSelect() {
  return (
    <Field label="Apple" style={{ width: 220 }}>
      <Select.Root items={apples} defaultValue="fuji">
        <Select.Trigger placeholder="Select apple" />
        <Select.Popup>
          {apples.map(({ label, value }) => (
            <Select.Item key={value} value={value}>
              {label}
            </Select.Item>
          ))}
        </Select.Popup>
      </Select.Root>
    </Field>
  )
}

const fruits = ['Apple', 'Apricot', 'Banana', 'Blueberry', 'Cherry', 'Grape', 'Kiwi', 'Lemon', 'Mango', 'Orange', 'Peach', 'Pear']

export function LiveCombobox() {
  return (
    <Field label="Fruit" style={{ width: 220 }}>
      <Combobox.Root items={fruits}>
        <Combobox.Input placeholder="e.g. Apple" />
        <Combobox.Popup>
          <Combobox.Empty>No fruits found.</Combobox.Empty>
          <Combobox.List>
            {(fruit: string) => (
              <Combobox.Item key={fruit} value={fruit}>
                {fruit}
              </Combobox.Item>
            )}
          </Combobox.List>
        </Combobox.Popup>
      </Combobox.Root>
    </Field>
  )
}

export function LivePopover() {
  return (
    <Popover.Root>
      <Popover.Trigger>Notifications</Popover.Trigger>
      <Popover.Popup>
        <Popover.Title>Notifications</Popover.Title>
        <Popover.Description>You are all caught up. Good job!</Popover.Description>
      </Popover.Popup>
    </Popover.Root>
  )
}

const tools = [
  ['Bold', TextB],
  ['Italic', TextItalic],
  ['Underline', TextUnderline],
] as const

export function LiveTooltip() {
  return (
    <Tooltip.Provider>
      <div style={{ display: 'flex', gap: 4 }}>
        {tools.map(([label, IconCmp]) => (
          <Tooltip.Root key={label}>
            <Tooltip.Trigger render={<IconButton variant="ghost" label={label} icon={<IconCmp weight="fill" />} />} />
            <Tooltip.Popup>{label}</Tooltip.Popup>
          </Tooltip.Root>
        ))}
      </div>
    </Tooltip.Provider>
  )
}

const PICTURE =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="288"><defs><linearGradient id="g" x2="1" y2="1"><stop offset="0" stop-color="#c7d2fe"/><stop offset="1" stop-color="#fbcfe8"/></linearGradient></defs><rect width="480" height="288" fill="url(#g)"/><text x="40" y="200" font-family="Georgia" font-size="140" fill="#1e1b4b">Aa</text></svg>',
  )

export function LivePreviewCard() {
  return (
    <PreviewCard.Root>
      <p style={{ margin: 0, maxWidth: 220 }}>
        The principles of good <PreviewCard.Trigger href="#" onClick={(e) => e.preventDefault()}>typography</PreviewCard.Trigger> remain in the digital age.
      </p>
      <PreviewCard.Popup>
        <PreviewCard.Image src={PICTURE} alt="The letters Aa on a soft gradient" />
        <PreviewCard.Title>Typography</PreviewCard.Title>
        <PreviewCard.Summary>The art and science of arranging type to make written language clear and appealing.</PreviewCard.Summary>
      </PreviewCard.Popup>
    </PreviewCard.Root>
  )
}

export function LiveMenu() {
  const [shuffle, setShuffle] = useState(true)
  const [sort, setSort] = useState('date')
  return (
    <Menu.Root>
      <Menu.Trigger>Song</Menu.Trigger>
      <Menu.Popup>
        <Menu.Group>
          <Menu.GroupLabel>Library</Menu.GroupLabel>
          <Menu.Item>Add to Library</Menu.Item>
          <Menu.SubmenuRoot>
            <Menu.SubmenuTrigger>Share</Menu.SubmenuTrigger>
            <Menu.Popup side="right" align="start" sideOffset={4}>
              <Menu.Item>Copy link</Menu.Item>
              <Menu.Item>Email</Menu.Item>
            </Menu.Popup>
          </Menu.SubmenuRoot>
          <Menu.Item disabled>Download</Menu.Item>
        </Menu.Group>
        <Menu.Separator />
        <Menu.CheckboxItem checked={shuffle} onCheckedChange={setShuffle}>
          Shuffle
        </Menu.CheckboxItem>
        <Menu.Separator />
        <Menu.Group>
          <Menu.GroupLabel>Sort by</Menu.GroupLabel>
          <Menu.RadioGroup value={sort} onValueChange={setSort}>
            <Menu.RadioItem value="date">Date added</Menu.RadioItem>
            <Menu.RadioItem value="title">Title</Menu.RadioItem>
          </Menu.RadioGroup>
        </Menu.Group>
      </Menu.Popup>
    </Menu.Root>
  )
}

const menus = {
  File: ['New', 'Open', 'Save', null, 'Print'],
  Edit: ['Cut', 'Copy', 'Paste'],
  View: ['Zoom in', 'Zoom out'],
}

export function LiveMenubar() {
  return (
    <Menubar.Root>
      {Object.entries(menus).map(([name, items]) => (
        <Menu.Root key={name}>
          <Menubar.Trigger>{name}</Menubar.Trigger>
          <Menu.Popup sideOffset={6}>
            {items.map((item, i) => (item ? <Menu.Item key={item}>{item}</Menu.Item> : <Menu.Separator key={i} />))}
          </Menu.Popup>
        </Menu.Root>
      ))}
    </Menubar.Root>
  )
}

const overview = [
  ['Quick start', 'Install and assemble your first component.'],
  ['Accessibility', 'Learn how we build accessible components.'],
]
const handbook = [
  ['Styling', 'Style components with plain CSS or Tailwind.'],
  ['Composition', 'Replace and compose parts with your own components.'],
]

export function LiveNavigationMenu() {
  return (
    <NavigationMenu.Root>
      <NavigationMenu.List>
        <NavigationMenu.Item>
          <NavigationMenu.Link href="#" icon={House} active onClick={(e) => e.preventDefault()}>
            Home
          </NavigationMenu.Link>
        </NavigationMenu.Item>
        {(
          [
            ['Overview', Compass, overview],
            ['Handbook', BookOpen, handbook],
          ] as const
        ).map(([name, icon, links]) => (
          <NavigationMenu.Item key={name}>
            <NavigationMenu.Trigger icon={icon}>{name}</NavigationMenu.Trigger>
            <NavigationMenu.Content>
              {links.map(([title, description]) => (
                <NavigationMenu.Card key={title} href="#" title={title} description={description} onClick={(e) => e.preventDefault()} />
              ))}
            </NavigationMenu.Content>
          </NavigationMenu.Item>
        ))}
      </NavigationMenu.List>
      <NavigationMenu.Popup />
    </NavigationMenu.Root>
  )
}

export function LiveDialog() {
  return (
    <Dialog.Root>
      <Dialog.Trigger>View notifications</Dialog.Trigger>
      <Dialog.Popup>
        <Dialog.Header>
          <Dialog.Title>Notifications</Dialog.Title>
          <Dialog.Description>You are all caught up. Good job!</Dialog.Description>
        </Dialog.Header>
        <Dialog.Actions>
          <Dialog.Close>Close</Dialog.Close>
        </Dialog.Actions>
      </Dialog.Popup>
    </Dialog.Root>
  )
}

export function LiveAlertDialog() {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger destructive variant="ghost">
        Discard draft
      </AlertDialog.Trigger>
      <AlertDialog.Popup>
        <AlertDialog.Header>
          <AlertDialog.Title>Discard draft?</AlertDialog.Title>
          <AlertDialog.Description>You can’t undo this action.</AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Actions>
          <AlertDialog.Close>Cancel</AlertDialog.Close>
          <AlertDialog.Close variant="primary" destructive>
            Discard
          </AlertDialog.Close>
        </AlertDialog.Actions>
      </AlertDialog.Popup>
    </AlertDialog.Root>
  )
}

export function LiveDrawer() {
  return (
    <Drawer.Root>
      <Drawer.Trigger>Open filters</Drawer.Trigger>
      <Drawer.Popup>
        <Drawer.Header>
          <Drawer.Title>Filters</Drawer.Title>
          <Drawer.Description>Narrow the list down. Swipe right or press Escape to close.</Drawer.Description>
        </Drawer.Header>
        <Drawer.Actions>
          <Drawer.Close>Close</Drawer.Close>
        </Drawer.Actions>
      </Drawer.Popup>
    </Drawer.Root>
  )
}

const MESSAGES = {
  neutral: ['Message sent', 'Your message is on its way.'],
  success: ['Changes saved', 'Your profile is up to date.'],
  error: ['Upload failed', 'Check your connection and try again.'],
} as const

function CreateToast() {
  const toasts = Toast.useToastManager()
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {(Object.keys(MESSAGES) as (keyof typeof MESSAGES)[]).map((type) => (
        <Button key={type} size="sm" variant="secondary" onClick={() => toasts.add({ type, title: MESSAGES[type][0], description: MESSAGES[type][1] })}>
          {type[0].toUpperCase() + type.slice(1)}
        </Button>
      ))}
    </div>
  )
}

export function LiveToast() {
  return (
    <Toast.Provider>
      <CreateToast />
      <Toast.Viewport />
    </Toast.Provider>
  )
}

export function LiveCollapsible() {
  return (
    <div style={{ width: 220 }}>
      <Collapsible label="Recovery keys" defaultOpen>
        <div>alien-bean-pasta</div>
        <div>wild-irish-burrito</div>
      </Collapsible>
    </div>
  )
}
