# Form

**Tier:** molecule
**Location:** `src/components/molecules/Form/Form.spec.md`
**Version:** 1.0.0

## When to use

- Use for any **submittable group of fields** — create/edit record flows, settings panels, modal forms, drawer forms.
- Use when submit-time validation, disabled primary CTA logic, and focus management on failed submit should be consistent across the product.
- Use as the parent that owns **vertical rhythm between direct child inputs** (`TextInput`, `Select`, `NumberInput`, `CheckboxField`, `ChipField`, `Fieldset`, etc.).

## When NOT to use

- Do not use for read-only detail views with no submit action → plain layout stack without `<form>`.
- Do not use for grouping related fields without submission → use `Fieldset` inside a layout stack, or bare inputs with parent `gap`.
- Do not use as the AppShell page root → `Form` lives inside `Card` content, drawer bodies, or modal bodies per `form-page` pattern.
- Do not use for a single standalone field with no submit → mount the input directly.
- Do not use for search/filter toolbars with immediate effect → toolbar pattern, not submit form.
- Do not replace `Card` bottom bar — primary/secondary actions still render in `Card` `bottomBar*` props; `Form` wires submit behavior to those buttons.

### Disambiguation

| Primitive | Purpose |
|-----------|---------|
| `Form` | Submittable field group; owns field-to-field vertical rhythm and submit orchestration |
| `Fieldset` | Semantic grouping under a legend inside a form; does not handle submission |
| Layout stack without `Form` | Read-only content, filters, or non-submitting settings previews |

## What it is

A semantic `<form>` wrapper that composes existing DS input components directly with consistent vertical spacing, submit validation orchestration hooks, primary CTA disabled-state contract, and focus management when submit fails. Each input retains its own label, helper text, error message, and internal spacing — `Form` does not wrap or replace input anatomy.

`Form` does not render action buttons — it coordinates with external `Button` / `Toolbar` actions via `onSubmit` and the `form` attribute on submit buttons.

## Variant selection

No visual variants. Form behavior is controlled by props (`validateOn`, `disabled`, etc.).

## Anatomy and spatial contract

```
<Form>
  <TextInput label="Project name" … />
  <Select label="Status" … />
  <Fieldset legend="Schedule">…</Fieldset>
</Form>
[Toolbar / buttons outside Form]     ← typical Card bottom bar pattern
```

### Input field anatomy (owned by each input, not Form)

Each input component owns the vertical spacing between its own **label → control → help text → error message**. Consuming code never adds margins between those internal parts. This is already true in code for `TextInput`, `Select`, `NumberInput`, and the other input atoms.

### Spacing ownership

- **Owns vertical rhythm between direct children:** yes — `gap: var(--space-md)` on the internal stack.
- **Owns spacing inside inputs:** no — label/control/meta gaps remain owned by each input component.
- **Owns external margin:** no — spacing to `SectionHeader`, card edges, and toolbar defers to `Card` / page layout.
- **Owns its padding:** no.
- **Fills its container:** yes — children stretch horizontally.
- **Defers to parent:** card content padding (`Card` owns inset); gap between multiple cards on a form page (`--space-lg` on page stack).

Input components **never add external margin** between sibling fields — that rhythm is owned by `Form` (or an explicit parent `gap` when no `Form` is used).

## Behavior rules

| Rule | Enforcement |
|------|-------------|
| Mandatory by default | Documented on each input; `optional` prop marks exceptions. `Form` treats non-`optional` fields as required for CTA enablement when `disableSubmitUntilValid={true}` (default). |
| No required marker | Inputs cannot render an asterisk or any visual required indicator. |
| Validate on submit | Default: validation runs on `submit` event, not on every keystroke. |
| Real-time exceptions | Password strength, character count, search, OTP — child controls keep their existing inline validation; `Form` does not suppress them. |
| Primary CTA disabled | When `disableSubmitUntilValid={true}`, consumer wires primary `Button` `disabled` until all mandatory fields have values. |
| Submit shortcut | Documented consumer rule: primary submit shows `⌘↵` via `Shortcut` — not rendered by `Form`. |
| Failed submit focus | On failed validation, `Form` focuses the first invalid field and scrolls it into view. |
| Inline errors only | Each invalid field shows its own error via its existing `error` + `errorMessage` props. No form-level error summary in v1. |
| Error persistence | Field errors remain until cleared by re-validation on a subsequent submit or explicit state reset. |

## Composition rules

- ✅ Direct children: DS input components (`TextInput`, `Select`, `NumberInput`, `TextArea`, `PasswordInput`, `PhoneInput`, `DateTimePicker`, `Combobox`, `CheckboxField`, `ChipField`, `SingleChoice`, `MultiChoice`, `Switcher`, etc.) and `Fieldset`.
- ✅ Inside `Card` content, `Modal` body, `Drawer` body.
- ✅ Primary submit triggered by `type="submit"` button inside or associated with the form (`form` attribute).
- ❌ Never add `gap` or `margin` on individual inputs inside `Form` — `Form` owns field-to-field rhythm.
- ❌ Never nest `Form` inside `Form`.
- ❌ Never put the primary submit only in `Navbar` — belongs in card bottom bar per `form-page` pattern.
- ❌ Never enable the primary CTA before mandatory fields are valid when using `disableSubmitUntilValid`.

