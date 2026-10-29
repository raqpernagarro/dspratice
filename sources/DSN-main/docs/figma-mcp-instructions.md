# Figma Code Connect — MCP instructions

Paste each block into **Code Connect → component → Add instructions for MCP**, then Save.
Sorted by Figma component name (same order as the Code Connect list). Accordion and Alert dialog are already done.
Source: generated from `ds-index.json` and each component's `*.spec.md`.

## Aspect ratio
`AspectRatio` · node `9647:51145`

```text
import { AspectRatio } from 'ds-ngr'

• Do not use as a general layout container for text, forms, or controls → use page and section layout (`AppShell` content area, `Card`) instead.
• Do not use for a user or organization identity picture → use `Avatar` instead; it owns the identity sizes and the initials fallback.
• Do not use for an attached file preview → use `FileThumbnail` / `AttachmentCard` instead.
• Avoid: Passing a number or `"16/9"` as `ratio` — the prop is a string union; see Props reference.
• Avoid: Repeating `width`, `height`, or `object-fit` on the child when `fit` is set — `fit` already sizes the child; see `fit` prop.
• Avoid: Passing an image and a caption as two children — wrap them in one child; see Composition rules.
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Attachment / Attachment card
`AttachmentCard` · node `4529:112526`

```text
import { AttachmentCard } from 'ds-ngr'

• Do not use for a scannable list of files with type, size, link and download → use `FileRow` instead
• Do not use for compact inline attachments in a composer → use `AttachmentChip` instead
• Do not use as a general content card → use `Card` instead
• Avoid: Shipping the "Title" / "Meta data" defaults — see Props reference.
• Avoid: `action="more"` with no menu — see Composition rules.
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Attachment / Attachment chip
`AttachmentChip` · node `4533:107444`

```text
import { AttachmentChip } from 'ds-ngr'

• Do not use as a file-picking form field → use `AttachmentField` (which renders this chip) instead
• Do not use for a list of files with type, size, link and download actions → use `FileRow` instead
• Do not use for a visual gallery of attachments → use `AttachmentCard` instead
• Avoid: Using chips as a file list with actions — see When NOT to use.
• Avoid: Shipping the default menu options — see Props reference.
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Avatar
`Avatar` · node `111:5684`

```text
import { Avatar } from 'ds-ngr'

• Do not use when the entity is a generic system process or automated action → use an icon instead
• Do not use when no identity information is available and a fallback would be misleading → omit the visual identity cue instead
• Do not use when the context is purely textual and a visual identity cue adds no value → use plain text instead
• Avoid: Mixing Avatar sizes within the same group — AI.md explicitly forbids mixing Avatar, Chip, Checkbox, Radio, or Switcher sizes within the same group.
• Avoid: Using `fill="icon"` when initials can be derived from `name` — fill priority is picture → initials → icon; never skip to icon when a higher-fidelity fill is available.
• Avoid: Building a native table cell with an avatar by hand instead of using the `render` prop with `AvatarGroup`/`Avatar` — AI.md requires the `render` prop on `DataTable` columns for cells needing DS components like `AvatarGroup`.
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Avatar group
`AvatarGroup` · node `3058:116174`

```text
import { AvatarGroup } from 'ds-ngr'

• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Badge
`Badge` · node `642:18316`

```text
import { Badge } from 'ds-ngr'

• Do not use when the value is a status label or category → use `Tag` instead
• Do not use when the element is interactive and the user selects or dismisses it → use `Chip` instead
• Do not use when the information is important enough to interrupt the user and demand a response → use `Toast` or an alert banner instead
• Avoid: Showing "0" — hide the badge when count is zero
• Avoid: Displaying counts ≥ 100 literally — cap at `"99+"`
• Avoid: Missing `aria-label` on dot badges — dot has no visible text; label is required
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Breadcrumb item
`Breadcrumbs` · node `4095:182336`

```text
import { Breadcrumbs } from 'ds-ngr'

• Do not use when the hierarchy is flat — two levels do not warrant breadcrumbs
• Do not use when the product uses single-level navigation
• Do not use when the user arrived via deep link and the path is not meaningful in context
• Avoid: Making the current item a link — `Current` is plain text with `aria-current="page"`
• Avoid: Truncating the current item — the user must always see where they are
• Avoid: Decorative separators read by screen readers — mark separators `aria-hidden="true"`
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Breadcrumbs / Large breadcrumbs
`Breadcrumbs` · node `4097:184354`

```text
import { Breadcrumbs } from 'ds-ngr'
This Figma component = <Breadcrumbs size="lg">

• Do not use when the hierarchy is flat — two levels do not warrant breadcrumbs
• Do not use when the product uses single-level navigation
• Do not use when the user arrived via deep link and the path is not meaningful in context
• Avoid: Making the current item a link — `Current` is plain text with `aria-current="page"`
• Avoid: Truncating the current item — the user must always see where they are
• Avoid: Decorative separators read by screen readers — mark separators `aria-hidden="true"`
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Breadcrumbs / Small bradcrumbs
`Breadcrumbs` · node `1393:46853`

```text
import { Breadcrumbs } from 'ds-ngr'
This Figma component = <Breadcrumbs size="sm">

• Do not use when the hierarchy is flat — two levels do not warrant breadcrumbs
• Do not use when the product uses single-level navigation
• Do not use when the user arrived via deep link and the path is not meaningful in context
• Avoid: Making the current item a link — `Current` is plain text with `aria-current="page"`
• Avoid: Truncating the current item — the user must always see where they are
• Avoid: Decorative separators read by screen readers — mark separators `aria-hidden="true"`
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Bulk actions
`BulkActionBar` · node `8922:15948`

```text
import { BulkActionBar } from 'ds-ngr'

• Do not use when nothing is selected → render nothing; do not show a disabled bar
• Do not use for page-level actions that don't depend on a selection → use `Navbar` `rightActions` instead
• Do not use for filter and view controls above a table → use `Toolbar` instead
• Avoid: Rendering with zero selected — see Props reference (LCB-06b).
• Avoid: Positioning the component instead of a wrapper — see Spatial contract (LCB-06b).
• Avoid: Static action labels — labels must be count-aware; see Props reference (LCB-06b).
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Bulk actions alt
`BulkActionBar` · node `8984:80601`

```text
import { BulkActionBar } from 'ds-ngr'

• Do not use when nothing is selected → render nothing; do not show a disabled bar
• Do not use for page-level actions that don't depend on a selection → use `Navbar` `rightActions` instead
• Do not use for filter and view controls above a table → use `Toolbar` instead
• Avoid: Rendering with zero selected — see Props reference (LCB-06b).
• Avoid: Positioning the component instead of a wrapper — see Spatial contract (LCB-06b).
• Avoid: Static action labels — labels must be count-aware; see Props reference (LCB-06b).
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Button
`Button` · node `19:574`

```text
import { Button } from 'ds-ngr'

• Do not use raw HTML `<button>` or hand-built button CSS when `Button` covers the action — consuming apps must not replicate DS button appearance with custom classes.
• Do not pass label text via a `label` prop — `Button` has no `label` prop; pass label text as `children`. Do not infer the API from form field components such as `TextInput` or `Select`.
• Do not use when the action navigates to another page without triggering anything → use a link instead.
• Avoid: Using `variant="plain"` at `size="md"` — Plain is `sm`-only per AI.md and the component spec; at `md` it breaks the documented size contract. Use `sm`.
• Avoid: Placing two `primary` buttons side by side — AI.md and the spec both call out a maximum of one Primary per view; use `secondary` for the second action.
• Avoid: Using `position: fixed`/`absolute` to create a floating action button — explicitly forbidden in AI.md; use `Navbar` `rightActions`.
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Button / Toggle button
`ToggleButton` · node `8412:66648`

