# DateTimePicker

**Tier:** atom  
**Location:** `src/components/atoms/DateTimePicker/DateTimePicker.spec.md`  
**Version:** 1.0.0

## What it is

A form field for picking a single date or a date range, optionally with a time, shown as a typed input with a popover calendar or as an always-visible inline calendar, with preset chips and an optional Cancel / Confirm bar.

## When to use

- Use when the user must pick a specific date or date range in a form or panel — due dates, event dates, report periods, booking windows
- Use `selectionMode="range"` when the value has a start and an end
- Use `withTime` when the time of day matters (meetings, deadlines with a time)
- Use `displayMode="inline"` when date selection is the main focus of the view (a dedicated scheduling or booking step)

## When NOT to use

- Do not use to show or manage events on a calendar → use `CalendarView` instead
- Do not use for relative periods that are not calendar-specific ("Last 7 days", "This quarter") → use `Select` or `SegmentControl` instead
- Do not use for a date the user already knows exactly and types faster than they pick (e.g. date of birth) → use `TextInput` with format guidance instead
- `DatePicker` and `DateRangePicker` do not exist → use `DateTimePicker` with `selectionMode="single"` or `"range"`

## Variant selection

### `selectionMode` prop

| Value | Use when |
|-------|----------|
| `"single"` (default) | One date (or date and time) |
| `"range"` | A start and end — renders separate start and end inputs; clicks set start, then end |

### `displayMode` prop

| Value | Use when |
|-------|----------|
| `"popover"` (default) | The date is one field among several in a form — the calendar opens from the input |
| `"inline"` | Date selection is the primary task of the view — the calendar is always visible |

### `withTime` prop

| Value | Use when |
|-------|----------|
| `false` (default) | Date only. In popover mode without the action bar, picking a day commits and closes. |
| `true` | Date and time — adds a time field; natural entries like "7 am" or "noon" are parsed |

## Spatial contract

- **Owns its padding:** yes — label, input and helper row own their spacing
- **Owns its margin:** no
- **Fills its container:** yes — the input stretches to its parent's width; constrain width on a wrapper
- **Notes:** in popover mode the calendar is portalled and positioned by `PopoverWrapper` below the input, flipping when there is no room, and closes when the page scrolls.

## Composition rules

- ✅ Can be used inside: `Form`, `Fieldset`, `Drawer` and `Modal` content, filter panels
- ❌ Never place inside: a `PopoverMenu` or another popover — it opens its own popover
- ❌ Never combine with: a separate `Select` of presets — pass them as `presets`

## Props reference

| Prop | Type | When to set |
|------|------|-------------|
| `label` | `string` | Always — what the date represents: "Due date", "Report period" |
| `value` + `onChange` | `DateTimePickerValue` + callback | Controlled usage — `Date` for single, `{ start, end }` for range |
| `presets` | `DateTimePickerPreset[]` | Omit for the built-in shortcuts (single: Today, Yesterday, Last Friday; range: Today, Yesterday, Last week, Last month, Last year — previous calendar week/month/year). Pass your own for other periods, or `[]` to hide them. |
| `showActions` + `onConfirm` | `boolean` + callback | On by default. Commit the value in `onConfirm`; set `showActions={false}` for quick single-date picks |
| `helperText` | `string` | The default is the literal "Help text" — override it, or pass `''` |
| `placeholder` / `startPlaceholder` / `endPlaceholder` | `string` | When the defaults don't describe the expected entry; typed dates use MM-DD-YYYY |
| `error` + `errorMessage` | `boolean` + `string` | Validation errors: "Select an end date", "End date must be after start date" |
| `optional` | `boolean` | The field is not mandatory — appends "(optional)" to the label |
| `open` / `onOpenChange` | `boolean` / callback | Only to control the popover from outside |

Not supported: minimum / maximum dates, disabled dates, and a two-month range view. Validate constraints in the form and show them in `helperText` before the user opens the calendar.

## Common mistakes

1. **Using `DatePicker` / `DateRangePicker`** — they don't exist; see When NOT to use.
2. **Using it for a scheduling view** — see When NOT to use (`CalendarView`).
3. **Shipping the default "Help text"** — see Props reference.
4. **Pre-selecting today for historical dates** — leave historical fields (e.g. date of birth) empty; pre-select today only when scheduling something now.

## Examples

```tsx
// Most common usage — a due date in a form
<DateTimePicker
  label="Due date"
  value={dueDate}
  onChange={setDueDate}
  presets={[]}
  showActions={false}
  helperText=""
/>

// Non-obvious: a report period with time and custom presets
<DateTimePicker
  label="Report period"
  selectionMode="range"
  withTime
  presets={[
    { id: 'last-7', label: 'Last 7 days', value: { start: subDays(today, 6), end: today } },
    { id: 'last-30', label: 'Last 30 days', value: { start: subDays(today, 29), end: today } },
  ]}
  onConfirm={setPeriod}
  helperText="Up to 90 days."
/>
```
