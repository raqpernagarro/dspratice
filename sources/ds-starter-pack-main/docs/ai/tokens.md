<!-- Generated from the specs by `npm run ds:ai-docs`. Do not edit. -->

# Design tokens

The semantic token vocabulary (190 variables, 7 shadow styles, 16 text styles). Names are identical in Figma and code; the naming source of truth is `docs/Tokens-semantic-v2.xlsx`. Values here are the default theme (no brand).

## Rules

- **Components use semantic tokens, never primitives.** Primitives (`scale/*`, `opacity/*`, `colors/*`) are building blocks of the semantic layer; the only one a spec binds directly is the keyword `colors/transparent`.
- **Component tokens exist only as overrides.** A component token (`button/space-x/md`) is created when a theme changes one component, and it aliases a semantic token. Never invent component tokens to style new UI.
- **Light / Dark only change color.** Size, space, shape, font, effect and motion tokens have one value for every mode. Brands (Gold Brand, Violet Brand) override a subset of tokens, color and non-color (see [Brands](#brands)).
- **Pick by job, not by value.** Two tokens with the same value today (`shape/radius/sm`, `shape/radius/md`) can diverge in another theme. Choose the one whose name describes what the element is.

## Using tokens in code

- CSS custom property: the path with `/` → `-`, prefixed with `--`: `color/background/neutral/primary` → `var(--color-background-neutral-primary)`. In TypeScript, `figmaTokenVar()` (`stories/base-ui/tokens/figma-css-var.ts`).
- Load `stories/base-ui/tokens/figma-semantic.css` once (generated from Figma). Colors resolve inside `.theme-scope[data-appearance="light"|"dark"]`, brands with `data-brand="<brand>"`. Put them on `<html>` so portalled popups inherit the theme.
- Typography: apply a text style through its four font tokens (family, size, line height, weight), as listed in [Text styles](#text-styles).
- Shadows: use the composite shadow styles (`var(--effect-shadow-elevation-low)`), not their parts.

## Naming grammar

`tier / aspect / role / prominence / state`. Not every token has every segment; segments are dropped from the right.

| Segment | Meaning | Words in use |
|---|---|---|
| tier | The kind of value | `color` `size` `space` `shape` `font` `effect` `motion` |
| aspect | What it paints (color) or measures (font, effect…) | `background` `border` `foreground` `shadow` |
| role | The job of the element | `accent` `deboss-bottom` `deboss-top` `elevation` `emboss-bottom` `emboss-top` `error` `focus-ring` `info` `interactive` `inverted` `neutral` `on-accent` `on-danger` `on-dark` `on-error` `on-info` `on-interactive` `on-light` `on-success` `on-warning` `overlay` `success` `surface` `warning` |
| prominence | Emphasis or step within the role | `danger` `danger-subtle` `error` `high` `low` `medium` `primary` `regular` `secondary` `strong` `subtle` `tertiary` |
| state | Interaction state (interactive roles only) | `default` `disabled` `hover` `pressed` `selected` `visited` |

Examples: `color/background/interactive/primary/hover` (tier color, aspect background, role interactive, prominence primary, state hover); `color/foreground/neutral/secondary`; `color/border/error`. `on-<role>` foregrounds go on top of that role’s background (`color/foreground/on-interactive/primary` on `color/background/interactive/primary/*`). Size, space and shape use t-shirt steps (`2xs` … `3xl`); font tokens are `font/<aspect>/<role>/<step>` (`font/size/body/md`).

## Color · background

Fills of surfaces and controls.

| Token | CSS | Light | Dark | Used by |
|---|---|---|---|---|
| `color/background/accent/default` | `--color-background-accent-default` | `#06041f` | `#ffffff` | Checkbox, Radio, Switch, Slider, Progress, Meter |
| `color/background/accent/hover` | `--color-background-accent-hover` | `#1b1b33` | `#f7f6f9` | Checkbox, Radio, Switch, Slider |
| `color/background/accent/pressed` | `--color-background-accent-pressed` | `#4e4e67` | `#efeffa` | Checkbox, Radio, Switch |
| `color/background/accent/selected` | `--color-background-accent-selected` | `#4e4e67` | `#efeffa` | Avatar |
| `color/background/error/strong` | `--color-background-error-strong` | `#ffffff` | `#06041f` | — |
| `color/background/error/subtle` | `--color-background-error-subtle` | `#fff4f4` | `#280f1a` | Toast |
| `color/background/info/strong` | `--color-background-info-strong` | `#2563eb` | `#60a5fa` | — |
| `color/background/info/subtle` | `--color-background-info-subtle` | `#eff6ff` | `#172554` | — |
| `color/background/interactive/danger-subtle/default` | `--color-background-interactive-danger-subtle-default` | `rgba(6,4,31,0)` | `rgba(255,255,255,0)` | Button, Icon Button |
| `color/background/interactive/danger-subtle/hover` | `--color-background-interactive-danger-subtle-hover` | `rgba(191,64,89,0.1)` | `rgba(6,4,31,0.1)` | Button, Icon Button |
| `color/background/interactive/danger-subtle/pressed` | `--color-background-interactive-danger-subtle-pressed` | `rgba(191,64,89,0.2)` | `rgba(6,4,31,0.2)` | Button, Icon Button |
| `color/background/interactive/danger/default` | `--color-background-interactive-danger-default` | `#bf4059` | `#06041f` | Button, Icon Button |
| `color/background/interactive/danger/hover` | `--color-background-interactive-danger-hover` | `#940929` | `#1b1b33` | Button, Icon Button |
| `color/background/interactive/danger/pressed` | `--color-background-interactive-danger-pressed` | `#7e0823` | `#4e4e67` | Button, Icon Button |
| `color/background/interactive/danger/selected` | `--color-background-interactive-danger-selected` | `#7e0823` | `#4e4e67` | — |
| `color/background/interactive/disabled` | `--color-background-interactive-disabled` | `#ffffff` | `#06041f` | Button, Icon Button, Input, Checkbox, Radio, Switch, Number Field, OTP Slot, Select, Combobox |
| `color/background/interactive/primary/default` | `--color-background-interactive-primary-default` | `#06041f` | `#ffffff` | Button, Icon Button |
| `color/background/interactive/primary/hover` | `--color-background-interactive-primary-hover` | `#1b1b33` | `#f7f6f9` | Button, Icon Button |
| `color/background/interactive/primary/pressed` | `--color-background-interactive-primary-pressed` | `#4e4e67` | `#efeffa` | Button, Icon Button |
| `color/background/interactive/primary/selected` | `--color-background-interactive-primary-selected` | `#4e4e67` | `#efeffa` | — |
| `color/background/interactive/secondary/default` | `--color-background-interactive-secondary-default` | `#ffffff` | `#06041f` | Button, Icon Button |
| `color/background/interactive/secondary/hover` | `--color-background-interactive-secondary-hover` | `#fcfcfc` | `#1b1b33` | Button, Icon Button |
| `color/background/interactive/secondary/pressed` | `--color-background-interactive-secondary-pressed` | `#f7f6f9` | `#4e4e67` | Button, Icon Button |
| `color/background/interactive/secondary/selected` | `--color-background-interactive-secondary-selected` | `#f7f6f9` | `#4e4e67` | — |
| `color/background/interactive/subtle/default` | `--color-background-interactive-subtle-default` | `rgba(6,4,31,0)` | `rgba(255,255,255,0)` | Button, Icon Button, Toggle, Number Field, Option, Menu Item, Menubar Item, Navigation Menu Item, Navigation Menu Link, Accordion Item |
| `color/background/interactive/subtle/hover` | `--color-background-interactive-subtle-hover` | `rgba(6,4,31,0.1)` | `rgba(255,255,255,0.1)` | Button, Icon Button, Toggle, Number Field, Option, Menu Item, Menubar Item, Navigation Menu Item, Navigation Menu Link, Accordion Item, Collapsible |
| `color/background/interactive/subtle/pressed` | `--color-background-interactive-subtle-pressed` | `rgba(6,4,31,0.15)` | `rgba(255,255,255,0.15)` | Button, Icon Button, Toggle, Number Field, Collapsible |
| `color/background/interactive/subtle/selected` | `--color-background-interactive-subtle-selected` | `rgba(6,4,31,0.15)` | `rgba(255,255,255,0.15)` | Toggle, Menubar Item, Navigation Menu Item |
| `color/background/inverted/primary` | `--color-background-inverted-primary` | `#06041f` | `#ffffff` | — |
| `color/background/inverted/secondary` | `--color-background-inverted-secondary` | `#100e23` | `#fcfcfc` | — |
| `color/background/inverted/tertiary` | `--color-background-inverted-tertiary` | `#1b1b33` | `#f7f6f9` | — |
| `color/background/neutral/primary` | `--color-background-neutral-primary` | `#ffffff` | `#06041f` | Toggle Group, Toolbar, Input, Checkbox, Radio, Switch, Slider, Number Field, OTP Slot, Select, Combobox, Tabs, Tab, Accordion, Collapsible, Scroll Area |
| `color/background/neutral/secondary` | `--color-background-neutral-secondary` | `#fcfcfc` | `#1b1b33` | Menubar |
| `color/background/neutral/tertiary` | `--color-background-neutral-tertiary` | `#f7f6f9` | `#4e4e67` | Preview Card |
| `color/background/overlay/regular` | `--color-background-overlay-regular` | `rgba(0,0,0,0.5)` | `rgba(0,0,0,0.6)` | Dialog, Alert Dialog, Drawer |
| `color/background/overlay/strong` | `--color-background-overlay-strong` | `rgba(0,0,0,0.7)` | `rgba(0,0,0,0.8)` | — |
| `color/background/overlay/subtle` | `--color-background-overlay-subtle` | `rgba(0,0,0,0.15)` | `rgba(0,0,0,0.3)` | — |
| `color/background/success/strong` | `--color-background-success-strong` | `#ffffff` | `#06041f` | — |
| `color/background/success/subtle` | `--color-background-success-subtle` | `#f0fdf4` | `#06231d` | Toast |
| `color/background/surface/high` | `--color-background-surface-high` | `#ffffff` | `#06041f` | Dialog, Alert Dialog, Drawer |
| `color/background/surface/low` | `--color-background-surface-low` | `#ffffff` | `#06041f` | — |
| `color/background/surface/medium` | `--color-background-surface-medium` | `#ffffff` | `#06041f` | Listbox, Menu, Navigation Menu, Popover, Tooltip, Preview Card, Toast |
| `color/background/warning/strong` | `--color-background-warning-strong` | `#ffffff` | `#06041f` | — |
| `color/background/warning/subtle` | `--color-background-warning-subtle` | `#fefce8` | `#241a02` | Toast |

## Color · foreground

Text and icons.

| Token | CSS | Light | Dark | Used by |
|---|---|---|---|---|
| `color/foreground/accent` | `--color-foreground-accent` | `#06041f` | `#ffffff` | — |
| `color/foreground/error` | `--color-foreground-error` | `#940929` | `#f97586` | Field, Toast |
| `color/foreground/info` | `--color-foreground-info` | `#1d4ed8` | `#93c5fd` | — |
| `color/foreground/interactive/danger/default` | `--color-foreground-interactive-danger-default` | `#940929` | `#f97586` | Button, Icon Button |
| `color/foreground/interactive/danger/hover` | `--color-foreground-interactive-danger-hover` | `#7e0823` | `#febbc4` | Button, Icon Button |
| `color/foreground/interactive/danger/pressed` | `--color-foreground-interactive-danger-pressed` | `#4e0717` | `#fcd0d7` | Button, Icon Button |
| `color/foreground/interactive/default` | `--color-foreground-interactive-default` | `#06041f` | `#ffffff` | Button, Icon Button |
| `color/foreground/interactive/disabled` | `--color-foreground-interactive-disabled` | `#757590` | `#9696ad` | Button, Icon Button, Toggle, Input, Checkbox, Radio, Switch, Number Field, OTP Slot, Select, Combobox, Option, Menu Item, Menubar Item, Tab, Accordion Item, Collapsible |
| `color/foreground/interactive/hover` | `--color-foreground-interactive-hover` | `#06041f` | `#ffffff` | Button, Icon Button |
| `color/foreground/interactive/pressed` | `--color-foreground-interactive-pressed` | `#06041f` | `#ffffff` | Button, Icon Button |
| `color/foreground/interactive/visited` | `--color-foreground-interactive-visited` | `#06041f` | `#ffffff` | — |
| `color/foreground/inverted/primary` | `--color-foreground-inverted-primary` | `#ffffff` | `#06041f` | — |
| `color/foreground/inverted/secondary` | `--color-foreground-inverted-secondary` | `#b4b3d1` | `#4e4e67` | — |
| `color/foreground/inverted/tertiary` | `--color-foreground-inverted-tertiary` | `#757590` | `#757590` | — |
| `color/foreground/neutral/primary` | `--color-foreground-neutral-primary` | `#06041f` | `#ffffff` | Button, Icon Button, Toggle, Input, Field, Fieldset, Checkbox, Checkbox Group, Radio, Radio Group, Switch, Number Field, OTP Slot, Select, Combobox, Option, Menu Item, Menubar Item, Navigation Menu Item, Navigation Menu Link, Tabs, Tab, Popover, Tooltip, Preview Card, Dialog, Alert Dialog, Drawer, Toast, Progress, Meter, Accordion Item, Collapsible, Scroll Area |
| `color/foreground/neutral/secondary` | `--color-foreground-neutral-secondary` | `#4e4e67` | `#b4b3d1` | Toggle, Input, Field, Select, Combobox, Listbox, Menu Item, Menu Group Label, Navigation Menu Item, Navigation Menu Link, Tab, Popover, Dialog, Alert Dialog, Drawer, Toast, Progress, Meter, Accordion Item |
| `color/foreground/neutral/tertiary` | `--color-foreground-neutral-tertiary` | `#757590` | `#757590` | Button, Icon Button, Checkbox, Radio, Switch |
| `color/foreground/on-accent/primary` | `--color-foreground-on-accent-primary` | `#ffffff` | `#06041f` | Checkbox, Radio, Switch, Avatar |
| `color/foreground/on-accent/secondary` | `--color-foreground-on-accent-secondary` | `#b4b3d1` | `#4e4e67` | — |
| `color/foreground/on-accent/tertiary` | `--color-foreground-on-accent-tertiary` | `#757590` | `#757590` | — |
| `color/foreground/on-danger/primary` | `--color-foreground-on-danger-primary` | `#ffffff` | `#ffffff` | Button, Icon Button |
| `color/foreground/on-danger/secondary` | `--color-foreground-on-danger-secondary` | `#4e4e67` | `#b4b3d1` | — |
| `color/foreground/on-dark/primary` | `--color-foreground-on-dark-primary` | `#ffffff` | `#ffffff` | — |
| `color/foreground/on-dark/secondary` | `--color-foreground-on-dark-secondary` | `#b4b3d1` | `#b4b3d1` | — |
| `color/foreground/on-dark/tertiary` | `--color-foreground-on-dark-tertiary` | `#757590` | `#757590` | — |
| `color/foreground/on-error/primary` | `--color-foreground-on-error-primary` | `#06041f` | `#ffffff` | — |
| `color/foreground/on-error/secondary` | `--color-foreground-on-error-secondary` | `#4e4e67` | `#b4b3d1` | — |
| `color/foreground/on-info/primary` | `--color-foreground-on-info-primary` | `#ffffff` | `#06041f` | — |
| `color/foreground/on-info/secondary` | `--color-foreground-on-info-secondary` | `#dbeafe` | `#1e3a8a` | — |
| `color/foreground/on-interactive/primary` | `--color-foreground-on-interactive-primary` | `#ffffff` | `#06041f` | Button, Icon Button |
| `color/foreground/on-interactive/secondary` | `--color-foreground-on-interactive-secondary` | `#b4b3d1` | `#4e4e67` | — |
| `color/foreground/on-light/primary` | `--color-foreground-on-light-primary` | `#06041f` | `#06041f` | — |
| `color/foreground/on-light/secondary` | `--color-foreground-on-light-secondary` | `#4e4e67` | `#4e4e67` | — |
| `color/foreground/on-light/tertiary` | `--color-foreground-on-light-tertiary` | `#757590` | `#757590` | — |
| `color/foreground/on-success/primary` | `--color-foreground-on-success-primary` | `#06041f` | `#ffffff` | — |
| `color/foreground/on-success/secondary` | `--color-foreground-on-success-secondary` | `#4e4e67` | `#b4b3d1` | — |
| `color/foreground/on-warning/primary` | `--color-foreground-on-warning-primary` | `#06041f` | `#ffffff` | — |
| `color/foreground/on-warning/secondary` | `--color-foreground-on-warning-secondary` | `#4e4e67` | `#b4b3d1` | — |
| `color/foreground/success` | `--color-foreground-success` | `#205463` | `#75e1c1` | Toast |
| `color/foreground/warning` | `--color-foreground-warning` | `#664f11` | `#fde047` | Toast |

## Color · border

Strokes and borders.

| Token | CSS | Light | Dark | Used by |
|---|---|---|---|---|
| `color/border/error` | `--color-border-error` | `#bf4059` | `#f8485e` | Input, Number Field, OTP Slot, Select, Combobox, Toast |
| `color/border/info` | `--color-border-info` | `#2563eb` | `#60a5fa` | — |
| `color/border/interactive/default` | `--color-border-interactive-default` | `#06041f` | `#ffffff` | Button, Icon Button, Input, Checkbox, Radio, Switch, Slider, Number Field, OTP Slot, Select, Combobox, Collapsible |
| `color/border/interactive/disabled` | `--color-border-interactive-disabled` | `#757590` | `#9696ad` | Button, Icon Button, Input, Checkbox, Radio, Switch, Slider, Number Field, OTP Slot, Select, Combobox, Collapsible |
| `color/border/interactive/hover` | `--color-border-interactive-hover` | `#06041f` | `#ffffff` | Button, Icon Button, Input, Checkbox, Radio, Switch, Slider, Number Field, OTP Slot, Select, Combobox |
| `color/border/interactive/pressed` | `--color-border-interactive-pressed` | `#06041f` | `#ffffff` | Button, Icon Button, Checkbox, Radio, Switch |
| `color/border/interactive/selected` | `--color-border-interactive-selected` | `#06041f` | `#ffffff` | Input, Slider, Number Field, OTP Slot, Select, Combobox |
| `color/border/neutral/regular` | `--color-border-neutral-regular` | `#06041f` | `#ffffff` | Scroll Area |
| `color/border/neutral/strong` | `--color-border-neutral-strong` | `#06041f` | `#ffffff` | — |
| `color/border/neutral/subtle` | `--color-border-neutral-subtle` | `#efeffa` | `#1b1b33` | Toggle Group, Toolbar, Slider, Listbox, Menu, Menu Separator, Menubar, Navigation Menu, Tabs, Tab, Popover, Tooltip, Preview Card, Dialog, Alert Dialog, Drawer, Toast, Progress, Meter, Accordion, Accordion Item, Separator, Scroll Area |
| `color/border/success` | `--color-border-success` | `#2d807b` | `#47d7ac` | Toast |
| `color/border/warning` | `--color-border-warning` | `#eab308` | `#eab308` | Toast |

## Color · shadow

Colors of shadows and focus rings (used by the effect styles below).

| Token | CSS | Light | Dark | Used by |
|---|---|---|---|---|
| `color/shadow/deboss-bottom/strong` | `--color-shadow-deboss-bottom-strong` | `rgba(255,255,255,0.1)` | `rgba(255,255,255,0.2)` | — |
| `color/shadow/deboss-bottom/subtle` | `--color-shadow-deboss-bottom-subtle` | `rgba(255,255,255,0.05)` | `rgba(255,255,255,0.1)` | — |
| `color/shadow/deboss-top/strong` | `--color-shadow-deboss-top-strong` | `rgba(0,0,0,0.1)` | `rgba(0,0,0,0.2)` | — |
| `color/shadow/deboss-top/subtle` | `--color-shadow-deboss-top-subtle` | `rgba(0,0,0,0.05)` | `rgba(0,0,0,0.1)` | — |
| `color/shadow/elevation/high` | `--color-shadow-elevation-high` | `rgba(0,0,0,0.2)` | `rgba(0,0,0,0.5)` | — |
| `color/shadow/elevation/low` | `--color-shadow-elevation-low` | `rgba(0,0,0,0.1)` | `rgba(0,0,0,0.3)` | — |
| `color/shadow/elevation/medium` | `--color-shadow-elevation-medium` | `rgba(0,0,0,0.15)` | `rgba(0,0,0,0.4)` | — |
| `color/shadow/emboss-bottom/strong` | `--color-shadow-emboss-bottom-strong` | `rgba(0,0,0,0.1)` | `rgba(0,0,0,0.2)` | — |
| `color/shadow/emboss-bottom/subtle` | `--color-shadow-emboss-bottom-subtle` | `rgba(0,0,0,0.05)` | `rgba(0,0,0,0.1)` | — |
| `color/shadow/emboss-top/strong` | `--color-shadow-emboss-top-strong` | `rgba(255,255,255,0.2)` | `rgba(255,255,255,0.1)` | — |
| `color/shadow/emboss-top/subtle` | `--color-shadow-emboss-top-subtle` | `rgba(255,255,255,0.1)` | `rgba(255,255,255,0.05)` | — |
| `color/shadow/focus-ring/error` | `--color-shadow-focus-ring-error` | `#bf4059` | `#f8485e` | — |
| `color/shadow/focus-ring/primary` | `--color-shadow-focus-ring-primary` | `#06041f` | `#ffffff` | — |

## Size

Fixed dimensions: control heights, icon boxes, border widths.

| Token | CSS | Value | Used by |
|---|---|---|---|
| `size/2xs` | `--size-2xs` | `14px` | Button, Icon Button, Toggle, Input, Checkbox, Radio, Switch, Number Field, Select, Combobox, Navigation Menu Item |
| `size/border/regular` | `--size-border-regular` | `1px` | Button, Icon Button, Toggle Group, Toolbar, Input, Checkbox, Radio, Switch, Slider, Number Field, OTP Slot, Select, Combobox, Listbox, Menu, Menu Separator, Menubar, Navigation Menu, Tabs, Tab, Popover, Tooltip, Preview Card, Dialog, Alert Dialog, Drawer, Toast, Accordion, Accordion Item, Collapsible, Separator, Scroll Area |
| `size/border/strong` | `--size-border-strong` | `4px` | — |
| `size/lg` | `--size-lg` | `36px` | Button, Icon Button, Toggle, Input, Switch, Number Field, OTP Slot, Select, Combobox, Navigation Menu Item, Tab, Collapsible, Avatar |
| `size/md` | `--size-md` | `28px` | Switch, Menubar Item |
| `size/sm` | `--size-sm` | `20px` | Button, Icon Button, Toggle, Input, Checkbox, Radio, Slider, Number Field, Select, Combobox |
| `size/xl` | `--size-xl` | `44px` | Button, Icon Button, Toggle, Input, Switch, Number Field, OTP Slot, Select, Combobox, Tab, Avatar |
| `size/xs` | `--size-xs` | `16px` | Button, Icon Button, Toggle, Input, Checkbox, Radio, Switch, Slider, Number Field, Select, Combobox, Option, Menu Item, Navigation Menu Item, Toast, Accordion Item, Collapsible |

## Space

Padding and gaps.

| Token | CSS | Value | Used by |
|---|---|---|---|
| `space/2xl` | `--space-2xl` | `24px` | Button, Icon Button, Toggle, Input, Number Field, OTP Slot, Select, Combobox, Tab, Drawer, Avatar |
| `space/2xs` | `--space-2xs` | `2px` | Button, Toggle Group, Toolbar, Switch, Slider, Menubar, Navigation Menu, Scroll Area |
| `space/3xl` | `--space-3xl` | `32px` | — |
| `space/lg` | `--space-lg` | `16px` | Input, Fieldset, Form, Select, Combobox, Tabs, Dialog, Alert Dialog, Toast, Accordion Item, Scroll Area |
| `space/md` | `--space-md` | `12px` | Button, Input, Fieldset, Checkbox, Switch, Slider, Select, Combobox, Listbox, Option, Menu Item, Menu Group Label, Menu Separator, Menubar Item, Navigation Menu Item, Tab, Popover, Dialog, Alert Dialog, Drawer, Toast, Meter, Accordion Item, Collapsible, Scroll Area |
| `space/sm` | `--space-sm` | `8px` | Button, Input, Field, Fieldset, Form, Checkbox, Checkbox Group, Radio, Radio Group, Switch, Slider, OTP Field, Select, Combobox, Listbox, Option, Menu Item, Navigation Menu, Navigation Menu Link, Tab, Tooltip, Preview Card, Progress, Meter, Accordion Item, Collapsible, Scroll Area |
| `space/xl` | `--space-xl` | `20px` | — |
| `space/xs` | `--space-xs` | `4px` | Button, Toolbar, Input, Field, Form, Checkbox, Checkbox Group, Radio, Radio Group, Switch, Slider, OTP Field, Select, Combobox, Autocomplete, Listbox, Menu, Menu Group Label, Menu Separator, Navigation Menu Item, Navigation Menu Link, Tabs, Popover, Tooltip, Dialog, Alert Dialog, Drawer, Toast, Progress, Collapsible |

## Shape

Corner radius.

| Token | CSS | Value | Used by |
|---|---|---|---|
| `shape/radius/full` | `--shape-radius-full` | `80px` | Radio, Switch, Slider, Progress, Meter, Scroll Area, Avatar |
| `shape/radius/lg` | `--shape-radius-lg` | `0px` | Listbox, Menu, Navigation Menu, Tabs, Popover, Tooltip, Preview Card, Dialog, Alert Dialog, Drawer, Toast, Accordion, Scroll Area |
| `shape/radius/md` | `--shape-radius-md` | `0px` | Toggle Group, Toolbar, Input, Number Field, OTP Slot, Select, Combobox, Menubar, Navigation Menu Item, Navigation Menu Link, Tabs, Tab, Preview Card, Collapsible |
| `shape/radius/sm` | `--shape-radius-sm` | `0px` | Button, Icon Button, Toggle, Checkbox, Option, Menu Item, Menubar Item |

## Font

Family, size, line height and weight. Prefer the text styles below over single font tokens.

| Token | CSS | Value | Used by |
|---|---|---|---|
| `font/family/mono` | `--font-family-mono` | `'Hanken Grotesk'` | — |
| `font/family/primary` | `--font-family-primary` | `'Hanken Grotesk'` | Button, Input, Field, Fieldset, Checkbox, Checkbox Group, Radio, Radio Group, Switch, Number Field, OTP Slot, Select, Combobox, Listbox, Option, Menu Item, Menu Group Label, Menubar Item, Navigation Menu Item, Navigation Menu Link, Tabs, Tab, Popover, Tooltip, Preview Card, Dialog, Alert Dialog, Drawer, Toast, Progress, Meter, Accordion Item, Collapsible, Scroll Area, Avatar |
| `font/family/secondary` | `--font-family-secondary` | `'Hanken Grotesk'` | — |
| `font/line-height/body/lg` | `--font-line-height-body-lg` | `24px` | Button, Input, Field, Fieldset, Checkbox, Checkbox Group, Radio, Radio Group, Switch, Number Field, OTP Slot, Select, Combobox, Tab, Dialog, Alert Dialog, Drawer |
| `font/line-height/body/md` | `--font-line-height-body-md` | `20px` | Button, Input, Field, Fieldset, Checkbox, Checkbox Group, Radio, Radio Group, Switch, Number Field, OTP Slot, Select, Combobox, Listbox, Option, Menu Item, Menubar Item, Navigation Menu Item, Navigation Menu Link, Tabs, Tab, Popover, Tooltip, Preview Card, Dialog, Alert Dialog, Drawer, Toast, Progress, Meter, Accordion Item, Collapsible, Scroll Area, Avatar |
| `font/line-height/body/sm` | `--font-line-height-body-sm` | `16px` | Button, Input, Field, Checkbox, Checkbox Group, Radio, Radio Group, Switch, Number Field, Select, Combobox, Tab, Avatar |
| `font/line-height/caption/md` | `--font-line-height-caption-md` | `16px` | Menu Group Label, Avatar |
| `font/line-height/caption/sm` | `--font-line-height-caption-sm` | `14px` | — |
| `font/line-height/heading/lg` | `--font-line-height-heading-lg` | `40px` | — |
| `font/line-height/heading/md` | `--font-line-height-heading-md` | `32px` | — |
| `font/line-height/heading/sm` | `--font-line-height-heading-sm` | `28px` | Fieldset, OTP Slot |
| `font/line-height/heading/xl` | `--font-line-height-heading-xl` | `48px` | — |
| `font/size/body/lg` | `--font-size-body-lg` | `16px` | Button, Input, Field, Fieldset, Checkbox, Checkbox Group, Radio, Radio Group, Switch, Number Field, OTP Slot, Select, Combobox, Tab, Dialog, Alert Dialog, Drawer |
| `font/size/body/md` | `--font-size-body-md` | `14px` | Button, Input, Field, Fieldset, Checkbox, Checkbox Group, Radio, Radio Group, Switch, Number Field, OTP Slot, Select, Combobox, Listbox, Option, Menu Item, Menubar Item, Navigation Menu Item, Navigation Menu Link, Tabs, Tab, Popover, Tooltip, Preview Card, Dialog, Alert Dialog, Drawer, Toast, Progress, Meter, Accordion Item, Collapsible, Scroll Area, Avatar |
| `font/size/body/sm` | `--font-size-body-sm` | `12px` | Button, Input, Field, Checkbox, Checkbox Group, Radio, Radio Group, Switch, Number Field, Select, Combobox, Tab, Avatar |
| `font/size/caption/md` | `--font-size-caption-md` | `12px` | Menu Group Label, Avatar |
| `font/size/caption/sm` | `--font-size-caption-sm` | `10px` | — |
| `font/size/heading/lg` | `--font-size-heading-lg` | `32px` | — |
| `font/size/heading/md` | `--font-size-heading-md` | `24px` | — |
| `font/size/heading/sm` | `--font-size-heading-sm` | `20px` | Fieldset, OTP Slot |
| `font/size/heading/xl` | `--font-size-heading-xl` | `40px` | — |
| `font/weight/body/regular` | `--font-weight-body-regular` | `400` | Input, Field, Checkbox, Radio, Switch, Number Field, OTP Slot, Select, Combobox, Listbox, Option, Menu Item, Menu Group Label, Menubar Item, Navigation Menu Item, Navigation Menu Link, Tabs, Tab, Popover, Tooltip, Preview Card, Dialog, Alert Dialog, Drawer, Toast, Progress, Meter, Accordion Item, Collapsible, Scroll Area, Avatar |
| `font/weight/body/strong` | `--font-weight-body-strong` | `600` | Button, Field, Fieldset, Checkbox Group, Radio Group, Navigation Menu Link, Popover, Preview Card, Dialog, Alert Dialog, Drawer, Toast, Avatar |
| `font/weight/heading/regular` | `--font-weight-heading-regular` | `400` | OTP Slot |
| `font/weight/heading/strong` | `--font-weight-heading-strong` | `700` | Fieldset |

### Text styles

Figma text styles, each bound to four font tokens. Components bind these (`text-style`), not single font tokens.

| Style | Family | Size | Line height | Weight | Used by |
|---|---|---|---|---|---|
| Heading/XL | `font/family/primary` | `font/size/heading/xl` | `font/line-height/heading/xl` | `font/weight/heading/strong` | — |
| Heading/XL Regular | `font/family/primary` | `font/size/heading/xl` | `font/line-height/heading/xl` | `font/weight/heading/regular` | — |
| Heading/LG | `font/family/primary` | `font/size/heading/lg` | `font/line-height/heading/lg` | `font/weight/heading/strong` | — |
| Heading/LG Regular | `font/family/primary` | `font/size/heading/lg` | `font/line-height/heading/lg` | `font/weight/heading/regular` | — |
| Heading/MD | `font/family/primary` | `font/size/heading/md` | `font/line-height/heading/md` | `font/weight/heading/strong` | — |
| Heading/MD Regular | `font/family/primary` | `font/size/heading/md` | `font/line-height/heading/md` | `font/weight/heading/regular` | — |
| Heading/SM | `font/family/primary` | `font/size/heading/sm` | `font/line-height/heading/sm` | `font/weight/heading/strong` | Fieldset |
| Heading/SM Regular | `font/family/primary` | `font/size/heading/sm` | `font/line-height/heading/sm` | `font/weight/heading/regular` | OTP Slot |
| Body/LG | `font/family/primary` | `font/size/body/lg` | `font/line-height/body/lg` | `font/weight/body/regular` | Input, Field, Checkbox, Radio, Switch, Number Field, OTP Slot, Select, Combobox, Tab |
| Body/LG Strong | `font/family/primary` | `font/size/body/lg` | `font/line-height/body/lg` | `font/weight/body/strong` | Button, Field, Fieldset, Checkbox Group, Radio Group, Dialog, Alert Dialog, Drawer |
| Body/MD | `font/family/primary` | `font/size/body/md` | `font/line-height/body/md` | `font/weight/body/regular` | Input, Field, Checkbox, Radio, Switch, Number Field, OTP Slot, Select, Combobox, Listbox, Option, Menu Item, Menubar Item, Navigation Menu Item, Navigation Menu Link, Tabs, Tab, Popover, Tooltip, Preview Card, Dialog, Alert Dialog, Drawer, Toast, Progress, Meter, Accordion Item, Collapsible, Scroll Area |
| Body/MD Strong | `font/family/primary` | `font/size/body/md` | `font/line-height/body/md` | `font/weight/body/strong` | Button, Field, Fieldset, Checkbox Group, Radio Group, Navigation Menu Link, Popover, Preview Card, Toast, Avatar |
| Body/SM | `font/family/primary` | `font/size/body/sm` | `font/line-height/body/sm` | `font/weight/body/regular` | Input, Field, Checkbox, Radio, Switch, Number Field, Select, Combobox, Tab |
| Body/SM Strong | `font/family/primary` | `font/size/body/sm` | `font/line-height/body/sm` | `font/weight/body/strong` | Button, Field, Checkbox Group, Radio Group, Avatar |
| Caption/MD | `font/family/primary` | `font/size/caption/md` | `font/line-height/caption/md` | `font/weight/body/regular` | Menu Group Label, Avatar |
| Caption/SM | `font/family/primary` | `font/size/caption/sm` | `font/line-height/caption/sm` | `font/weight/body/regular` | — |

## Effect

Shadow parts, blur, border styles, list and text decoration.

| Token | CSS | Value | Used by |
|---|---|---|---|
| `effect/blur/overlay/regular` | `--effect-blur-overlay-regular` | `8px` | — |
| `effect/blur/overlay/strong` | `--effect-blur-overlay-strong` | `24px` | — |
| `effect/border/style/droppable/default` | `--effect-border-style-droppable-default` | `2px dashed` | — |
| `effect/border/style/droppable/hover` | `--effect-border-style-droppable-hover` | `2px solid` | — |
| `effect/list/style/bullet` | `--effect-list-style-bullet` | `disc` | — |
| `effect/shadow/deboss/blur` | `--effect-shadow-deboss-blur` | `2px` | — |
| `effect/shadow/deboss/offset-x` | `--effect-shadow-deboss-offset-x` | `0px` | — |
| `effect/shadow/deboss/offset-y` | `--effect-shadow-deboss-offset-y` | `1px` | — |
| `effect/shadow/deboss/spread` | `--effect-shadow-deboss-spread` | `0px` | — |
| `effect/shadow/elevation/high/blur` | `--effect-shadow-elevation-high-blur` | `24px` | — |
| `effect/shadow/elevation/high/offset-x` | `--effect-shadow-elevation-high-offset-x` | `0px` | — |
| `effect/shadow/elevation/high/offset-y` | `--effect-shadow-elevation-high-offset-y` | `4px` | — |
| `effect/shadow/elevation/high/spread` | `--effect-shadow-elevation-high-spread` | `-2px` | — |
| `effect/shadow/elevation/low/blur` | `--effect-shadow-elevation-low-blur` | `4px` | — |
| `effect/shadow/elevation/low/offset-x` | `--effect-shadow-elevation-low-offset-x` | `0px` | — |
| `effect/shadow/elevation/low/offset-y` | `--effect-shadow-elevation-low-offset-y` | `1px` | — |
| `effect/shadow/elevation/low/spread` | `--effect-shadow-elevation-low-spread` | `0px` | — |
| `effect/shadow/elevation/medium/blur` | `--effect-shadow-elevation-medium-blur` | `8px` | — |
| `effect/shadow/elevation/medium/offset-x` | `--effect-shadow-elevation-medium-offset-x` | `0px` | — |
| `effect/shadow/elevation/medium/offset-y` | `--effect-shadow-elevation-medium-offset-y` | `2px` | — |
| `effect/shadow/elevation/medium/spread` | `--effect-shadow-elevation-medium-spread` | `-1px` | — |
| `effect/shadow/emboss/blur` | `--effect-shadow-emboss-blur` | `2px` | — |
| `effect/shadow/emboss/offset-x` | `--effect-shadow-emboss-offset-x` | `0px` | — |
| `effect/shadow/emboss/offset-y` | `--effect-shadow-emboss-offset-y` | `1px` | — |
| `effect/shadow/emboss/spread` | `--effect-shadow-emboss-spread` | `0px` | — |
| `effect/shadow/focus-ring/blur` | `--effect-shadow-focus-ring-blur` | `0px` | — |
| `effect/shadow/focus-ring/offset-x` | `--effect-shadow-focus-ring-offset-x` | `0px` | — |
| `effect/shadow/focus-ring/offset-y` | `--effect-shadow-focus-ring-offset-y` | `0px` | — |
| `effect/shadow/focus-ring/spread` | `--effect-shadow-focus-ring-spread` | `2px` | — |
| `effect/text/decoration/link` | `--effect-text-decoration-link` | `underline` | — |

### Shadow styles

Composite shadows (Figma effect styles). In code each is one custom property built from its parts and its `color/shadow/*` color.

| Style token | CSS | Used by |
|---|---|---|
| `effect/shadow/deboss` | `var(--effect-shadow-deboss)` | — |
| `effect/shadow/elevation/high` | `var(--effect-shadow-elevation-high)` | Dialog, Alert Dialog, Drawer |
| `effect/shadow/elevation/low` | `var(--effect-shadow-elevation-low)` | — |
| `effect/shadow/elevation/medium` | `var(--effect-shadow-elevation-medium)` | Listbox, Menu, Navigation Menu, Popover, Tooltip, Preview Card, Toast |
| `effect/shadow/emboss` | `var(--effect-shadow-emboss)` | — |
| `effect/shadow/focus-ring/error` | `var(--effect-shadow-focus-ring-error)` | Input, Number Field, OTP Slot, Select, Combobox |
| `effect/shadow/focus-ring/primary` | `var(--effect-shadow-focus-ring-primary)` | Input, Slider, Number Field, OTP Slot, Select, Combobox |

## Motion

Durations and easing curves.

| Token | CSS | Value | Used by |
|---|---|---|---|
| `motion/duration/fast` | `--motion-duration-fast` | `100ms` | — |
| `motion/duration/medium` | `--motion-duration-medium` | `200ms` | — |
| `motion/duration/slow` | `--motion-duration-slow` | `400ms` | — |
| `motion/ease/accelerate` | `--motion-ease-accelerate` | `cubic-bezier(0.4, 0, 1, 1)` | — |
| `motion/ease/decelerate` | `--motion-ease-decelerate` | `cubic-bezier(0, 0, 0.2, 1)` | — |
| `motion/ease/regular` | `--motion-ease-regular` | `cubic-bezier(0.4, 0, 0.2, 1)` | — |

## Brands

| Brand | Attribute | Overrides |
|---|---|---|
| Gold Brand | `data-brand="gold"` | 57 tokens: `color/background/accent/*`, `color/background/interactive/*`, `color/background/neutral/*`, `color/background/warning/*`, `color/border/interactive/*`, `color/foreground/accent/*`, `color/foreground/interactive/*`, `color/foreground/on-accent/*`, `color/foreground/on-interactive/*`, `color/shadow/focus-ring/*`, `font/*`, `motion/*`, `shape/*`, `size/*`, `space/*` |
| Violet Brand | `data-brand="violet"` | 66 tokens: `color/background/accent/*`, `color/background/interactive/*`, `color/border/interactive/*`, `color/foreground/accent/*`, `color/foreground/interactive/*`, `color/foreground/on-accent/*`, `color/foreground/on-interactive/*`, `color/shadow/focus-ring/*`, `font/*`, `motion/*`, `shape/*`, `size/*`, `space/*` |