```text
import { ToggleButton } from 'ds-ngr'

• Do not use for a one-off action with no persistent state → use `Button` instead.
• Do not use for a stacked icon+label control in a bottom toolbar or action panel → use `VerticalButton` instead.
• Do not use when only one option in a set can be active at a time (mutually exclusive) → use `SegmentControl` or `Tab` instead.
• Avoid: Using `Button` with manual selected-state styling to fake a toggle — `Button` has no `aria-pressed` semantics; use `ToggleButton`, which is exactly what `button.md`'s "when NOT to use" section for `Button` directs toward for persistent icon toggles.
• Avoid: Applying `aria-pressed` to a plain `Button` — AGENTS.md restricts `aria-pressed` usage to `ToggleButton`/`VerticalButton`; a plain `Button` triggers actions and should never carry pressed-state semantics.
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Button / Vertical button
`VerticalButton` · node `107:87`

```text
import { VerticalButton } from 'ds-ngr'

• Do not use for a single inline action in a toolbar or form → use `Button` instead.
• Do not use for a persistent icon-only toggle with no label (bold, italic, view mode) → use `ToggleButton` instead.
• Do not use for one option among several mutually exclusive choices → use `SegmentControl` or `Tab` instead.
• Avoid: Using `Button` for a stacked icon+label control — `button.md`'s "when NOT to use" section directs stacked icon+label controls to `VerticalButton` instead.
• Avoid: Applying `aria-pressed` to a `VerticalButton` used for a one-off action — AGENTS.md restricts `aria-pressed` semantics to toggle-style controls (`ToggleButton`/`VerticalButton` used as toggles); a `VerticalButton` triggering a single action should not carry pressed-state semantics.
• Avoid: Setting `showLabel={false}` without `aria-label` — leaves the button with no accessible name, mirroring the same mistake called out for `Button` icon-only usage in `button.md`.
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Button group / Inline
`ButtonGroup` · node `947:10906`

```text
import { ButtonGroup } from 'ds-ngr'

• Do not use to fake a primary/secondary CTA pair next to `EmptyState` → use `EmptyState`'s `showMainCta`/`showSecondaryOption` props instead.
• Do not use for a vertically stacked group of buttons → use `ButtonGroupVertical` instead.
• Do not use when only one option can ever be selected from the set (mutually exclusive, persistent selection) → use `SegmentControl` instead.
• Avoid: Mounting a standalone `Button` beside `EmptyState` instead of using its CTA props — `button.md` explicitly calls this out; the same applies when wrapping that pairing in a `ButtonGroup` — use `EmptyState`'s `showMainCta`/`showSecondaryOption` instead.
• Avoid: Mixing `size="sm"` and `size="md"` buttons in the same group — breaks the glued-mode corner-radius logic, which assumes a uniform child size.
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Button group / Vertical
`ButtonGroupVertical` · node `8488:52442`

```text
import { ButtonGroupVertical } from 'ds-ngr'

• Do not use for a horizontally laid-out group of buttons → use `ButtonGroup` instead.
• Do not use for stacked icon+label buttons (bottom nav style) → use `VerticalButton` for each item instead; `ButtonGroupVertical` is a layout wrapper for regular `Button`s, not an icon-stack component itself.
• Do not use when only one option can ever be selected from the set → use `SegmentControl` instead.
• Avoid: Mixing `size="sm"` and `size="md"` buttons in the same group — breaks the glued-mode corner-radius logic, which assumes a uniform child size (same failure mode as `ButtonGroup`).
• Avoid: Using `ButtonGroupVertical` where a horizontal layout is expected — the component only stacks vertically (`flex-direction: column`); use `ButtonGroup` for horizontal rows.
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Callout
`Callout` · node `8683:47493`

```text
import { Callout } from 'ds-ngr'

• Do not use for a transient, auto-dismissing confirmation after an action (e.g. "Changes saved") → use `Toast` instead.
• Do not use for a blocking confirmation the user must acknowledge before proceeding → use `AlertDialog` instead.
• Do not use for form-field-level validation errors → use the field's own `error`/`errorMessage` props instead.
• Avoid: Using `severity="error"` for non-urgent messages — triggers `aria-live="assertive"`, interrupting other screen reader output; reserve for genuine blocking errors.
• Avoid: Using `Callout` for transient post-action confirmation — that pattern belongs to `Toast`, which auto-dismisses; `Callout` is a persistent inline panel.
• Avoid: Using `Callout` for field-level validation — individual form fields have their own `error`/`errorMessage` props for that; `Callout` is for section/page-level messages.
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Card container
`Card` · node `8949:22777`

```text
import { Card } from 'ds-ngr'

• Do not use when content should flow continuously with the page → use `SectionHeader` + flat content instead.
• Do not use as a page-section title for a list or detail block in main content → use `SectionHeader` inside a `page-section` wrapper instead (`size="medium"` for subsection titles).
• Do not use to wrap a full-width data table → `DataTable` is never wrapped in a `Card`.
• Avoid: Shipping a body-only card with `showHeader={false}` and no `showBottomBar={false}` — AI.md and the spec both require `showHeader`/`title` whenever there's body content, and explicit `showBottomBar={false}` when there's no footer; otherwise padding/layout are undefined.
• Avoid: Adding `padding`/`margin`/`gap` directly on the `Card` root — `.dsn-card-content` already owns inset via `data-has-header`/`data-has-bottom-bar`; manual padding double-pads the content.
• Avoid: Wrapping a `DataTable` inside a `Card` — explicitly forbidden in AI.md; `DataTable` is always full-width.
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Carousel
`Carousel` · node `9650:333831`

```text
import { Carousel } from 'ds-ngr'

• Do not use when all items should be visible at once → use a grid of `AspectRatio` tiles instead.
• Do not use to open images or files full screen → use `MediaViewer` instead.
• Do not use for a single image → use `AspectRatio` instead (Carousel hides its controls with one slide, but adds nothing).
• Avoid: Passing plain `<img>` elements as children — wrap each in `CarouselSlide`; see Composition rules.
• Avoid: Using dots for a large set — dots stop rendering above 10 slides; see `showDots`.
• Avoid: Enabling thumbnails without `thumbnailSrc` — every slide needs one; see `showThumbnails`.
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Chart / Bar chart
`BarChart` · node `8868:25923`

```text
import { BarChart } from 'ds-ngr'

• Do not use when parts must sum to a whole per row and horizontal reading is clearer → use `HorizontalStackedBarChart` instead.
• Do not use for trends over many points where continuity matters → use `LineChart` or `AreaChart` instead.
• Do not use for part-to-whole with few slices → use `DonutChart` instead.
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Chart / Donut
`DonutChart` · node `8868:25925`

```text
import { DonutChart } from 'ds-ngr'

• Do not use with many slices (8+) — labels crowd the legend and slices become unreadable → use `BarChart` or `HorizontalStackedBarChart` instead.
• Do not use when comparing values across time → use `LineChart` or `BarChart` instead.
• Do not use when precise comparison between similar-sized slices is critical — bar charts outperform donuts for accuracy.
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Chart / Line chart
`LineChart` · node `8868:25924`

```text
import { LineChart } from 'ds-ngr'

