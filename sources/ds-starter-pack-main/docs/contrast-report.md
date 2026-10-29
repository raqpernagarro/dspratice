# Contrast report

> Generated from the component specs and `stories/base-ui/tokens/figma-semantic.json` by `scripts/ds/check-contrast.ts`. Do not edit.
> Regenerate with `npm run ds:contrast -- --report`.

Every foreground binding (text color, icon fill) of every component variant, paired with the background it sits on, in every brand and mode. WCAG 2.x minimums: **text 4.5:1**, **large text 3:1** (≥ 24px, or ≥ 18.66px bold), **icons 3:1**. Disabled variants are **exempt** (WCAG 1.4.3: inactive components) and are listed without failing.

The background is the part's own, else the nearest enclosing part's, else the page surface (`surface/low`). Translucent backgrounds are composited over what is under them. Rows marked *code* or *Figma* differ between the two; rows naming a part and a state (`decrement :hover`) are code-only states. Ratios are rounded down.

**1488 checks (pairings × 6 brand modes): 1186 pass, 8 fail, 294 exempt (disabled).**

## Summary

| Component | Checks | Pass | Fail | Exempt |
| --- | --- | --- | --- | --- |
| [Button](#button) | 144 | 104 | **4** | 36 |
| [Icon Button](#icon-button) | 144 | 107 | **1** | 36 |
| [Checkbox](#checkbox) | 72 | 52 | **2** | 18 |
| [Input](#input) | 72 | 54 | 0 | 18 |
| [Field](#field) | 18 | 18 | 0 | 0 |
| [Menu Item](#menu-item) | 72 | 48 | 0 | 24 |
| [Menu Group Label](#menu-group-label) | 6 | 6 | 0 | 0 |
| [Switch](#switch) | 24 | 18 | 0 | 6 |
| [Radio](#radio) | 24 | 18 | 0 | 6 |
| [Radio Group](#radio-group) | 6 | 6 | 0 | 0 |
| [Checkbox Group](#checkbox-group) | 6 | 6 | 0 | 0 |
| [Toggle](#toggle) | 48 | 36 | 0 | 12 |
| [Number Field](#number-field) | 144 | 126 | 0 | 18 |
| [OTP Slot](#otp-slot) | 24 | 18 | 0 | 6 |
| [Fieldset](#fieldset) | 12 | 12 | 0 | 0 |
| [Popover](#popover) | 12 | 12 | 0 | 0 |
| [Tooltip](#tooltip) | 6 | 6 | 0 | 0 |
| [Preview Card](#preview-card) | 12 | 12 | 0 | 0 |
| [Option](#option) | 36 | 24 | 0 | 12 |
| [Listbox](#listbox) | 6 | 6 | 0 | 0 |
| [Select](#select) | 72 | 54 | 0 | 18 |
| [Combobox](#combobox) | 96 | 72 | 0 | 24 |
| [Menubar Item](#menubar-item) | 24 | 18 | 0 | 6 |
| [Navigation Menu Item](#navigation-menu-item) | 72 | 72 | 0 | 0 |
| [Navigation Menu Link](#navigation-menu-link) | 24 | 24 | 0 | 0 |
| [Dialog](#dialog) | 12 | 12 | 0 | 0 |
| [Alert Dialog](#alert-dialog) | 12 | 12 | 0 | 0 |
| [Drawer](#drawer) | 12 | 12 | 0 | 0 |
| [Toast](#toast) | 72 | 72 | 0 | 0 |
| [Avatar](#avatar) | 6 | 5 | **1** | 0 |
| [Progress](#progress) | 12 | 12 | 0 | 0 |
| [Meter](#meter) | 12 | 12 | 0 | 0 |
| [Tab](#tab) | 54 | 36 | 0 | 18 |
| [Tabs](#tabs) | 6 | 6 | 0 | 0 |
| [Accordion Item](#accordion-item) | 48 | 30 | 0 | 18 |
| [Collapsible](#collapsible) | 60 | 42 | 0 | 18 |
| [Scroll Area](#scroll-area) | 6 | 6 | 0 | 0 |

## Failures

- Button · root (Type=Primary, State=Default, Destructive=False) · Gold Dark: on-interactive/primary on interactive/primary/default = 3.35:1, needs 4.5:1 (text)
- Button · root (Type=Primary, State=Default, Destructive=False) · Violet Dark: on-interactive/primary on interactive/primary/default = 3.52:1, needs 4.5:1 (text)
- Button · root (Type=Primary, State=Hover, Destructive=False) · Gold Light: on-interactive/primary on interactive/primary/hover = 3.35:1, needs 4.5:1 (text)
- Button · root (Type=Primary, State=Pressed, Destructive=False) · Gold Light: on-interactive/primary on interactive/primary/pressed = 2.57:1, needs 4.5:1 (text)
- Icon Button · root (Type=Primary, State=Pressed, Destructive=False) · Gold Light: on-interactive/primary on interactive/primary/pressed = 2.57:1, needs 3:1 (icon)
- Checkbox · indicator (Checked=True, State=Pressed) · Gold Light: on-accent/primary on accent/pressed = 2.57:1, needs 3:1 (icon)
- Checkbox · indicator (Checked=Indeterminate, State=Pressed) · Gold Light: on-accent/primary on accent/pressed = 2.57:1, needs 3:1 (icon)
- Avatar · fallback (Type=Initials) · Gold Light: on-accent/primary on accent/selected = 1.67:1, needs 4.5:1 (text)

## Components

### Button

| Variant | Part | Kind | Foreground on background | Default Light | Default Dark | Gold Light | Gold Dark | Violet Light | Violet Dark |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Type=Primary, State=Default, Destructive=False | root | text 4.5:1 | `on-interactive/primary` on `interactive/primary/default` | 20.09 ✓ | 20.09 ✓ | 10.47 ✓ | **3.35 ✗** | 5.69 ✓ | **3.52 ✗** |
| Type=Primary, State=Default, Destructive=True | root | text 4.5:1 | `on-danger/primary` on `interactive/danger/default` | 5.13 ✓ | 20.09 ✓ | 5.13 ✓ | 20.09 ✓ | 5.13 ✓ | 20.09 ✓ |
| Type=Primary, State=Hover, Destructive=False | root | text 4.5:1 | `on-interactive/primary` on `interactive/primary/hover` | 16.78 ✓ | 18.66 ✓ | **3.35 ✗** | 10.47 ✓ | 7.10 ✓ | 4.74 ✓ |
| Type=Primary, State=Hover, Destructive=True | root | text 4.5:1 | `on-danger/primary` on `interactive/danger/hover` | 9.01 ✓ | 16.78 ✓ | 9.01 ✓ | 16.78 ✓ | 9.01 ✓ | 16.78 ✓ |
| Type=Primary, State=Pressed, Destructive=False | root | text 4.5:1 | `on-interactive/primary` on `interactive/primary/pressed` | 8.04 ✓ | 17.60 ✓ | **2.57 ✗** | 13.12 ✓ | 8.98 ✓ | 7.38 ✓ |
| Type=Primary, State=Pressed, Destructive=True | root | text 4.5:1 | `on-danger/primary` on `interactive/danger/pressed` | 10.79 ✓ | 8.04 ✓ | 10.79 ✓ | 8.04 ✓ | 10.79 ✓ | 8.04 ✓ |
| Type=Primary, State=Disabled, Destructive=False | root | text 4.5:1 | `neutral/tertiary` on `interactive/disabled` | 4.46 exempt | 4.50 exempt | 4.46 exempt | 4.50 exempt | 4.46 exempt | 4.50 exempt |
| Type=Primary, State=Disabled, Destructive=True | root | text 4.5:1 | `neutral/tertiary` on `interactive/disabled` | 4.46 exempt | 4.50 exempt | 4.46 exempt | 4.50 exempt | 4.46 exempt | 4.50 exempt |
| Type=Secondary, State=Default, Destructive=False | root | text 4.5:1 | `neutral/primary` on `interactive/secondary/default` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| Type=Secondary, State=Hover, Destructive=False | root | text 4.5:1 | `neutral/primary` on `interactive/secondary/hover` | 19.58 ✓ | 16.78 ✓ | 19.58 ✓ | 16.78 ✓ | 19.58 ✓ | 16.78 ✓ |
| Type=Secondary, State=Pressed, Destructive=False | root | text 4.5:1 | `neutral/primary` on `interactive/secondary/pressed` | 18.66 ✓ | 8.04 ✓ | 18.66 ✓ | 8.04 ✓ | 18.66 ✓ | 8.04 ✓ |
| Type=Secondary, State=Disabled, Destructive=False | root | text 4.5:1 | `neutral/tertiary` on `interactive/disabled` | 4.46 exempt | 4.50 exempt | 4.46 exempt | 4.50 exempt | 4.46 exempt | 4.50 exempt |
| Type=Ghost, State=Default, Destructive=False | root | text 4.5:1 | `interactive/default` on `interactive/subtle/default` | 20.09 ✓ | 20.09 ✓ | 7.80 ✓ | 13.12 ✓ | 5.69 ✓ | 7.38 ✓ |
| Type=Ghost, State=Default, Destructive=True | root | text 4.5:1 | `interactive/danger/default` on `interactive/danger-subtle/default` | 9.01 ✓ | 7.57 ✓ | 9.01 ✓ | 7.57 ✓ | 9.01 ✓ | 7.57 ✓ |
| Type=Ghost, State=Hover, Destructive=False | root | text 4.5:1 | `interactive/hover` on `interactive/subtle/hover` | 16.13 ✓ | 16.33 ✓ | 10.28 ✓ | 13.22 ✓ | 6.11 ✓ | 9.75 ✓ |
| Type=Ghost, State=Hover, Destructive=True | root | text 4.5:1 | `interactive/danger/hover` on `interactive/danger-subtle/hover` | 9.38 ✓ | 12.55 ✓ | 9.38 ✓ | 12.55 ✓ | 9.38 ✓ | 12.55 ✓ |
| Type=Ghost, State=Pressed, Destructive=False | root | text 4.5:1 | `interactive/pressed` on `interactive/subtle/pressed` | 14.30 ✓ | 13.90 ✓ | 11.43 ✓ | 13.36 ✓ | 7.14 ✓ | 12.00 ✓ |
| Type=Ghost, State=Pressed, Destructive=True | root | text 4.5:1 | `interactive/danger/pressed` on `interactive/danger-subtle/pressed` | 11.52 ✓ | 14.49 ✓ | 11.52 ✓ | 14.49 ✓ | 11.52 ✓ | 14.49 ✓ |
| Type=Ghost, State=Disabled, Destructive=False | root | text 4.5:1 | `neutral/tertiary` on `interactive/subtle/default` | 4.46 exempt | 4.50 exempt | 4.46 exempt | 4.50 exempt | 4.46 exempt | 4.50 exempt |
| Type=Ghost, State=Disabled, Destructive=True | root | text 4.5:1 | `interactive/disabled` on `interactive/danger-subtle/default` | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt |
| Type=Outline, State=Default, Destructive=False | root | text 4.5:1 | `interactive/default` on `interactive/subtle/default` | 20.09 ✓ | 20.09 ✓ | 7.80 ✓ | 13.12 ✓ | 5.69 ✓ | 7.38 ✓ |
| Type=Outline, State=Hover, Destructive=False | root | text 4.5:1 | `interactive/hover` on `interactive/subtle/hover` | 16.13 ✓ | 16.33 ✓ | 10.28 ✓ | 13.22 ✓ | 6.11 ✓ | 9.75 ✓ |
| Type=Outline, State=Pressed, Destructive=False | root | text 4.5:1 | `interactive/pressed` on `interactive/subtle/pressed` | 14.30 ✓ | 13.90 ✓ | 11.43 ✓ | 13.36 ✓ | 7.14 ✓ | 12.00 ✓ |
| Type=Outline, State=Disabled, Destructive=False | root | text 4.5:1 | `neutral/tertiary` on `interactive/subtle/default` | 4.46 exempt | 4.50 exempt | 4.46 exempt | 4.50 exempt | 4.46 exempt | 4.50 exempt |

### Icon Button

| Variant | Part | Kind | Foreground on background | Default Light | Default Dark | Gold Light | Gold Dark | Violet Light | Violet Dark |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Type=Primary, State=Default, Destructive=False | root | icon 3:1 | `on-interactive/primary` on `interactive/primary/default` | 20.09 ✓ | 20.09 ✓ | 10.47 ✓ | 3.35 ✓ | 5.69 ✓ | 3.52 ✓ |
| Type=Primary, State=Default, Destructive=True | root | icon 3:1 | `on-danger/primary` on `interactive/danger/default` | 5.13 ✓ | 20.09 ✓ | 5.13 ✓ | 20.09 ✓ | 5.13 ✓ | 20.09 ✓ |
| Type=Primary, State=Hover, Destructive=False | root | icon 3:1 | `on-interactive/primary` on `interactive/primary/hover` | 16.78 ✓ | 18.66 ✓ | 3.35 ✓ | 10.47 ✓ | 7.10 ✓ | 4.74 ✓ |
| Type=Primary, State=Hover, Destructive=True | root | icon 3:1 | `on-danger/primary` on `interactive/danger/hover` | 9.01 ✓ | 16.78 ✓ | 9.01 ✓ | 16.78 ✓ | 9.01 ✓ | 16.78 ✓ |
| Type=Primary, State=Pressed, Destructive=False | root | icon 3:1 | `on-interactive/primary` on `interactive/primary/pressed` | 8.04 ✓ | 17.60 ✓ | **2.57 ✗** | 13.12 ✓ | 8.98 ✓ | 7.38 ✓ |
| Type=Primary, State=Pressed, Destructive=True | root | icon 3:1 | `on-danger/primary` on `interactive/danger/pressed` | 10.79 ✓ | 8.04 ✓ | 10.79 ✓ | 8.04 ✓ | 10.79 ✓ | 8.04 ✓ |
| Type=Primary, State=Disabled, Destructive=False | root | icon 3:1 | `neutral/tertiary` on `interactive/disabled` | 4.46 exempt | 4.50 exempt | 4.46 exempt | 4.50 exempt | 4.46 exempt | 4.50 exempt |
| Type=Primary, State=Disabled, Destructive=True | root | icon 3:1 | `neutral/tertiary` on `interactive/disabled` | 4.46 exempt | 4.50 exempt | 4.46 exempt | 4.50 exempt | 4.46 exempt | 4.50 exempt |
| Type=Secondary, State=Default, Destructive=False | root | icon 3:1 | `neutral/primary` on `interactive/secondary/default` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| Type=Secondary, State=Hover, Destructive=False | root | icon 3:1 | `neutral/primary` on `interactive/secondary/hover` | 19.58 ✓ | 16.78 ✓ | 19.58 ✓ | 16.78 ✓ | 19.58 ✓ | 16.78 ✓ |
| Type=Secondary, State=Pressed, Destructive=False | root | icon 3:1 | `neutral/primary` on `interactive/secondary/pressed` | 18.66 ✓ | 8.04 ✓ | 18.66 ✓ | 8.04 ✓ | 18.66 ✓ | 8.04 ✓ |
| Type=Secondary, State=Disabled, Destructive=False | root | icon 3:1 | `neutral/tertiary` on `interactive/disabled` | 4.46 exempt | 4.50 exempt | 4.46 exempt | 4.50 exempt | 4.46 exempt | 4.50 exempt |
| Type=Ghost, State=Default, Destructive=False | root | icon 3:1 | `interactive/default` on `interactive/subtle/default` | 20.09 ✓ | 20.09 ✓ | 7.80 ✓ | 13.12 ✓ | 5.69 ✓ | 7.38 ✓ |
| Type=Ghost, State=Default, Destructive=True | root | icon 3:1 | `interactive/danger/default` on `interactive/danger-subtle/default` | 9.01 ✓ | 7.57 ✓ | 9.01 ✓ | 7.57 ✓ | 9.01 ✓ | 7.57 ✓ |
| Type=Ghost, State=Hover, Destructive=False | root | icon 3:1 | `interactive/hover` on `interactive/subtle/hover` | 16.13 ✓ | 16.33 ✓ | 10.28 ✓ | 13.22 ✓ | 6.11 ✓ | 9.75 ✓ |
| Type=Ghost, State=Hover, Destructive=True | root | icon 3:1 | `interactive/danger/hover` on `interactive/danger-subtle/hover` | 9.38 ✓ | 12.55 ✓ | 9.38 ✓ | 12.55 ✓ | 9.38 ✓ | 12.55 ✓ |
| Type=Ghost, State=Pressed, Destructive=False | root | icon 3:1 | `interactive/pressed` on `interactive/subtle/pressed` | 14.30 ✓ | 13.90 ✓ | 11.43 ✓ | 13.36 ✓ | 7.14 ✓ | 12.00 ✓ |
| Type=Ghost, State=Pressed, Destructive=True | root | icon 3:1 | `interactive/danger/pressed` on `interactive/danger-subtle/pressed` | 11.52 ✓ | 14.49 ✓ | 11.52 ✓ | 14.49 ✓ | 11.52 ✓ | 14.49 ✓ |
| Type=Ghost, State=Disabled, Destructive=False | root | icon 3:1 | `neutral/tertiary` on `interactive/subtle/default` | 4.46 exempt | 4.50 exempt | 4.46 exempt | 4.50 exempt | 4.46 exempt | 4.50 exempt |
| Type=Ghost, State=Disabled, Destructive=True | root | icon 3:1 | `interactive/disabled` on `interactive/danger-subtle/default` | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt |
| Type=Outline, State=Default, Destructive=False | root | icon 3:1 | `interactive/default` on `interactive/subtle/default` | 20.09 ✓ | 20.09 ✓ | 7.80 ✓ | 13.12 ✓ | 5.69 ✓ | 7.38 ✓ |
| Type=Outline, State=Hover, Destructive=False | root | icon 3:1 | `interactive/hover` on `interactive/subtle/hover` | 16.13 ✓ | 16.33 ✓ | 10.28 ✓ | 13.22 ✓ | 6.11 ✓ | 9.75 ✓ |
| Type=Outline, State=Pressed, Destructive=False | root | icon 3:1 | `interactive/pressed` on `interactive/subtle/pressed` | 14.30 ✓ | 13.90 ✓ | 11.43 ✓ | 13.36 ✓ | 7.14 ✓ | 12.00 ✓ |
| Type=Outline, State=Disabled, Destructive=False | root | icon 3:1 | `neutral/tertiary` on `interactive/subtle/default` | 4.46 exempt | 4.50 exempt | 4.46 exempt | 4.50 exempt | 4.46 exempt | 4.50 exempt |

### Checkbox

| Variant | Part | Kind | Foreground on background | Default Light | Default Dark | Gold Light | Gold Dark | Violet Light | Violet Dark |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| State=Default | label | text 4.5:1 | `neutral/primary` on `surface/low (page)` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| State=Hover | label | text 4.5:1 | `neutral/primary` on `surface/low (page)` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| State=Pressed | label | text 4.5:1 | `neutral/primary` on `surface/low (page)` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| State=Disabled | label | text 4.5:1 | `interactive/disabled` on `surface/low (page)` | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt |
| Checked=True, State=Default | indicator | icon 3:1 | `on-accent/primary` on `accent/default` | 20.09 ✓ | 20.09 ✓ | 10.47 ✓ | 3.35 ✓ | 5.69 ✓ | 3.52 ✓ |
| Checked=True, State=Hover | indicator | icon 3:1 | `on-accent/primary` on `accent/hover` | 16.78 ✓ | 18.66 ✓ | 3.35 ✓ | 10.47 ✓ | 7.10 ✓ | 4.74 ✓ |
| Checked=True, State=Pressed | indicator | icon 3:1 | `on-accent/primary` on `accent/pressed` | 8.04 ✓ | 17.60 ✓ | **2.57 ✗** | 13.12 ✓ | 8.98 ✓ | 7.38 ✓ |
| Checked=True, State=Disabled | indicator | icon 3:1 | `neutral/tertiary` on `interactive/disabled` | 4.46 exempt | 4.50 exempt | 4.46 exempt | 4.50 exempt | 4.46 exempt | 4.50 exempt |
| Checked=Indeterminate, State=Default | indicator | icon 3:1 | `on-accent/primary` on `accent/default` | 20.09 ✓ | 20.09 ✓ | 10.47 ✓ | 3.35 ✓ | 5.69 ✓ | 3.52 ✓ |
| Checked=Indeterminate, State=Hover | indicator | icon 3:1 | `on-accent/primary` on `accent/hover` | 16.78 ✓ | 18.66 ✓ | 3.35 ✓ | 10.47 ✓ | 7.10 ✓ | 4.74 ✓ |
| Checked=Indeterminate, State=Pressed | indicator | icon 3:1 | `on-accent/primary` on `accent/pressed` | 8.04 ✓ | 17.60 ✓ | **2.57 ✗** | 13.12 ✓ | 8.98 ✓ | 7.38 ✓ |
| Checked=Indeterminate, State=Disabled | indicator | icon 3:1 | `neutral/tertiary` on `interactive/disabled` | 4.46 exempt | 4.50 exempt | 4.46 exempt | 4.50 exempt | 4.46 exempt | 4.50 exempt |

### Input

| Variant | Part | Kind | Foreground on background | Default Light | Default Dark | Gold Light | Gold Dark | Violet Light | Violet Dark |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| State=Default | icon | icon 3:1 | `neutral/secondary` on `neutral/primary` | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ |
| State=Default, Filled=False | value | text 4.5:1 | `neutral/secondary` on `neutral/primary` | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ |
| State=Default, Filled=True | value | text 4.5:1 | `neutral/primary` on `neutral/primary` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| State=Hover | icon | icon 3:1 | `neutral/secondary` on `neutral/primary` | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ |
| State=Hover, Filled=False | value | text 4.5:1 | `neutral/secondary` on `neutral/primary` | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ |
| State=Hover, Filled=True | value | text 4.5:1 | `neutral/primary` on `neutral/primary` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| State=Focused | icon | icon 3:1 | `neutral/secondary` on `neutral/primary` | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ |
| State=Focused, Filled=False | value | text 4.5:1 | `neutral/secondary` on `neutral/primary` | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ |
| State=Focused, Filled=True | value | text 4.5:1 | `neutral/primary` on `neutral/primary` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| State=Disabled | icon | icon 3:1 | `interactive/disabled` on `interactive/disabled` | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt |
| State=Disabled, Filled=False | value | text 4.5:1 | `interactive/disabled` on `interactive/disabled` | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt |
| State=Disabled, Filled=True | value | text 4.5:1 | `interactive/disabled` on `interactive/disabled` | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt |

### Field

| Variant | Part | Kind | Foreground on background | Default Light | Default Dark | Gold Light | Gold Dark | Violet Light | Violet Dark |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| — | label | text 4.5:1 | `neutral/primary` on `surface/low (page)` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| Invalid=False | description | text 4.5:1 | `neutral/secondary` on `surface/low (page)` | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ |
| Invalid=True | error | text 4.5:1 | `error` on `surface/low (page)` | 9.01 ✓ | 7.57 ✓ | 9.01 ✓ | 7.57 ✓ | 9.01 ✓ | 7.57 ✓ |

### Menu Item

| Variant | Part | Kind | Foreground on background | Default Light | Default Dark | Gold Light | Gold Dark | Violet Light | Violet Dark |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| State=Default | label | text 4.5:1 | `neutral/primary` on `interactive/subtle/default` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| State=Highlighted | label | text 4.5:1 | `neutral/primary` on `interactive/subtle/hover` | 16.13 ✓ | 16.33 ✓ | 17.20 ✓ | 17.43 ✓ | 17.30 ✓ | 18.01 ✓ |
| State=Disabled | label | text 4.5:1 | `interactive/disabled` on `interactive/subtle/default` | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt |
| Type=Checkbox, State=Default, Checked=True | icon | icon 3:1 | `neutral/primary` on `interactive/subtle/default` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| Type=Checkbox, State=Highlighted, Checked=True | icon | icon 3:1 | `neutral/primary` on `interactive/subtle/hover` | 16.13 ✓ | 16.33 ✓ | 17.20 ✓ | 17.43 ✓ | 17.30 ✓ | 18.01 ✓ |
| Type=Checkbox, State=Disabled, Checked=True | icon | icon 3:1 | `interactive/disabled` on `interactive/subtle/default` | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt |
| Type=Radio, State=Default, Checked=True | icon | icon 3:1 | `neutral/primary` on `interactive/subtle/default` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| Type=Radio, State=Highlighted, Checked=True | icon | icon 3:1 | `neutral/primary` on `interactive/subtle/hover` | 16.13 ✓ | 16.33 ✓ | 17.20 ✓ | 17.43 ✓ | 17.30 ✓ | 18.01 ✓ |
| Type=Radio, State=Disabled, Checked=True | icon | icon 3:1 | `interactive/disabled` on `interactive/subtle/default` | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt |
| Type=Submenu, State=Default | caret | icon 3:1 | `neutral/secondary` on `interactive/subtle/default` | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ |
| Type=Submenu, State=Highlighted | caret | icon 3:1 | `neutral/secondary` on `interactive/subtle/hover` | 6.46 ✓ | 8.02 ✓ | 6.88 ✓ | 8.55 ✓ | 6.92 ✓ | 8.84 ✓ |
| Type=Submenu, State=Disabled | caret | icon 3:1 | `interactive/disabled` on `interactive/subtle/default` | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt |

### Menu Group Label

| Variant | Part | Kind | Foreground on background | Default Light | Default Dark | Gold Light | Gold Dark | Violet Light | Violet Dark |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| — | text | text 4.5:1 | `neutral/secondary` on `surface/low (page)` | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ |

### Switch

| Variant | Part | Kind | Foreground on background | Default Light | Default Dark | Gold Light | Gold Dark | Violet Light | Violet Dark |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| State=Default | label | text 4.5:1 | `neutral/primary` on `surface/low (page)` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| State=Hover | label | text 4.5:1 | `neutral/primary` on `surface/low (page)` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| State=Pressed | label | text 4.5:1 | `neutral/primary` on `surface/low (page)` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| State=Disabled | label | text 4.5:1 | `interactive/disabled` on `surface/low (page)` | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt |

### Radio

| Variant | Part | Kind | Foreground on background | Default Light | Default Dark | Gold Light | Gold Dark | Violet Light | Violet Dark |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| State=Default | label | text 4.5:1 | `neutral/primary` on `surface/low (page)` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| State=Hover | label | text 4.5:1 | `neutral/primary` on `surface/low (page)` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| State=Pressed | label | text 4.5:1 | `neutral/primary` on `surface/low (page)` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| State=Disabled | label | text 4.5:1 | `interactive/disabled` on `surface/low (page)` | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt |

### Radio Group

| Variant | Part | Kind | Foreground on background | Default Light | Default Dark | Gold Light | Gold Dark | Violet Light | Violet Dark |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| — | label | text 4.5:1 | `neutral/primary` on `surface/low (page)` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |

### Checkbox Group

| Variant | Part | Kind | Foreground on background | Default Light | Default Dark | Gold Light | Gold Dark | Violet Light | Violet Dark |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| — | label | text 4.5:1 | `neutral/primary` on `surface/low (page)` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |

### Toggle

| Variant | Part | Kind | Foreground on background | Default Light | Default Dark | Gold Light | Gold Dark | Violet Light | Violet Dark |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Selected=False, State=Default | root | icon 3:1 | `neutral/secondary` on `interactive/subtle/default` | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ |
| Selected=False, State=Hover | root | icon 3:1 | `neutral/primary` on `interactive/subtle/hover` | 16.13 ✓ | 16.33 ✓ | 17.20 ✓ | 17.43 ✓ | 17.30 ✓ | 18.01 ✓ |
| Selected=False, State=Pressed | root | icon 3:1 | `neutral/primary` on `interactive/subtle/pressed` | 14.30 ✓ | 13.90 ✓ | 15.94 ✓ | 15.55 ✓ | 15.99 ✓ | 16.66 ✓ |
| Selected=False, State=Disabled | root | icon 3:1 | `interactive/disabled` on `interactive/subtle/default` | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt |
| Selected=True, State=Default | root | icon 3:1 | `neutral/primary` on `interactive/subtle/selected` | 14.30 ✓ | 13.90 ✓ | 15.94 ✓ | 15.55 ✓ | 15.99 ✓ | 16.66 ✓ |
| Selected=True, State=Hover | root | icon 3:1 | `neutral/primary` on `interactive/subtle/selected` | 14.30 ✓ | 13.90 ✓ | 15.94 ✓ | 15.55 ✓ | 15.99 ✓ | 16.66 ✓ |
| Selected=True, State=Pressed | root | icon 3:1 | `neutral/primary` on `interactive/subtle/pressed` | 14.30 ✓ | 13.90 ✓ | 15.94 ✓ | 15.55 ✓ | 15.99 ✓ | 16.66 ✓ |
| Selected=True, State=Disabled | root | icon 3:1 | `interactive/disabled` on `interactive/subtle/selected` | 3.17 exempt | 4.80 exempt | 3.54 exempt | 5.37 exempt | 3.55 exempt | 5.76 exempt |

### Number Field

| Variant | Part | Kind | Foreground on background | Default Light | Default Dark | Gold Light | Gold Dark | Violet Light | Violet Dark |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| State=Default | decrement-icon | icon 3:1 | `neutral/primary` on `interactive/subtle/default over neutral/primary` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| State=Default · code, decrement :hover | decrement-icon | icon 3:1 | `neutral/primary` on `interactive/subtle/hover over neutral/primary` | 16.13 ✓ | 16.33 ✓ | 17.20 ✓ | 17.43 ✓ | 17.30 ✓ | 18.01 ✓ |
| State=Default · code, decrement :active | decrement-icon | icon 3:1 | `neutral/primary` on `interactive/subtle/pressed over neutral/primary` | 14.30 ✓ | 13.90 ✓ | 15.94 ✓ | 15.55 ✓ | 15.99 ✓ | 16.66 ✓ |
| State=Default | value | text 4.5:1 | `neutral/primary` on `neutral/primary` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| State=Default | increment-icon | icon 3:1 | `neutral/primary` on `interactive/subtle/default over neutral/primary` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| State=Default · code, increment :hover | increment-icon | icon 3:1 | `neutral/primary` on `interactive/subtle/hover over neutral/primary` | 16.13 ✓ | 16.33 ✓ | 17.20 ✓ | 17.43 ✓ | 17.30 ✓ | 18.01 ✓ |
| State=Default · code, increment :active | increment-icon | icon 3:1 | `neutral/primary` on `interactive/subtle/pressed over neutral/primary` | 14.30 ✓ | 13.90 ✓ | 15.94 ✓ | 15.55 ✓ | 15.99 ✓ | 16.66 ✓ |
| State=Hover | decrement-icon | icon 3:1 | `neutral/primary` on `interactive/subtle/default over neutral/primary` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| State=Hover · code, decrement :hover | decrement-icon | icon 3:1 | `neutral/primary` on `interactive/subtle/hover over neutral/primary` | 16.13 ✓ | 16.33 ✓ | 17.20 ✓ | 17.43 ✓ | 17.30 ✓ | 18.01 ✓ |
| State=Hover · code, decrement :active | decrement-icon | icon 3:1 | `neutral/primary` on `interactive/subtle/pressed over neutral/primary` | 14.30 ✓ | 13.90 ✓ | 15.94 ✓ | 15.55 ✓ | 15.99 ✓ | 16.66 ✓ |
| State=Hover | value | text 4.5:1 | `neutral/primary` on `neutral/primary` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| State=Hover | increment-icon | icon 3:1 | `neutral/primary` on `interactive/subtle/default over neutral/primary` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| State=Hover · code, increment :hover | increment-icon | icon 3:1 | `neutral/primary` on `interactive/subtle/hover over neutral/primary` | 16.13 ✓ | 16.33 ✓ | 17.20 ✓ | 17.43 ✓ | 17.30 ✓ | 18.01 ✓ |
| State=Hover · code, increment :active | increment-icon | icon 3:1 | `neutral/primary` on `interactive/subtle/pressed over neutral/primary` | 14.30 ✓ | 13.90 ✓ | 15.94 ✓ | 15.55 ✓ | 15.99 ✓ | 16.66 ✓ |
| State=Focused | decrement-icon | icon 3:1 | `neutral/primary` on `interactive/subtle/default over neutral/primary` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| State=Focused · code, decrement :hover | decrement-icon | icon 3:1 | `neutral/primary` on `interactive/subtle/hover over neutral/primary` | 16.13 ✓ | 16.33 ✓ | 17.20 ✓ | 17.43 ✓ | 17.30 ✓ | 18.01 ✓ |
| State=Focused · code, decrement :active | decrement-icon | icon 3:1 | `neutral/primary` on `interactive/subtle/pressed over neutral/primary` | 14.30 ✓ | 13.90 ✓ | 15.94 ✓ | 15.55 ✓ | 15.99 ✓ | 16.66 ✓ |
| State=Focused | value | text 4.5:1 | `neutral/primary` on `neutral/primary` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| State=Focused | increment-icon | icon 3:1 | `neutral/primary` on `interactive/subtle/default over neutral/primary` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| State=Focused · code, increment :hover | increment-icon | icon 3:1 | `neutral/primary` on `interactive/subtle/hover over neutral/primary` | 16.13 ✓ | 16.33 ✓ | 17.20 ✓ | 17.43 ✓ | 17.30 ✓ | 18.01 ✓ |
| State=Focused · code, increment :active | increment-icon | icon 3:1 | `neutral/primary` on `interactive/subtle/pressed over neutral/primary` | 14.30 ✓ | 13.90 ✓ | 15.94 ✓ | 15.55 ✓ | 15.99 ✓ | 16.66 ✓ |
| State=Disabled | decrement-icon | icon 3:1 | `interactive/disabled` on `interactive/subtle/default over interactive/disabled` | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt |
| State=Disabled | value | text 4.5:1 | `interactive/disabled` on `interactive/disabled` | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt |
| State=Disabled | increment-icon | icon 3:1 | `interactive/disabled` on `interactive/subtle/default over interactive/disabled` | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt |

### OTP Slot

| Variant | Part | Kind | Foreground on background | Default Light | Default Dark | Gold Light | Gold Dark | Violet Light | Violet Dark |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| State=Default | value | text 4.5:1 | `neutral/primary` on `neutral/primary` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| State=Hover | value | text 4.5:1 | `neutral/primary` on `neutral/primary` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| State=Focused | value | text 4.5:1 | `neutral/primary` on `neutral/primary` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| State=Disabled | value | text 4.5:1 | `interactive/disabled` on `interactive/disabled` | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt |

### Fieldset

| Variant | Part | Kind | Foreground on background | Default Light | Default Dark | Gold Light | Gold Dark | Violet Light | Violet Dark |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| — | legend | text 4.5:1 | `neutral/primary` on `surface/low (page)` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| Size=Large | legend | large text 3:1 | `neutral/primary` on `surface/low (page)` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |

### Popover

| Variant | Part | Kind | Foreground on background | Default Light | Default Dark | Gold Light | Gold Dark | Violet Light | Violet Dark |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| — | title | text 4.5:1 | `neutral/primary` on `surface/medium` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| — | description | text 4.5:1 | `neutral/secondary` on `surface/medium` | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ |

### Tooltip

| Variant | Part | Kind | Foreground on background | Default Light | Default Dark | Gold Light | Gold Dark | Violet Light | Violet Dark |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| — | label | text 4.5:1 | `neutral/primary` on `surface/medium` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |

### Preview Card

| Variant | Part | Kind | Foreground on background | Default Light | Default Dark | Gold Light | Gold Dark | Violet Light | Violet Dark |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| — | title | text 4.5:1 | `neutral/primary` on `surface/medium` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| — | summary | text 4.5:1 | `neutral/primary` on `surface/medium` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |

### Option

| Variant | Part | Kind | Foreground on background | Default Light | Default Dark | Gold Light | Gold Dark | Violet Light | Violet Dark |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| State=Default | label | text 4.5:1 | `neutral/primary` on `interactive/subtle/default` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| State=Default, Selected=True | icon | icon 3:1 | `neutral/primary` on `interactive/subtle/default` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| State=Highlighted | label | text 4.5:1 | `neutral/primary` on `interactive/subtle/hover` | 16.13 ✓ | 16.33 ✓ | 17.20 ✓ | 17.43 ✓ | 17.30 ✓ | 18.01 ✓ |
| State=Highlighted, Selected=True | icon | icon 3:1 | `neutral/primary` on `interactive/subtle/hover` | 16.13 ✓ | 16.33 ✓ | 17.20 ✓ | 17.43 ✓ | 17.30 ✓ | 18.01 ✓ |
| State=Disabled | label | text 4.5:1 | `interactive/disabled` on `interactive/subtle/default` | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt |
| State=Disabled, Selected=True | icon | icon 3:1 | `interactive/disabled` on `interactive/subtle/default` | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt |

### Listbox

| Variant | Part | Kind | Foreground on background | Default Light | Default Dark | Gold Light | Gold Dark | Violet Light | Violet Dark |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| — | empty-text | text 4.5:1 | `neutral/secondary` on `surface/medium` | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ |

### Select

| Variant | Part | Kind | Foreground on background | Default Light | Default Dark | Gold Light | Gold Dark | Violet Light | Violet Dark |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| State=Default, Filled=False | value | text 4.5:1 | `neutral/secondary` on `neutral/primary` | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ |
| State=Default | icon | icon 3:1 | `neutral/secondary` on `neutral/primary` | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ |
| State=Default, Filled=True | value | text 4.5:1 | `neutral/primary` on `neutral/primary` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| State=Hover, Filled=False | value | text 4.5:1 | `neutral/secondary` on `neutral/primary` | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ |
| State=Hover | icon | icon 3:1 | `neutral/secondary` on `neutral/primary` | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ |
| State=Hover, Filled=True | value | text 4.5:1 | `neutral/primary` on `neutral/primary` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| State=Focused, Filled=False | value | text 4.5:1 | `neutral/secondary` on `neutral/primary` | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ |
| State=Focused | icon | icon 3:1 | `neutral/secondary` on `neutral/primary` | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ |
| State=Focused, Filled=True | value | text 4.5:1 | `neutral/primary` on `neutral/primary` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| State=Disabled, Filled=False | value | text 4.5:1 | `interactive/disabled` on `interactive/disabled` | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt |
| State=Disabled | icon | icon 3:1 | `interactive/disabled` on `interactive/disabled` | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt |
| State=Disabled, Filled=True | value | text 4.5:1 | `interactive/disabled` on `interactive/disabled` | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt |

### Combobox

| Variant | Part | Kind | Foreground on background | Default Light | Default Dark | Gold Light | Gold Dark | Violet Light | Violet Dark |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| State=Default, Filled=False | value | text 4.5:1 | `neutral/secondary` on `neutral/primary` | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ |
| State=Default | trigger | icon 3:1 | `neutral/secondary` on `neutral/primary` | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ |
| State=Default, Filled=True | value | text 4.5:1 | `neutral/primary` on `neutral/primary` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| State=Default, Filled=True | clear | icon 3:1 | `neutral/secondary` on `neutral/primary` | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ |
| State=Hover, Filled=False | value | text 4.5:1 | `neutral/secondary` on `neutral/primary` | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ |
| State=Hover | trigger | icon 3:1 | `neutral/secondary` on `neutral/primary` | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ |
| State=Hover, Filled=True | value | text 4.5:1 | `neutral/primary` on `neutral/primary` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| State=Hover, Filled=True | clear | icon 3:1 | `neutral/secondary` on `neutral/primary` | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ |
| State=Focused, Filled=False | value | text 4.5:1 | `neutral/secondary` on `neutral/primary` | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ |
| State=Focused | trigger | icon 3:1 | `neutral/secondary` on `neutral/primary` | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ |
| State=Focused, Filled=True | value | text 4.5:1 | `neutral/primary` on `neutral/primary` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| State=Focused, Filled=True | clear | icon 3:1 | `neutral/secondary` on `neutral/primary` | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ |
| State=Disabled, Filled=False | value | text 4.5:1 | `interactive/disabled` on `interactive/disabled` | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt |
| State=Disabled | trigger | icon 3:1 | `interactive/disabled` on `interactive/disabled` | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt |
| State=Disabled, Filled=True | value | text 4.5:1 | `interactive/disabled` on `interactive/disabled` | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt |
| State=Disabled, Filled=True | clear | icon 3:1 | `interactive/disabled` on `interactive/disabled` | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt |

### Menubar Item

| Variant | Part | Kind | Foreground on background | Default Light | Default Dark | Gold Light | Gold Dark | Violet Light | Violet Dark |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| State=Default | label | text 4.5:1 | `neutral/primary` on `interactive/subtle/default` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| State=Hover | label | text 4.5:1 | `neutral/primary` on `interactive/subtle/hover` | 16.13 ✓ | 16.33 ✓ | 17.20 ✓ | 17.43 ✓ | 17.30 ✓ | 18.01 ✓ |
| State=Open | label | text 4.5:1 | `neutral/primary` on `interactive/subtle/selected` | 14.30 ✓ | 13.90 ✓ | 15.94 ✓ | 15.55 ✓ | 15.99 ✓ | 16.66 ✓ |
| State=Disabled | label | text 4.5:1 | `interactive/disabled` on `interactive/subtle/default` | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt |

### Navigation Menu Item

| Variant | Part | Kind | Foreground on background | Default Light | Default Dark | Gold Light | Gold Dark | Violet Light | Violet Dark |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| State=Default, Active=False | icon | icon 3:1 | `neutral/primary` on `interactive/subtle/default` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| State=Default, Active=False | label | text 4.5:1 | `neutral/primary` on `interactive/subtle/default` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| State=Default, Active=True | icon | icon 3:1 | `neutral/primary` on `interactive/subtle/selected` | 14.30 ✓ | 13.90 ✓ | 15.94 ✓ | 15.55 ✓ | 15.99 ✓ | 16.66 ✓ |
| State=Default, Active=True | label | text 4.5:1 | `neutral/primary` on `interactive/subtle/selected` | 14.30 ✓ | 13.90 ✓ | 15.94 ✓ | 15.55 ✓ | 15.99 ✓ | 16.66 ✓ |
| State=Hover, Active=False | icon | icon 3:1 | `neutral/primary` on `interactive/subtle/hover` | 16.13 ✓ | 16.33 ✓ | 17.20 ✓ | 17.43 ✓ | 17.30 ✓ | 18.01 ✓ |
| State=Hover, Active=False | label | text 4.5:1 | `neutral/primary` on `interactive/subtle/hover` | 16.13 ✓ | 16.33 ✓ | 17.20 ✓ | 17.43 ✓ | 17.30 ✓ | 18.01 ✓ |
| State=Hover, Active=True | icon | icon 3:1 | `neutral/primary` on `interactive/subtle/hover` | 16.13 ✓ | 16.33 ✓ | 17.20 ✓ | 17.43 ✓ | 17.30 ✓ | 18.01 ✓ |
| State=Hover, Active=True | label | text 4.5:1 | `neutral/primary` on `interactive/subtle/hover` | 16.13 ✓ | 16.33 ✓ | 17.20 ✓ | 17.43 ✓ | 17.30 ✓ | 18.01 ✓ |
| Type=Trigger, State=Default, Active=False | caret | icon 3:1 | `neutral/secondary` on `interactive/subtle/default` | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ |
| Type=Trigger, State=Default, Active=True | caret | icon 3:1 | `neutral/secondary` on `interactive/subtle/selected` | 5.72 ✓ | 6.82 ✓ | 6.38 ✓ | 7.63 ✓ | 6.40 ✓ | 8.18 ✓ |
| Type=Trigger, State=Hover, Active=False | caret | icon 3:1 | `neutral/secondary` on `interactive/subtle/hover` | 6.46 ✓ | 8.02 ✓ | 6.88 ✓ | 8.55 ✓ | 6.92 ✓ | 8.84 ✓ |
| Type=Trigger, State=Hover, Active=True | caret | icon 3:1 | `neutral/secondary` on `interactive/subtle/hover` | 6.46 ✓ | 8.02 ✓ | 6.88 ✓ | 8.55 ✓ | 6.92 ✓ | 8.84 ✓ |

### Navigation Menu Link

| Variant | Part | Kind | Foreground on background | Default Light | Default Dark | Gold Light | Gold Dark | Violet Light | Violet Dark |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| State=Default | title | text 4.5:1 | `neutral/primary` on `interactive/subtle/default` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| State=Default | description | text 4.5:1 | `neutral/secondary` on `interactive/subtle/default` | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ |
| State=Hover | title | text 4.5:1 | `neutral/primary` on `interactive/subtle/hover` | 16.13 ✓ | 16.33 ✓ | 17.20 ✓ | 17.43 ✓ | 17.30 ✓ | 18.01 ✓ |
| State=Hover | description | text 4.5:1 | `neutral/secondary` on `interactive/subtle/hover` | 6.46 ✓ | 8.02 ✓ | 6.88 ✓ | 8.55 ✓ | 6.92 ✓ | 8.84 ✓ |

### Dialog

| Variant | Part | Kind | Foreground on background | Default Light | Default Dark | Gold Light | Gold Dark | Violet Light | Violet Dark |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| — | title | text 4.5:1 | `neutral/primary` on `surface/high` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| — | description | text 4.5:1 | `neutral/secondary` on `surface/high` | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ |

### Alert Dialog

| Variant | Part | Kind | Foreground on background | Default Light | Default Dark | Gold Light | Gold Dark | Violet Light | Violet Dark |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| — | title | text 4.5:1 | `neutral/primary` on `surface/high` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| — | description | text 4.5:1 | `neutral/secondary` on `surface/high` | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ |

### Drawer

| Variant | Part | Kind | Foreground on background | Default Light | Default Dark | Gold Light | Gold Dark | Violet Light | Violet Dark |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| — | title | text 4.5:1 | `neutral/primary` on `surface/high` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| — | description | text 4.5:1 | `neutral/secondary` on `surface/high` | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ |

### Toast

| Variant | Part | Kind | Foreground on background | Default Light | Default Dark | Gold Light | Gold Dark | Violet Light | Violet Dark |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Type=Neutral | icon | icon 3:1 | `neutral/secondary` on `surface/medium` | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ |
| Type=Neutral | title | text 4.5:1 | `neutral/primary` on `surface/medium` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| Type=Neutral | description | text 4.5:1 | `neutral/primary` on `surface/medium` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| Type=Success | icon | icon 3:1 | `success` on `success/subtle` | 7.99 ✓ | 10.50 ✓ | 7.99 ✓ | 10.50 ✓ | 7.99 ✓ | 10.50 ✓ |
| Type=Success | title | text 4.5:1 | `neutral/primary` on `success/subtle` | 19.19 ✓ | 16.58 ✓ | 19.19 ✓ | 16.58 ✓ | 19.19 ✓ | 16.58 ✓ |
| Type=Success | description | text 4.5:1 | `neutral/primary` on `success/subtle` | 19.19 ✓ | 16.58 ✓ | 19.19 ✓ | 16.58 ✓ | 19.19 ✓ | 16.58 ✓ |
| Type=Warning | icon | icon 3:1 | `warning` on `warning/subtle` | 7.54 ✓ | 13.01 ✓ | 7.54 ✓ | 13.01 ✓ | 7.54 ✓ | 13.01 ✓ |
| Type=Warning | title | text 4.5:1 | `neutral/primary` on `warning/subtle` | 19.43 ✓ | 17.16 ✓ | 19.43 ✓ | 17.16 ✓ | 19.43 ✓ | 17.16 ✓ |
| Type=Warning | description | text 4.5:1 | `neutral/primary` on `warning/subtle` | 19.43 ✓ | 17.16 ✓ | 19.43 ✓ | 17.16 ✓ | 19.43 ✓ | 17.16 ✓ |
| Type=Error | icon | icon 3:1 | `error` on `error/subtle` | 8.36 ✓ | 6.74 ✓ | 8.36 ✓ | 6.74 ✓ | 8.36 ✓ | 6.74 ✓ |
| Type=Error | title | text 4.5:1 | `neutral/primary` on `error/subtle` | 18.66 ✓ | 17.89 ✓ | 18.66 ✓ | 17.89 ✓ | 18.66 ✓ | 17.89 ✓ |
| Type=Error | description | text 4.5:1 | `neutral/primary` on `error/subtle` | 18.66 ✓ | 17.89 ✓ | 18.66 ✓ | 17.89 ✓ | 18.66 ✓ | 17.89 ✓ |

### Avatar

| Variant | Part | Kind | Foreground on background | Default Light | Default Dark | Gold Light | Gold Dark | Violet Light | Violet Dark |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Type=Initials | fallback | text 4.5:1 | `on-accent/primary` on `accent/selected` | 8.04 ✓ | 17.60 ✓ | **1.67 ✗** | 15.24 ✓ | 8.04 ✓ | 17.60 ✓ |

### Progress

| Variant | Part | Kind | Foreground on background | Default Light | Default Dark | Gold Light | Gold Dark | Violet Light | Violet Dark |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| — | label | text 4.5:1 | `neutral/primary` on `surface/low (page)` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| — | value | text 4.5:1 | `neutral/secondary` on `surface/low (page)` | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ |

### Meter

| Variant | Part | Kind | Foreground on background | Default Light | Default Dark | Gold Light | Gold Dark | Violet Light | Violet Dark |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| — | label | text 4.5:1 | `neutral/primary` on `surface/low (page)` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| — | value | text 4.5:1 | `neutral/secondary` on `surface/low (page)` | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ |

### Tab

| Variant | Part | Kind | Foreground on background | Default Light | Default Dark | Gold Light | Gold Dark | Violet Light | Violet Dark |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Selected=False, State=Default | label | text 4.5:1 | `neutral/secondary` on `surface/low (page)` | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ |
| Selected=False, State=Hover | label | text 4.5:1 | `neutral/primary` on `surface/low (page)` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| Selected=False, State=Disabled | label | text 4.5:1 | `interactive/disabled` on `surface/low (page)` | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt |
| Selected=True, State=Default · code | label | text 4.5:1 | `neutral/primary` on `surface/low (page)` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| Selected=True, State=Default · Figma | label | text 4.5:1 | `neutral/primary` on `neutral/primary` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| Selected=True, State=Hover · code | label | text 4.5:1 | `neutral/primary` on `surface/low (page)` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| Selected=True, State=Hover · Figma | label | text 4.5:1 | `neutral/primary` on `neutral/primary` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| Selected=True, State=Disabled · code | label | text 4.5:1 | `interactive/disabled` on `surface/low (page)` | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt |
| Selected=True, State=Disabled · Figma | label | text 4.5:1 | `interactive/disabled` on `neutral/primary` | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt |

### Tabs

| Variant | Part | Kind | Foreground on background | Default Light | Default Dark | Gold Light | Gold Dark | Violet Light | Violet Dark |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| — | text | text 4.5:1 | `neutral/primary` on `neutral/primary` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |

### Accordion Item

| Variant | Part | Kind | Foreground on background | Default Light | Default Dark | Gold Light | Gold Dark | Violet Light | Violet Dark |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| State=Default | label | text 4.5:1 | `neutral/primary` on `interactive/subtle/default` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| State=Default | icon | icon 3:1 | `neutral/primary` on `interactive/subtle/default` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| State=Hover | label | text 4.5:1 | `neutral/primary` on `interactive/subtle/hover` | 16.13 ✓ | 16.33 ✓ | 17.20 ✓ | 17.43 ✓ | 17.30 ✓ | 18.01 ✓ |
| State=Hover | icon | icon 3:1 | `neutral/primary` on `interactive/subtle/hover` | 16.13 ✓ | 16.33 ✓ | 17.20 ✓ | 17.43 ✓ | 17.30 ✓ | 18.01 ✓ |
| State=Disabled | label | text 4.5:1 | `interactive/disabled` on `interactive/subtle/default` | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt |
| State=Disabled | icon | icon 3:1 | `interactive/disabled` on `interactive/subtle/default` | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt |
| Open=True | text | text 4.5:1 | `neutral/secondary` on `surface/low (page)` | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ | 8.04 ✓ | 9.86 ✓ |
| Open=True, State=Disabled | text | text 4.5:1 | `neutral/secondary` on `surface/low (page)` | 8.04 exempt | 9.86 exempt | 8.04 exempt | 9.86 exempt | 8.04 exempt | 9.86 exempt |

### Collapsible

| Variant | Part | Kind | Foreground on background | Default Light | Default Dark | Gold Light | Gold Dark | Violet Light | Violet Dark |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| State=Default | label | text 4.5:1 | `neutral/primary` on `neutral/primary` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| State=Default | icon | icon 3:1 | `neutral/primary` on `neutral/primary` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| State=Hover | label | text 4.5:1 | `neutral/primary` on `interactive/subtle/hover` | 16.13 ✓ | 16.33 ✓ | 17.20 ✓ | 17.43 ✓ | 17.30 ✓ | 18.01 ✓ |
| State=Hover | icon | icon 3:1 | `neutral/primary` on `interactive/subtle/hover` | 16.13 ✓ | 16.33 ✓ | 17.20 ✓ | 17.43 ✓ | 17.30 ✓ | 18.01 ✓ |
| State=Pressed | label | text 4.5:1 | `neutral/primary` on `interactive/subtle/pressed` | 14.30 ✓ | 13.90 ✓ | 15.94 ✓ | 15.55 ✓ | 15.99 ✓ | 16.66 ✓ |
| State=Pressed | icon | icon 3:1 | `neutral/primary` on `interactive/subtle/pressed` | 14.30 ✓ | 13.90 ✓ | 15.94 ✓ | 15.55 ✓ | 15.99 ✓ | 16.66 ✓ |
| State=Disabled | label | text 4.5:1 | `interactive/disabled` on `neutral/primary` | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt |
| State=Disabled | icon | icon 3:1 | `interactive/disabled` on `neutral/primary` | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt | 4.46 exempt | 6.95 exempt |
| Open=True | text | text 4.5:1 | `neutral/primary` on `surface/low (page)` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
| Open=True, State=Disabled | text | text 4.5:1 | `neutral/primary` on `surface/low (page)` | 20.09 exempt | 20.09 exempt | 20.09 exempt | 20.09 exempt | 20.09 exempt | 20.09 exempt |

### Scroll Area

| Variant | Part | Kind | Foreground on background | Default Light | Default Dark | Gold Light | Gold Dark | Violet Light | Violet Dark |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| — | text | text 4.5:1 | `neutral/primary` on `neutral/primary` | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ | 20.09 ✓ |