## Props reference

| Prop | Type | Default | When to set |
|------|------|---------|-------------|
| `onSubmit` | `(event: FormEvent) => void` | — | Called when submit fires and `onValidate` returns no errors. |
| `onValidate` | `() => Record<string, string \| undefined>` | — | Return field-id → error message map on submit. Empty object = valid. |
| `fieldErrors` | `Record<string, string>` | — | Controlled error messages keyed by input `id` or `name`. |
| `disableSubmitUntilValid` | `boolean` | `true` | When true, exposes validity for primary CTA wiring. |
| `onValidityChange` | `(isValid: boolean) => void` | — | Notifies when mandatory-field completeness changes. |
| `validateOn` | `'submit'` | `'submit'` | v1 only supports submit-time validation. |
| `disabled` | `boolean` | `false` | Disables all fields and blocks submit. |
| `id` | `string` | auto | Form element id; pairs with submit button `form` attribute when needed. |
| `children` | `React.ReactNode` | — | Input components and `Fieldset` elements. |
| `className` | `string` | — | Optional root class. |
| `noValidate` | `boolean` | `true` | Suppress native browser validation UI; DSN validation only. |

No compositional subcomponents (`Form.Root`, `Form.Field`, etc.). One flat component API.

`Form` does not accept `title`, `actions`, or `footer` props — those belong to `Card` / `Modal` / page layout.

## Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Semantic form | Renders native `<form>` with `noValidate` (DSN validation replaces native bubbles). |
| Submit association | Submit buttons use `type="submit"` or `form={formId}`. |
| Enter to submit | Enter in single-line fields submits the form when appropriate; `TextArea` excludes implicit submit. |
| First invalid focus | On failed `onValidate`, focus moves to the first input with an error — keyboard-safe, no focus trap. |
| Scroll into view | First invalid field scrolls into view with `scroll-margin` respecting sticky headers (implementation detail). |
| Error announcement | Per-input polite live regions (owned by each input's error row); no assertive form-level region in v1. |

## Implementation notes

### Failed-submit focus

On failed submit, `Form` queries the live DOM for the first descendant with `[aria-invalid="true"]` inside the `<form>`, then focuses the nearest focusable control (the invalid element itself when focusable, otherwise the first focusable descendant). DS inputs already set `aria-invalid` on their interactive control when `error={true}` — no consumer ref wiring is required.

### Mandatory-field completeness (`onValidityChange`)

When `disableSubmitUntilValid={true}`, `Form` scans the live DOM for controls with `[aria-required="true"]` and checks each for a value. DS inputs set `aria-required` when not `optional`; custom triggers such as `Select` expose `data-placeholder` on the value slot when empty. A `MutationObserver` plus `input`/`change` listeners re-report completeness as fields fill — consumers do not pass refs or field registries.

### Error injection

`Form` clones direct children (and `Fieldset` descendants) to pass `error` and `errorMessage` from `onValidate` results or controlled `fieldErrors`, keyed by each field's `id` or `name`.

## Common mistakes

1. **Adding `marginBottom` on inputs inside `Form`** — duplicates `Form` internal rhythm.
2. **Validating on every keystroke** — violates DSN submit-validation rule (except documented exceptions).
3. **Enabling primary CTA while mandatory fields are empty** — wire `onValidityChange` / `disableSubmitUntilValid`.
4. **Omitting `⌘↵` on primary submit** — consumer responsibility per LCB-10.
5. **Using raw `<form>` without `Form`** — loses focus-first-invalid and spacing contract.
6. **Expecting `Form` to render buttons** — actions live in `Card` toolbar.
7. **Hand-composing label + input + error** — use each input's built-in `label`, `helperText`, and `errorMessage` props.

## Examples

```tsx
<Card
  title="Project details"
  showBottomBar
  bottomBarRightActions={
    <Button type="submit" form="project-form" variant="primary" disabled={!isValid}
      shortcut shortcutLabel="⌘↵" shortcutAriaLabel="Command Enter">
      Create project
    </Button>
  }
>
  <Form
    id="project-form"
    onSubmit={handleCreate}
    onValidate={validateProject}
    onValidityChange={setIsValid}
    fieldErrors={errors}
  >
    <TextInput label="Project name" value={name} onChange={…} />
    <Select label="Status" options={statusOptions} value={status} onChange={setStatus} />
    <Fieldset legend="Schedule">
      <DateTimePicker label="Start date" value={start} onChange={setStart} />
      <DateTimePicker label="Due date" optional value={due} onChange={setDue} />
    </Fieldset>
  </Form>
</Card>
```

## Tokens referenced

| Token | Purpose in Form |
|-------|-----------------|
| `--space-md` | Vertical rhythm between direct child inputs and fieldsets (→ `--space-md`) |
| `--space-md` | Scroll margin for first invalid field focus |

### Needs Figma counterpart first

None identified for v1.