• Do not use when the user must inspect exact values on hover → use `XYLineChart` instead (animated tooltip and crosshair).
• Do not use when the user must zoom or filter a long x-range interactively → use `BrushLineChart` instead.
• Do not use when emphasizing volume under the line → use `AreaChart` instead.
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Checkbox
`Checkbox` · node `8441:154815`

```text
import { Checkbox } from 'ds-ngr'

• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Chip
`Chip` · node `1544:19006`

```text
import { Chip } from 'ds-ngr'

• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Chip group
`ChipGroup` · node `8515:36008`

```text
import { ChipGroup } from 'ds-ngr'

• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Choice list
`ChoiceList` · node `8572:15962`

```text
import { ChoiceList } from 'ds-ngr'

• Do not use for a simple single-selection form field → use `SingleChoice` instead.
• Do not use for a simple multi-selection form field → use `MultiChoice` instead.
• Do not use for a flat list of plain actions with no selection state → use a plain list of `MenuCell`s or `PopoverMenu` instead.
• Avoid: Using `ChoiceList` for a simple single-kind form field — use `SingleChoice`/`MultiChoice` instead, which are purpose-built for that simpler case.
• Avoid: Expecting `radio-cell` items in different sections to be mutually exclusive automatically — each section is an independent `role="group"`; cross-section exclusivity must be coordinated by the caller.
• Avoid: Setting `enableMenuKeyboardNavigation` without `onMenuEscape` — leaves the menu with no way to close via keyboard when used as a popover-triggered menu.
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Data list cell / Editable
`DataListCell` · node `2311:43294`

```text
import { DataListCell } from 'ds-ngr'

• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Data list cell / Info
`DataListCell` · node `1719:67872`

```text
import { DataListCell } from 'ds-ngr'

• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Data table / Cell / Header cell
`DataTableHeaderCell` · node `179:2156`

```text
import { DataTableHeaderCell } from 'ds-ngr'

• Do not use to build a custom table header → use `DataTable` instead; never hand-build tables
• Do not use as a section or group title → use `SectionHeader` instead
• Do not use for label–value pairs in a detail panel → use `DataListCell` instead
• Avoid: Hand-built table headers — see When NOT to use.
• Avoid: Setting `state="hover"` in a real table — see Variant selection.
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Data table / Cell / Table cell
`DataTableCell` · node `179:2495`

```text
import { DataTableCell } from 'ds-ngr'

• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Date and time picker
`DateTimePicker` · node `1697:33038`

```text
import { DateTimePicker } from 'ds-ngr'
This Figma component = <DateTimePicker displayMode="inline">

• Do not use to show or manage events on a calendar → use `CalendarView` instead
• Do not use for relative periods that are not calendar-specific ("Last 7 days", "This quarter") → use `Select` or `SegmentControl` instead
• Do not use for a date the user already knows exactly and types faster than they pick (e.g. date of birth) → use `TextInput` with format guidance instead
• Avoid: Using `DatePicker` / `DateRangePicker` — they don't exist; see When NOT to use.
• Avoid: Using it for a scheduling view — see When NOT to use (`CalendarView`).
• Avoid: Shipping the default "Help text" — see Props reference.
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Date and time picker (popover)
`DateTimePicker` · node `8567:40254`

```text
import { DateTimePicker } from 'ds-ngr'
This Figma component = <DateTimePicker displayMode="popover">

• Do not use to show or manage events on a calendar → use `CalendarView` instead
• Do not use for relative periods that are not calendar-specific ("Last 7 days", "This quarter") → use `Select` or `SegmentControl` instead
• Do not use for a date the user already knows exactly and types faster than they pick (e.g. date of birth) → use `TextInput` with format guidance instead
• Avoid: Using `DatePicker` / `DateRangePicker` — they don't exist; see When NOT to use.
• Avoid: Using it for a scheduling view — see When NOT to use (`CalendarView`).
• Avoid: Shipping the default "Help text" — see Props reference.
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Drawer
`Drawer` · node `8784:10454`

```text
import { Drawer } from 'ds-ngr'

• Do not use when the task needs exclusive focus with no background reference → use `Modal` instead
• Do not use when the content is a single short line → use `Tooltip` instead
• Do not use when the interaction is anchored to a trigger with a small menu → use `Popover` instead
• Avoid: Capping a `DataListCell` stack in drawer content with an arbitrary `max-width` — AI.md (LCB-06d) requires a full-bleed list wrapper that cancels the drawer content inset and uses the full available panel width.
• Avoid: Placing `Breadcrumbs` inside a Drawer — AI.md explicitly forbids placing Breadcrumbs inside cards, modals, or drawers.
• Avoid: Using a Drawer when the task needs exclusive focus with no background reference — use `Modal` instead, per AI.md's Drawer/Modal "never for" guidance.
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## File row
`FileRow` · node `4540:121392`

```text
import { FileRow } from 'ds-ngr'

• Do not use for a visual gallery where the preview matters → use `AttachmentCard` instead
• Do not use for compact attachments in a composer → use `AttachmentChip` instead
• Do not use for a single-file form field → use `AttachmentField` instead
• Avoid: Listing files in a `MediaViewer` — it views media full size; list files with `FileRow` (AI.md, MediaViewer).
• Avoid: Image file without `previewVariant="image"` and `previewSrc` — it shows a generic file icon; see Props reference.
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Input / Checkbox
`CheckboxField` · node `8515:38459`

```text
import { CheckboxField } from 'ds-ngr'

• Do not use for a group of several related checkboxes → use `MultiChoice` instead, which manages a list of options with a single fieldset.
• Do not use when the checkbox doesn't need a separate field label/helper text — mount the `Checkbox` atom directly instead.
• Avoid: Using `CheckboxField` for multiple related checkboxes — use `MultiChoice` instead, which is built for a list of options under one fieldset.
• Avoid: Mounting a separate `Checkbox` alongside `CheckboxField` instead of using `checkboxProps` — duplicates the control; pass overrides through `checkboxProps`.
• Avoid: Setting `error={true}` without `errorMessage` — the helper row only shows content when there's helper or error text; a silent error state leaves the user without an explanation.
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Input / Chips
`ChipField` · node `8515:41820`

```text
import { ChipField } from 'ds-ngr'

• Do not use for 4 or more options in a form → use `MultiChoice` (checkbox list) or `Combobox selectionMode="multi"` instead (Pattern 2)
• Do not use when only one option can be selected → use `SingleChoice` / `Radio` or `SegmentControl` instead
• Do not use for multi-value toolbar filters → use `PopoverMenu` with checkbox-cell items instead (MultiSelectAnchored)
• Avoid: Too many options as chips — see When NOT to use (Pattern 2).
• Avoid: Chips for toolbar filters — see When NOT to use (Pattern 2, MultiSelectAnchored).
• Avoid: Shipping the "Label" / "Help text" defaults — see Props reference.
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Input / Combobox
`Combobox` · node `8822:61813`

