<!-- Generated from the specs by `npm run ds:ai-docs`. Do not edit. -->

# Components

Every component of the design system, in catalog order (49 components in 9 categories). Each one is a React wrapper around Base UI, styled by semantic tokens, with a matching Figma component set. Use the wrappers; see [rules.md](rules.md) and [tokens.md](tokens.md). Import paths are from the repo root: write them relative to your file.

How to read a section:

- **Props (variant axes)**: the Figma variant properties that are React props. Values are the allowed literals; Figma shows them as the names after the colon.
- **States**: Figma variants that Base UI drives at runtime (hover, focus, checked, open…). Never set them yourself: use Base UI props (`disabled`, `checked`, `defaultValue`, Field `invalid`…).
- **Parts**: the anatomy. Part ↔ Base UI part ↔ Figma layer ↔ CSS class.
- **Figma properties**: slots, booleans and texts on the Figma component, and what they are in code (a prop, `children` or a sub-component).
- **Tokens**: the semantic tokens the component is bound to (in Figma and in code), and the override tokens a theme may set for it.

## Catalog

- **Button & Actions**: [Button](#button), [Icon Button](#icon-button), [Toggle](#toggle), [Toggle Group](#toggle-group), [Toolbar](#toolbar)
- **Form Controls**: [Input](#input), [Field](#field), [Fieldset](#fieldset), [Form](#form), [Checkbox](#checkbox), [Checkbox Group](#checkbox-group), [Radio](#radio), [Radio Group](#radio-group), [Switch](#switch), [Slider](#slider), [Number Field](#number-field), [OTP Field](#otp-field), [OTP Slot](#otp-slot)
- **Selection**: [Select](#select), [Combobox](#combobox), [Autocomplete](#autocomplete), [Listbox](#listbox), [Option](#option)
- **Menus**: [Menu](#menu), [Menu Item](#menu-item), [Menu Group Label](#menu-group-label), [Menu Separator](#menu-separator), [Menubar](#menubar), [Menubar Item](#menubar-item)
- **Navigation**: [Navigation Menu](#navigation-menu), [Navigation Menu Item](#navigation-menu-item), [Navigation Menu Link](#navigation-menu-link), [Tabs](#tabs), [Tab](#tab)
- **Overlays**: [Popover](#popover), [Tooltip](#tooltip), [Preview Card](#preview-card), [Dialog](#dialog), [Alert Dialog](#alert-dialog), [Drawer](#drawer)
- **Feedback**: [Toast](#toast), [Progress](#progress), [Meter](#meter)
- **Layout & Disclosure**: [Accordion](#accordion), [Accordion Item](#accordion-item), [Collapsible](#collapsible), [Separator](#separator), [Scroll Area](#scroll-area)
- **Display**: [Avatar](#avatar)

## Button & Actions

### Button

01 · Button & Actions · CSS `.ds-button` · [Base UI docs](https://base-ui.com/react/components/button)

Triggers an action. Four types set its emphasis; destructive marks actions that delete or can’t be undone.

**Use it**

- Use one Primary button per view for the main action.
- Use Secondary or Outline for alternatives next to it, Ghost for low-emphasis actions in toolbars and lists.
- Use Destructive (Primary or Ghost) only for actions that delete data or can’t be undone.

**Don't**

- Don’t use a button for navigation; use a link.
- Don’t put more than one Primary button side by side.

**Accessibility**

- Renders a native <button>; Enter and Space activate it.
- Keep the label: an icon-only action should use Icon Button, which requires an accessible label.
- Disabled buttons are skipped by keyboard focus. Use focusableWhenDisabled for buttons that become disabled while focused (e.g. while submitting).

**Code**

```tsx
import { Button } from 'stories/base-ui/components/button/Button'
```

Rendered by `<Button>`. API: [Button module](#button-module).

**Props (variant axes)**

| Prop | Values | Default | Figma | Notes |
|---|---|---|---|---|
| `variant` | `'primary'` `'secondary'` `'ghost'` `'outline'` | `'primary'` | Type: Primary · Secondary · Ghost · Outline | On `Button` |
| `size` | `'sm'` `'md'` `'lg'` | `'md'` | Size: Small · Medium · Large | On `Button` |
| `destructive` | `false` `true` | `false` | Destructive: False · True | On `Button` |

**States** (not props: Base UI sets them from interaction and its own props, e.g. `disabled`, `checked`, Field `invalid`)

| Figma | Values | Code condition |
|---|---|---|
| State | Default · Hover · Pressed · Disabled | default: (default); hover: `:hover:not(:disabled):not([data-disabled])`; pressed: `:active:not(:disabled):not([data-disabled])`; disabled: `:disabled` or `[data-disabled]` |

**Parts**

| Part | Base UI | Figma layer | CSS class | Description |
|---|---|---|---|---|
| root | `Button` | `(variant)` | `.ds-button` | The button. Holds the background, border and padding. |
| label | — | `labelWrapper` | `.ds-button__label` | Wraps the text, with its own horizontal padding. |
| icon | — | `leadIcon`, `trailIcon` | `.ds-button__icon` | Optional icons before and after the label. |

**Tokens**

- Semantic: `color/background/interactive/danger-subtle/default`, `color/background/interactive/danger-subtle/hover`, `color/background/interactive/danger-subtle/pressed`, `color/background/interactive/danger/default`, `color/background/interactive/danger/hover`, `color/background/interactive/danger/pressed`, `color/background/interactive/disabled`, `color/background/interactive/primary/default`, `color/background/interactive/primary/hover`, `color/background/interactive/primary/pressed`, `color/background/interactive/secondary/default`, `color/background/interactive/secondary/hover`, `color/background/interactive/secondary/pressed`, `color/background/interactive/subtle/default`, `color/background/interactive/subtle/hover`, `color/background/interactive/subtle/pressed`, `color/border/interactive/default`, `color/border/interactive/disabled`, `color/border/interactive/hover`, `color/border/interactive/pressed`, `color/foreground/interactive/danger/default`, `color/foreground/interactive/danger/hover`, `color/foreground/interactive/danger/pressed`, `color/foreground/interactive/default`, `color/foreground/interactive/disabled`, `color/foreground/interactive/hover`, `color/foreground/interactive/pressed`, `color/foreground/neutral/primary`, `color/foreground/neutral/tertiary`, `color/foreground/on-danger/primary`, `color/foreground/on-interactive/primary`, `font/family/primary`, `font/line-height/body/lg`, `font/line-height/body/md`, `font/line-height/body/sm`, `font/size/body/lg`, `font/size/body/md`, `font/size/body/sm`, `font/weight/body/strong`, `shape/radius/sm`, `size/2xs`, `size/border/regular`, `size/lg`, `size/sm`, `size/xl`, `size/xs`, `space/2xl`, `space/2xs`, `space/md`, `space/sm`, `space/xs`
- Component tokens bound directly: `button/label/space-x/lg`, `button/label/space-x/md`, `button/label/space-x/sm`
- Primitive keywords: `colors/transparent`
- Override tokens (configurator; each aliases the semantic token it replaces): `button/background/{type}/{state}`, `button/border-color/{type}/{state}`, `button/foreground/{type}/{state}`, `button/radius/{size}`, `button/height/{size}`, `button/space-x/{size}`, `button/gap/{size}`, `button/label/space-x/{size}`, `button/label/text-style/{size}`, `button/icon/size/{size}`

### Icon Button

02 · Button & Actions · CSS `.ds-icon-button` · [Base UI docs](https://base-ui.com/react/components/button)

A button that shows only an icon. Same types, sizes and states as Button.

**Use it**

- Use for compact, well-known actions (close, more, add) in toolbars, headers and table rows.

**Don't**

- Don’t use an icon whose meaning isn’t obvious; use Button with a label instead.

**Accessibility**

- `label` is required: it becomes the aria-label, the only name screen readers announce.

**Code**

```tsx
import { IconButton } from 'stories/base-ui/components/icon-button/IconButton'
```

Rendered by `<IconButton>`. API: [IconButton module](#iconbutton-module).

**Props (variant axes)**

| Prop | Values | Default | Figma | Notes |
|---|---|---|---|---|
| `variant` | `'primary'` `'secondary'` `'ghost'` `'outline'` | `'primary'` | Type: Primary · Secondary · Ghost · Outline | On `IconButton` |
| `size` | `'sm'` `'md'` `'lg'` | `'md'` | Size: Small · Medium · Large | On `IconButton` |
| `destructive` | `false` `true` | `false` | Destructive: False · True | On `IconButton` |

**States** (not props: Base UI sets them from interaction and its own props, e.g. `disabled`, `checked`, Field `invalid`)

| Figma | Values | Code condition |
|---|---|---|
| State | Default · Hover · Pressed · Disabled | default: (default); hover: `:hover:not(:disabled):not([data-disabled])`; pressed: `:active:not(:disabled):not([data-disabled])`; disabled: `:disabled` or `[data-disabled]` |

**Parts**

| Part | Base UI | Figma layer | CSS class | Description |
|---|---|---|---|---|
| root | `Button` | `(variant)` | `.ds-icon-button` | A square button. |
| icon | — | `Icon` | `.ds-icon-button__icon` | The icon. Its color follows the button’s foreground. |

**Tokens**

- Semantic: `color/background/interactive/danger-subtle/default`, `color/background/interactive/danger-subtle/hover`, `color/background/interactive/danger-subtle/pressed`, `color/background/interactive/danger/default`, `color/background/interactive/danger/hover`, `color/background/interactive/danger/pressed`, `color/background/interactive/disabled`, `color/background/interactive/primary/default`, `color/background/interactive/primary/hover`, `color/background/interactive/primary/pressed`, `color/background/interactive/secondary/default`, `color/background/interactive/secondary/hover`, `color/background/interactive/secondary/pressed`, `color/background/interactive/subtle/default`, `color/background/interactive/subtle/hover`, `color/background/interactive/subtle/pressed`, `color/border/interactive/default`, `color/border/interactive/disabled`, `color/border/interactive/hover`, `color/border/interactive/pressed`, `color/foreground/interactive/danger/default`, `color/foreground/interactive/danger/hover`, `color/foreground/interactive/danger/pressed`, `color/foreground/interactive/default`, `color/foreground/interactive/disabled`, `color/foreground/interactive/hover`, `color/foreground/interactive/pressed`, `color/foreground/neutral/primary`, `color/foreground/neutral/tertiary`, `color/foreground/on-danger/primary`, `color/foreground/on-interactive/primary`, `shape/radius/sm`, `size/2xs`, `size/border/regular`, `size/lg`, `size/sm`, `size/xl`, `size/xs`, `space/2xl`
- Primitive keywords: `colors/transparent`
- Override tokens (configurator; each aliases the semantic token it replaces): `icon-button/background/{type}/{state}`, `icon-button/border-color/{type}/{state}`, `icon-button/foreground/{type}/{state}`, `icon-button/size/{size}`, `icon-button/radius/{size}`, `icon-button/border-width`, `icon-button/icon/size/{size}`

### Toggle

03 · Button & Actions · CSS `.ds-toggle` · [Base UI docs](https://base-ui.com/react/components/toggle)

A two-state button: on or off. Its icon is drawn as a line while off and filled while on.

**Use it**

- Use for a single on / off action with an icon (favorite, bold, mute).
- Group related toggles in a Toggle Group.

**Don't**

- Don’t use for settings that apply immediately and aren’t actions; use a Switch.

**Accessibility**

- Renders a button with aria-pressed.
- Icon-only toggles need an aria-label that names the action (“Favorite”).

**Code**

```tsx
import { Toggle } from 'stories/base-ui/components/toggle/Toggle'
```

Rendered by `<Toggle>`. API: [Toggle module](#toggle-module).

**Props (variant axes)**

| Prop | Values | Default | Figma | Notes |
|---|---|---|---|---|
| `size` | `'sm'` `'md'` `'lg'` | `'md'` (or the enclosing group’s) | Size: Small · Medium · Large | On `Toggle` |

**States** (not props: Base UI sets them from interaction and its own props, e.g. `disabled`, `checked`, Field `invalid`)

| Figma | Values | Code condition |
|---|---|---|
| Selected | False · True | false: `:not([data-pressed])`; true: `[data-pressed]` |
| State | Default · Hover · Pressed · Disabled | default: (default); hover: `:hover:not(:disabled):not([data-disabled])`; pressed: `:active:not(:disabled):not([data-disabled])`; disabled: `:disabled` or `[data-disabled]` |

**Parts**

| Part | Base UI | Figma layer | CSS class | Description |
|---|---|---|---|---|
| root | `Toggle` | `(variant)` | `.ds-toggle` | A button that stays pressed while on. |
| icon | — | `icon` | `.ds-toggle__icon` | Line icon while off, filled icon while on (in code, pass the Phosphor icon; the weight follows the state). |

**Tokens**

- Semantic: `color/background/interactive/subtle/default`, `color/background/interactive/subtle/hover`, `color/background/interactive/subtle/pressed`, `color/background/interactive/subtle/selected`, `color/foreground/interactive/disabled`, `color/foreground/neutral/primary`, `color/foreground/neutral/secondary`, `shape/radius/sm`, `size/2xs`, `size/lg`, `size/sm`, `size/xl`, `size/xs`, `space/2xl`
- Override tokens (configurator; each aliases the semantic token it replaces): `toggle/size/{size}`, `toggle/radius/{size}`, `toggle/background/{selected}/{state}`, `toggle/foreground/{selected}/{state}`, `toggle/icon/size/{size}`

### Toggle Group

04 · Button & Actions · CSS `.ds-toggle-group` · [Base UI docs](https://base-ui.com/react/components/toggle-group)

A set of toggles for related options, such as text alignment or formatting.

**Use it**

- Use for 2–5 related options shown as icons.
- Pick single (one on at a time, like alignment) or multiple (like bold / italic).

**Don't**

- Don’t mix unrelated actions in one group; use a Toolbar.

**Accessibility**

- Arrow keys move between toggles; each announces its pressed state.
- Give every icon toggle an aria-label.

**Code**

```tsx
import { ToggleGroup } from 'stories/base-ui/components/toggle-group/ToggleGroup'
```

Rendered by `<ToggleGroup>`. API: [ToggleGroup module](#togglegroup-module).

**Props (variant axes)**

| Prop | Values | Default | Figma | Notes |
|---|---|---|---|---|
| `size` | `'sm'` `'md'` `'lg'` | `'md'` | Size: Small · Medium · Large | On `ToggleGroup` |

**Parts**

| Part | Base UI | Figma layer | CSS class | Description |
|---|---|---|---|---|
| root | `ToggleGroup` | `(variant)` | `.ds-toggle-group` | A bordered row of toggles. One or several can be on (multiple). |
| items | — | `Items` | `.ds-toggle-group` | Slot for the toggles (in code, the children of the group). |
| toggle | — | `Items › toggle` | instance of Toggle | Toggle instances of the same size. |

**Figma properties** (set on an instance instead of detaching it)

| Property | Kind | Default / suggested | In code |
|---|---|---|---|
| Items | Slot | Toggle | `children` |

**Tokens**

- Semantic: `color/background/neutral/primary`, `color/border/neutral/subtle`, `shape/radius/md`, `size/border/regular`, `space/2xs`
- Override tokens (configurator; each aliases the semantic token it replaces): `toggle-group/space-x`, `toggle-group/space-y`, `toggle-group/gap`, `toggle-group/radius`, `toggle-group/border-width`, `toggle-group/border-color`, `toggle-group/background`

### Toolbar

05 · Button & Actions · CSS `.ds-toolbar` · [Base UI docs](https://base-ui.com/react/components/toolbar)

Groups the controls of an editor or a view (formatting, alignment, zoom) in one strip.

**Use it**

- Use Toggles for on/off formatting and a Toggle Group for one-of choices (alignment).
- Give icon-only controls a Tooltip and an aria-label.
- Separate groups with a separator; keep the order stable.

**Don't**

- Don’t use it for navigation or a single action.

**Accessibility**

- Renders role="toolbar": one tab stop, arrow keys move between controls.

**Code**

```tsx
import { Toolbar } from 'stories/base-ui/components/toolbar/Toolbar'
```

Rendered by `<Toolbar.Root>`. API: [Toolbar module](#toolbar-module).

**Parts**

| Part | Base UI | Figma layer | CSS class | Description |
|---|---|---|---|---|
| root | `Toolbar.Root` | `(variant)` | `.ds-toolbar` | The strip. One tab stop; arrow keys move between its controls. |
| items | — | `Items` | `.ds-toolbar` | Slot for the controls: Toggles, Icon Buttons, Separators (in code, the toolbar’s children). |
| group | `Toolbar.Group` | `Items › group` | `.ds-toolbar__group` | Related controls (a Toggle Group for exclusive choices). |
| toggle | — | `Items › group › toggle` | instance of Toggle | Toggle instances (Toolbar.Button render={<Toggle />}). |
| button | — | `Items › group › button` | instance of Icon Button | Icon Button instances (Toolbar.Button render={<IconButton />}). |
| separator | `Toolbar.Separator` | `Items › separator` | instance of Separator | Vertical Separator instances between groups. |

**Figma properties** (set on an instance instead of detaching it)

| Property | Kind | Default / suggested | In code |
|---|---|---|---|
| Items | Slot | Toggle, Icon Button, Separator, Toggle Group | `children` |

**Tokens**

- Semantic: `color/background/neutral/primary`, `color/border/neutral/subtle`, `shape/radius/md`, `size/border/regular`, `space/2xs`, `space/xs`
- Override tokens (configurator; each aliases the semantic token it replaces): `toolbar/space-x`, `toolbar/space-y`, `toolbar/gap`, `toolbar/radius`, `toolbar/border-width`, `toolbar/border-color`, `toolbar/background`, `toolbar/group/gap`

## Form Controls

### Input

06 · Form Controls · CSS `.ds-input` · [Base UI docs](https://base-ui.com/react/components/input)

A single-line text field with an optional leading icon. Use it inside Field to get a label, description and validation message.

**Use it**

- Wrap it in Field whenever it has a visible label (almost always).
- Use the leading icon for what the field is for (search, email, amount); leave it out when it adds nothing.
- Match the size to the buttons next to it; heights are the same as Button’s.
- Use the placeholder for an example value, never as the label.

**Don't**

- Don’t disable a field to show it’s read-only; use readOnly.
- Don’t make the icon the only clue to what the field is for.

**Accessibility**

- Inside Field, the label, description and error are linked to the input automatically.
- The icon is decorative (aria-hidden); the label must say what the field is for.
- Invalid sets aria-invalid; the error text is announced with the field.

**Code**

```tsx
import { Autocomplete } from 'stories/base-ui/components/autocomplete/Autocomplete'
import { Input } from 'stories/base-ui/components/input/Input'
```

Rendered by `<Autocomplete.Input>`, `<Input>`. API: [Autocomplete module](#autocomplete-module), [Input module](#input-module).

**Props (variant axes)**

| Prop | Values | Default | Figma | Notes |
|---|---|---|---|---|
| `size` | `'sm'` `'md'` `'lg'` | `'md'` (or the enclosing group’s) | Size: Small · Medium · Large | On `Autocomplete.Input`, `Input` |

**States** (not props: Base UI sets them from interaction and its own props, e.g. `disabled`, `checked`, Field `invalid`)

| Figma | Values | Code condition |
|---|---|---|
| State | Default · Hover · Focused · Disabled | default: (default); hover: `:hover:not(:has(> .ds-input__value[data-disabled])):not(:focus-within)`; focused: `:has(> .ds-input__value[data-focused])` or `:focus-within`; disabled: `:has(> .ds-input__value[data-disabled])` |
| Filled | False · True | false: `:not([data-filled])`; true: `[data-filled]` or `:not(:placeholder-shown)` |
| Invalid | False · True | false: `:not([data-invalid])`; true: `[data-invalid]` |

**Parts**

| Part | Base UI | Figma layer | CSS class | Description |
|---|---|---|---|---|
| root | — | `(variant)` | `.ds-input` | The field’s box: surface, border, padding and focus ring. Clicking anywhere in it focuses the input. |
| icon | — | `icon` | `.ds-input__icon` | Leading icon, shown by default (Figma: Show icon / Icon; code: showIcon / icon). Magnifying glass unless swapped. |
| value | `Input` | `value` | `.ds-input__value` | The value, or the placeholder while empty. |

**Tokens**

- Semantic: `color/background/interactive/disabled`, `color/background/neutral/primary`, `color/border/error`, `color/border/interactive/default`, `color/border/interactive/disabled`, `color/border/interactive/hover`, `color/border/interactive/selected`, `color/foreground/interactive/disabled`, `color/foreground/neutral/primary`, `color/foreground/neutral/secondary`, `effect/shadow/focus-ring/error`, `effect/shadow/focus-ring/primary`, `font/family/primary`, `font/line-height/body/lg`, `font/line-height/body/md`, `font/line-height/body/sm`, `font/size/body/lg`, `font/size/body/md`, `font/size/body/sm`, `font/weight/body/regular`, `shape/radius/md`, `size/2xs`, `size/border/regular`, `size/lg`, `size/sm`, `size/xl`, `size/xs`, `space/2xl`, `space/lg`, `space/md`, `space/sm`, `space/xs`
- Override tokens (configurator; each aliases the semantic token it replaces): `input/height/{size}`, `input/space-x/{size}`, `input/gap/{size}`, `input/radius/{size}`, `input/border-width`, `input/background/{state}`, `input/border-color/{invalid}/{state}`, `input/icon/size/{size}`, `input/icon/foreground/{state}`, `input/foreground/{filled}/{state}`, `input/text/text-style/{size}`

### Field

07 · Form Controls · CSS `.ds-field` · [Base UI docs](https://base-ui.com/react/components/field)

Labels a control and shows its help text and validation message. Wraps Input, and other Base UI controls.

**Use it**

- Give every input a Field with a visible label.
- Use the description for format hints (“At least 8 characters”), the error for what went wrong and how to fix it. While invalid, the error replaces the description, so the field keeps its height.
- The size applies to the label, the messages and the control inside.

**Don't**

- Don’t repeat the label in the placeholder.
- Don’t show an error before the person has had a chance to fill the field in.

**Accessibility**

- Field.Label, Field.Description and Field.Error are linked to the control (aria-labelledby / aria-describedby).
- Errors come from the browser’s constraint validation or the validate prop; invalid sets aria-invalid on the control.

**Code**

```tsx
import { Field } from 'stories/base-ui/components/field/Field'
```

Rendered by `<Field>`. API: [Field module](#field-module).

**Props (variant axes)**

| Prop | Values | Default | Figma | Notes |
|---|---|---|---|---|
| `size` | `'sm'` `'md'` `'lg'` | `'md'` | Size: Small · Medium · Large | On `Field` |

**States** (not props: Base UI sets them from interaction and its own props, e.g. `disabled`, `checked`, Field `invalid`)

| Figma | Values | Code condition |
|---|---|---|
| Invalid | False · True | false: `:not([data-invalid])`; true: `[data-invalid]` |

**Parts**

| Part | Base UI | Figma layer | CSS class | Description |
|---|---|---|---|---|
| root | `Field.Root` | `(variant)` | `.ds-field` | Stacks the label, control and messages. |
| label | `Field.Label` | `label` | `.ds-field__label` | Names the control. |
| control | `Field.Control` | `Control` | `.ds-field__control` | An Input (or another control) of the same size. Its look comes from Input. |
| description | `Field.Description` | `description` | `.ds-field__description` | Optional help text (Show description). Hidden while the field is invalid. |
| error | `Field.Error` | `error` | `.ds-field__error` | Validation message: replaces the description while the field is invalid. |

**Figma properties** (set on an instance instead of detaching it)

| Property | Kind | Default / suggested | In code |
|---|---|---|---|
| Control | Slot | Input, Select, Combobox, Autocomplete, Number Field, OTP Field, Slider, Switch, Checkbox | `children` |

**Tokens**

- Semantic: `color/foreground/error`, `color/foreground/neutral/primary`, `color/foreground/neutral/secondary`, `font/family/primary`, `font/line-height/body/lg`, `font/line-height/body/md`, `font/line-height/body/sm`, `font/size/body/lg`, `font/size/body/md`, `font/size/body/sm`, `font/weight/body/regular`, `font/weight/body/strong`, `space/sm`, `space/xs`
- Override tokens (configurator; each aliases the semantic token it replaces): `field/gap/{size}`, `field/label/foreground`, `field/label/text-style/{size}`, `field/description/foreground`, `field/description/text-style/{size}`, `field/error/foreground`, `field/error/text-style/{size}`

### Fieldset

08 · Form Controls · CSS `.ds-fieldset` · [Base UI docs](https://base-ui.com/react/components/fieldset)

A group of related fields with a legend, e.g. “Billing details”.

**Use it**

- Use to split a long form into named sections.
- The size applies to the legend and to the fields inside.

**Don't**

- Don’t nest fieldsets more than one level.

**Accessibility**

- Renders a <fieldset> with a <legend>, announced with each field inside.

**Code**

```tsx
import { Fieldset } from 'stories/base-ui/components/fieldset/Fieldset'
```

Rendered by `<Fieldset>`. API: [Fieldset module](#fieldset-module).

**Props (variant axes)**

| Prop | Values | Default | Figma | Notes |
|---|---|---|---|---|
| `size` | `'sm'` `'md'` `'lg'` | `'md'` | Size: Small · Medium · Large | On `Fieldset` |

**Parts**

| Part | Base UI | Figma layer | CSS class | Description |
|---|---|---|---|---|
| root | `Fieldset.Root` | `(variant)` | `.ds-fieldset` | Groups related fields under one legend. Disabling it disables every field inside. |
| legend | `Fieldset.Legend` | `legend` | `.ds-fieldset__legend` | Names the group, one step larger than the field labels. |
| fields | — | `Fields` | `.ds-fieldset` | Slot for the fields (in code, the children). |
| field | — | `Fields › field` | instance of Field | Field instances of the same size. |

**Figma properties** (set on an instance instead of detaching it)

| Property | Kind | Default / suggested | In code |
|---|---|---|---|
| Fields | Slot | Field, Radio Group, Checkbox Group | `children` |
| Legend | Text | Billing details | `legend` |

**Tokens**

- Semantic: `color/foreground/neutral/primary`, `font/family/primary`, `font/line-height/body/lg`, `font/line-height/body/md`, `font/line-height/heading/sm`, `font/size/body/lg`, `font/size/body/md`, `font/size/heading/sm`, `font/weight/body/strong`, `font/weight/heading/strong`, `space/lg`, `space/md`, `space/sm`
- Override tokens (configurator; each aliases the semantic token it replaces): `fieldset/gap/{size}`, `fieldset/legend/foreground`, `fieldset/legend/text-style/{size}`

### Form

09 · Form Controls · CSS `.ds-form` · [Base UI docs](https://base-ui.com/react/components/form)

A form that validates its fields and shows their errors, laid out with consistent spacing.

**Use it**

- Use Form around Fields; pass errors from the server with the errors prop.
- Put the primary action first in the actions row.

**Don't**

- Don’t disable the submit button to show a form is incomplete; let validation explain what’s missing.

**Accessibility**

- On a failed submit, focus moves to the first invalid field.

**Code**

```tsx
import { Form } from 'stories/base-ui/components/form/Form'
```

Rendered by `<Form>`. API: [Form module](#form-module).

**Parts**

| Part | Base UI | Figma layer | CSS class | Description |
|---|---|---|---|---|
| root | `Form` | `(variant)` | `.ds-form` | Stacks fields and fieldsets; shows their errors on submit (Base UI validation). |
| fields | — | `Fields` | `.ds-form` | Slot for fields and fieldsets. |
| field | — | `Fields › field` | instance of Field | Field instances. |
| actions | — | `Actions` | `.ds-form__actions` | The submit button and other actions, in a row. |
| button | — | `Actions › button` | instance of Button | Button instances. |

**Figma properties** (set on an instance instead of detaching it)

| Property | Kind | Default / suggested | In code |
|---|---|---|---|
| Fields | Slot | Field, Fieldset | `children` |
| Actions | Slot | Button | `<FormActions>` |

**Tokens**

- Semantic: `space/lg`, `space/sm`, `space/xs`
- Override tokens (configurator; each aliases the semantic token it replaces): `form/gap`, `form/actions/gap`, `form/actions/space-y`

### Checkbox

10 · Form Controls · CSS `.ds-checkbox` · [Base UI docs](https://base-ui.com/react/components/checkbox)

Lets people turn a single option on or off, or pick several options from a list.

**Use it**

- Use for independent options, and for choosing several items from a list (with Checkbox Group).
- Use Indeterminate on a “select all” checkbox when only some of its items are selected.
- Match the size to the controls next to it: Small with Small buttons and inputs, and so on.

**Don't**

- Don’t use a checkbox for an action that takes effect immediately; use a Switch.
- Don’t use it for mutually exclusive choices; use Radio Group.

**Accessibility**

- The wrapping <label> names the checkbox; without a visible label, pass aria-label.
- Space toggles it. Base UI renders a hidden native input so forms and autofill work.
- Indeterminate is announced as “mixed”.

**Code**

```tsx
import { Checkbox } from 'stories/base-ui/components/checkbox/Checkbox'
```

Rendered by `<Checkbox>`. API: [Checkbox module](#checkbox-module).

**Props (variant axes)**

| Prop | Values | Default | Figma | Notes |
|---|---|---|---|---|
| `size` | `'sm'` `'md'` `'lg'` | `'md'` (or the enclosing group’s) | Size: Small · Medium · Large | On `Checkbox` |

**States** (not props: Base UI sets them from interaction and its own props, e.g. `disabled`, `checked`, Field `invalid`)

| Figma | Values | Code condition |
|---|---|---|
| Checked | False · True · Indeterminate | unchecked: `[data-unchecked]`; checked: `[data-checked]`; indeterminate: `[data-indeterminate]` |
| State | Default · Hover · Pressed · Disabled | default: (default); hover: `:hover:not(:has(> .ds-checkbox__control[data-disabled]))`; pressed: `:active:not(:has(> .ds-checkbox__control[data-disabled]))`; disabled: `:has(> .ds-checkbox__control[data-disabled])` |

**Parts**

| Part | Base UI | Figma layer | CSS class | Description |
|---|---|---|---|---|
| root | — | `(variant)` | `.ds-checkbox` | The <label> wrapping the box and its text; clicking either toggles it. |
| control | `Checkbox.Root` | `control` | `.ds-checkbox__control` | The box. |
| indicator | `Checkbox.Indicator` | `control › indicator` | `.ds-checkbox__indicator` | Check or dash icon; only rendered while checked or indeterminate. |
| label | — | `label` | `.ds-checkbox__label` | The text. Optional (Show label = False), e.g. in table rows that have their own label. |

**Tokens**

- Semantic: `color/background/accent/default`, `color/background/accent/hover`, `color/background/accent/pressed`, `color/background/interactive/disabled`, `color/background/neutral/primary`, `color/border/interactive/default`, `color/border/interactive/disabled`, `color/border/interactive/hover`, `color/border/interactive/pressed`, `color/foreground/interactive/disabled`, `color/foreground/neutral/primary`, `color/foreground/neutral/tertiary`, `color/foreground/on-accent/primary`, `font/family/primary`, `font/line-height/body/lg`, `font/line-height/body/md`, `font/line-height/body/sm`, `font/size/body/lg`, `font/size/body/md`, `font/size/body/sm`, `font/weight/body/regular`, `shape/radius/sm`, `size/2xs`, `size/border/regular`, `size/sm`, `size/xs`, `space/md`, `space/sm`, `space/xs`
- Override tokens (configurator; each aliases the semantic token it replaces): `checkbox/gap/{size}`, `checkbox/control/size/{size}`, `checkbox/control/radius/{size}`, `checkbox/control/border-width`, `checkbox/control/background/{checked}/{state}`, `checkbox/control/border-color/{checked}/{state}`, `checkbox/indicator/foreground/{checked}/{state}`, `checkbox/indicator/size/{size}`, `checkbox/label/foreground/{state}`, `checkbox/label/text-style/{size}`

### Checkbox Group

11 · Form Controls · CSS `.ds-checkbox-group` · [Base UI docs](https://base-ui.com/react/components/checkbox-group)

A set of checkboxes sharing one value (an array), optionally with a “select all” parent.

**Use it**

- Give the group a visible label.
- Use a parent checkbox (indeterminate while partly selected) for “select all”.

**Don't**

- Don’t use for a single choice; use a Radio Group.

**Accessibility**

- Each checkbox stays its own tab stop; Space toggles it.

**Code**

```tsx
import { CheckboxGroup } from 'stories/base-ui/components/checkbox-group/CheckboxGroup'
```

Rendered by `<CheckboxGroup>`. API: [CheckboxGroup module](#checkboxgroup-module).

**Props (variant axes)**

| Prop | Values | Default | Figma | Notes |
|---|---|---|---|---|
| `size` | `'sm'` `'md'` `'lg'` | `'md'` | Size: Small · Medium · Large | On `CheckboxGroup` |

**Parts**

| Part | Base UI | Figma layer | CSS class | Description |
|---|---|---|---|---|
| root | `CheckboxGroup` | `(variant)` | `.ds-checkbox-group` | Stacks a label and its checkboxes. |
| label | — | `label` | `.ds-checkbox-group__label` | Names the group (aria-labelledby). |
| options | — | `Options` | `.ds-checkbox-group` | Slot for the options (in code, the children). |
| option | — | `Options › option` | instance of Checkbox | Checkbox instances of the same size; the first can be a “select all” parent. |

**Figma properties** (set on an instance instead of detaching it)

| Property | Kind | Default / suggested | In code |
|---|---|---|---|
| Options | Slot | Checkbox | `children` |

**Tokens**

- Semantic: `color/foreground/neutral/primary`, `font/family/primary`, `font/line-height/body/lg`, `font/line-height/body/md`, `font/line-height/body/sm`, `font/size/body/lg`, `font/size/body/md`, `font/size/body/sm`, `font/weight/body/strong`, `space/sm`, `space/xs`
- Override tokens (configurator; each aliases the semantic token it replaces): `checkbox-group/gap/{size}`, `checkbox-group/label/foreground`, `checkbox-group/label/text-style/{size}`

### Radio

12 · Form Controls · CSS `.ds-radio` · [Base UI docs](https://base-ui.com/react/components/radio)

One option in a Radio Group: pick exactly one of several.

**Use it**

- Always use radios inside a Radio Group.
- Use for 2–6 visible options; for more, use Select.

**Don't**

- Don’t use a single radio on its own; use a Checkbox.

**Accessibility**

- Arrow keys move between options in the group and select them.
- The wrapping <label> names each option.

**Code**

```tsx
import { Radio } from 'stories/base-ui/components/radio/Radio'
```

Rendered by `<Radio>`. API: [Radio module](#radio-module).

**Props (variant axes)**

| Prop | Values | Default | Figma | Notes |
|---|---|---|---|---|
| `size` | `'sm'` `'md'` `'lg'` | `'md'` (or the enclosing group’s) | Size: Small · Medium · Large | On `Radio` |

**States** (not props: Base UI sets them from interaction and its own props, e.g. `disabled`, `checked`, Field `invalid`)

| Figma | Values | Code condition |
|---|---|---|
| Checked | False · True | false: `[data-unchecked]`; true: `[data-checked]` |
| State | Default · Hover · Pressed · Disabled | default: (default); hover: `:hover:not(:has(> .ds-radio__control[data-disabled]))`; pressed: `:active:not(:has(> .ds-radio__control[data-disabled]))`; disabled: `:has(> .ds-radio__control[data-disabled])` |

**Parts**

| Part | Base UI | Figma layer | CSS class | Description |
|---|---|---|---|---|
| root | — | `(variant)` | `.ds-radio` | The <label> wrapping the radio and its text. |
| control | `Radio.Root` | `control` | `.ds-radio__control` | The circle. |
| indicator | `Radio.Indicator` | `control › indicator` | `.ds-radio__indicator` | The dot, only while checked. |
| label | — | `label` | `.ds-radio__label` | The option’s text. |

**Tokens**

- Semantic: `color/background/accent/default`, `color/background/accent/hover`, `color/background/accent/pressed`, `color/background/interactive/disabled`, `color/background/neutral/primary`, `color/border/interactive/default`, `color/border/interactive/disabled`, `color/border/interactive/hover`, `color/border/interactive/pressed`, `color/foreground/interactive/disabled`, `color/foreground/neutral/primary`, `color/foreground/neutral/tertiary`, `color/foreground/on-accent/primary`, `font/family/primary`, `font/line-height/body/lg`, `font/line-height/body/md`, `font/line-height/body/sm`, `font/size/body/lg`, `font/size/body/md`, `font/size/body/sm`, `font/weight/body/regular`, `shape/radius/full`, `size/2xs`, `size/border/regular`, `size/sm`, `size/xs`, `space/sm`, `space/xs`
- Override tokens (configurator; each aliases the semantic token it replaces): `radio/gap/{size}`, `radio/control/size/{size}`, `radio/control/border-width`, `radio/control/background/{checked}/{state}`, `radio/control/border-color/{checked}/{state}`, `radio/indicator/size`, `radio/indicator/background/{checked}/{state}`, `radio/label/foreground/{state}`, `radio/label/text-style/{size}`

### Radio Group

13 · Form Controls · CSS `.ds-radio-group` · [Base UI docs](https://base-ui.com/react/components/radio-group)

A set of radios where exactly one can be selected.

**Use it**

- Give the group a visible label.
- Order options logically (most common first, or a natural order).
- Preselect a sensible default when there is one.

**Don't**

- Don’t use radios for on / off; use a Switch or Checkbox.

**Accessibility**

- Tab moves into the group to the selected option; arrows move between options.

**Code**

```tsx
import { RadioGroup } from 'stories/base-ui/components/radio-group/RadioGroup'
```

Rendered by `<RadioGroup>`. API: [RadioGroup module](#radiogroup-module).

**Props (variant axes)**

| Prop | Values | Default | Figma | Notes |
|---|---|---|---|---|
| `size` | `'sm'` `'md'` `'lg'` | `'md'` | Size: Small · Medium · Large | On `RadioGroup` |

**Parts**

| Part | Base UI | Figma layer | CSS class | Description |
|---|---|---|---|---|
| root | `RadioGroup` | `(variant)` | `.ds-radio-group` | Stacks a label and its options. |
| label | — | `label` | `.ds-radio-group__label` | Names the group (aria-labelledby). |
| options | — | `Options` | `.ds-radio-group` | Slot for the options (in code, the children). |
| option | — | `Options › option` | instance of Radio | Radio instances of the same size. |

**Figma properties** (set on an instance instead of detaching it)

| Property | Kind | Default / suggested | In code |
|---|---|---|---|
| Options | Slot | Radio | `children` |

**Tokens**

- Semantic: `color/foreground/neutral/primary`, `font/family/primary`, `font/line-height/body/lg`, `font/line-height/body/md`, `font/line-height/body/sm`, `font/size/body/lg`, `font/size/body/md`, `font/size/body/sm`, `font/weight/body/strong`, `space/sm`, `space/xs`
- Override tokens (configurator; each aliases the semantic token it replaces): `radio-group/gap/{size}`, `radio-group/label/foreground`, `radio-group/label/text-style/{size}`

### Switch

14 · Form Controls · CSS `.ds-switch` · [Base UI docs](https://base-ui.com/react/components/switch)

Turns a setting on or off, with immediate effect.

**Use it**

- Use for settings that apply right away (notifications, dark mode).
- Label the setting, not the action: “Notifications”, not “Turn on notifications”.

**Don't**

- Don’t use a switch in a form that needs a submit; use a Checkbox.

**Accessibility**

- Renders role="switch" with aria-checked; Space toggles it.
- The wrapping <label> names it; without visible text, pass aria-label.

**Code**

```tsx
import { Switch } from 'stories/base-ui/components/switch/Switch'
```

Rendered by `<Switch>`. API: [Switch module](#switch-module).

**Props (variant axes)**

| Prop | Values | Default | Figma | Notes |
|---|---|---|---|---|
| `size` | `'sm'` `'md'` `'lg'` | `'md'` (or the enclosing group’s) | Size: Small · Medium · Large | On `Switch` |

**States** (not props: Base UI sets them from interaction and its own props, e.g. `disabled`, `checked`, Field `invalid`)

| Figma | Values | Code condition |
|---|---|---|
| Checked | False · True | false: `[data-unchecked]`; true: `[data-checked]` |
| State | Default · Hover · Pressed · Disabled | default: (default); hover: `:hover:not(:has(> .ds-switch__control[data-disabled]))`; pressed: `:active:not(:has(> .ds-switch__control[data-disabled]))`; disabled: `:has(> .ds-switch__control[data-disabled])` |

**Parts**

| Part | Base UI | Figma layer | CSS class | Description |
|---|---|---|---|---|
| root | — | `(variant)` | `.ds-switch` | The <label> wrapping the switch and its text. |
| control | `Switch.Root` | `control` | `.ds-switch__control` | The track. Its height follows the thumb (padding + thumb + border). |
| thumb | `Switch.Thumb` | `control › thumb` | `.ds-switch__thumb` | Slides to the end of the track while on. |
| label | — | `label` | `.ds-switch__label` | The text. Optional (Show label). |

**Tokens**

- Semantic: `color/background/accent/default`, `color/background/accent/hover`, `color/background/accent/pressed`, `color/background/interactive/disabled`, `color/background/neutral/primary`, `color/border/interactive/default`, `color/border/interactive/disabled`, `color/border/interactive/hover`, `color/border/interactive/pressed`, `color/foreground/interactive/disabled`, `color/foreground/neutral/primary`, `color/foreground/neutral/tertiary`, `color/foreground/on-accent/primary`, `font/family/primary`, `font/line-height/body/lg`, `font/line-height/body/md`, `font/line-height/body/sm`, `font/size/body/lg`, `font/size/body/md`, `font/size/body/sm`, `font/weight/body/regular`, `shape/radius/full`, `size/2xs`, `size/border/regular`, `size/lg`, `size/md`, `size/xl`, `size/xs`, `space/2xs`, `space/md`, `space/sm`, `space/xs`
- Override tokens (configurator; each aliases the semantic token it replaces): `switch/gap/{size}`, `switch/track/width/{size}`, `switch/track/space-x`, `switch/track/space-y`, `switch/track/radius`, `switch/track/border-width`, `switch/track/background/{checked}/{state}`, `switch/track/border-color/{checked}/{state}`, `switch/thumb/size/{size}`, `switch/thumb/radius`, `switch/thumb/background/{checked}/{state}`, `switch/label/foreground/{state}`, `switch/label/text-style/{size}`

### Slider

15 · Form Controls · CSS `.ds-slider` · [Base UI docs](https://base-ui.com/react/components/slider)

Picks a value, or a range, by dragging along a track.

**Use it**

- Use when the exact value matters less than its position (volume, price range).
- Pass an array value for a range: one thumb per value.
- Show the value next to it when users need the number.

**Don't**

- Don’t use for precise numbers; use Number Field (or both together).

**Accessibility**

- Each thumb is a focusable input with role slider; arrows step, Page Up / Down step 10×, Home / End jump.
- Label each thumb (aria-label or getAriaLabel), e.g. “Minimum price”.

**Code**

```tsx
import { Slider } from 'stories/base-ui/components/slider/Slider'
```

Rendered by `<Slider>`. API: [Slider module](#slider-module).

**Props (variant axes)**

| Prop | Values | Default | Figma | Notes |
|---|---|---|---|---|
| `size` | `'sm'` `'md'` `'lg'` | `'md'` (or the enclosing group’s) | Size: Small · Medium · Large | On `Slider` |

**States** (not props: Base UI sets them from interaction and its own props, e.g. `disabled`, `checked`, Field `invalid`)

| Figma | Values | Code condition |
|---|---|---|
| State | Default · Hover · Focused · Disabled | default: (default); hover: `:hover:not([data-disabled]):not([data-focused])`; focused: `[data-focused]` or `[data-dragging]`; disabled: `[data-disabled]` |

**Parts**

| Part | Base UI | Figma layer | CSS class | Description |
|---|---|---|---|---|
| root | `Slider.Control` | `(variant)` | `.ds-slider` | The pointer area: its vertical padding makes the slider easy to grab. |
| track | `Slider.Track` | `track` | `.ds-slider__track` | The full range. |
| indicator | `Slider.Indicator` | `track › indicator` | `.ds-slider__indicator` | The selected part of the range. |
| thumb | `Slider.Thumb` | `track › thumb` | `.ds-slider__thumb` | Drag it, or focus it and use the arrow keys. A range has two. |

**Tokens**

- Semantic: `color/background/accent/default`, `color/background/accent/hover`, `color/background/neutral/primary`, `color/border/interactive/default`, `color/border/interactive/disabled`, `color/border/interactive/hover`, `color/border/interactive/selected`, `color/border/neutral/subtle`, `effect/shadow/focus-ring/primary`, `shape/radius/full`, `size/border/regular`, `size/sm`, `size/xs`, `space/2xs`, `space/md`, `space/sm`, `space/xs`
- Override tokens (configurator; each aliases the semantic token it replaces): `slider/space-y/{size}`, `slider/track/height/{size}`, `slider/track/radius`, `slider/track/background`, `slider/indicator/background/{state}`, `slider/thumb/size/{size}`, `slider/thumb/radius`, `slider/thumb/border-width`, `slider/thumb/background`, `slider/thumb/border-color/{state}`

### Number Field

16 · Form Controls · CSS `.ds-number-field` · [Base UI docs](https://base-ui.com/react/components/number-field)

A numeric input with − / + steppers. Same box as Input, so it lines up with other controls.

**Use it**

- Use for small adjustments (quantity, count); type for big jumps.
- Set min, max and step; wrap in Field for a label.

**Don't**

- Don’t use for numbers that aren’t quantities (phone, card, postal code); use Input.

**Accessibility**

- Arrow Up / Down step; Page Up / Down step by 10× (largeStep); Home / End jump to min / max.
- The − / + buttons have their own labels.

**Code**

```tsx
import { NumberField } from 'stories/base-ui/components/number-field/NumberField'
```

Rendered by `<NumberField>`. API: [NumberField module](#numberfield-module).

**Props (variant axes)**

| Prop | Values | Default | Figma | Notes |
|---|---|---|---|---|
| `size` | `'sm'` `'md'` `'lg'` | `'md'` (or the enclosing group’s) | Size: Small · Medium · Large | On `NumberField` |

**States** (not props: Base UI sets them from interaction and its own props, e.g. `disabled`, `checked`, Field `invalid`)

| Figma | Values | Code condition |
|---|---|---|
| State | Default · Hover · Focused · Disabled | default: (default); hover: `:hover:not([data-disabled]):not([data-focused])`; focused: `[data-focused]`; disabled: `[data-disabled]` |
| Invalid | False · True | false: `:not([data-invalid])`; true: `[data-invalid]` |

**Parts**

| Part | Base UI | Figma layer | CSS class | Description |
|---|---|---|---|---|
| root | `NumberField.Group` | `(variant)` | `.ds-number-field` | The box: like Input (heights, border, focus ring, invalid). |
| decrement | `NumberField.Decrement` | `decrement` | `.ds-number-field__decrement` | Steps down. Divided from the value by a line in the border color. |
| decrement-icon | — | `decrement › icon` | `.ds-number-field__decrement-icon` | Minus. |
| value | `NumberField.Input` | `value` | `.ds-number-field__value` | The number, centered, with tabular figures. |
| increment | `NumberField.Increment` | `increment` | `.ds-number-field__increment` | Steps up. |
| increment-icon | — | `increment › icon` | `.ds-number-field__increment-icon` | Plus. |

**Tokens**

- Semantic: `color/background/interactive/disabled`, `color/background/interactive/subtle/default`, `color/background/interactive/subtle/hover`, `color/background/interactive/subtle/pressed`, `color/background/neutral/primary`, `color/border/error`, `color/border/interactive/default`, `color/border/interactive/disabled`, `color/border/interactive/hover`, `color/border/interactive/selected`, `color/foreground/interactive/disabled`, `color/foreground/neutral/primary`, `effect/shadow/focus-ring/error`, `effect/shadow/focus-ring/primary`, `font/family/primary`, `font/line-height/body/lg`, `font/line-height/body/md`, `font/line-height/body/sm`, `font/size/body/lg`, `font/size/body/md`, `font/size/body/sm`, `font/weight/body/regular`, `shape/radius/md`, `size/2xs`, `size/border/regular`, `size/lg`, `size/sm`, `size/xl`, `size/xs`, `space/2xl`
- Override tokens (configurator; each aliases the semantic token it replaces): `number-field/height/{size}`, `number-field/radius/{size}`, `number-field/border-width`, `number-field/background/{state}`, `number-field/border-color/{invalid}/{state}`, `number-field/decrement/width/{size}`, `number-field/foreground/{state}`, `number-field/text-style/{size}`, `number-field/increment/width/{size}`

### OTP Field

17 · Form Controls · CSS `.ds-otp-field` · [Base UI docs](https://base-ui.com/react/components/otp-field)

A one-time-code input: one box per character, with paste, auto-advance and backspace across boxes.

**Use it**

- Use for verification codes (usually 4–8 digits).
- Wrap in Field for the label and description (“Sent to …”).

**Don't**

- Don’t use for passwords or anything longer than a code.

**Accessibility**

- The first slot takes the label; the others announce “Character n of length”.
- Pasting a whole code fills every slot; autocomplete="one-time-code" lets phones suggest the SMS code.

**Code**

```tsx
import { OtpField } from 'stories/base-ui/components/otp-field/OtpField'
```

Rendered by `<OtpField>`. API: [OtpField module](#otpfield-module).

**Props (variant axes)**

| Prop | Values | Default | Figma | Notes |
|---|---|---|---|---|
| `size` | `'sm'` `'md'` `'lg'` | `'md'` (or the enclosing group’s) | Size: Small · Medium · Large | On `OtpField` |

**Parts**

| Part | Base UI | Figma layer | CSS class | Description |
|---|---|---|---|---|
| root | `OTPField.Root` | `(variant)` | `.ds-otp-field` | A row of slots, one per character (length). |
| slot | — | `slot` | instance of OTP Slot | OTP Slot instances of the same size. |

**Tokens**

- Semantic: `space/sm`, `space/xs`
- Override tokens (configurator; each aliases the semantic token it replaces): `otp-field/gap/{size}`

### OTP Slot

18 · Form Controls · CSS `.ds-otp-slot` · [Base UI docs](https://base-ui.com/react/components/otp-field)

One character box of an OTP Field.

**Use it**

- Only used inside OTP Field.

**Code**

```tsx
import { OtpField } from 'stories/base-ui/components/otp-field/OtpField'
```

Rendered by `<OtpField>`. API: [OtpField module](#otpfield-module).

**Props (variant axes)**

| Prop | Values | Default | Figma | Notes |
|---|---|---|---|---|
| `size` | `'sm'` `'md'` `'lg'` | `'md'` (or the enclosing group’s) | Size: Small · Medium · Large | On `OtpField` |

**States** (not props: Base UI sets them from interaction and its own props, e.g. `disabled`, `checked`, Field `invalid`)

| Figma | Values | Code condition |
|---|---|---|
| State | Default · Hover · Focused · Disabled | default: (default); hover: `:hover:not([data-disabled]):not([data-focused])`; focused: `[data-focused]`; disabled: `[data-disabled]` |
| Filled | False · True | false: `:not([data-filled])`; true: `[data-filled]` |
| Invalid | False · True | false: `:not([data-invalid])`; true: `[data-invalid]` |

**Parts**

| Part | Base UI | Figma layer | CSS class | Description |
|---|---|---|---|---|
| root | `OTPField.Input` | `(variant)` | `.ds-otp-slot` | One character: a square box like Input’s. |
| value | — | `value` | `.ds-otp-slot` | The character, centered (in code, the input itself). |

**Tokens**

- Semantic: `color/background/interactive/disabled`, `color/background/neutral/primary`, `color/border/error`, `color/border/interactive/default`, `color/border/interactive/disabled`, `color/border/interactive/hover`, `color/border/interactive/selected`, `color/foreground/interactive/disabled`, `color/foreground/neutral/primary`, `effect/shadow/focus-ring/error`, `effect/shadow/focus-ring/primary`, `font/family/primary`, `font/line-height/body/lg`, `font/line-height/body/md`, `font/line-height/heading/sm`, `font/size/body/lg`, `font/size/body/md`, `font/size/heading/sm`, `font/weight/body/regular`, `font/weight/heading/regular`, `shape/radius/md`, `size/border/regular`, `size/lg`, `size/xl`, `space/2xl`
- Override tokens (configurator; each aliases the semantic token it replaces): `otp-slot/size/{size}`, `otp-slot/radius/{size}`, `otp-slot/border-width`, `otp-slot/background/{state}`, `otp-slot/border-color/{invalid}/{state}`, `otp-slot/foreground/{state}`, `otp-slot/text-style/{size}`

## Selection

### Select

19 · Selection · CSS `.ds-select` · [Base UI docs](https://base-ui.com/react/components/select)

Picks one value from a list. A field box (like Input) that opens a Listbox of Options.

**Use it**

- Use it for 5–15 options the user doesn’t need to type; for fewer, a Radio Group shows them all; for more, a Combobox lets them search.
- Wrap it in Field for a label, description and error; sizes match Input and Button.
- Use a placeholder that says what to pick (“Select a country”).

**Don't**

- Don’t use it for actions; use Menu.
- Don’t use it when users need to compare options; use Radio Group.

**Accessibility**

- The trigger opens the list with Enter, Space or the arrow keys; typing jumps to a matching option.
- The list opens aligned with the selected option over the trigger (macOS-style) unless turned off.
- Inside Field, the label and error are linked to the trigger.

**Code**

```tsx
import { Select } from 'stories/base-ui/components/select/Select'
```

Rendered by `<Select.Trigger>`. API: [Select module](#select-module).

**Props (variant axes)**

| Prop | Values | Default | Figma | Notes |
|---|---|---|---|---|
| `size` | `'sm'` `'md'` `'lg'` | `'md'` (or the enclosing group’s) | Size: Small · Medium · Large | On `Select.Trigger` |

**States** (not props: Base UI sets them from interaction and its own props, e.g. `disabled`, `checked`, Field `invalid`)

| Figma | Values | Code condition |
|---|---|---|
| State | Default · Hover · Focused · Disabled | default: (default); hover: `:hover:not([data-disabled]):not([data-popup-open]):not(:focus-visible)`; focused: `:focus-visible` or `[data-popup-open]`; disabled: `[data-disabled]` |
| Filled | False · True | false: `[data-placeholder]`; true: `:not([data-placeholder])` |
| Invalid | False · True | false: `:not([data-invalid])`; true: `[data-invalid]` |

**Parts**

| Part | Base UI | Figma layer | CSS class | Description |
|---|---|---|---|---|
| root | `Select.Trigger` | `(variant)` | `.ds-select` | The field’s box. Opens the Listbox; focus ring while focused or open. |
| value | `Select.Value` | `value` | `.ds-select__value` | The selected option’s label, or the placeholder. |
| icon | `Select.Icon` | `icon` | `.ds-select__icon` | The caret (up/down: the list can open over the trigger). |

**Tokens**

- Semantic: `color/background/interactive/disabled`, `color/background/neutral/primary`, `color/border/error`, `color/border/interactive/default`, `color/border/interactive/disabled`, `color/border/interactive/hover`, `color/border/interactive/selected`, `color/foreground/interactive/disabled`, `color/foreground/neutral/primary`, `color/foreground/neutral/secondary`, `effect/shadow/focus-ring/error`, `effect/shadow/focus-ring/primary`, `font/family/primary`, `font/line-height/body/lg`, `font/line-height/body/md`, `font/line-height/body/sm`, `font/size/body/lg`, `font/size/body/md`, `font/size/body/sm`, `font/weight/body/regular`, `shape/radius/md`, `size/2xs`, `size/border/regular`, `size/lg`, `size/sm`, `size/xl`, `size/xs`, `space/2xl`, `space/lg`, `space/md`, `space/sm`, `space/xs`
- Override tokens (configurator; each aliases the semantic token it replaces): `select/height/{size}`, `select/space-x/{size}`, `select/gap/{size}`, `select/radius/{size}`, `select/border-width`, `select/background/{state}`, `select/border-color/{invalid}/{state}`, `select/foreground/{filled}/{state}`, `select/text/text-style/{size}`, `select/icon/size/{size}`, `select/icon/foreground/{state}`

### Combobox

20 · Selection · CSS `.ds-combobox` · [Base UI docs](https://base-ui.com/react/components/combobox)

A text field that filters a list as the user types, then picks one of its options.

**Use it**

- Use it for long lists (countries, people, tags) where typing is faster than scrolling.
- Only values from the list are accepted; for free text with suggestions, use Autocomplete.
- Wrap it in Field; sizes match Input and Button.

**Don't**

- Don’t use it for a handful of options; use Select or Radio Group.

**Accessibility**

- Typing filters; arrow keys move through the matches; Enter picks; Escape closes, then clears.
- The input keeps focus and points at the highlighted option (aria-activedescendant).
- The clear and trigger buttons need aria-labels (“Clear selection”, “Open list”).

**Code**

```tsx
import { Combobox } from 'stories/base-ui/components/combobox/Combobox'
```

Rendered by `<Combobox.Input>`. API: [Combobox module](#combobox-module).

**Props (variant axes)**

| Prop | Values | Default | Figma | Notes |
|---|---|---|---|---|
| `size` | `'sm'` `'md'` `'lg'` | `'md'` (or the enclosing group’s) | Size: Small · Medium · Large | On `Combobox.Input` |

**States** (not props: Base UI sets them from interaction and its own props, e.g. `disabled`, `checked`, Field `invalid`)

| Figma | Values | Code condition |
|---|---|---|
| State | Default · Hover · Focused · Disabled | default: (default); hover: `:hover:not(:has(> .ds-combobox__value[data-disabled])):not(:focus-within)`; focused: `:focus-within`; disabled: `:has(> .ds-combobox__value[data-disabled])` |
| Filled | False · True | false: `:placeholder-shown`; true: `:not(:placeholder-shown)` |
| Invalid | False · True | false: `:not([data-invalid])`; true: `[data-invalid]` |

**Parts**

| Part | Base UI | Figma layer | CSS class | Description |
|---|---|---|---|---|
| root | `Combobox.InputGroup` | `(variant)` | `.ds-combobox` | The field’s box: surface, border, padding and focus ring. |
| value | `Combobox.Input` | `value` | `.ds-combobox__value` | The text the user types to filter; the selected label once chosen. |
| clear | `Combobox.Clear` | `clear` | `.ds-combobox__clear` | Clears the value. Only there while there is one. |
| trigger | `Combobox.Trigger` | `trigger` | `.ds-combobox__trigger` | Opens the list without typing. |

**Tokens**

- Semantic: `color/background/interactive/disabled`, `color/background/neutral/primary`, `color/border/error`, `color/border/interactive/default`, `color/border/interactive/disabled`, `color/border/interactive/hover`, `color/border/interactive/selected`, `color/foreground/interactive/disabled`, `color/foreground/neutral/primary`, `color/foreground/neutral/secondary`, `effect/shadow/focus-ring/error`, `effect/shadow/focus-ring/primary`, `font/family/primary`, `font/line-height/body/lg`, `font/line-height/body/md`, `font/line-height/body/sm`, `font/size/body/lg`, `font/size/body/md`, `font/size/body/sm`, `font/weight/body/regular`, `shape/radius/md`, `size/2xs`, `size/border/regular`, `size/lg`, `size/sm`, `size/xl`, `size/xs`, `space/2xl`, `space/lg`, `space/md`, `space/sm`, `space/xs`
- Override tokens (configurator; each aliases the semantic token it replaces): `combobox/height/{size}`, `combobox/space-x/{size}`, `combobox/gap/{size}`, `combobox/radius/{size}`, `combobox/border-width`, `combobox/background/{state}`, `combobox/border-color/{invalid}/{state}`, `combobox/foreground/{filled}/{state}`, `combobox/text/text-style/{size}`, `combobox/clear/size/{size}`, `combobox/clear/foreground/{state}`, `combobox/trigger/size/{size}`, `combobox/trigger/foreground/{state}`

### Autocomplete

21 · Selection · CSS `.ds-autocomplete` · [Base UI docs](https://base-ui.com/react/components/autocomplete)

A text input with suggestions. The user can pick one or keep typing their own text.

**Use it**

- Use it for search boxes and free-text fields with common values (tags, cities).
- When only listed values are valid, use Combobox instead.
- Wrap it in Field for a label; it takes the Field’s size like Input.

**Don't**

- Don’t show a check on suggestions: nothing stays selected, the text is the value.

**Accessibility**

- Arrow keys move through the suggestions; Enter fills the input; Escape closes the list.
- The input keeps focus and points at the highlighted suggestion (aria-activedescendant).

**Code**

```tsx
import { Autocomplete } from 'stories/base-ui/components/autocomplete/Autocomplete'
```

Rendered by `<Autocomplete.Root>`. API: [Autocomplete module](#autocomplete-module).

**Parts**

| Part | Base UI | Figma layer | CSS class | Description |
|---|---|---|---|---|
| root | `Autocomplete.Root` | `(variant)` | `.ds-autocomplete` | Input and list (in code the list is portalled, offset by the positioner). |
| input | `Autocomplete.Input` | `input` | instance of Input | An Input: Autocomplete.Input renders the Input’s value element. |
| listbox | `Autocomplete.Popup` | `listbox` | instance of Listbox | The suggestions: a Listbox of Options without indicators. |

**Figma properties** (set on an instance instead of detaching it)

| Property | Kind | Default / suggested | In code |
|---|---|---|---|
| Input | Nested instance | its own properties show here | — |
| Listbox | Nested instance | its own properties show here | — |

**Tokens**

- Semantic: `space/xs`

### Listbox

22 · Selection · CSS `.ds-listbox` · [Base UI docs](https://base-ui.com/react/components/select)

The list that opens from a Select, Combobox or Autocomplete: a surface of Options.

**Use it**

- It takes at least its trigger’s width; long lists scroll inside it.
- Group long lists with group labels, like Menu.
- Say why a search matched nothing in the empty state (“No fruits found”).

**Don't**

- Don’t use it for actions; use Menu.

**Accessibility**

- Renders role="listbox"; the input or trigger keeps focus and points at the highlighted option (aria-activedescendant).

**Code**

```tsx
import { Autocomplete } from 'stories/base-ui/components/autocomplete/Autocomplete'
import { Combobox } from 'stories/base-ui/components/combobox/Combobox'
import { Select } from 'stories/base-ui/components/select/Select'
```

Rendered by `<Autocomplete.Popup>`, `<Combobox.Popup>`, `<Select.Popup>`. API: [Autocomplete module](#autocomplete-module), [Combobox module](#combobox-module), [Select module](#select-module).

**Parts**

| Part | Base UI | Figma layer | CSS class | Description |
|---|---|---|---|---|
| root | `Select.Popup / Combobox.Popup / Autocomplete.Popup` | `(variant)` | `.ds-listbox` | The surface. At least as wide as its trigger or input. |
| items | — | `Items` | `.ds-listbox` | Slot for the Options (in code, the List’s children). |
| option | — | `Items › option` | instance of Option | Option instances. |
| empty | `Combobox.Empty / Autocomplete.Empty` | `empty` | `.ds-listbox__empty` | Shown instead of the options when a search matches nothing (hidden in Figma; turn it on). |
| empty-text | — | `empty › text` | `.ds-listbox__empty` | The empty state’s text. |

**Figma properties** (set on an instance instead of detaching it)

| Property | Kind | Default / suggested | In code |
|---|---|---|---|
| Items | Slot | Option | `<Select.Item>… / <Combobox.Item>…` |
| Show empty | Boolean | Off | `<Combobox.Empty>` |
| Empty text | Text | No results. | — |

**Tokens**

- Semantic: `color/background/surface/medium`, `color/border/neutral/subtle`, `color/foreground/neutral/secondary`, `effect/shadow/elevation/medium`, `font/family/primary`, `font/line-height/body/md`, `font/size/body/md`, `font/weight/body/regular`, `shape/radius/lg`, `size/border/regular`, `space/md`, `space/sm`, `space/xs`
- Override tokens (configurator; each aliases the semantic token it replaces): `listbox/space-x`, `listbox/space-y`, `listbox/radius`, `listbox/border-width`, `listbox/background`, `listbox/border-color`, `listbox/empty/space-x`, `listbox/empty/space-y`, `listbox/empty/foreground`, `listbox/empty/text-style`

### Option

23 · Selection · CSS `.ds-option` · [Base UI docs](https://base-ui.com/react/components/select)

A row in a Listbox: the options of a Select, Combobox or Autocomplete.

**Use it**

- Keep labels short and distinct; they are what typeahead matches.
- Hide the indicator where nothing stays selected (Autocomplete only fills the input).

**Don't**

- Don’t put interactive content (buttons, links) in an option.

**Accessibility**

- Arrow keys move the highlight; Enter selects; typing jumps to a matching label.
- Selected options are announced (aria-selected); disabled ones are skipped by the highlight.

**Code**

```tsx
import { Autocomplete } from 'stories/base-ui/components/autocomplete/Autocomplete'
import { Combobox } from 'stories/base-ui/components/combobox/Combobox'
import { Select } from 'stories/base-ui/components/select/Select'
```

Rendered by `<Autocomplete.Item>`, `<Combobox.Item>`, `<Select.Item>`. API: [Autocomplete module](#autocomplete-module), [Combobox module](#combobox-module), [Select module](#select-module).

**States** (not props: Base UI sets them from interaction and its own props, e.g. `disabled`, `checked`, Field `invalid`)

| Figma | Values | Code condition |
|---|---|---|
| State | Default · Highlighted · Disabled | default: (default); highlighted: `[data-highlighted]`; disabled: `[data-disabled]` |
| Selected | False · True | false: `:not([data-selected])`; true: `[data-selected]` |

**Parts**

| Part | Base UI | Figma layer | CSS class | Description |
|---|---|---|---|---|
| root | `Select.Item / Combobox.Item / Autocomplete.Item` | `(variant)` | `.ds-option` | One row of a Listbox. |
| indicator | — | `indicator` | `.ds-option__indicator` | A fixed slot for the check, so labels line up (Show indicator; off in Autocomplete). |
| icon | `Select.ItemIndicator / Combobox.ItemIndicator` | `indicator › icon` | `.ds-option__icon` | The check, only on the selected option. |
| label | `Select.ItemText` | `label` | `.ds-option__label` | The option’s text. |

**Tokens**

- Semantic: `color/background/interactive/subtle/default`, `color/background/interactive/subtle/hover`, `color/foreground/interactive/disabled`, `color/foreground/neutral/primary`, `font/family/primary`, `font/line-height/body/md`, `font/size/body/md`, `font/weight/body/regular`, `shape/radius/sm`, `size/xs`, `space/md`, `space/sm`
- Override tokens (configurator; each aliases the semantic token it replaces): `option/space-x`, `option/space-y`, `option/gap`, `option/radius`, `option/background/{state}`, `option/indicator/size`, `option/indicator/foreground/{state}`, `option/label/foreground/{state}`, `option/label/text-style`

## Menus

### Menu

24 · Menus · CSS `.ds-menu` · [Base UI docs](https://base-ui.com/react/components/menu)

A list of actions or options that opens from a button. Built from Menu Items, Menu Group Labels and Menu Separators.

**Use it**

- Open it from a Button (Menu.Trigger renders one, with a caret).
- Group related items under a group label; separate groups with a separator.
- Keep labels short and start them with a verb.

**Don't**

- Don’t use a menu for navigation between pages; use Navigation Menu.
- Don’t use it to pick a form value; use Select.

**Accessibility**

- The trigger opens it with Enter, Space or Arrow Down; Escape closes it and returns focus to the trigger.
- Focus is trapped while open; the popup is announced as a menu.

**Code**

```tsx
import { ContextMenu } from 'stories/base-ui/components/context-menu/ContextMenu'
import { Menu } from 'stories/base-ui/components/menu/Menu'
```

Rendered by `<ContextMenu.Popup>`, `<Menu.Popup>`. API: [ContextMenu module](#contextmenu-module), [Menu module](#menu-module).

**Parts**

| Part | Base UI | Figma layer | CSS class | Description |
|---|---|---|---|---|
| root | `Menu.Popup` | `(variant)` | `.ds-menu` | The surface: background, border, radius and elevation. Opens from a Button (Menu.Trigger). |
| items | — | `Items` | `.ds-menu` | Slot for the menu’s content: Menu Items, Menu Group Labels and Menu Separators (in code, the popup’s children). |
| item | — | `Items › item` | instance of Menu Item | Menu Item instances. |

**Figma properties** (set on an instance instead of detaching it)

| Property | Kind | Default / suggested | In code |
|---|---|---|---|
| Items | Slot | Menu Item, Menu Group Label, Menu Separator | `children` |

**Tokens**

- Semantic: `color/background/surface/medium`, `color/border/neutral/subtle`, `effect/shadow/elevation/medium`, `shape/radius/lg`, `size/border/regular`, `space/xs`
- Override tokens (configurator; each aliases the semantic token it replaces): `menu/space-x`, `menu/space-y`, `menu/radius`, `menu/border-width`, `menu/background`, `menu/border-color`

### Menu Item

25 · Menus · CSS `.ds-menu-item` · [Base UI docs](https://base-ui.com/react/components/menu)

A row in a Menu: an action, a checkbox or radio option, or the trigger of a submenu.

**Use it**

- Use Checkbox items for independent toggles, Radio items (in a Menu.RadioGroup) for one choice of several.
- Use a Submenu item to group related actions; keep nesting to one level.

**Don't**

- Don’t mix checkbox / radio items with plain actions without a separator or group label between them.

**Accessibility**

- Arrow keys move the highlight; Enter or Space activates; typing jumps to the matching label.
- Checkbox and radio items announce their checked state (menuitemcheckbox / menuitemradio).

**Code**

```tsx
import { Menu } from 'stories/base-ui/components/menu/Menu'
```

Rendered by `<Menu.Item>`, `<Menu.CheckboxItem>`, `<Menu.RadioItem>`, `<Menu.SubmenuTrigger>`. API: [Menu module](#menu-module).

**Props (variant axes)**

| Prop | Values | Default | Figma | Notes |
|---|---|---|---|---|
| — | `'default'` `'checkbox'` `'radio'` `'submenu'` | — | Type: Default · Checkbox · Radio · Submenu | Not a prop: each component sets it. `Menu.Item` → `default`, `Menu.CheckboxItem` → `checkbox`, `Menu.RadioItem` → `radio`, `Menu.SubmenuTrigger` → `submenu`. |

**States** (not props: Base UI sets them from interaction and its own props, e.g. `disabled`, `checked`, Field `invalid`)

| Figma | Values | Code condition |
|---|---|---|
| State | Default · Highlighted · Disabled | default: (default); highlighted: `[data-highlighted]` or `[data-popup-open]`; disabled: `[data-disabled]` |
| Checked | False · True | false: `:not([data-checked])`; true: `[data-checked]` |

**Parts**

| Part | Base UI | Figma layer | CSS class | Description |
|---|---|---|---|---|
| root | `Menu.Item` | `(variant)` | `.ds-menu-item` | One row. Menu.CheckboxItem, Menu.RadioItem and Menu.SubmenuTrigger share its look. |
| indicator | — | `indicator` | `.ds-menu-item__indicator` | Checkbox and radio items: a fixed slot, so labels line up whether checked or not. |
| icon | `Menu.CheckboxItemIndicator / Menu.RadioItemIndicator` | `indicator › icon` | `.ds-menu-item__icon` | Check (checkbox) or dot (radio), only while checked. |
| label | — | `label` | `.ds-menu-item__label` | The item’s text. |
| caret | — | `caret` | `.ds-menu-item__caret` | Submenu triggers: points to the submenu. |

**Tokens**

- Semantic: `color/background/interactive/subtle/default`, `color/background/interactive/subtle/hover`, `color/foreground/interactive/disabled`, `color/foreground/neutral/primary`, `color/foreground/neutral/secondary`, `font/family/primary`, `font/line-height/body/md`, `font/size/body/md`, `font/weight/body/regular`, `shape/radius/sm`, `size/xs`, `space/md`, `space/sm`
- Override tokens (configurator; each aliases the semantic token it replaces): `menu-item/space-x`, `menu-item/space-y`, `menu-item/gap`, `menu-item/radius`, `menu-item/background/{state}`, `menu-item/indicator/size`, `menu-item/indicator/foreground/{state}`, `menu-item/label/foreground/{state}`, `menu-item/label/text-style`, `menu-item/caret/size`, `menu-item/caret/foreground/{state}`

### Menu Group Label

26 · Menus · CSS `.ds-menu-group-label` · [Base UI docs](https://base-ui.com/react/components/menu)

Names a group of items in a Menu (or Context Menu, Menubar menu).

**Use it**

- Use it inside a Menu.Group; one or two words.

**Don't**

- Don’t use it as a clickable item.

**Accessibility**

- Labels its Menu.Group (aria-labelledby).

**Code**

```tsx
import { Menu } from 'stories/base-ui/components/menu/Menu'
```

Rendered by `<Menu.GroupLabel>`. API: [Menu module](#menu-module).

**Parts**

| Part | Base UI | Figma layer | CSS class | Description |
|---|---|---|---|---|
| root | `Menu.GroupLabel` | `(variant)` | `.ds-menu-group-label` | The label row; inset like the items. |
| text | — | `text` | `.ds-menu-group-label` | The label’s text. |

**Figma properties** (set on an instance instead of detaching it)

| Property | Kind | Default / suggested | In code |
|---|---|---|---|
| Label | Text | Library | `children` |

**Tokens**

- Semantic: `color/foreground/neutral/secondary`, `font/family/primary`, `font/line-height/caption/md`, `font/size/caption/md`, `font/weight/body/regular`, `space/md`, `space/xs`
- Override tokens (configurator; each aliases the semantic token it replaces): `menu-group-label/space-x`, `menu-group-label/space-y`, `menu-group-label/foreground`, `menu-group-label/text-style`

### Menu Separator

27 · Menus · CSS `.ds-menu-separator` · [Base UI docs](https://base-ui.com/react/components/menu)

A line between groups of items in a Menu.

**Use it**

- Put it between groups, not at the start or end of a menu.

**Don't**

- Don’t separate every item.

**Accessibility**

- Renders role="separator"; screen readers skip it while moving through items.

**Code**

```tsx
import { Menu } from 'stories/base-ui/components/menu/Menu'
```

Rendered by `<Menu.Separator>`. API: [Menu module](#menu-module).

**Parts**

| Part | Base UI | Figma layer | CSS class | Description |
|---|---|---|---|---|
| root | `Menu.Separator` | `(variant)` | `.ds-menu-separator` | Its padding keeps the line inset from the popup’s edges. |
| line | — | `line` | `.ds-menu-separator` | The line itself (the content box in code). |

**Tokens**

- Semantic: `color/border/neutral/subtle`, `size/border/regular`, `space/md`, `space/xs`
- Override tokens (configurator; each aliases the semantic token it replaces): `menu-separator/space-x`, `menu-separator/space-y`, `menu-separator/width`, `menu-separator/color`

### Menubar

28 · Menus · CSS `.ds-menubar` · [Base UI docs](https://base-ui.com/react/components/menubar)

A row of menus, like a desktop app’s File / Edit / View bar.

**Use it**

- Use it in tool-like apps (editors) with many commands grouped by topic.
- The menus are ordinary Menus: items, checkbox and radio items, submenus.

**Don't**

- Don’t use it for site navigation; use Navigation Menu.

**Accessibility**

- Renders role="menubar": one tab stop; arrow keys move between items.
- Once a menu is open, moving to the next item opens its menu.

**Code**

```tsx
import { Menubar } from 'stories/base-ui/components/menubar/Menubar'
```

Rendered by `<Menubar.Root>`. API: [Menubar module](#menubar-module).

**Parts**

| Part | Base UI | Figma layer | CSS class | Description |
|---|---|---|---|---|
| root | `Menubar` | `(variant)` | `.ds-menubar` | The bar holding the menus’ triggers. |
| items | — | `Items` | `.ds-menubar` | Slot for the Menubar Items (in code, the bar’s children). |
| item | — | `Items › item` | instance of Menubar Item | Menubar Item instances; each opens a Menu. |

**Figma properties** (set on an instance instead of detaching it)

| Property | Kind | Default / suggested | In code |
|---|---|---|---|
| Items | Slot | Menubar Item | `children` |

**Tokens**

- Semantic: `color/background/neutral/secondary`, `color/border/neutral/subtle`, `shape/radius/md`, `size/border/regular`, `space/2xs`
- Override tokens (configurator; each aliases the semantic token it replaces): `menubar/space-x`, `menubar/space-y`, `menubar/gap`, `menubar/radius`, `menubar/border-width`, `menubar/background`, `menubar/border-color`

### Menubar Item

29 · Menus · CSS `.ds-menubar-item` · [Base UI docs](https://base-ui.com/react/components/menubar)

One entry of a Menubar: a trigger that opens a Menu.

**Use it**

- Label it with a noun for what its menu holds (File, Edit, View).

**Don't**

- Don’t make an item act on its own; every item opens a menu.

**Accessibility**

- Left/Right move between items; Down or Enter opens the menu.

**Code**

```tsx
import { Menubar } from 'stories/base-ui/components/menubar/Menubar'
```

Rendered by `<Menubar.Trigger>`. API: [Menubar module](#menubar-module).

**States** (not props: Base UI sets them from interaction and its own props, e.g. `disabled`, `checked`, Field `invalid`)

| Figma | Values | Code condition |
|---|---|---|
| State | Default · Hover · Open · Disabled | default: (default); hover: `:hover:not([data-disabled]):not([data-popup-open])`; open: `[data-popup-open]`; disabled: `[data-disabled]` |

**Parts**

| Part | Base UI | Figma layer | CSS class | Description |
|---|---|---|---|---|
| root | `Menu.Trigger` | `(variant)` | `.ds-menubar-item` | Opens its Menu. Arrow keys move along the bar; once a menu is open, hovering the next item opens its menu. |
| label | — | `label` | `.ds-menubar-item` | The text (the trigger’s own text in code). |

**Tokens**

- Semantic: `color/background/interactive/subtle/default`, `color/background/interactive/subtle/hover`, `color/background/interactive/subtle/selected`, `color/foreground/interactive/disabled`, `color/foreground/neutral/primary`, `font/family/primary`, `font/line-height/body/md`, `font/size/body/md`, `font/weight/body/regular`, `shape/radius/sm`, `size/md`, `space/md`
- Override tokens (configurator; each aliases the semantic token it replaces): `menubar-item/height`, `menubar-item/space-x`, `menubar-item/radius`, `menubar-item/background/{state}`, `menubar-item/foreground/{state}`, `menubar-item/text-style`

## Navigation

### Navigation Menu

30 · Navigation · CSS `.ds-navigation-menu` · [Base UI docs](https://base-ui.com/react/components/navigation-menu)

Site navigation: a row of links and triggers whose panels list a section’s pages.

**Use it**

- Use it for a site’s or app’s main sections; mark the current page’s link active.
- In a panel, give each link a title and one line of description.
- Keep the bar short (up to ~6 items); the panel is where depth goes.

**Don't**

- Don’t use it for commands; use Menu or Menubar.

**Accessibility**

- Renders a <nav> with a list; links are real links (render your router’s Link).
- Panels open on hover and on Enter / Space; arrow keys move between items.

**Code**

```tsx
import { NavigationMenu } from 'stories/base-ui/components/navigation-menu/NavigationMenu'
```

Rendered by `<NavigationMenu.Root>`. API: [NavigationMenu module](#navigationmenu-module).

**Parts**

| Part | Base UI | Figma layer | CSS class | Description |
|---|---|---|---|---|
| root | `NavigationMenu.Root` | `(variant)` | `.ds-navigation-menu` | The bar and its panel (in code, the panel is portalled and placed under its trigger). |
| list | `NavigationMenu.List` | `List` | `.ds-navigation-menu__list` | Slot for the bar’s items. |
| item | — | `List › item` | instance of Navigation Menu Item | Navigation Menu Item instances. |
| popup | `NavigationMenu.Popup` | `popup` | `.ds-navigation-menu__popup` | The panel’s surface (Show panel). Resizes to the open trigger’s content. |
| content | `NavigationMenu.Content` | `popup` | `.ds-navigation-menu__content` | The open trigger’s links. Holds the panel’s padding (Base UI sizes the popup from it); in Figma it is the popup frame itself. |
| links | — | `popup › Links` | `.ds-navigation-menu__content` | Slot for the panel’s links (in code, the Content’s children). |
| link | — | `popup › Links › link` | instance of Navigation Menu Link | Navigation Menu Link instances. |
| arrow | `NavigationMenu.Arrow` | `popup › arrow` | `.ds-navigation-menu__arrow` | Points at the trigger. Placed by Base UI on the side facing it. |
| arrow-shape | — | `popup › arrow › shape` | `.ds-navigation-menu__arrow::before` | The arrow’s diamond (::before in code): the surface’s fill and border, half hidden so only the tip shows. |

**Figma properties** (set on an instance instead of detaching it)

| Property | Kind | Default / suggested | In code |
|---|---|---|---|
| List | Slot | Navigation Menu Item | `<NavigationMenu.Item>…` |
| Show panel | Boolean | On | `<NavigationMenu.Content>` |
| Links | Slot | Navigation Menu Link | `<NavigationMenu.Card>…` |

**Tokens**

- Semantic: `color/background/surface/medium`, `color/border/neutral/subtle`, `effect/shadow/elevation/medium`, `shape/radius/lg`, `size/border/regular`, `space/2xs`, `space/sm`
- Override tokens (configurator; each aliases the semantic token it replaces): `navigation-menu/gap`, `navigation-menu/popup/space-x`, `navigation-menu/popup/space-y`, `navigation-menu/popup/radius`, `navigation-menu/popup/border-width`, `navigation-menu/popup/background`, `navigation-menu/popup/border-color`

### Navigation Menu Item

31 · Navigation · CSS `.ds-navigation-menu-item` · [Base UI docs](https://base-ui.com/react/components/navigation-menu)

An entry of a Navigation Menu: a link to a page, or a trigger that opens a panel of links.

**Use it**

- Mark the current page’s link active: its icon fills and it gets the selected background.
- Use a trigger for a section with several pages; its panel lists them with a line of description each.

**Don't**

- Don’t put actions (Log out, Share) in navigation; use Menu.

**Accessibility**

- The active link gets aria-current="page".
- Triggers open their panel on hover, Enter or Space; Escape closes it and returns focus.

**Code**

```tsx
import { NavigationMenu } from 'stories/base-ui/components/navigation-menu/NavigationMenu'
```

Rendered by `<NavigationMenu.Trigger>`, `<NavigationMenu.Link>`. API: [NavigationMenu module](#navigationmenu-module).

**Props (variant axes)**

| Prop | Values | Default | Figma | Notes |
|---|---|---|---|---|
| — | `'link'` `'trigger'` | — | Type: Link · Trigger | Not a prop: each component sets it. `NavigationMenu.Trigger` → `trigger`, `NavigationMenu.Link` → `link`. |

**States** (not props: Base UI sets them from interaction and its own props, e.g. `disabled`, `checked`, Field `invalid`)

| Figma | Values | Code condition |
|---|---|---|
| State | Default · Hover | default: (default); hover: `:hover` |
| Active | False · True | false: `:not([data-active]):not([data-popup-open])`; true: `[data-active]` or `[data-popup-open]` |

**Parts**

| Part | Base UI | Figma layer | CSS class | Description |
|---|---|---|---|---|
| root | `NavigationMenu.Link / NavigationMenu.Trigger` | `(variant)` | `.ds-navigation-menu-item` | A link to a page, or a trigger that opens a panel of links. |
| icon | — | `icon` | `.ds-navigation-menu-item__icon` | Optional (Show icon). A line icon while inactive, filled while active (current page or open panel). |
| label | — | `label` | `.ds-navigation-menu-item__label` | The item’s text. |
| caret | `NavigationMenu.Icon` | `caret` | `.ds-navigation-menu-item__caret` | Triggers only. Turns over while the panel is open. |

**Tokens**

- Semantic: `color/background/interactive/subtle/default`, `color/background/interactive/subtle/hover`, `color/background/interactive/subtle/selected`, `color/foreground/neutral/primary`, `color/foreground/neutral/secondary`, `font/family/primary`, `font/line-height/body/md`, `font/size/body/md`, `font/weight/body/regular`, `shape/radius/md`, `size/2xs`, `size/lg`, `size/xs`, `space/md`, `space/xs`
- Override tokens (configurator; each aliases the semantic token it replaces): `navigation-menu-item/height`, `navigation-menu-item/space-x`, `navigation-menu-item/gap`, `navigation-menu-item/radius`, `navigation-menu-item/background/{active}/{state}`, `navigation-menu-item/icon/size`, `navigation-menu-item/icon/foreground`, `navigation-menu-item/label/foreground`, `navigation-menu-item/label/text-style`, `navigation-menu-item/caret/size`, `navigation-menu-item/caret/foreground`

### Navigation Menu Link

32 · Navigation · CSS `.ds-navigation-menu-link` · [Base UI docs](https://base-ui.com/react/components/navigation-menu)

A link card in a Navigation Menu panel.

**Use it**

- Title the page; describe it in one line.

**Don't**

- Don’t put buttons in it; the whole card is the link.

**Accessibility**

- A real link (render your router’s Link); the title is its accessible name, the description is read after it.

**Code**

```tsx
import { NavigationMenu } from 'stories/base-ui/components/navigation-menu/NavigationMenu'
```

Rendered by `<NavigationMenu.Card>`. API: [NavigationMenu module](#navigationmenu-module).

**States** (not props: Base UI sets them from interaction and its own props, e.g. `disabled`, `checked`, Field `invalid`)

| Figma | Values | Code condition |
|---|---|---|
| State | Default · Hover | default: (default); hover: `:hover` |

**Parts**

| Part | Base UI | Figma layer | CSS class | Description |
|---|---|---|---|---|
| root | `NavigationMenu.Link` | `(variant)` | `.ds-navigation-menu-link` | The card: a link to a page. |
| title | — | `title` | `.ds-navigation-menu-link__title` | The page’s name. |
| description | — | `description` | `.ds-navigation-menu-link__description` | One line about the page (Show description). |

**Figma properties** (set on an instance instead of detaching it)

| Property | Kind | Default / suggested | In code |
|---|---|---|---|
| Title | Text | Quick start | `title` |
| Show description | Boolean | On | `description` |
| Description | Text | Install and assemble your first component. | — |

**Tokens**

- Semantic: `color/background/interactive/subtle/default`, `color/background/interactive/subtle/hover`, `color/foreground/neutral/primary`, `color/foreground/neutral/secondary`, `font/family/primary`, `font/line-height/body/md`, `font/size/body/md`, `font/weight/body/regular`, `font/weight/body/strong`, `shape/radius/md`, `space/sm`, `space/xs`
- Override tokens (configurator; each aliases the semantic token it replaces): `navigation-menu-link/space-x`, `navigation-menu-link/space-y`, `navigation-menu-link/gap`, `navigation-menu-link/radius`, `navigation-menu-link/background/{state}`, `navigation-menu-link/title/foreground`, `navigation-menu-link/title/text-style`, `navigation-menu-link/description/foreground`, `navigation-menu-link/description/text-style`

### Tabs

33 · Navigation · CSS `.ds-tabs` · [Base UI docs](https://base-ui.com/react/components/tabs)

Switches between views of related content, one panel at a time.

**Use it**

- Use tabs for peer views of the same thing (an item’s Overview, Activity, Settings).
- Keep the number of tabs small (2–6); the selected tab joins its panel.
- Match the size to the surrounding controls.

**Don't**

- Don’t use tabs for steps in a sequence; use a stepper or a form.
- Don’t nest tabs.

**Accessibility**

- Renders a tablist; each tab controls its panel (aria-controls), and the panel is labelled by its tab.
- Arrow keys move focus along the list; selection follows focus unless activateOnFocus is off.

**Code**

```tsx
import { Tabs } from 'stories/base-ui/components/tabs/Tabs'
```

Rendered by `<Tabs.Root>`. API: [Tabs module](#tabs-module).

**Props (variant axes)**

| Prop | Values | Default | Figma | Notes |
|---|---|---|---|---|
| `size` | `'sm'` `'md'` `'lg'` | `'md'` | Size: Small · Medium · Large | On `Tabs.Root` |

**Parts**

| Part | Base UI | Figma layer | CSS class | Description |
|---|---|---|---|---|
| root | `Tabs.Root` | `(variant)` | `.ds-tabs` | List above panel; the list overlaps the panel’s top border by its width. |
| list | `Tabs.List` | `List` | `.ds-tabs__list` | Slot for the Tabs. |
| tab | — | `List › tab` | instance of Tab | Tab instances. |
| indicator | `Tabs.Indicator` | (code only) | `.ds-tabs__indicator` | Code only: slides behind the selected tab (surface, border on three sides, top corners rounded). In Figma the selected Tab draws it. |
| panel | `Tabs.Panel` | `Panel` | `.ds-tabs__panel` | Slot for the selected tab’s content. |
| text | — | `Panel › text` | `.ds-tabs__panel` | The panel’s text (in code, any content). |

**Figma properties** (set on an instance instead of detaching it)

| Property | Kind | Default / suggested | In code |
|---|---|---|---|
| List | Slot | Tab | `<Tabs.Tab>…` |
| Panel | Slot | Field, Button, Scroll Area | `<Tabs.Panel>` |

**Tokens**

- Semantic: `color/background/neutral/primary`, `color/border/neutral/subtle`, `color/foreground/neutral/primary`, `font/family/primary`, `font/line-height/body/md`, `font/size/body/md`, `font/weight/body/regular`, `shape/radius/lg`, `shape/radius/md`, `size/border/regular`, `space/lg`, `space/xs`
- Override tokens (configurator; each aliases the semantic token it replaces): `tabs/gap`, `tabs/indicator/radius`, `tabs/border-width`, `tabs/border-color`, `tabs/background`, `tabs/panel/space-x`, `tabs/panel/space-y`, `tabs/panel/radius`, `tabs/panel/foreground`, `tabs/panel/text-style`

### Tab

34 · Navigation · CSS `.ds-tab` · [Base UI docs](https://base-ui.com/react/components/tabs)

One tab of a Tabs list.

**Use it**

- Label tabs with one or two words; keep them parallel (Overview, Projects, Account).

**Don't**

- Don’t disable a tab to hide content the user can’t reach; explain why instead.

**Accessibility**

- Arrow keys move between tabs; Home / End jump to the first / last.

**Code**

```tsx
import { Tabs } from 'stories/base-ui/components/tabs/Tabs'
```

Rendered by `<Tabs.Tab>`. API: [Tabs module](#tabs-module).

**Props (variant axes)**

| Prop | Values | Default | Figma | Notes |
|---|---|---|---|---|
| `size` | `'sm'` `'md'` `'lg'` | `'md'` | Size: Small · Medium · Large | Set on `Tabs.Root`, which passes it down |

**States** (not props: Base UI sets them from interaction and its own props, e.g. `disabled`, `checked`, Field `invalid`)

| Figma | Values | Code condition |
|---|---|---|
| Selected | False · True | false: `:not([data-active])`; true: `[data-active]` |
| State | Default · Hover · Disabled | default: (default); hover: `:hover:not([data-disabled])`; disabled: `[data-disabled]` |

**Parts**

| Part | Base UI | Figma layer | CSS class | Description |
|---|---|---|---|---|
| root | `Tabs.Tab` | `(variant)` | `.ds-tab` | One tab. In Figma the selected one draws the indicator (surface, border on three sides); in code Tabs.Indicator slides behind it. |
| label | — | `label` | `.ds-tab` | The text (the tab’s own text in code). |

**Figma properties** (set on an instance instead of detaching it)

| Property | Kind | Default / suggested | In code |
|---|---|---|---|
| Label | Text | Overview | `children` |

**Tokens**

- Semantic: `color/background/neutral/primary`, `color/border/neutral/subtle`, `color/foreground/interactive/disabled`, `color/foreground/neutral/primary`, `color/foreground/neutral/secondary`, `font/family/primary`, `font/line-height/body/lg`, `font/line-height/body/md`, `font/line-height/body/sm`, `font/size/body/lg`, `font/size/body/md`, `font/size/body/sm`, `font/weight/body/regular`, `shape/radius/md`, `size/border/regular`, `size/lg`, `size/xl`, `space/2xl`, `space/md`, `space/sm`
- Primitive keywords: `colors/transparent`
- Override tokens (configurator; each aliases the semantic token it replaces): `tab/height/{size}`, `tab/space-x/{size}`, `tab/foreground/{selected}/{state}`, `tab/text-style/{size}`

## Overlays

### Popover

35 · Overlays · CSS `.ds-popover` · [Base UI docs](https://base-ui.com/react/components/popover)

A floating panel anchored to a trigger, for extra information or controls that don’t need a full dialog.

**Use it**

- Open it from a Button; it stays until the user clicks outside, presses Escape or uses a close control.
- Give it a title, so it’s announced with a name.
- Keep it small: a few lines of text, or a short form.

**Don't**

- Don’t use it for hints on hover; use Tooltip.
- Don’t put a long flow in it; use Dialog.

**Accessibility**

- Focus moves into the popover when it opens and back to the trigger when it closes.
- The title and description label and describe the popup.

**Code**

```tsx
import { Popover } from 'stories/base-ui/components/popover/Popover'
```

Rendered by `<Popover.Popup>`. API: [Popover module](#popover-module).

**States** (not props: Base UI sets them from interaction and its own props, e.g. `disabled`, `checked`, Field `invalid`)

| Figma | Values | Code condition |
|---|---|---|
| Side (placement) | Bottom · Top · Left · Right | bottom: `[data-side="bottom"]`; top: `[data-side="top"]`; left: `[data-side="left"]`; right: `[data-side="right"]` |

**Parts**

| Part | Base UI | Figma layer | CSS class | Description |
|---|---|---|---|---|
| root | `Popover.Popup` | `(variant)` | `.ds-popover` | The surface. Opens from a trigger (usually a Button) and stays until dismissed. |
| arrow | `Popover.Arrow` | `arrow` | `.ds-popover__arrow` | Points at the trigger. Placed by Base UI on the side facing it. |
| arrow-shape | — | `arrow › shape` | `.ds-popover__arrow::before` | The arrow’s diamond (::before in code): the surface’s fill and border, half hidden so only the tip shows. |
| title | `Popover.Title` | `title` | `.ds-popover__title` | Names the popover; announced when it opens. |
| description | `Popover.Description` | `description` | `.ds-popover__description` | Supporting text. |
| content | — | `Content` | `.ds-popover` | Slot for anything else (a form, a list); off by default (in code, more children). |

**Figma properties** (set on an instance instead of detaching it)

| Property | Kind | Default / suggested | In code |
|---|---|---|---|
| Show arrow | Boolean | On | `arrow` |
| Show title | Boolean | On | `<Popover.Title>` |
| Title | Text | Notifications | — |
| Show description | Boolean | On | `<Popover.Description>` |
| Description | Text | You are all caught up. Good job! | — |
| Show content | Boolean | Off | — |
| Content | Slot | Button, Field, Separator | `children` |

**Tokens**

- Semantic: `color/background/surface/medium`, `color/border/neutral/subtle`, `color/foreground/neutral/primary`, `color/foreground/neutral/secondary`, `effect/shadow/elevation/medium`, `font/family/primary`, `font/line-height/body/md`, `font/size/body/md`, `font/weight/body/regular`, `font/weight/body/strong`, `shape/radius/lg`, `size/border/regular`, `space/md`, `space/xs`
- Override tokens (configurator; each aliases the semantic token it replaces): `popover/space-x`, `popover/space-y`, `popover/gap`, `popover/radius`, `popover/border-width`, `popover/background`, `popover/border-color`, `popover/title/foreground`, `popover/title/text-style`, `popover/description/foreground`, `popover/description/text-style`

### Tooltip

36 · Overlays · CSS `.ds-tooltip` · [Base UI docs](https://base-ui.com/react/components/tooltip)

A short label that appears when a control is hovered or focused, usually to name an icon button.

**Use it**

- Name icon-only controls (Bold, Share) and show their keyboard shortcut.
- Keep it to a few words, with no interactive content.
- Wrap a group of triggers in Tooltip.Provider so moving between them shows the next tooltip at once.

**Don't**

- Don’t put essential information only in a tooltip; touch users can’t hover.
- Don’t put links or buttons in it; use Popover.

**Accessibility**

- Shows on keyboard focus as well as hover; Escape hides it.
- The trigger still needs its own accessible name (aria-label); the tooltip repeats it visually.

**Code**

```tsx
import { Tooltip } from 'stories/base-ui/components/tooltip/Tooltip'
```

Rendered by `<Tooltip.Popup>`. API: [Tooltip module](#tooltip-module).

**States** (not props: Base UI sets them from interaction and its own props, e.g. `disabled`, `checked`, Field `invalid`)

| Figma | Values | Code condition |
|---|---|---|
| Side (placement) | Bottom · Top · Left · Right | bottom: `[data-side="bottom"]`; top: `[data-side="top"]`; left: `[data-side="left"]`; right: `[data-side="right"]` |

**Parts**

| Part | Base UI | Figma layer | CSS class | Description |
|---|---|---|---|---|
| root | `Tooltip.Popup` | `(variant)` | `.ds-tooltip` | The surface, with a short label. Shows on hover or keyboard focus of its trigger. |
| arrow | `Tooltip.Arrow` | `arrow` | `.ds-tooltip__arrow` | Points at the trigger. Placed by Base UI on the side facing it. |
| arrow-shape | — | `arrow › shape` | `.ds-tooltip__arrow::before` | The arrow’s diamond (::before in code): the surface’s fill and border, half hidden so only the tip shows. |
| label | — | `label` | `.ds-tooltip` | The text (the popup’s own text in code). |

**Figma properties** (set on an instance instead of detaching it)

| Property | Kind | Default / suggested | In code |
|---|---|---|---|
| Show arrow | Boolean | On | `arrow` |
| Label | Text | Bold | `children` |

**Tokens**

- Semantic: `color/background/surface/medium`, `color/border/neutral/subtle`, `color/foreground/neutral/primary`, `effect/shadow/elevation/medium`, `font/family/primary`, `font/line-height/body/md`, `font/size/body/md`, `font/weight/body/regular`, `shape/radius/lg`, `size/border/regular`, `space/sm`, `space/xs`
- Override tokens (configurator; each aliases the semantic token it replaces): `tooltip/space-x`, `tooltip/space-y`, `tooltip/radius`, `tooltip/border-width`, `tooltip/background`, `tooltip/border-color`, `tooltip/foreground`, `tooltip/text-style`

### Preview Card

37 · Overlays · CSS `.ds-preview-card` · [Base UI docs](https://base-ui.com/react/components/preview-card)

A preview of a link’s destination, shown while the link is hovered or focused.

**Use it**

- Use it on links to people, documents or pages where a glance saves a click.
- Keep it read-only: a picture, a title and a short summary.

**Don't**

- Don’t put actions in it; it closes when the pointer leaves.
- Don’t use it on buttons; use Tooltip or Popover.

**Accessibility**

- It’s a visual extra: the link must make sense without it.
- Opens on keyboard focus too, after a short delay.

**Code**

```tsx
import { PreviewCard } from 'stories/base-ui/components/preview-card/PreviewCard'
```

Rendered by `<PreviewCard.Popup>`. API: [PreviewCard module](#previewcard-module).

**States** (not props: Base UI sets them from interaction and its own props, e.g. `disabled`, `checked`, Field `invalid`)

| Figma | Values | Code condition |
|---|---|---|
| Side (placement) | Bottom · Top · Left · Right | bottom: `[data-side="bottom"]`; top: `[data-side="top"]`; left: `[data-side="left"]`; right: `[data-side="right"]` |

**Parts**

| Part | Base UI | Figma layer | CSS class | Description |
|---|---|---|---|---|
| root | `PreviewCard.Popup` | `(variant)` | `.ds-preview-card` | The surface. Opens when a link (PreviewCard.Trigger) is hovered or focused. |
| arrow | `PreviewCard.Arrow` | `arrow` | `.ds-preview-card__arrow` | Points at the trigger. Placed by Base UI on the side facing it. |
| arrow-shape | — | `arrow › shape` | `.ds-preview-card__arrow::before` | The arrow’s diamond (::before in code): the surface’s fill and border, half hidden so only the tip shows. |
| image | — | `image` | `.ds-preview-card__image` | Optional picture. Its background shows while it loads. |
| title | — | `title` | `.ds-preview-card__title` | What the link points to. |
| summary | — | `summary` | `.ds-preview-card__summary` | A sentence or two about it. |

**Figma properties** (set on an instance instead of detaching it)

| Property | Kind | Default / suggested | In code |
|---|---|---|---|
| Show arrow | Boolean | On | `arrow` |
| Show image | Boolean | On | `<PreviewCard.Image>` |
| Title | Text | Typography | — |
| Summary | Text | The art and science of arranging type to make written language clear and appealing. | — |

**Tokens**

- Semantic: `color/background/neutral/tertiary`, `color/background/surface/medium`, `color/border/neutral/subtle`, `color/foreground/neutral/primary`, `effect/shadow/elevation/medium`, `font/family/primary`, `font/line-height/body/md`, `font/size/body/md`, `font/weight/body/regular`, `font/weight/body/strong`, `shape/radius/lg`, `shape/radius/md`, `size/border/regular`, `space/sm`
- Override tokens (configurator; each aliases the semantic token it replaces): `preview-card/space-x`, `preview-card/space-y`, `preview-card/gap`, `preview-card/radius`, `preview-card/border-width`, `preview-card/background`, `preview-card/border-color`, `preview-card/image/background`, `preview-card/image/radius`, `preview-card/title/foreground`, `preview-card/title/text-style`, `preview-card/summary/foreground`, `preview-card/summary/text-style`

### Dialog

38 · Overlays · CSS `.ds-dialog` · [Base UI docs](https://base-ui.com/react/components/dialog)

A window over the page for a focused task: a form, details, a decision. The page behind is inert until it closes.

**Use it**

- Give it a title that says what the task is; put the primary action last in the actions row.
- Close it with a Close button, Escape or a click on the backdrop.
- For a confirmation the user must answer, use Alert Dialog.

**Don't**

- Don’t open a dialog from a dialog.
- Don’t use it for information the user may want to keep looking at while working; use Popover or a page.

**Accessibility**

- Focus moves into the dialog and is trapped there; it returns to the trigger on close.
- The title and description label and describe it (role="dialog", aria-modal).

**Code**

```tsx
import { Dialog } from 'stories/base-ui/components/dialog/Dialog'
```

Rendered by `<Dialog.Popup>`. API: [Dialog module](#dialog-module).

**Parts**

| Part | Base UI | Figma layer | CSS class | Description |
|---|---|---|---|---|
| root | `Dialog.Popup` | `(variant)` | `.ds-dialog` | The surface, centred over the page. |
| backdrop | `Dialog.Backdrop` | (code only) | `.ds-dialog__backdrop` | Dims the page behind (code only; in Figma, place the dialog over an overlay yourself). |
| header | — | `header` | `.ds-dialog__header` | Title and description. |
| title | `Dialog.Title` | `header › title` | `.ds-dialog__title` | Names the dialog; announced when it opens. |
| description | `Dialog.Description` | `header › description` | `.ds-dialog__description` | What the dialog is about, or what the action will do (Show description). |
| body | — | `Body` | `.ds-dialog__body` | Slot for the content between header and actions: a form, a list (Show body). |
| actions | — | `Actions` | `.ds-dialog__actions` | Slot for the buttons, at the end; the primary action last. |
| action | `Dialog.Close` | `Actions › action` | instance of Button | Button instances (a Close renders one). |
| close | `Dialog.Close` | `close` | instance of Icon Button | A ghost Icon Button with a cross in the top corner (Show close; showClose in code). |

**Figma properties** (set on an instance instead of detaching it)

| Property | Kind | Default / suggested | In code |
|---|---|---|---|
| Title | Text | Notifications | `<Dialog.Title>` |
| Show description | Boolean | On | `<Dialog.Description>` |
| Description | Text | You are all caught up. Good job! | — |
| Show close | Boolean | On | `showClose` |
| Show body | Boolean | Off | `<Dialog.Body>` |
| Body | Slot | Field, Fieldset, Scroll Area, Separator | `<Dialog.Body>` |
| Actions | Slot | Button | `<Dialog.Actions>` |

**Tokens**

- Semantic: `color/background/overlay/regular`, `color/background/surface/high`, `color/border/neutral/subtle`, `color/foreground/neutral/primary`, `color/foreground/neutral/secondary`, `effect/shadow/elevation/high`, `font/family/primary`, `font/line-height/body/lg`, `font/line-height/body/md`, `font/size/body/lg`, `font/size/body/md`, `font/weight/body/regular`, `font/weight/body/strong`, `shape/radius/lg`, `size/border/regular`, `space/lg`, `space/md`, `space/xs`
- Override tokens (configurator; each aliases the semantic token it replaces): `dialog/space-x`, `dialog/space-y`, `dialog/gap`, `dialog/radius`, `dialog/border-width`, `dialog/background`, `dialog/border-color`, `dialog/backdrop`, `dialog/header/gap`, `dialog/title/foreground`, `dialog/title/text-style`, `dialog/description/foreground`, `dialog/description/text-style`, `dialog/body/gap`, `dialog/actions/gap`

### Alert Dialog

39 · Overlays · CSS `.ds-alert-dialog` · [Base UI docs](https://base-ui.com/react/components/alert-dialog)

A dialog that asks the user to confirm or cancel an important action. It can’t be dismissed by clicking outside.

**Use it**

- Ask a question as the title (“Discard draft?”) and say what happens in the description.
- Label the buttons with the outcome (“Discard”, “Cancel”), not “Yes” / “No”; make a destructive action the destructive Button.

**Don't**

- Don’t use it for routine confirmations; prefer undo.
- Don’t use it for forms; use Dialog.

**Accessibility**

- Renders role="alertdialog"; focus is trapped inside until the user picks an action or presses Escape.
- Clicking the backdrop doesn’t close it.

**Code**

```tsx
import { AlertDialog } from 'stories/base-ui/components/alert-dialog/AlertDialog'
```

Rendered by `<AlertDialog.Popup>`. API: [AlertDialog module](#alertdialog-module).

**Parts**

| Part | Base UI | Figma layer | CSS class | Description |
|---|---|---|---|---|
| root | `AlertDialog.Popup` | `(variant)` | `.ds-alert-dialog` | The surface, centred over the page. |
| backdrop | `AlertDialog.Backdrop` | (code only) | `.ds-alert-dialog__backdrop` | Dims the page behind (code only; in Figma, place the dialog over an overlay yourself). |
| header | — | `header` | `.ds-alert-dialog__header` | Title and description. |
| title | `AlertDialog.Title` | `header › title` | `.ds-alert-dialog__title` | Names the dialog; announced when it opens. |
| description | `AlertDialog.Description` | `header › description` | `.ds-alert-dialog__description` | What the dialog is about, or what the action will do (Show description). |
| body | — | `Body` | `.ds-alert-dialog__body` | Slot for the content between header and actions: a form, a list (Show body). |
| actions | — | `Actions` | `.ds-alert-dialog__actions` | Slot for the buttons, at the end; the primary action last. |
| action | `AlertDialog.Close` | `Actions › action` | instance of Button | Button instances (a Close renders one). |
| close | `AlertDialog.Close` | `close` | instance of Icon Button | A ghost Icon Button with a cross in the top corner (Show close; showClose in code). |

**Figma properties** (set on an instance instead of detaching it)

| Property | Kind | Default / suggested | In code |
|---|---|---|---|
| Title | Text | Discard draft? | `<AlertDialog.Title>` |
| Show description | Boolean | On | `<AlertDialog.Description>` |
| Description | Text | You can’t undo this action. | — |
| Show close | Boolean | Off | `showClose` |
| Show body | Boolean | Off | `<AlertDialog.Body>` |
| Body | Slot | Field, Fieldset, Scroll Area, Separator | `<AlertDialog.Body>` |
| Actions | Slot | Button | `<AlertDialog.Actions>` |

**Tokens**

- Semantic: `color/background/overlay/regular`, `color/background/surface/high`, `color/border/neutral/subtle`, `color/foreground/neutral/primary`, `color/foreground/neutral/secondary`, `effect/shadow/elevation/high`, `font/family/primary`, `font/line-height/body/lg`, `font/line-height/body/md`, `font/size/body/lg`, `font/size/body/md`, `font/weight/body/regular`, `font/weight/body/strong`, `shape/radius/lg`, `size/border/regular`, `space/lg`, `space/md`, `space/xs`
- Override tokens (configurator; each aliases the semantic token it replaces): `alert-dialog/space-x`, `alert-dialog/space-y`, `alert-dialog/gap`, `alert-dialog/radius`, `alert-dialog/border-width`, `alert-dialog/background`, `alert-dialog/border-color`, `alert-dialog/backdrop`, `alert-dialog/header/gap`, `alert-dialog/title/foreground`, `alert-dialog/title/text-style`, `alert-dialog/description/foreground`, `alert-dialog/description/text-style`, `alert-dialog/body/gap`, `alert-dialog/actions/gap`

### Drawer

40 · Overlays · CSS `.ds-drawer` · [Base UI docs](https://base-ui.com/react/components/drawer)

A panel that slides in from the edge of the screen, for secondary tasks and details without leaving the page.

**Use it**

- Use it for filters, settings or an item’s details next to the list it came from.
- Give it a title; close it with a Close button, Escape, a swipe or a click on the backdrop.

**Don't**

- Don’t stack drawers.
- Don’t use it for short confirmations; use Alert Dialog.

**Accessibility**

- Behaves like a dialog: focus is trapped inside and returns to the trigger on close.
- Swiping is an extra: every way to close it also works from the keyboard.

**Code**

```tsx
import { Drawer } from 'stories/base-ui/components/drawer/Drawer'
```

Rendered by `<Drawer.Popup>`. API: [Drawer module](#drawer-module).

**Props (variant axes)**

| Prop | Values | Default | Figma | Notes |
|---|---|---|---|---|
| `side` | `'right'` `'left'` `'bottom'` | `'right'` | Side: Right · Left · Bottom | Set on `Drawer.Root`, which passes it down. Placement / content only: no token changes. |

**Parts**

| Part | Base UI | Figma layer | CSS class | Description |
|---|---|---|---|---|
| root | `Drawer.Popup` | `(variant)` | `.ds-drawer` | The panel, docked to an edge (full height at the sides, content height at the bottom). |
| backdrop | `Drawer.Backdrop` | (code only) | `.ds-drawer__backdrop` | Dims the page behind (code only; in Figma, place the dialog over an overlay yourself). |
| header | — | `header` | `.ds-drawer__header` | Title and description. |
| title | `Drawer.Title` | `header › title` | `.ds-drawer__title` | Names the dialog; announced when it opens. |
| description | `Drawer.Description` | `header › description` | `.ds-drawer__description` | What the dialog is about, or what the action will do (Show description). |
| body | — | `Body` | `.ds-drawer__body` | Slot for the content between header and actions: a form, a list (Show body). |
| actions | — | `Actions` | `.ds-drawer__actions` | Slot for the buttons, at the end; the primary action last. |
| action | `Drawer.Close` | `Actions › action` | instance of Button | Button instances (a Close renders one). |
| close | `Drawer.Close` | `close` | instance of Icon Button | A ghost Icon Button with a cross in the top corner (Show close; showClose in code). |

**Figma properties** (set on an instance instead of detaching it)

| Property | Kind | Default / suggested | In code |
|---|---|---|---|
| Title | Text | Filters | `<Drawer.Title>` |
| Show description | Boolean | On | `<Drawer.Description>` |
| Description | Text | Narrow the list down. Swipe it away or press Escape to close. | — |
| Show close | Boolean | On | `showClose` |
| Show body | Boolean | Off | `<Drawer.Body>` |
| Body | Slot | Field, Fieldset, Scroll Area, Separator | `<Drawer.Body>` |
| Actions | Slot | Button | `<Drawer.Actions>` |

**Tokens**

- Semantic: `color/background/overlay/regular`, `color/background/surface/high`, `color/border/neutral/subtle`, `color/foreground/neutral/primary`, `color/foreground/neutral/secondary`, `effect/shadow/elevation/high`, `font/family/primary`, `font/line-height/body/lg`, `font/line-height/body/md`, `font/size/body/lg`, `font/size/body/md`, `font/weight/body/regular`, `font/weight/body/strong`, `shape/radius/lg`, `size/border/regular`, `space/2xl`, `space/md`, `space/xs`
- Override tokens (configurator; each aliases the semantic token it replaces): `drawer/space-x`, `drawer/space-y`, `drawer/gap`, `drawer/radius`, `drawer/border-width`, `drawer/background`, `drawer/border-color`, `drawer/backdrop`, `drawer/header/gap`, `drawer/title/foreground`, `drawer/title/text-style`, `drawer/description/foreground`, `drawer/description/text-style`, `drawer/body/gap`, `drawer/actions/gap`

## Feedback

### Toast

41 · Feedback · CSS `.ds-toast` · [Base UI docs](https://base-ui.com/react/components/toast)

A brief message about something that just happened, shown in a corner without interrupting.

**Use it**

- Confirm a completed action (“Message sent”), ideally with a way to undo it.
- Pick the type that matches the outcome: neutral, success, warning or error (toastManager.add({ type })).
- Keep the title to a few words; add a description only when it helps.
- Create toasts with the toast manager (Toast.useToastManager().add({ title, description })).

**Don't**

- Don’t put information the user must act on in a toast; it disappears. Use Alert Dialog or an inline message.

**Accessibility**

- Toasts are announced politely by screen readers as they appear.
- Timers pause while the pointer is over the toasts or focus is inside; F6 moves focus to them.

**Code**

```tsx
import { Toast } from 'stories/base-ui/components/toast/Toast'
```

Rendered by `<Toast.Viewport>`. API: [Toast module](#toast-module).

**States** (not props: Base UI sets them from interaction and its own props, e.g. `disabled`, `checked`, Field `invalid`)

| Figma | Values | Code condition |
|---|---|---|
| Type | Neutral · Success · Warning · Error | neutral: `:not([data-type])` or `[data-type="neutral"]`; success: `[data-type="success"]`; warning: `[data-type="warning"]`; error: `[data-type="error"]` |

**Parts**

| Part | Base UI | Figma layer | CSS class | Description |
|---|---|---|---|---|
| root | `Toast.Root` | `(variant)` | `.ds-toast` | The surface. Swipe it away, or it times out (5 s by default). |
| content | `Toast.Content` | `content` | `.ds-toast__content` | Text and close button, side by side. |
| icon | — | `content › icon` | `.ds-toast__icon` | Shows the type: info, check, warning or cross (Show icon). |
| text | — | `content › text` | `.ds-toast__text` | Title and description. |
| title | `Toast.Title` | `content › text › title` | `.ds-toast__title` | What happened, in a few words. |
| description | `Toast.Description` | `content › text › description` | `.ds-toast__description` | Details, or what to do next. |
| close | `Toast.Close` | `content › close` | instance of Button | Dismisses it (a Button). |

**Figma properties** (set on an instance instead of detaching it)

| Property | Kind | Default / suggested | In code |
|---|---|---|---|
| Show icon | Boolean | On | `icon` |
| Title | Text | Message sent | `title` |
| Show description | Boolean | On | `description` |
| Description | Text | Your message is on its way. | — |
| Show close | Boolean | On | `Toast.Close` |
| Close | Nested instance | its own properties show here | — |

**Tokens**

- Semantic: `color/background/error/subtle`, `color/background/success/subtle`, `color/background/surface/medium`, `color/background/warning/subtle`, `color/border/error`, `color/border/neutral/subtle`, `color/border/success`, `color/border/warning`, `color/foreground/error`, `color/foreground/neutral/primary`, `color/foreground/neutral/secondary`, `color/foreground/success`, `color/foreground/warning`, `effect/shadow/elevation/medium`, `font/family/primary`, `font/line-height/body/md`, `font/size/body/md`, `font/weight/body/regular`, `font/weight/body/strong`, `shape/radius/lg`, `size/border/regular`, `size/xs`, `space/lg`, `space/md`, `space/xs`
- Override tokens (configurator; each aliases the semantic token it replaces): `toast/radius`, `toast/border-width`, `toast/background/{type}`, `toast/border-color/{type}`, `toast/space-x`, `toast/space-y`, `toast/gap`, `toast/icon/size`, `toast/icon/foreground/{type}`, `toast/text/gap`, `toast/title/foreground`, `toast/title/text-style`, `toast/description/foreground`, `toast/description/text-style`

### Progress

42 · Feedback · CSS `.ds-progress` · [Base UI docs](https://base-ui.com/react/components/progress)

Shows how far a task has got: an upload, an export, a multi-step process.

**Use it**

- Label what is in progress; show the value when the user benefits from the number.
- Pass value={null} while the total is unknown: the bar becomes indeterminate (it sweeps).

**Don't**

- Don’t use it for a quantity that isn’t moving towards done (disk usage); use Meter.

**Accessibility**

- Renders role="progressbar" with aria-valuenow; the label names it.

**Code**

```tsx
import { Progress } from 'stories/base-ui/components/progress/Progress'
```

Rendered by `<Progress>`. API: [Progress module](#progress-module).

**Props (variant axes)**

| Prop | Values | Default | Figma | Notes |
|---|---|---|---|---|
| — | `0` `25` `50` `75` `100` | — | Value: 0% · 25% · 50% · 75% · 100% | Passed through to Base UI as `value` (not declared by the wrapper). |

**Parts**

| Part | Base UI | Figma layer | CSS class | Description |
|---|---|---|---|---|
| root | `Progress.Root` | `(variant)` | `.ds-progress` | Header above the track. |
| header | — | `header` | `.ds-progress__header` | Label and value, at either end. |
| label | `Progress.Label` | `header › label` | `.ds-progress__label` | What is measured. |
| value | `Progress.Value` | `header › value` | `.ds-progress__value` | The formatted value (a percentage by default). |
| track | `Progress.Track` | `track` | `.ds-progress__track` | The full range. |
| indicator | `Progress.Indicator` | `track › indicator` | `.ds-progress__indicator` | The filled part, as wide as the value. |

**Figma properties** (set on an instance instead of detaching it)

| Property | Kind | Default / suggested | In code |
|---|---|---|---|
| Show label | Boolean | On | `label` |
| Label | Text | Export data | — |
| Show value | Boolean | On | `showValue` |

**Tokens**

- Semantic: `color/background/accent/default`, `color/border/neutral/subtle`, `color/foreground/neutral/primary`, `color/foreground/neutral/secondary`, `font/family/primary`, `font/line-height/body/md`, `font/size/body/md`, `font/weight/body/regular`, `shape/radius/full`, `space/sm`, `space/xs`
- Override tokens (configurator; each aliases the semantic token it replaces): `progress/gap`, `progress/label/foreground`, `progress/label/text-style`, `progress/value/foreground`, `progress/value/text-style`, `progress/track/height`, `progress/track/radius`, `progress/track/background`, `progress/indicator/background`

### Meter

43 · Feedback · CSS `.ds-meter` · [Base UI docs](https://base-ui.com/react/components/meter)

Shows a measurement within a known range: storage used, a password’s strength, a battery level.

**Use it**

- Label what is measured and show the value (formatted with format, e.g. as a percentage or in GB).

**Don't**

- Don’t use it for a task in progress; use Progress.

**Accessibility**

- Renders role="meter" with aria-valuenow / min / max; the label names it.

**Code**

```tsx
import { Meter } from 'stories/base-ui/components/meter/Meter'
```

Rendered by `<Meter>`. API: [Meter module](#meter-module).

**Props (variant axes)**

| Prop | Values | Default | Figma | Notes |
|---|---|---|---|---|
| — | `0` `25` `50` `75` `100` | — | Value: 0% · 25% · 50% · 75% · 100% | Passed through to Base UI as `value` (not declared by the wrapper). |

**Parts**

| Part | Base UI | Figma layer | CSS class | Description |
|---|---|---|---|---|
| root | `Meter.Root` | `(variant)` | `.ds-meter` | Header above the track. |
| header | — | `header` | `.ds-meter__header` | Label and value, at either end. |
| label | `Meter.Label` | `header › label` | `.ds-meter__label` | What is measured. |
| value | `Meter.Value` | `header › value` | `.ds-meter__value` | The formatted value (a percentage by default). |
| track | `Meter.Track` | `track` | `.ds-meter__track` | The full range. |
| indicator | `Meter.Indicator` | `track › indicator` | `.ds-meter__indicator` | The filled part, as wide as the value. |

**Figma properties** (set on an instance instead of detaching it)

| Property | Kind | Default / suggested | In code |
|---|---|---|---|
| Show label | Boolean | On | `label` |
| Label | Text | Storage used | — |
| Show value | Boolean | On | `showValue` |

**Tokens**

- Semantic: `color/background/accent/default`, `color/border/neutral/subtle`, `color/foreground/neutral/primary`, `color/foreground/neutral/secondary`, `font/family/primary`, `font/line-height/body/md`, `font/size/body/md`, `font/weight/body/regular`, `shape/radius/full`, `space/md`, `space/sm`
- Override tokens (configurator; each aliases the semantic token it replaces): `meter/gap`, `meter/label/foreground`, `meter/label/text-style`, `meter/value/foreground`, `meter/value/text-style`, `meter/track/height`, `meter/track/radius`, `meter/track/background`, `meter/indicator/background`

## Layout & Disclosure

### Accordion

44 · Layout & Disclosure · CSS `.ds-accordion` · [Base UI docs](https://base-ui.com/react/components/accordion)

A stack of sections that open and close, to keep long pages scannable.

**Use it**

- Use it for FAQs, settings groups and details the user opens on demand.
- By default one item is open at a time; pass multiple to allow several.

**Don't**

- Don’t use it for navigation or for a single section (use Collapsible).

**Accessibility**

- Arrow keys move between headings; Home / End jump to the first / last; Enter or Space toggles.

**Code**

```tsx
import { Accordion } from 'stories/base-ui/components/accordion/Accordion'
```

Rendered by `<Accordion.Root>`. API: [Accordion module](#accordion-module).

**Parts**

| Part | Base UI | Figma layer | CSS class | Description |
|---|---|---|---|---|
| root | `Accordion.Root` | `(variant)` | `.ds-accordion` | The frame around the items. |
| items | — | `Items` | `.ds-accordion` | Slot for the Accordion Items (turn off the first one’s divider). |
| item | — | `Items › item` | instance of Accordion Item | Accordion Item instances. |

**Figma properties** (set on an instance instead of detaching it)

| Property | Kind | Default / suggested | In code |
|---|---|---|---|
| Items | Slot | Accordion Item | `<Accordion.Item>…` |

**Tokens**

- Semantic: `color/background/neutral/primary`, `color/border/neutral/subtle`, `shape/radius/lg`, `size/border/regular`
- Override tokens (configurator; each aliases the semantic token it replaces): `accordion/radius`, `accordion/border-width`, `accordion/border-color`, `accordion/background`

### Accordion Item

45 · Layout & Disclosure · CSS `.ds-accordion-item` · [Base UI docs](https://base-ui.com/react/components/accordion)

One section of an Accordion: a heading that opens and closes its content.

**Use it**

- Write headings that tell the user what’s inside (questions work well for FAQs).

**Don't**

- Don’t hide content the user needs to complete the task in a closed item.

**Accessibility**

- The trigger is a button inside a heading (Accordion.Header renders an h3); aria-expanded reflects the state.

**Code**

```tsx
import { Accordion } from 'stories/base-ui/components/accordion/Accordion'
```

Rendered by `<Accordion.Item>`. API: [Accordion module](#accordion-module).

**States** (not props: Base UI sets them from interaction and its own props, e.g. `disabled`, `checked`, Field `invalid`)

| Figma | Values | Code condition |
|---|---|---|
| Open | False · True | false: `:not([data-open])`; true: `[data-open]` |
| State | Default · Hover · Disabled | default: (default); hover: `:hover:not([data-disabled])`; disabled: `[data-disabled]` |

**Parts**

| Part | Base UI | Figma layer | CSS class | Description |
|---|---|---|---|---|
| root | `Accordion.Item` | `(variant)` | `.ds-accordion-item` | One section. A line separates it from the one above (not on the first). |
| divider | — | `divider` | `.ds-accordion-item` | The line above the item (its top border in code; Show divider in Figma, off for the first item). |
| trigger | `Accordion.Header › Accordion.Trigger` | `trigger` | `.ds-accordion-item__trigger` | The heading button that opens and closes the panel. |
| label | — | `trigger › label` | `.ds-accordion-item__trigger` | The heading text. |
| icon | — | `trigger › icon` | `.ds-accordion-item__icon` | A plus that turns into a cross while open. |
| panel | `Accordion.Panel` | `Panel` | `.ds-accordion-item__panel` | The content; its height animates open and closed. |
| content | — | `Panel` | `.ds-accordion-item__content` | Slot for the content. In code it holds the padding inside the animating panel. |
| text | — | `Panel › text` | `.ds-accordion-item__content` | The content’s text (in code, any content). |

**Figma properties** (set on an instance instead of detaching it)

| Property | Kind | Default / suggested | In code |
|---|---|---|---|
| Title | Text | What is Base UI? | `title` |
| Show divider | Boolean | On | — |
| Panel | Slot | any content | `children` |

**Tokens**

- Semantic: `color/background/interactive/subtle/default`, `color/background/interactive/subtle/hover`, `color/border/neutral/subtle`, `color/foreground/interactive/disabled`, `color/foreground/neutral/primary`, `color/foreground/neutral/secondary`, `font/family/primary`, `font/line-height/body/md`, `font/size/body/md`, `font/weight/body/regular`, `size/border/regular`, `size/xs`, `space/lg`, `space/md`, `space/sm`
- Override tokens (configurator; each aliases the semantic token it replaces): `accordion-item/divider/width`, `accordion-item/divider/color`, `accordion-item/trigger/space-x`, `accordion-item/trigger/space-y`, `accordion-item/trigger/gap`, `accordion-item/trigger/background/{state}`, `accordion-item/label/foreground/{state}`, `accordion-item/label/text-style`, `accordion-item/icon/size`, `accordion-item/icon/foreground/{state}`, `accordion-item/panel/space-x`, `accordion-item/panel/space-y`, `accordion-item/panel/foreground`, `accordion-item/panel/text-style`

### Collapsible

46 · Layout & Disclosure · CSS `.ds-collapsible` · [Base UI docs](https://base-ui.com/react/components/collapsible)

A single section that shows or hides its content.

**Use it**

- Use it for optional details (advanced settings, recovery keys) that would clutter the view.
- For several sections, use Accordion.

**Don't**

- Don’t hide required fields in it.

**Accessibility**

- The trigger is a button with aria-expanded; the panel stays in the page’s find-in-page results while closed (hidden="until-found").

**Code**

```tsx
import { Collapsible } from 'stories/base-ui/components/collapsible/Collapsible'
```

Rendered by `<Collapsible>`. API: [Collapsible module](#collapsible-module).

**States** (not props: Base UI sets them from interaction and its own props, e.g. `disabled`, `checked`, Field `invalid`)

| Figma | Values | Code condition |
|---|---|---|
| Open | False · True | false: `:not([data-panel-open])`; true: `[data-panel-open]` |
| State | Default · Hover · Pressed · Disabled | default: (default); hover: `:hover:not(:disabled):not([data-disabled])`; pressed: `:active:not(:disabled):not([data-disabled])`; disabled: `:disabled` or `[data-disabled]` |

**Parts**

| Part | Base UI | Figma layer | CSS class | Description |
|---|---|---|---|---|
| root | `Collapsible.Root` | `(variant)` | `.ds-collapsible` | Trigger above panel. |
| trigger | `Collapsible.Trigger` | `trigger` | `.ds-collapsible__trigger` | Opens and closes the panel; looks like a secondary button. |
| label | — | `trigger › label` | `.ds-collapsible__trigger` | The trigger’s text. |
| icon | — | `trigger › icon` | `.ds-collapsible__icon` | A caret that turns down while open. |
| panel | `Collapsible.Panel` | `Panel` | `.ds-collapsible__panel` | The content; its height animates open and closed. |
| content | — | `Panel` | `.ds-collapsible__content` | Slot for the content. In code it holds the padding and gap inside the animating panel. |
| text | — | `Panel › text` | `.ds-collapsible__content` | The content’s text (in code, any content). |

**Figma properties** (set on an instance instead of detaching it)

| Property | Kind | Default / suggested | In code |
|---|---|---|---|
| Label | Text | Recovery keys | `label` |
| Panel | Slot | any content | `children` |

**Tokens**

- Semantic: `color/background/interactive/subtle/hover`, `color/background/interactive/subtle/pressed`, `color/background/neutral/primary`, `color/border/interactive/default`, `color/border/interactive/disabled`, `color/foreground/interactive/disabled`, `color/foreground/neutral/primary`, `font/family/primary`, `font/line-height/body/md`, `font/size/body/md`, `font/weight/body/regular`, `shape/radius/md`, `size/border/regular`, `size/lg`, `size/xs`, `space/md`, `space/sm`, `space/xs`
- Override tokens (configurator; each aliases the semantic token it replaces): `collapsible/gap`, `collapsible/trigger/height`, `collapsible/trigger/space-x`, `collapsible/trigger/gap`, `collapsible/trigger/radius`, `collapsible/trigger/border-width`, `collapsible/trigger/background/{state}`, `collapsible/trigger/border-color/{state}`, `collapsible/label/foreground/{state}`, `collapsible/label/text-style`, `collapsible/icon/size`, `collapsible/icon/foreground/{state}`, `collapsible/panel/space-x`, `collapsible/panel/space-y`, `collapsible/panel/gap`, `collapsible/panel/foreground`, `collapsible/panel/text-style`

### Separator

47 · Layout & Disclosure · CSS `.ds-separator` · [Base UI docs](https://base-ui.com/react/components/separator)

A thin line that separates groups of content, horizontally or vertically.

**Use it**

- Separate groups that spacing alone doesn’t set apart (toolbar groups, link lists).
- Set orientation="vertical" inside rows.

**Don't**

- Don’t use it as decoration between every item; whitespace usually does the job.

**Accessibility**

- Renders role="separator" with aria-orientation; screen readers announce it between groups.

**Code**

```tsx
import { Separator } from 'stories/base-ui/components/separator/Separator'
import { Toolbar } from 'stories/base-ui/components/toolbar/Toolbar'
```

Rendered by `<Separator>`, `<Toolbar.Separator>`. API: [Separator module](#separator-module), [Toolbar module](#toolbar-module).

**States** (not props: Base UI sets them from interaction and its own props, e.g. `disabled`, `checked`, Field `invalid`)

| Figma | Values | Code condition |
|---|---|---|
| Orientation (placement) | Horizontal · Vertical | horizontal: `[data-orientation="horizontal"]`; vertical: `[data-orientation="vertical"]` |

**Parts**

| Part | Base UI | Figma layer | CSS class | Description |
|---|---|---|---|---|
| root | `Separator` | `(variant)` | `.ds-separator` | The line. Stretches along its container (a vertical one to the row’s height). |

**Tokens**

- Semantic: `color/border/neutral/subtle`, `size/border/regular`
- Override tokens (configurator; each aliases the semantic token it replaces): `separator/thickness`, `separator/color`

### Scroll Area

48 · Layout & Disclosure · CSS `.ds-scroll-area` · [Base UI docs](https://base-ui.com/react/components/scroll-area)

A scrolling region with a slim, styled scrollbar that appears while hovering or scrolling.

**Use it**

- Use it for panels with a fixed height inside a page (lists, code, terms) where the native scrollbar looks out of place.

**Don't**

- Don’t wrap a whole page in it; let the page scroll natively.

**Accessibility**

- The native scroll behaviour is kept: wheel, touch, keyboard (the viewport is focusable) and screen readers work as usual.

**Code**

```tsx
import { ScrollArea } from 'stories/base-ui/components/scroll-area/ScrollArea'
```

Rendered by `<ScrollArea>`. API: [ScrollArea module](#scrollarea-module).

**Parts**

| Part | Base UI | Figma layer | CSS class | Description |
|---|---|---|---|---|
| root | `ScrollArea.Root` | `(variant)` | `.ds-scroll-area` | Fixes the visible size; clips the content. |
| viewport | `ScrollArea.Viewport` | `viewport` | `.ds-scroll-area__viewport` | The scrolling box, with the border. Focusable, so keyboard users can scroll it. |
| content | `ScrollArea.Content` | `viewport › Content` | `.ds-scroll-area__content` | Slot for what scrolls. |
| text | — | `viewport › Content › text` | `.ds-scroll-area__text` | Paragraphs (in code, any content). |
| scrollbar | `ScrollArea.Scrollbar` | `scrollbar` | `.ds-scroll-area__scrollbar` | The track, along the right edge (a horizontal one goes along the bottom). |
| thumb | `ScrollArea.Thumb` | `scrollbar › thumb` | `.ds-scroll-area__thumb` | Its length shows how much is visible. |

**Figma properties** (set on an instance instead of detaching it)

| Property | Kind | Default / suggested | In code |
|---|---|---|---|
| Content | Slot | any content | `children` |

**Tokens**

- Semantic: `color/background/neutral/primary`, `color/border/neutral/regular`, `color/border/neutral/subtle`, `color/foreground/neutral/primary`, `font/family/primary`, `font/line-height/body/md`, `font/size/body/md`, `font/weight/body/regular`, `shape/radius/full`, `shape/radius/lg`, `size/border/regular`, `space/2xs`, `space/lg`, `space/md`, `space/sm`
- Override tokens (configurator; each aliases the semantic token it replaces): `scroll-area/radius`, `scroll-area/border-width`, `scroll-area/border-color`, `scroll-area/background`, `scroll-area/content/space-x`, `scroll-area/content/space-y`, `scroll-area/content/gap`, `scroll-area/foreground`, `scroll-area/text-style`, `scroll-area/scrollbar/width`, `scroll-area/scrollbar/space`, `scroll-area/thumb/radius`, `scroll-area/thumb/background`

## Display

### Avatar

49 · Display · CSS `.ds-avatar` · [Base UI docs](https://base-ui.com/react/components/avatar)

A person’s picture, or their initials when there is no picture.

**Use it**

- Always pass initials as the fallback: images fail, and slow ones show the initials first.
- Match the size to the text next to it.

**Don't**

- Don’t use it for logos or icons.

**Accessibility**

- Give the image alt text with the person’s name, or empty alt when the name is shown next to it.

**Code**

```tsx
import { Avatar } from 'stories/base-ui/components/avatar/Avatar'
```

Rendered by `<Avatar>`. API: [Avatar module](#avatar-module).

**Props (variant axes)**

| Prop | Values | Default | Figma | Notes |
|---|---|---|---|---|
| `size` | `'sm'` `'md'` `'lg'` | `'md'` | Size: Small · Medium · Large | On `Avatar` |
| — | `'image'` `'initials'` | — | Type: Image · Initials | Not a prop: the wrapper derives it. `Avatar`: `data-type={src ? 'image' : 'initials'}`. |

**Parts**

| Part | Base UI | Figma layer | CSS class | Description |
|---|---|---|---|---|
| root | `Avatar.Root` | `(variant)` | `.ds-avatar` | The circle. Its background shows behind the initials (and while the image loads). |
| image | `Avatar.Image` | `image` | `.ds-avatar__image` | The picture (Type = Image), cropped to the circle. |
| fallback | `Avatar.Fallback` | `fallback` | `.ds-avatar__fallback` | Initials (Type = Initials), also shown when the image fails to load. |

**Tokens**

- Semantic: `color/background/accent/selected`, `color/foreground/on-accent/primary`, `font/family/primary`, `font/line-height/body/md`, `font/line-height/body/sm`, `font/line-height/caption/md`, `font/size/body/md`, `font/size/body/sm`, `font/size/caption/md`, `font/weight/body/regular`, `font/weight/body/strong`, `shape/radius/full`, `size/lg`, `size/xl`, `space/2xl`
- Override tokens (configurator; each aliases the semantic token it replaces): `avatar/size/{size}`, `avatar/radius`, `avatar/background`, `avatar/foreground`, `avatar/text-style/{size}`

## Utilities (no spec)

Base UI utilities without styles of their own. Use them as Base UI documents them (`@base-ui/react`); their Storybook pages are under Base UI / Utils.

- **CSP Provider**: Passes a CSP nonce to the inline <style> / <script> tags Base UI renders. Docs: [stories/base-ui/docs/csp-provider.md](../../stories/base-ui/docs/csp-provider.md)
- **Direction Provider**: Sets text direction (ltr / rtl) for Base UI components below it. Docs: [stories/base-ui/docs/direction-provider.md](../../stories/base-ui/docs/direction-provider.md)
- **mergeProps**: Merges React props: event handlers are chained, className and style combined. Docs: [stories/base-ui/docs/merge-props.md](../../stories/base-ui/docs/merge-props.md)
- **useRender**: Hook for your own components that take a `render` prop, the same way Base UI parts do. Docs: [stories/base-ui/docs/use-render.md](../../stories/base-ui/docs/use-render.md)

## React modules

What each wrapper file exports, and the props each part declares. Parts marked "Base UI as is" are re-exported unstyled Base UI parts (roots, groups): use them through the wrapper export, not from `@base-ui/react`.

### Button module

```tsx
import { Button } from 'stories/base-ui/components/button/Button'
```

Source: [stories/base-ui/components/button/Button.tsx](../../stories/base-ui/components/button/Button.tsx)

**`Button`**

Props: `variant`: `ButtonType` = `'primary'` (Figma's Type. (`type` stays the native attribute: button / submit / reset.)); `size`: `ButtonSize` = `'md'`; `destructive`: `boolean` = `false`; `leadIcon`: `React.ReactNode`; `trailIcon`: `React.ReactNode`; `children`; + Base UI `Button` props

### IconButton module

```tsx
import { IconButton } from 'stories/base-ui/components/icon-button/IconButton'
```

Source: [stories/base-ui/components/icon-button/IconButton.tsx](../../stories/base-ui/components/icon-button/IconButton.tsx)

**`IconButton`**

Props: `variant`: `ButtonType` = `'primary'` (Figma's Type. (`type` stays the native attribute.)); `size`: `ButtonSize` = `'md'`; `destructive`: `boolean` = `false`; `label`: `string` (Accessible name (aria-label). Required: it's the only name screen readers announce); `icon`: `React.ReactNode`; + Base UI `Button` props

### Toggle module

```tsx
import { Toggle } from 'stories/base-ui/components/toggle/Toggle'
```

Source: [stories/base-ui/components/toggle/Toggle.tsx](../../stories/base-ui/components/toggle/Toggle.tsx)

**`Toggle`**

Props: `icon`: `Icon` (A Phosphor icon: drawn as a line while off and filled while on); `label`: `string` (Accessible name (aria-label)); `size`: `ToggleSize` = `'md'` (Defaults to the enclosing Toggle Group's size, else md); + Base UI `Toggle` props

### ToggleGroup module

```tsx
import { ToggleGroup } from 'stories/base-ui/components/toggle-group/ToggleGroup'
```

Source: [stories/base-ui/components/toggle-group/ToggleGroup.tsx](../../stories/base-ui/components/toggle-group/ToggleGroup.tsx)

**`ToggleGroup`**

Props: `size`: `ControlSize` = `'md'` (Size of every toggle inside); + Base UI `ToggleGroup` props

### Toolbar module

```tsx
import { Toolbar } from 'stories/base-ui/components/toolbar/Toolbar'
```

Source: [stories/base-ui/components/toolbar/Toolbar.tsx](../../stories/base-ui/components/toolbar/Toolbar.tsx)

**`Toolbar`**: Controls: <Toolbar.Button render={<Toggle … />} /> or render={<IconButton variant="ghost" … />}.

| Part | What it is | Props (default) |
|---|---|---|
| `Toolbar.Root` | The strip. Its controls are md-sized Toggles and Icon Buttons. | + Base UI `Toolbar.Root` props |
| `Toolbar.Group` | — | + Base UI `Toolbar.Group` props |
| `Toolbar.ToggleGroup` | Exclusive (or multiple) toggles: a Toggle Group without its own frame. | + Base UI `ToggleGroup` props |
| `Toolbar.Separator` | A vertical Separator between groups (Base UI sets its orientation across the toolbar). | + Base UI `Toolbar.Separator` props |
| `Toolbar.Button` | Base UI `Toolbar.Button` as is (no styles of its own) |  |

### Input module

```tsx
import { Input } from 'stories/base-ui/components/input/Input'
```

Source: [stories/base-ui/components/input/Input.tsx](../../stories/base-ui/components/input/Input.tsx)

**`Input`**

Props: `size`: `InputSize` = `'md'` (Defaults to the enclosing Field's size, else md); `icon`: `React.ReactNode` = `<MagnifyingGlass weight="fill" />` (Leading icon (decorative). Defaults to a magnifying glass, like the Figma component); `showIcon`: `boolean` = `true` (Show the leading icon (Figma: Show icon). Default true); + Base UI `Input` props

### Autocomplete module

```tsx
import { Autocomplete } from 'stories/base-ui/components/autocomplete/Autocomplete'
```

Source: [stories/base-ui/components/autocomplete/Autocomplete.tsx](../../stories/base-ui/components/autocomplete/Autocomplete.tsx)

**`Autocomplete`**

| Part | What it is | Props (default) |
|---|---|---|
| `Autocomplete.Root` | Base UI `Autocomplete.Root` as is (no styles of its own) |  |
| `Autocomplete.Input` | An Input (same box, icon and tokens) whose value element is Autocomplete.Input. | `size`: `InputSize` = `'md'` (Defaults to the enclosing Field's size, else md); `icon`: `React.ReactNode` = `<MagnifyingGlass weight="fill" />` (Leading icon (decorative). Defaults to a magnifying glass, like Input); `showIcon`: `boolean` = `true`; + Base UI `Autocomplete.Input` props |
| `Autocomplete.Popup` | Portal + positioner + Listbox. Put Autocomplete.Empty and Autocomplete.List inside. | + Base UI `Autocomplete.Popup` props |
| `Autocomplete.Empty` | — | `children` |
| `Autocomplete.List` | — | + Base UI `Autocomplete.List` props |
| `Autocomplete.Item` | An Option without indicator: a suggestion fills the input, nothing stays selected. | `children`; + Base UI `Autocomplete.Item` props |

### Field module

```tsx
import { Field } from 'stories/base-ui/components/field/Field'
```

Source: [stories/base-ui/components/field/Field.tsx](../../stories/base-ui/components/field/Field.tsx)

**`Field`**

Props: `label`: `React.ReactNode`; `description`: `React.ReactNode`; `error`: `React.ReactNode` (Message shown while the field is invalid (constraint validation, `validate`, or `invalid`)); `size`: `FieldSize` = `'md'`; `children`: `React.ReactNode` (The control: usually an Input, which takes the Field's size); + Base UI `Field.Root` props

### Fieldset module

```tsx
import { Fieldset } from 'stories/base-ui/components/fieldset/Fieldset'
```

Source: [stories/base-ui/components/fieldset/Fieldset.tsx](../../stories/base-ui/components/fieldset/Fieldset.tsx)

**`Fieldset`**

Props: `legend`: `React.ReactNode`; `size`: `ControlSize` = `'md'` (Size of the legend and of every field inside); `children`; + Base UI `Fieldset.Root` props

### Form module

```tsx
import { Form, FormActions } from 'stories/base-ui/components/form/Form'
```

Source: [stories/base-ui/components/form/Form.tsx](../../stories/base-ui/components/form/Form.tsx)

**`Form`**

Props: + Base UI `Form` props

**`FormActions`**: The row of buttons at the end of a form.

Props: + `<div>` props

### Checkbox module

```tsx
import { Checkbox } from 'stories/base-ui/components/checkbox/Checkbox'
```

Source: [stories/base-ui/components/checkbox/Checkbox.tsx](../../stories/base-ui/components/checkbox/Checkbox.tsx)

**`Checkbox`**

Props: `size`: `CheckboxSize` = `'md'` (Defaults to the enclosing group's size, else md); `children`: `React.ReactNode` (The label. Omit it for a bare box, and pass aria-label instead); + Base UI `Checkbox.Root` props

### CheckboxGroup module

```tsx
import { CheckboxGroup } from 'stories/base-ui/components/checkbox-group/CheckboxGroup'
```

Source: [stories/base-ui/components/checkbox-group/CheckboxGroup.tsx](../../stories/base-ui/components/checkbox-group/CheckboxGroup.tsx)

**`CheckboxGroup`**

Props: `label`: `React.ReactNode` (Visible name of the group (linked with aria-labelledby)); `size`: `ControlSize` = `'md'` (Size of the group's label and of every option inside); `children`; + Base UI `CheckboxGroup` props

### Radio module

```tsx
import { Radio } from 'stories/base-ui/components/radio/Radio'
```

Source: [stories/base-ui/components/radio/Radio.tsx](../../stories/base-ui/components/radio/Radio.tsx)

**`Radio`**

Props: `size`: `RadioSize` = `'md'` (Defaults to the enclosing Radio Group's size, else md); `children`: `React.ReactNode` (The option's label); + Base UI `Radio.Root` props

### RadioGroup module

```tsx
import { RadioGroup } from 'stories/base-ui/components/radio-group/RadioGroup'
```

Source: [stories/base-ui/components/radio-group/RadioGroup.tsx](../../stories/base-ui/components/radio-group/RadioGroup.tsx)

**`RadioGroup`**

Props: `label`: `React.ReactNode` (Visible name of the group (linked with aria-labelledby)); `size`: `ControlSize` = `'md'` (Size of the group's label and of every option inside); `children`; + Base UI `RadioGroup` props

### Switch module

```tsx
import { Switch } from 'stories/base-ui/components/switch/Switch'
```

Source: [stories/base-ui/components/switch/Switch.tsx](../../stories/base-ui/components/switch/Switch.tsx)

**`Switch`**

Props: `size`: `SwitchSize` = `'md'`; `children`: `React.ReactNode` (The label. Omit it for a bare switch, and pass aria-label instead); + Base UI `Switch.Root` props

### Slider module

```tsx
import { Slider } from 'stories/base-ui/components/slider/Slider'
```

Source: [stories/base-ui/components/slider/Slider.tsx](../../stories/base-ui/components/slider/Slider.tsx)

**`Slider`**

Props: `size`: `SliderSize` = `'md'` (Defaults to the enclosing Field's size, else md); `thumbLabels`: `string[]` (Labels for the thumbs, in order (one per value)); + Base UI `Slider.Root` props

### NumberField module

```tsx
import { NumberField } from 'stories/base-ui/components/number-field/NumberField'
```

Source: [stories/base-ui/components/number-field/NumberField.tsx](../../stories/base-ui/components/number-field/NumberField.tsx)

**`NumberField`**: `aria-label` / `aria-labelledby` name the input, for use outside a Field (inside one, its label does).

Props: `size`: `NumberFieldSize` = `'md'` (Defaults to the enclosing Field's size, else md); `aria-label`; `aria-labelledby`; + Base UI `NumberField.Root` props

### OtpField module

```tsx
import { OtpField } from 'stories/base-ui/components/otp-field/OtpField'
```

Source: [stories/base-ui/components/otp-field/OtpField.tsx](../../stories/base-ui/components/otp-field/OtpField.tsx)

**`OtpField`**

Props: `length`: `number` = `6` (Number of characters); `size`: `OtpSize` = `'md'` (Defaults to the enclosing Field's size, else md); + Base UI `OTPField.Root` props

### Select module

```tsx
import { Select } from 'stories/base-ui/components/select/Select'
```

Source: [stories/base-ui/components/select/Select.tsx](../../stories/base-ui/components/select/Select.tsx)

**`Select`**: the popup is a Listbox of Options (listbox/).

| Part | What it is | Props (default) |
|---|---|---|
| `Select.Root` | Base UI `Select.Root` as is (no styles of its own) |  |
| `Select.Trigger` | The field box: the value (or placeholder) and a caret. | `size`: `SelectSize` = `'md'` (Defaults to the enclosing Field's size, else md); `placeholder`: `React.ReactNode`; + Base UI `Select.Trigger` props |
| `Select.Popup` | Portal + positioner + Listbox. | `alignItemWithTrigger`: `boolean` (Open over the trigger with the selected option aligned to it (Base UI default), or below it); `children`; + Base UI `Select.Popup` props |
| `Select.Item` | An Option: check indicator + label. | `children`; + Base UI `Select.Item` props |
| `Select.Group` | Base UI `Select.Group` as is (no styles of its own) |  |

### Combobox module

```tsx
import { Combobox } from 'stories/base-ui/components/combobox/Combobox'
```

Source: [stories/base-ui/components/combobox/Combobox.tsx](../../stories/base-ui/components/combobox/Combobox.tsx)

**`Combobox`**: the popup is a Listbox of Options (listbox/).

| Part | What it is | Props (default) |
|---|---|---|
| `Combobox.Root` | Base UI `Combobox.Root` as is (no styles of its own) |  |
| `Combobox.Input` | The field box: text input, clear button (while there's a value) and trigger. | `size`: `ComboboxSize` = `'md'` (Defaults to the enclosing Field's size, else md); + Base UI `Combobox.Input` props |
| `Combobox.Popup` | Portal + positioner + Listbox. Put Combobox.Empty and Combobox.List inside. | + Base UI `Combobox.Popup` props |
| `Combobox.Empty` | Shown when the search matches nothing. | `children` |
| `Combobox.List` | — | + Base UI `Combobox.List` props |
| `Combobox.Item` | An Option: check indicator + label. | `children`; + Base UI `Combobox.Item` props |

### Menu module

```tsx
import { Menu } from 'stories/base-ui/components/menu/Menu'
```

Source: [stories/base-ui/components/menu/Menu.tsx](../../stories/base-ui/components/menu/Menu.tsx)

**`Menu`**

| Part | What it is | Props (default) |
|---|---|---|
| `Menu.Root` | Base UI `Menu.Root` as is (no styles of its own) |  |
| `Menu.Trigger` | Opens the menu: a Button with a caret. | `variant`: `ButtonProps['variant']` = `'secondary'` (Button look of the trigger (default secondary)); `size`: `ButtonProps['size']` = `'md'`; `children`; + Base UI `Menu.Trigger` props |
| `Menu.Popup` | Portal + positioner + popup, so a menu is Root › Trigger + Popup › items. | `side`: `React.ComponentProps<typeof BaseMenu.Positioner>['side']` (Positioner options); `align`: `React.ComponentProps<typeof BaseMenu.Positioner>['align']` = `'start'`; `sideOffset`: `number` = `8`; + Base UI `Menu.Popup` props |
| `Menu.Item` | — | `children`; + Base UI `Menu.Item` props |
| `Menu.CheckboxItem` | — | `children`; + Base UI `Menu.CheckboxItem` props |
| `Menu.RadioGroup` | Base UI `Menu.RadioGroup` as is (no styles of its own) |  |
| `Menu.RadioItem` | — | `children`; + Base UI `Menu.RadioItem` props |
| `Menu.Group` | Base UI `Menu.Group` as is (no styles of its own) |  |
| `Menu.GroupLabel` | — | + Base UI `Menu.GroupLabel` props |
| `Menu.Separator` | — | + Base UI `Menu.Separator` props |
| `Menu.SubmenuRoot` | Base UI `Menu.SubmenuRoot` as is (no styles of its own) |  |
| `Menu.SubmenuTrigger` | — | `children`; + Base UI `Menu.SubmenuTrigger` props |

### ContextMenu module

```tsx
import { ContextMenu } from 'stories/base-ui/components/context-menu/ContextMenu'
```

Source: [stories/base-ui/components/context-menu/ContextMenu.tsx](../../stories/base-ui/components/context-menu/ContextMenu.tsx)

**`ContextMenu`**: Menu, opened at the pointer: the popup and items are Menu's (same Figma components and tokens). Base UI's ContextMenu parts are Menu's, so Menu.Item & co. work inside it.

| Part | What it is | Props (default) |
|---|---|---|
| `ContextMenu.Root` | Base UI `ContextMenu.Root` as is (no styles of its own) |  |
| `ContextMenu.Trigger` | The area that opens the menu on right-click or long-press. Unstyled: it wraps your content. | + Base UI `ContextMenu.Trigger` props |
| `ContextMenu.Popup` | Portal + positioner (at the pointer) + Menu's popup. | + Base UI `ContextMenu.Popup` props |
| `ContextMenu.Item` | The same component as `Menu.Item` |  |
| `ContextMenu.CheckboxItem` | The same component as `Menu.CheckboxItem` |  |
| `ContextMenu.RadioGroup` | The same component as `Menu.RadioGroup` |  |
| `ContextMenu.RadioItem` | The same component as `Menu.RadioItem` |  |
| `ContextMenu.Group` | The same component as `Menu.Group` |  |
| `ContextMenu.GroupLabel` | The same component as `Menu.GroupLabel` |  |
| `ContextMenu.Separator` | The same component as `Menu.Separator` |  |
| `ContextMenu.SubmenuRoot` | The same component as `Menu.SubmenuRoot` |  |
| `ContextMenu.SubmenuTrigger` | The same component as `Menu.SubmenuTrigger` |  |

### Menubar module

```tsx
import { Menubar } from 'stories/base-ui/components/menubar/Menubar'
```

Source: [stories/base-ui/components/menubar/Menubar.tsx](../../stories/base-ui/components/menubar/Menubar.tsx)

**`Menubar`**: The menus are ordinary Menus: Menubar.Root › Menu.Root › Menubar.Trigger + Menu.Popup.

| Part | What it is | Props (default) |
|---|---|---|
| `Menubar.Root` | — | + Base UI `Menubar` props |
| `Menubar.Trigger` | A Menubar Item: the trigger of one Menu (inside Menu.Root). | + Base UI `Menu.Trigger` props |

### NavigationMenu module

```tsx
import { NavigationMenu } from 'stories/base-ui/components/navigation-menu/NavigationMenu'
```

Source: [stories/base-ui/components/navigation-menu/NavigationMenu.tsx](../../stories/base-ui/components/navigation-menu/NavigationMenu.tsx)

**`NavigationMenu`**: Root › List › Item › (Trigger + Content › Card…) | Link Root › Popup (once)

| Part | What it is | Props (default) |
|---|---|---|
| `NavigationMenu.Root` | — | + Base UI `NavigationMenu.Root` props |
| `NavigationMenu.List` | — | + Base UI `NavigationMenu.List` props |
| `NavigationMenu.Item` | Base UI `NavigationMenu.Item` as is (no styles of its own) |  |
| `NavigationMenu.Trigger` | Opens its item's panel (NavigationMenu.Content). | `icon`: `Icon` (A Phosphor icon: line while closed, filled while its panel is open); `children`; + Base UI `NavigationMenu.Trigger` props |
| `NavigationMenu.Link` | A link in the bar. Set `active` on the current page's link. | `icon`: `Icon` (A Phosphor icon: line while inactive, filled on the current page (active)); `children`; + Base UI `NavigationMenu.Link` props |
| `NavigationMenu.Content` | — | + Base UI `NavigationMenu.Content` props |
| `NavigationMenu.Card` | A link card in a panel: title and one line of description. | `title`: `React.ReactNode`; `description`: `React.ReactNode`; + Base UI `NavigationMenu.Link` props |
| `NavigationMenu.Popup` | The panel: portal + positioner + popup (+ arrow) + viewport. Render it once, after the List. | `arrow` = `true` |

### Tabs module

```tsx
import { Tabs } from 'stories/base-ui/components/tabs/Tabs'
```

Source: [stories/base-ui/components/tabs/Tabs.tsx](../../stories/base-ui/components/tabs/Tabs.tsx)

**`Tabs`**: Root › List › Tab… + Panel…

| Part | What it is | Props (default) |
|---|---|---|
| `Tabs.Root` | — | `size`: `ControlSize` = `'md'` (Size of every tab); + Base UI `Tabs.Root` props |
| `Tabs.List` | The row of tabs, with the indicator behind the selected one. | `children`; + Base UI `Tabs.List` props |
| `Tabs.Tab` | — | + Base UI `Tabs.Tab` props |
| `Tabs.Panel` | — | + Base UI `Tabs.Panel` props |

### Popover module

```tsx
import { Popover } from 'stories/base-ui/components/popover/Popover'
```

Source: [stories/base-ui/components/popover/Popover.tsx](../../stories/base-ui/components/popover/Popover.tsx)

**`Popover`**

| Part | What it is | Props (default) |
|---|---|---|
| `Popover.Root` | Base UI `Popover.Root` as is (no styles of its own) |  |
| `Popover.Trigger` | Opens the popover: a Button. | `variant`: `ButtonProps['variant']` = `'secondary'` (Button look of the trigger (default secondary)); `size`: `ButtonProps['size']` = `'md'`; `children`; + Base UI `Popover.Trigger` props |
| `Popover.Popup` | Portal + positioner + popup (+ arrow), so a popover is Root › Trigger + Popup › content. | `side`: `React.ComponentProps<typeof BasePopover.Positioner>['side']`; `align`: `React.ComponentProps<typeof BasePopover.Positioner>['align']`; `sideOffset`: `number` = `8`; `arrow`: `boolean` = `true` (Show the arrow pointing at the trigger (default true)); `children`; + Base UI `Popover.Popup` props |
| `Popover.Title` | — | + Base UI `Popover.Title` props |
| `Popover.Description` | — | + Base UI `Popover.Description` props |
| `Popover.Close` | Base UI `Popover.Close` as is (no styles of its own) |  |

### Tooltip module

```tsx
import { Tooltip } from 'stories/base-ui/components/tooltip/Tooltip'
```

Source: [stories/base-ui/components/tooltip/Tooltip.tsx](../../stories/base-ui/components/tooltip/Tooltip.tsx)

**`Tooltip`**: The trigger is any focusable control: `<Tooltip.Trigger render={<IconButton … />} />`.

| Part | What it is | Props (default) |
|---|---|---|
| `Tooltip.Provider` | Base UI `Tooltip.Provider` as is (no styles of its own) |  |
| `Tooltip.Root` | Base UI `Tooltip.Root` as is (no styles of its own) |  |
| `Tooltip.Trigger` | Base UI `Tooltip.Trigger` as is (no styles of its own) |  |
| `Tooltip.Popup` | Portal + positioner + popup (+ arrow). | `side`: `React.ComponentProps<typeof BaseTooltip.Positioner>['side']`; `align`: `React.ComponentProps<typeof BaseTooltip.Positioner>['align']`; `sideOffset`: `number` = `10`; `arrow`: `boolean` = `true` (Show the arrow pointing at the trigger (default true)); `children`; + Base UI `Tooltip.Popup` props |

### PreviewCard module

```tsx
import { PreviewCard } from 'stories/base-ui/components/preview-card/PreviewCard'
```

Source: [stories/base-ui/components/preview-card/PreviewCard.tsx](../../stories/base-ui/components/preview-card/PreviewCard.tsx)

**`PreviewCard`**

| Part | What it is | Props (default) |
|---|---|---|
| `PreviewCard.Root` | Base UI `PreviewCard.Root` as is (no styles of its own) |  |
| `PreviewCard.Trigger` | The link that opens the card (an <a>). | + Base UI `PreviewCard.Trigger` props |
| `PreviewCard.Popup` | — | `side`: `React.ComponentProps<typeof BasePreviewCard.Positioner>['side']`; `align`: `React.ComponentProps<typeof BasePreviewCard.Positioner>['align']`; `sideOffset`: `number` = `8`; `arrow`: `boolean` = `true`; `children`; + Base UI `PreviewCard.Popup` props |
| `PreviewCard.Image` | — | + `<img>` props |
| `PreviewCard.Title` | — | + `<p>` props |
| `PreviewCard.Summary` | — | + `<p>` props |

### Dialog module

```tsx
import { Dialog } from 'stories/base-ui/components/dialog/Dialog'
```

Source: [stories/base-ui/components/dialog/Dialog.tsx](../../stories/base-ui/components/dialog/Dialog.tsx)

**`Dialog`**: Root › Trigger + Popup › Header (Title, Description) + Body + Actions (Close, Button)

| Part | What it is | Props (default) |
|---|---|---|
| `Dialog.Root` | Base UI `Dialog.Root` as is (no styles of its own) |  |
| `Dialog.Trigger` | Opens the dialog: a Button. | `variant` = `'secondary'`; `size`; `destructive`; + Base UI `Dialog.Trigger` props |
| `Dialog.Popup` | Portal + backdrop + popup (+ close button). | `showClose`: `boolean` = `true` (A cross in the top corner that closes it (Figma: Show close)); `children`; + Base UI `Dialog.Popup` props |
| `Dialog.Header` | — | + `<div>` props |
| `Dialog.Title` | — | + Base UI `Dialog.Title` props |
| `Dialog.Description` | — | + Base UI `Dialog.Description` props |
| `Dialog.Body` | Anything between the header and the actions: a form, a list (Figma: Body slot). | + `<div>` props |
| `Dialog.Actions` | — | + `<div>` props |
| `Dialog.Close` | Closes the dialog: a Button (default secondary). | `variant` = `'secondary'`; `size`; `destructive`; + Base UI `Dialog.Close` props |

### AlertDialog module

```tsx
import { AlertDialog } from 'stories/base-ui/components/alert-dialog/AlertDialog'
```

Source: [stories/base-ui/components/alert-dialog/AlertDialog.tsx](../../stories/base-ui/components/alert-dialog/AlertDialog.tsx)

**`AlertDialog`**: Dialog's anatomy with its own tokens; it can't be dismissed by clicking outside. Styles: alert-dialog.css (layout) + alert-dialog.tokens.css (generated from alert-dialog.spec.ts). Root › Trigger + Popup › Header (Title, Description) + Body + Actions (Close, Button)

| Part | What it is | Props (default) |
|---|---|---|
| `AlertDialog.Root` | Base UI `AlertDialog.Root` as is (no styles of its own) |  |
| `AlertDialog.Trigger` | Opens the dialog: a Button. | `variant` = `'secondary'`; `size`; `destructive`; + Base UI `AlertDialog.Trigger` props |
| `AlertDialog.Popup` | Portal + backdrop + popup (+ close button). | `showClose`: `boolean` = `false` (A cross in the top corner that closes it (Figma: Show close)); `children`; + Base UI `AlertDialog.Popup` props |
| `AlertDialog.Header` | — | + `<div>` props |
| `AlertDialog.Title` | — | + Base UI `AlertDialog.Title` props |
| `AlertDialog.Description` | — | + Base UI `AlertDialog.Description` props |
| `AlertDialog.Body` | Anything between the header and the actions: a form, a list (Figma: Body slot). | + `<div>` props |
| `AlertDialog.Actions` | — | + `<div>` props |
| `AlertDialog.Close` | Closes the dialog: a Button (default secondary). | `variant` = `'secondary'`; `size`; `destructive`; + Base UI `AlertDialog.Close` props |

### Drawer module

```tsx
import { Drawer } from 'stories/base-ui/components/drawer/Drawer'
```

Source: [stories/base-ui/components/drawer/Drawer.tsx](../../stories/base-ui/components/drawer/Drawer.tsx)

**`Drawer`**: Root (side) › Trigger + Popup › Header (Title, Description) + Body + Actions (Close)

| Part | What it is | Props (default) |
|---|---|---|
| `Drawer.Root` | — | `side`: `DrawerSide` = `'right'` (The screen edge it's docked to (default right); swiping towards it dismisses it); + Base UI `Drawer.Root` props |
| `Drawer.Trigger` | — | `variant` = `'secondary'`; `size`; `destructive`; + Base UI `Drawer.Trigger` props |
| `Drawer.Popup` | Portal + backdrop + viewport + panel (+ close button). | `showClose`: `boolean` = `true` (A cross in the top corner that closes it (Figma: Show close)); `children`; + Base UI `Drawer.Popup` props |
| `Drawer.Header` | — | + `<div>` props |
| `Drawer.Title` | — | + Base UI `Drawer.Title` props |
| `Drawer.Description` | — | + Base UI `Drawer.Description` props |
| `Drawer.Body` | Anything between the header and the actions (Figma: Body slot). | + `<div>` props |
| `Drawer.Actions` | — | + `<div>` props |
| `Drawer.Close` | — | `variant` = `'secondary'`; `size`; `destructive`; + Base UI `Drawer.Close` props |

### Toast module

```tsx
import { Toast } from 'stories/base-ui/components/toast/Toast'
```

Source: [stories/base-ui/components/toast/Toast.tsx](../../stories/base-ui/components/toast/Toast.tsx)

**`Toast`**: <Toast.Provider> … <Toast.Viewport /> </Toast.Provider>, then Toast.useToastManager().add({ title, description, type: 'success' | 'warning' | 'error' })

| Part | What it is | Props (default) |
|---|---|---|
| `Toast.Provider` | Base UI `Toast.Provider` as is (no styles of its own) |  |
| `Toast.Viewport` | Where toasts stack (bottom right). Render once, inside Toast.Provider. | `showIcon` = `true` |
| `Toast.useToastManager` | Base UI `Toast.useToastManager` as is |  |

### Progress module

```tsx
import { Progress } from 'stories/base-ui/components/progress/Progress'
```

Source: [stories/base-ui/components/progress/Progress.tsx](../../stories/base-ui/components/progress/Progress.tsx)

**`Progress`**: value={null} is indeterminate.

### Meter module

```tsx
import { Meter } from 'stories/base-ui/components/meter/Meter'
```

Source: [stories/base-ui/components/meter/Meter.tsx](../../stories/base-ui/components/meter/Meter.tsx)

**`Meter`**

### Accordion module

```tsx
import { Accordion } from 'stories/base-ui/components/accordion/Accordion'
```

Source: [stories/base-ui/components/accordion/Accordion.tsx](../../stories/base-ui/components/accordion/Accordion.tsx)

**`Accordion`**

| Part | What it is | Props (default) |
|---|---|---|
| `Accordion.Root` | — | + Base UI `Accordion.Root` props |
| `Accordion.Item` | One section: heading (trigger with a plus that turns into a cross) and panel. | `title`: `React.ReactNode` (The heading); `children`; `disabled`; + Base UI `Accordion.Item` props |

### Collapsible module

```tsx
import { Collapsible } from 'stories/base-ui/components/collapsible/Collapsible'
```

Source: [stories/base-ui/components/collapsible/Collapsible.tsx](../../stories/base-ui/components/collapsible/Collapsible.tsx)

**`Collapsible`**

Props: `label`: `React.ReactNode` (The trigger's text); `disabled`: `boolean` (Disables the trigger); `children`; + Base UI `Collapsible.Root` props

### Separator module

```tsx
import { Separator } from 'stories/base-ui/components/separator/Separator'
```

Source: [stories/base-ui/components/separator/Separator.tsx](../../stories/base-ui/components/separator/Separator.tsx)

**`Separator`**

Props: + Base UI `Separator` props

### ScrollArea module

```tsx
import { ScrollArea } from 'stories/base-ui/components/scroll-area/ScrollArea'
```

Source: [stories/base-ui/components/scroll-area/ScrollArea.tsx](../../stories/base-ui/components/scroll-area/ScrollArea.tsx)

**`ScrollArea`**: Size it with className / style.

Props: `children`; + Base UI `ScrollArea.Root` props

### Avatar module

```tsx
import { Avatar } from 'stories/base-ui/components/avatar/Avatar'
```

Source: [stories/base-ui/components/avatar/Avatar.tsx](../../stories/base-ui/components/avatar/Avatar.tsx)

**`Avatar`**

Props: `size`: `AvatarSize` = `'md'`; `src`: `string` (The picture. Without it (or while it loads, or if it fails) the initials show); `alt`: `string` = `''` (Alt text for the picture: the person's name, or '' when the name is shown next to it); `initials`: `string` (Initials shown when there is no picture: "LT"); + Base UI `Avatar.Root` props