```text
import { Combobox } from 'ds-ngr'

• Do not use when the list is fixed and small (6 or fewer) → use `Radio` or `CheckboxField` / `MultiChoice`
• Do not use only because a fixed list is long → use `Select`, which adds a search field automatically above 10 options
• Do not use when the user picks one value without typing → use `Select`
• Avoid: Using `Select` for free-text or async option sets — use `Combobox`; for long fixed lists keep `Select`, which shows search automatically above 10 options
• Avoid: Omitting `options` in app code — always pass contextual options; placeholders belong in Storybook only
• Avoid: Modeling toolbar filters as multi `Combobox` — use `PopoverMenu` with checkbox cells and Confirm/Cancel
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Input / Combobox multi
`Combobox` · node `1548:22387`

```text
import { Combobox } from 'ds-ngr'

• Do not use when the list is fixed and small (6 or fewer) → use `Radio` or `CheckboxField` / `MultiChoice`
• Do not use only because a fixed list is long → use `Select`, which adds a search field automatically above 10 options
• Do not use when the user picks one value without typing → use `Select`
• Avoid: Using `Select` for free-text or async option sets — use `Combobox`; for long fixed lists keep `Select`, which shows search automatically above 10 options
• Avoid: Omitting `options` in app code — always pass contextual options; placeholders belong in Storybook only
• Avoid: Modeling toolbar filters as multi `Combobox` — use `PopoverMenu` with checkbox cells and Confirm/Cancel
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Input / Date picker
`DateTimePicker` · node `8794:56699`

```text
import { DateTimePicker } from 'ds-ngr'

• Do not use to show or manage events on a calendar → use `CalendarView` instead
• Do not use for relative periods that are not calendar-specific ("Last 7 days", "This quarter") → use `Select` or `SegmentControl` instead
• Do not use for a date the user already knows exactly and types faster than they pick (e.g. date of birth) → use `TextInput` with format guidance instead
• Avoid: Using `DatePicker` / `DateRangePicker` — they don't exist; see When NOT to use.
• Avoid: Using it for a scheduling view — see When NOT to use (`CalendarView`).
• Avoid: Shipping the default "Help text" — see Props reference.
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Input / Date range picker
`DateTimePicker` · node `8823:62649`

```text
import { DateTimePicker } from 'ds-ngr'

• Do not use to show or manage events on a calendar → use `CalendarView` instead
• Do not use for relative periods that are not calendar-specific ("Last 7 days", "This quarter") → use `Select` or `SegmentControl` instead
• Do not use for a date the user already knows exactly and types faster than they pick (e.g. date of birth) → use `TextInput` with format guidance instead
• Avoid: Using `DatePicker` / `DateRangePicker` — they don't exist; see When NOT to use.
• Avoid: Using it for a scheduling view — see When NOT to use (`CalendarView`).
• Avoid: Shipping the default "Help text" — see Props reference.
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Input / File upload
`AttachmentField` · node `8772:601900`

```text
import { AttachmentField } from 'ds-ngr'

• Do not use for several files, or when drag-and-drop is the main interaction → use `UploadArea` instead
• Do not use to display files that already belong to a record → use `FileRow` or `AttachmentCard` instead
• Do not use for attachments in a message composer → use `PromptInput` or `RichTextEditor` attachments instead
• Avoid: Not stating accepted types and size limits — put them in `helperText`; see Props reference (UploadArea in AI.md).
• Avoid: Using it for several files — see When NOT to use.
• Avoid: Shipping the "Label" / "Help text" / default error text — see Props reference.
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Input / Horizontal input
`HorizontalInput` · node `5190:212002`

```text
import { HorizontalInput } from 'ds-ngr'

• Do not use in standard top-to-bottom scannable forms → use the input's default stacked (label-above-control) layout instead.
• Do not use in mobile layouts where horizontal space is insufficient → use the stacked layout instead.
• Do not use with long labels that would wrap → keep labels short, or use the stacked layout if the label can't be shortened.
• Avoid: Using inconsistent `labelWidth` across rows in the same group — the source doc (`input-select-autocomplete-horizontal.md`) calls out that misaligned labels create visual noise; set one consistent value for the whole group.
• Avoid: Using long, wrapping labels — the source doc limits labels to short phrases (3–4 words) because horizontal space is shared with the control.
• Avoid: Using `HorizontalInput` in a standard top-to-bottom form — the source doc recommends the stacked layout there instead; horizontal layout is for dense, space-constrained contexts.
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Input / Multi choice
`MultiChoice` · node `8515:36405`

```text
import { MultiChoice } from 'ds-ngr'

• Do not use when only one option can be selected → use `SingleChoice` instead.
• Do not use for a single standalone checkbox → use `CheckboxField` instead.
• Do not use when the list is long or dynamic and benefits from search/filter → use `Autocomplete multi`/`Combobox` with `multiSelect` instead.
• Avoid: Using `MultiChoice` for a mutually exclusive set — use `SingleChoice` instead, which enforces single selection.
• Avoid: Not wiring `onOptionChange` back into `options[].checked` — since `MultiChoice` is fully controlled, omitting this update makes the checkboxes appear unresponsive to clicks.
• Avoid: Using `MultiChoice` for a single checkbox — use `CheckboxField` instead; `MultiChoice`'s fieldset/legend structure is designed for a list of options, not one.
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Input / Number input
`NumberInput` · node `1613:49241`

```text
import { NumberInput } from 'ds-ngr'

• Do not use for currency amounts → currency formatting/decimal rules are complex; use a dedicated currency input or a plain text input with explicit formatting guidance.
• Do not use for a value that is a range between two points → use `Slider` instead.
• Do not use for a large numeric ID or code where increment/decrement makes no sense → use a plain text input instead.
• Avoid: Using `NumberInput` for a currency amount — `input-password-otp-number-phone.md` explicitly excludes currency values; use a dedicated currency input or plain text input with formatting guidance instead.
• Avoid: Using `NumberInput` for a min–max range selection — the source doc directs range selection to `Slider` instead.
• Avoid: Silently clamping without showing an error — the source doc states bounds should be enforced with a visible error, not a silent clamp, when the user exceeds them via typed input before blur.
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Input / OTP
`OTPInput` · node `8572:19405`

```text
import { OTPInput } from 'ds-ngr'

• Do not use for passwords → use `PasswordInput` instead.
• Do not use for long codes or free-form alphanumeric values → use a standard text input instead.
• Avoid: Requiring a separate submit button — `input-password-otp-number-phone.md` states auto-submit should trigger verification automatically for standard OTP flows once the last cell is filled; use `onComplete` instead of adding a submit control.
• Avoid: Not handling multi-character paste — the component already fills all cells from a single paste event; do not intercept `onPaste` to implement single-character-only pasting.
• Avoid: Showing a generic error — distinguish wrong code vs. expired code in `errorMessage` ("Incorrect code — please try again" vs. "This code has expired — request a new one"), per the source doc's content guidelines.
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Input / Password
`PasswordInput` · node `8572:18974`

```text
import { PasswordInput } from 'ds-ngr'

• Do not use for PINs or one-time verification codes → use `OTPInput` instead.
• Do not use for any non-sensitive text value → use a standard text input instead.
• Avoid: Setting `autoComplete="off"` — `input-password-otp-number-phone.md` explicitly calls this out: password managers depend on `current-password`/`new-password` autocomplete values; never disable autocomplete.
• Avoid: Using `PasswordInput` for OTP/PIN entry — the source doc's "when to use" section for OTP explicitly separates the two; use `OTPInput` for short verification codes instead.
• Avoid: Showing a generic error like "Invalid password" — `input-password-otp-number-phone.md` requires specific errors, e.g. "Password must include at least one uppercase letter".
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Input / Phone number
`PhoneInput` · node `487:38022`

```text
import { PhoneInput } from 'ds-ngr'

• Do not use when the product only ever operates in a single country/locale with no need for a country selector → use a plain text input with a fixed format hint instead.
• Do not use for non-phone numeric identifiers → use `NumberInput` or a plain text input instead.
• Avoid: Hardcoding a placeholder format that doesn't match the selected country — the source doc requires the placeholder to reflect the selected country's local format, not a single generic pattern.
• Avoid: Not pre-selecting a sensible default country — the source doc recommends detecting and pre-selecting the user's locale to reduce friction; don't leave `defaultCountryCode` unset in user-facing forms without considering the target locale.
• Avoid: Validating on every keystroke — the source doc specifies phone number format validation should happen on blur, not on every keystroke.
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Input / Search
`SearchBar` · node `390:24397`

```text
import { SearchBar } from 'ds-ngr'

• Do not use for a text value that is saved with a form → use `TextInput` instead
• Do not use to pick one value from a known list → use `Combobox` or `Select` instead
• Do not use for a global command palette or jump-to search → use `Command` / `CommandDialog` instead
• Avoid: Error state for "no results" — see Composition rules.
• Avoid: Generic placeholder — the placeholder must describe what is searched; see Props reference.
• Avoid: Ghost SearchBar with no `aria-label` — see Props reference.
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Input / Search ghost
`SearchBar` · node `1218:10394`

```text
import { SearchBar } from 'ds-ngr'
This Figma component = <SearchBar variant="ghost">

• Do not use for a text value that is saved with a form → use `TextInput` instead
• Do not use to pick one value from a known list → use `Combobox` or `Select` instead
• Do not use for a global command palette or jump-to search → use `Command` / `CommandDialog` instead
• Avoid: Error state for "no results" — see Composition rules.
• Avoid: Generic placeholder — the placeholder must describe what is searched; see Props reference.
• Avoid: Ghost SearchBar with no `aria-label` — see Props reference.
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Input / Select
`Select` · node `409:9847`

```text
import { Select } from 'ds-ngr'

• Do not use when there are 6 or fewer options and space allows → use `Radio` instead
• Do not use when the user can select multiple values → use `MultiChoice` or autocomplete multi instead
• Do not use when the user needs to type a value that may or may not match a list (free-text) → use `Combobox` instead
• Avoid: Using Select for 6 or fewer fixed options — use `Radio` so all options are visible
• Avoid: Making the placeholder a valid option — placeholder is a prompt, not a value
• Avoid: Turning search off on long lists — above 10 options Select shows a search field in the popover automatically (`SELECT_SEARCH_THRESHOLD`). Don't pass `searchable={false}` there; free-text or async options → `Combobox`
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Input / Single choice
`SingleChoice` · node `8515:39160`

```text
import { SingleChoice } from 'ds-ngr'

• Do not use when the user can select more than one option → use `MultiChoice` instead.
• Do not use when there are many options and space is constrained → use `Select` instead.
• Do not use for an instant, no-confirmation mode/view switch (not a form field) → use `SegmentControl` instead.
• Avoid: Using `SingleChoice` when multiple selections are allowed — use `MultiChoice` instead; `SingleChoice` enforces exactly one selected value via `role="radiogroup"`.
• Avoid: Passing `checked` through `option.radioProps` — conflicts with the internally computed checked state; control selection via `value`/`onValueChange` instead.
• Avoid: Using `SingleChoice` for an instant view/mode switch with no form-submission context — use `SegmentControl` instead, which is designed for that immediate-effect pattern.
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Input / Text area
`TextArea` · node `390:23634`

```text
import { TextArea } from 'ds-ngr'

• Do not use when the value is a single line → use `TextInput` instead
• Do not use when the value is richly formatted (bold, lists, links) → use a rich text editor instead
• Do not omit `label` and rely on placeholder text alone — placeholders are not accessible names
• Avoid: Using `TextInput` for multi-line content — use `TextArea` instead
• Avoid: Omitting `label` — always provide a visible field label; use `optional` for non-mandatory fields
• Avoid: Passing `rows` instead of `minRows` — `TextArea` controls height via `minRows` only
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Input / Text input
`TextInput` · node `109:381`

```text
import { TextInput } from 'ds-ngr'

• Do not use when the value is multiple lines of prose → use `TextArea` instead
• Do not use when the value is a number with increment/decrement controls → use `NumberInput` instead
• Do not use when the value is a password → use `PasswordInput` instead
• Avoid: Using `TextInput` for international phone numbers — use `PhoneInput` instead
• Avoid: Using placeholder text as a label substitute — always set `label` or an `aria-label`
• Avoid: Showing an error message without the `error` visual state — set the `error` prop with `errorMessage`
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Input / Upload area
`UploadArea` · node `8586:53892`

```text
import { UploadArea } from 'ds-ngr'

• Do not use for attaching a single file as one field among others in a form → use `AttachmentField` instead
• Do not use for incidental attachments in a message or comment composer → use the composer's attach action with `AttachmentChip` (e.g. `PromptInput`, `RichTextEditor`) instead
• Do not use to list files that are already uploaded → use `FileRow` or `AttachmentCard` instead
• Avoid: Not stating accepted types and size limits up front — see Props reference (UploadArea in AI.md).
• Avoid: Silently ignoring rejected files — handle `onFilesRejected`; see Props reference.
• Avoid: No progress feedback after acceptance — see Composition rules (UploadArea in AI.md).
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Loading / Bar
`LoadingBar` · node `8570:51729`

```text
import { LoadingBar } from 'ds-ngr'

• Do not use to show progress for a specific bounded task the user is actively watching (uploads, multi-step processes) where a labeled percentage matters → use `ProgressBar` instead, which is designed for that context.
• Do not use for a circular/compact loading indicator → use `ProgressRing` instead.
• Do not use to represent placeholder content while data loads → use `SkeletonLoading` instead.
• Avoid: Using `LoadingBar` for a task the user is actively tracking with a known percentage and label — `ProgressBar` is the more appropriate component for that bounded, labeled context.
• Avoid: Omitting `label` with no other accessible description nearby — the component sets `aria-live="polite"` and relies on `label` (or context) to tell assistive technology what is loading.
• Avoid: Passing a `value` when the duration is actually unknown — forcing a determinate percentage for an unknown-duration operation misleads users about progress; omit `value` instead.
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Loading / Skeleton loading
`SkeletonLoading` · node `4016:242608`

```text
import { SkeletonLoading } from 'ds-ngr'

• Do not use for a page-level or section-level loading indicator with no shape to match → use `LoadingBar` or `ProgressRing` instead.
• Do not use for a bounded task with a known percentage → use `ProgressBar` instead.
• Do not use as a purely decorative loading spinner → use `ProgressRing` in indeterminate mode instead.
• Avoid: Using a mismatched `type` — e.g. a `pill` skeleton where a `card` will render — causes a visual jump/layout shift when real content replaces the placeholder.
• Avoid: Relying on `SkeletonLoading` to announce loading state to screen readers — it is `aria-hidden="true"` by design; the surrounding container must provide the accessible loading announcement.
• Avoid: Using `SkeletonLoading` for a determinate, trackable operation — a skeleton represents "content not yet loaded," not "task X% complete"; use `ProgressBar` for the latter.
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Loading / Spinner
`ProgressRing` · node `8570:51697`

```text
import { ProgressRing } from 'ds-ngr'

• Do not use for a full-width, linear loading indicator → use `LoadingBar` (indeterminate) or `ProgressBar` (determinate) instead.
• Do not use to represent placeholder content while data loads → use `SkeletonLoading` instead.
• Avoid: Using `ProgressRing` for a full-width linear indicator — use `LoadingBar`/`ProgressBar` instead; `ProgressRing` is sized to fixed pixel dimensions and doesn't stretch.
• Avoid: Omitting `label` with no visible surrounding text — leaves the ring with no accessible description of what is loading/progressing.
• Avoid: Assuming `role="progressbar"` in indeterminate mode — the component switches to `role="status"` when `value` is omitted since `aria-valuenow` can't be meaningfully set; code inspecting the accessibility tree should account for both roles.
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Menu cell
`MenuCell` · node `204:19436`

```text
import { MenuCell } from 'ds-ngr'

• Do not use to build a dropdown or action menu by hand → use `PopoverMenu` instead
• Do not use to build a select or picker → use `Select` or `Combobox` instead
• Do not use for a list of selectable options in a form → use `ChoiceList` instead
• Avoid: Hand-built menus from MenuCell rows — see When NOT to use (Pattern 7, PopoverMenu).
• Avoid: Leaving default icons on — set `showLeadingIcon` and `showTrailingIcon` to `false` when no icons are needed; see Props reference.
• Avoid: Orphaned `menuitem` role — see Composition rules.
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Modal
`Modal` · node `1229:16497`

```text
import { Modal } from 'ds-ngr'

• Do not use when the message is informational only with no action required → use `Toast` instead
• Do not use when the task needs more room than a dialog but should retain partial page context → use `Drawer` instead
• Do not use when the content is anchored to a trigger element (small menu, contextual content) → use `Popover` instead
• Avoid: Opening a Modal from within another Modal — AI.md explicitly forbids nesting modals; use a single Modal and sequence the flow, or use a `Drawer`/inline step instead.
• Avoid: Using "Are you sure?" as the title — AI.md requires specific, descriptive titles like "Delete project" in sentence case.
• Avoid: Using generic action labels like "OK" or "Confirm" — AI.md requires `confirmLabel` to be a specific verb describing the action.
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Nav bar
`Navbar` · node `8620:54668`

```text
import { Navbar } from 'ds-ngr'

• Do not use as a section title inside page content → use `SectionHeader` instead (NAV-11)
• Do not use for in-content hierarchy trails → use `Breadcrumbs size="sm"` inside the content instead (NAV-06)
• Do not use as the header of a `Card`, `Modal` or `Drawer` → use that component's own header props instead
• Avoid: Back arrow on a top-level page — see Variant selection (NAV-03).
• Avoid: Title navbar plus breadcrumbs on a detail view — the trail is the title; see Variant selection (NAV-05).
• Avoid: Primary CTA inside a Card or floating — see When to use and Composition rules (NAV-08).
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Pagination
`Pagination` · node `609:16611`

```text
import { Pagination } from 'ds-ngr'

• Do not use when the dataset is small enough to display in full
• Do not use when the primary interaction is scrolling a continuous feed → use infinite scroll instead
• Do not use when the user is unlikely to jump to a specific page → use load-more instead
• Avoid: Changing visible page selector count mid-session — keep layout consistent
• Avoid: Omitting first and last page numbers when collapsing ranges — they anchor scale
• Avoid: Leaving focus on pagination after page change — move focus to the top of updated content
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Pattern / Empty space content
`EmptyState` · node `8512:21029`

```text
import { EmptyState } from 'ds-ngr'

• Do not use when a single form field failed validation → use an inline field validation message instead
• Do not use when the whole page cannot render due to a system error → use a full-page error screen instead
• Do not use when you only need a one-line hint beside other content → use copy in context instead, not a full empty state
• Avoid: Mounting a separate `Button` beside `EmptyState` only to get primary vs. secondary variant — AI.md explicitly forbids this; use `showMainCta` and `showSecondaryOption` instead.
• Avoid: Reimplementing board or in-column empty layouts with custom flex wrappers — AI.md requires using `EmptyState` with `min-width: 0` / `max-width: 100%` column constraints instead of bespoke wrappers.
• Avoid: Omitting `min-width: 0` on the flex column parent and `min-width: 0`/`max-width: 100%` on the `EmptyState` root — causes title/subtitle/actions to overflow narrow board columns instead of wrapping.
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Popover / Complex popover menu
`PopoverMenu` · node `8567:27319`

```text
import { PopoverMenu } from 'ds-ngr'
This Figma component = <PopoverMenu variant="rich">

• Do not use when the content is a single short sentence with no interaction → use `Tooltip` instead
• Do not use when the content demands full attention and must block the rest of the UI → use `Modal` instead
• Do not use when the content is a persistent panel the user interacts with over an extended period → use `Drawer` instead
• Avoid: Using tooltip for interactive content — tooltips are hover-only and non-interactive
• Avoid: Adding an "All" option to represent unfiltered state — empty checkbox selection means no filter applied
• Avoid: Clipping the panel inside `overflow: hidden` ancestors — breaks keyboard access and visibility
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Popover / Popover container
`PopoverWrapper` · node `1229:16495`

```text
import { PopoverWrapper } from 'ds-ngr'

• Do not use for hover-only hints → use `Tooltip` instead (no click trigger, no persistent panel).
• Do not use when the user needs a structured menu with sections, choice lists, and optional bottom bar → use `PopoverMenu` (menu content + behavior) rather than reassembling slots on raw `PopoverWrapper`.
• Do not use when the overlay must block the entire page → use `Modal` instead.
• Avoid: Using `rootRef.contains(target)` for outside-click on an anchored popover — closes the panel on the first `mousedown` inside portaled content; breaks mouse selection. Use `isPointerInsideAnchoredPopover`.
• Avoid: Putting `id` on an inner content node that does not wrap segment/header/bottomBar — clicks on those slots count as outside the popover and dismiss prematurely. Put `id` on `PopoverWrapper` root.
• Avoid: Mounting `PopoverWrapper` in consuming apps — internal infrastructure; expose behavior through `Select`, `PopoverMenu`, etc.
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Popover / Simple popover menu
`PopoverMenu` · node `8448:53918`

```text
import { PopoverMenu } from 'ds-ngr'
This Figma component = <PopoverMenu variant="simple">

• Do not use when the content is a single short sentence with no interaction → use `Tooltip` instead
• Do not use when the content demands full attention and must block the rest of the UI → use `Modal` instead
• Do not use when the content is a persistent panel the user interacts with over an extended period → use `Drawer` instead
• Avoid: Using tooltip for interactive content — tooltips are hover-only and non-interactive
• Avoid: Adding an "All" option to represent unfiltered state — empty checkbox selection means no filter applied
• Avoid: Clipping the panel inside `overflow: hidden` ancestors — breaks keyboard access and visibility
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Progress bar
`ProgressBar` · node `5291:723275`

```text
import { ProgressBar } from 'ds-ngr'

• Do not use when the duration/percentage is unknown → use `LoadingBar` in indeterminate mode instead (omit its `value`).
• Do not use for a compact or circular indicator → use `ProgressRing` instead.
• Do not use to represent placeholder content while data loads → use `SkeletonLoading` instead.
• Avoid: Using `ProgressBar` when the percentage is actually unknown — use `LoadingBar`'s indeterminate mode (omit `value`) instead of guessing or faking a percentage.
• Avoid: Omitting `label` with no visible surrounding text — leaves the progress indicator with no accessible description of what is progressing.
• Avoid: Adding manual width/border compensation around the bar — the fill's width-plus-2px calculation already accounts for the track border overlap internally.
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Prompt input
`PromptInput` · node `9180:10128`

```text
import { PromptInput } from 'ds-ngr'

• Do not use for plain multi-line form text → use `TextArea` instead
• Do not use for formatted prose → use `RichTextEditor` instead
• Do not use for search or jump-to → use `SearchBar` or `CommandDialog` instead
• Avoid: Not clearing the prompt after submit — in controlled usage `onSubmit` must reset `value`; see Props reference.
• Avoid: Wrapping it in a `Form` — see Composition rules.
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Radio
`Radio` · node `8442:6760`

```text
import { Radio } from 'ds-ngr'

• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Rich text editor
`RichTextEditor` · node `409:7293`

```text
import { RichTextEditor } from 'ds-ngr'

• Do not use for plain multi-line text → use `TextArea` instead
• Do not use for a single-line value → use `TextInput` instead
• Do not use for an AI chat prompt → use `PromptInput` instead
• Avoid: Two submits in a form — see Composition rules (LCB-09).
• Avoid: Relying on `maxLength` to block input — see Props reference.
• Avoid: Shipping the "Label" / "Help text" defaults — see Props reference.
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Section header
`SectionHeader` · node `345:20068`

```text
import { SectionHeader } from 'ds-ngr'

• Do not use when you need a bounded card surface around the title → use `Card`'s `title` prop, but only for content inside that card — not for main-content page sections.
• Do not use when you need a page-level title in the navigation chrome → use `Navbar` title or breadcrumbs instead.
• Do not use a `SectionHeader` title on a detail page to repeat the entity name when that name already appears as the current breadcrumb item — use the page body for metadata, filters, and content instead.
• Avoid: Wrapping `SectionHeader` in a padded div — AI.md explicitly forbids this; it is edge-to-edge and owns its own `padding-inline`, so an outer padded wrapper causes double padding and overflow.
• Avoid: Adding `padding`, `minWidth`, or a fixed `width` to a container that directly holds a `SectionHeader` — same root cause as above; the parent must have none of these.
• Avoid: Using a `Card` header (`title`/`showHeader`) as a page-section title for lists or detail blocks in main content — AI.md requires `SectionHeader` inside a `page-section` wrapper for that purpose instead.
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Segment control
`SegmentControl` · node `242:8752`

```text
import { SegmentControl } from 'ds-ngr'

• Do not use when there are more than 5 options → use `Select` or `Tabs` instead
• Do not use when the options represent named content sections with distinct panels → use `Tabs` instead
• Do not use when the selection requires confirmation before taking effect → use `Radio` instead
• Avoid: Using SegmentControl for options with distinct content panels — AI.md explicitly requires `Tabs` in this case.
• Avoid: Using more than 5 options — the control becomes unwieldy at that width; use `Select` or `Tabs` instead.
• Avoid: Replacing SegmentControl with plain text or custom buttons — AI.md forbids reimplementing this pattern manually.
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Selectors / Segment control selector
`SegmentControl` · node `236:8414`

```text
import { SegmentControl } from 'ds-ngr'

• Do not use when there are more than 5 options → use `Select` or `Tabs` instead
• Do not use when the options represent named content sections with distinct panels → use `Tabs` instead
• Do not use when the selection requires confirmation before taking effect → use `Radio` instead
• Avoid: Using SegmentControl for options with distinct content panels — AI.md explicitly requires `Tabs` in this case.
• Avoid: Using more than 5 options — the control becomes unwieldy at that width; use `Select` or `Tabs` instead.
• Avoid: Replacing SegmentControl with plain text or custom buttons — AI.md forbids reimplementing this pattern manually.
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Selectors / Sidebar selector (icon)
`SidebarMenuSelector` · node `8113:185712`

```text
import { SidebarMenuSelector } from 'ds-ngr'
This Figma component = <SidebarMenuSelector variant="icon">

• Do not use for main navigation items → use `Sidebar` `sections` items instead; Sidebar renders the rows for you
• Do not use for rows in a dropdown or popover menu → use `MenuCell` (inside `PopoverMenu`) instead
• Do not use outside a sidebar as a generic button → use `Button` instead
• Avoid: `bottomContent` rows not mirroring collapsed state — see Variant selection.
• Avoid: Missing Settings or User Name rows in `bottomContent` — see When to use (NAV-02).
• Avoid: Hand-built sidebar rows — see Composition rules.
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Selectors / Sidebar selector (label)
`SidebarMenuSelector` · node `126:6836`

```text
import { SidebarMenuSelector } from 'ds-ngr'

• Do not use for main navigation items → use `Sidebar` `sections` items instead; Sidebar renders the rows for you
• Do not use for rows in a dropdown or popover menu → use `MenuCell` (inside `PopoverMenu`) instead
• Do not use outside a sidebar as a generic button → use `Button` instead
• Avoid: `bottomContent` rows not mirroring collapsed state — see Variant selection.
• Avoid: Missing Settings or User Name rows in `bottomContent` — see When to use (NAV-02).
• Avoid: Hand-built sidebar rows — see Composition rules.
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Separator
`Separator` · node `6006:357608`

```text
import { Separator } from 'ds-ngr'

• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Shortcut
`Shortcut` · node `8508:59670`

```text
import { Shortcut } from 'ds-ngr'

• Do not use for an interactive control the user can click — `Shortcut` is display-only, never interactive.
• Do not use to show descriptive text — it is for key characters only ("⌘K", "Ctrl+K"), not phrases like "Press Command K".
• Avoid: Omitting the Shortcut component on the primary submit CTA — AGENTS.md's `submit_cta` rule requires the primary submit button to always include a `Shortcut` showing `⌘↵`.
• Avoid: Omitting `aria-label` — symbol characters are not reliably announced by assistive technology; the prop is required for exactly this reason.
• Avoid: Using `contentColor="default"` on a filled/dark surface — reduces legibility; use `"inverted"` for primary buttons and other filled/dark backgrounds.
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Sidebar
`Sidebar` · node `1359:12674`

```text
import { Sidebar } from 'ds-ngr'

• Do not use for in-page sub-navigation between views of one page → use `TabNav` instead
• Do not use as a standalone menu of actions → use `PopoverMenu` instead
• Do not render it in page content or outside `AppShell` → pass it to `AppShell` `sidebar`; on mobile, render it inside a left `Drawer`
• Avoid: Passing `collapsed` manually — see Composition rules.
• Avoid: Inventing nav items or sections — see Composition rules.
• Avoid: Deselecting the parent item on a detail route — see Props reference (NAV-05d).
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Slider
`Slider` · node `2514:45982`

```text
import { Slider } from 'ds-ngr'

• Do not use when the exact value is critical and must be typed precisely → use `NumberInput` instead.
• Do not use when the range isn't meaningful to display visually (a hidden internal threshold) → use `NumberInput` instead.
• Do not use for a very large range needing fine granularity → use `NumberInput` with explicit `min`/`max` instead.
• Avoid: Using `Slider` for a value that must be typed exactly — `input-slider-upload-chips.md` directs precise-entry cases to `NumberInput` instead.
• Avoid: Not showing the current value alongside the handle — the source doc requires the value be visible (tooltip or persistent label), not inferred from handle position.
• Avoid: Omitting a step size for a large range — the source doc recommends a larger step (e.g. `100` for a 0–10,000 range) to make selection practical; leaving the default `step={1}` on a huge range makes dragging imprecise.
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Split button
`SplitButton` · node `5772:189085`

```text
import { SplitButton } from 'ds-ngr'

• Do not use when there is no default action and the trigger only opens a menu → use a `Button` with a trailing chevron that opens a `PopoverMenu` instead
• Do not use for several independent actions → use `ButtonGroup` instead
• Do not use to pick one persistent option from a set → use `SegmentControl` instead
• Avoid: Two primary buttons in one view — see Composition rules (NAV-09).
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Stat
`Stat` · node `8821:61808`

```text
import { Stat } from 'ds-ngr'

• Do not use for a value that changes interactively or accepts input → use `NumberInput` or a form field instead.
• Do not use to display a long-form value or paragraph → `Stat` is for concise, at-a-glance metrics only.
• Do not use for a value that needs its own trend chart or visualization → pair `Stat` with `Charts` inside a `Card` instead of overloading `Stat` itself.
• Avoid: Using `variant="card"` inside an existing `Card` — creates a nested card-in-card visual, which the composition rules above call out as over-nesting.
• Avoid: Passing a long or paragraph-length `value` — `Stat` is designed for concise, at-a-glance values; long content breaks its intended layout.
• Avoid: Using `Stat` for an editable/interactive value — it renders static text (`<p>` elements), not an input; use `NumberInput` or a form field for anything the user edits.
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Switcher
`Switcher` · node `204:18242`

```text
import { Switcher } from 'ds-ngr'

• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Tab / Custom view tab
`CustomViewTab` · node `132:7427`

```text
import { CustomViewTab } from 'ds-ngr'

• Do not use for fixed, product-defined navigation sections → use `Tab` instead (no add/remove affordances).
• Do not use when switching is a display preference with no distinct content panel and no user-created views → use `SegmentControl` instead.
• Do not use when the goal is filtering the same content inline → use `Chip` or a filter panel instead.
• Avoid: Expecting the X button to be keyboard-focusable — removal for keyboard users is Delete on the focused tab only; the X is mouse-only and `aria-hidden`.
• Avoid: Using `CustomViewTab` for static product navigation — use `Tab` when views are fixed and not user-created.
• Avoid: Mixing `Tab` and `CustomViewTab` in one row — pick one component for the entire tab group.
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Tab / Navigation tab
`TabNav` · node `132:8663`

```text
import { TabNav } from 'ds-ngr'

• Do not use to switch panels inside the same page → use `Tab` instead
• Do not use for a display-preference toggle → use `SegmentControl` instead
• Do not use for more than 6–7 destinations → use a sidebar nav instead
• Avoid: Using `Tab` with `showPanels={false}` plus a router push for page navigation — screen readers announce "tab, 2 of 5" for something that loads a new page, arrow-key roving hides links from the Tab order, and items lose link behaviour. Use `TabNav`.
• Avoid: Forgetting `current` — without it no item is marked, and assistive tech cannot tell which page the user is on.
• Avoid: Marking several items `current` — only the page the user is on is current.
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Tag
`Tag` · node `184:9584`

```text
import { Tag } from 'ds-ngr'

• Do not use when the element must be selectable, removable, or otherwise interactive → use `Chip` instead.
• Do not use when the label is a numeric count or notification indicator attached to another element (e.g. a nav icon) → use `Badge` instead.
• Do not use for kanban column status when tasks are already grouped into status columns — tint column chrome with tag semantic surface tokens instead; see `specs/patterns/kanban-board.md`.
• Avoid: Using the same `variant` for every tag in a list regardless of meaning — Each tag's variant must independently reflect its own label's semantics (see Tag semantic mapping in AI.md). Defaulting to one variant for visual uniformity defeats the purpose of the color signal.
• Avoid: Wrapping a Tag in a clickable element or adding an `onClick` — Tags have no interactive states by design. If the design calls for a removable or selectable label, use `Chip` instead of bolting interactivity onto `Tag`.
• Avoid: Using the deprecated `iconLeft` / `iconRight` / `showIcon` — use `leadingIcon` / `trailingIcon` / `showLeadingIcon` / `showTrailingIcon`, which match the Figma property names.
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Toast / Inline toast
`Toast` · node `2884:87110`

```text
import { Toast } from 'ds-ngr'
This Figma component = <Toast variant="inline">

• Do not use when the information is critical and requires the user to act before continuing → use `Modal` instead
• Do not use when the message is directly related to a specific form field → use inline field validation instead
• Do not use when the event is complex and needs detailed explanation or multiple actions → reconsider `Modal` instead
• Avoid: Using `error` severity for a warning or caveat — AI.md/spec rules reserve `Error` for genuine failures only; softening a warning into an error misleads urgency.
• Avoid: Using `Toast` for actions requiring user response — AI.md explicitly forbids this; use `Modal` instead.
• Avoid: Adding "Successfully" as a prefix to toast copy — AI.md forbids this; state the outcome directly ("Changes saved", not "Successfully saved changes").
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Toast / Rich toast
`Toast` · node `2911:73678`

```text
import { Toast } from 'ds-ngr'
This Figma component = <Toast variant="rich">

• Do not use when the information is critical and requires the user to act before continuing → use `Modal` instead
• Do not use when the message is directly related to a specific form field → use inline field validation instead
• Do not use when the event is complex and needs detailed explanation or multiple actions → reconsider `Modal` instead
• Avoid: Using `error` severity for a warning or caveat — AI.md/spec rules reserve `Error` for genuine failures only; softening a warning into an error misleads urgency.
• Avoid: Using `Toast` for actions requiring user response — AI.md explicitly forbids this; use `Modal` instead.
• Avoid: Adding "Successfully" as a prefix to toast copy — AI.md forbids this; state the outcome directly ("Changes saved", not "Successfully saved changes").
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Toolbar
`Toolbar` · node `725:48320`

```text
import { Toolbar } from 'ds-ngr'

• Do not mount a standalone `Toolbar` inside `Card`, `Modal`, or `Drawer` content to act as a footer → use the organism's own `bottomBarLeftActions` / `bottomBarRightActions` / `bottomBar` props instead
• Do not use for a single icon-only persistent toggle control → use `ToggleButton` instead
• Do not use for view-switching tabs → use `SegmentControl` or `Tabs` instead
• Avoid: Mounting a standalone `Toolbar` inside `Card`, `Modal`, or `Drawer` content — AI.md and the patterns specs require using the organism's built-in `bottomBarLeftActions`/`bottomBarRightActions`/`bottomBar` props instead; a manually mounted Toolbar duplicates chrome.
• Avoid: Adding `padding`/`margin`/`gap` directly to a `Toolbar` instance — AI.md explicitly forbids styling pre-built chrome like `Toolbar` and `SectionHeader` this way.
• Avoid: Mounting `Toolbar` inside `DataTable` — the filter bar is a sibling above `DataTable`, never inside it; `DataTable` has no toolbar prop.
• Use DS tokens; never hardcode colors, spacing or fonts.
```

## Tooltip
`Tooltip` · node `1017:7179`

```text
import { Tooltip } from 'ds-ngr'

• Use DS tokens; never hardcode colors, spacing or fonts.
```
