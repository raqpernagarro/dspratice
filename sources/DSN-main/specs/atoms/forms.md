{% raw %}
# DS-Ngr — Forms

Import form components from `ds-ngr`:

```tsx
import { TextInput, TextArea, SearchInput, Select, Checkbox, Radio, Switcher } from 'ds-ngr'
```

## Form rules — always follow

- Every field is **mandatory by default** — mark optional fields with the input `optional` prop; see AI.md LCB-08.
- Primary submit button must be **disabled** until all mandatory fields have a value
- Validate on submit only — not in real time as the user types
- Exceptions for real-time validation: password strength, character count, search, OTP

## TextInput

```tsx
<TextInput
  label="Project name"
  placeholder="e.g. Q4 campaign"
  value={value}
  onChange={(e) => setValue(e.target.value)}
  helpText="This will be visible to all team members."
/>

// Optional field
<TextInput
  label="Team"
  optional
  placeholder="e.g. Design"
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>

// Error state
<TextInput
  label="Email address"
  value={value}
  onChange={(e) => setValue(e.target.value)}
  error
  errorMessage="Please enter a valid email address."
/>
```

**Props:**
| Prop | Type | Description |
|---|---|---|
| `label` | string \| ReactNode | Field label — always required |
| `placeholder` | string | Example of expected format, not a label |
| `value` | string | Controlled value |
| `onChange` | function | Change handler |
| `helpText` | string | Supplementary guidance below field |
| `error` | boolean | Error state |
| `errorMessage` | string | Error message — full sentence with period |
| `disabled` | boolean | Disabled state |
| `size` | `'sm' \| 'md'` | Field size, `md` is default |

## TextArea

```tsx
<TextArea
  label="Description"
  placeholder="Describe the project goals..."
  value={value}
  onChange={(e) => setValue(e.target.value)}
  rows={4}
/>
```

Use for multi-line free-form text. Never use TextInput for multi-line content.

## SearchInput

```tsx
<SearchInput
  placeholder="Search projects..."
  value={searchValue}
  onChange={(e) => setSearchValue(e.target.value)}
  onClear={() => setSearchValue('')}
/>
```

Always include `onClear` to show the clear (×) button when field has a value.

## Select

```tsx
<Select
  label="Status"
  value={status}
  onChange={(value) => setStatus(value)}
  options={[
    { value: '', label: 'Select status' },
    { value: 'not-started', label: 'Not started' },
    { value: 'in-progress', label: 'In progress' },
    { value: 'completed', label: 'Completed' },
  ]}
/>
```

**Props:**
| Prop | Type | Description |
|---|---|---|
| `label` | string | Field label |
| `value` | string | Selected value |
| `onChange` | function | Change handler |
| `options` | Option[] | List of options |
| `placeholder` | string | Default empty option |
| `error` | boolean | Error state |
| `disabled` | boolean | Disabled state |

Always include an empty placeholder option that is NOT a valid value.
Use Select for 7+ options. For ≤6 options with space, prefer Radio.

## Checkbox

```tsx
// Single checkbox
<Checkbox
  label="Send email notifications"
  checked={checked}
  onChange={(e) => setChecked(e.target.checked)}
/>

// Checkbox group
<fieldset>
  <legend>Notification preferences</legend>
  <Checkbox label="Weekly summary" checked={weekly} onChange={(e) => setWeekly(e.target.checked)} />
  <Checkbox label="Mentions only" checked={mentions} onChange={(e) => setMentions(e.target.checked)} />
</fieldset>
```

Use for: selecting any number of independent options, effect on submit.
Never use when: only one can be selected (→ Radio), effect is immediate (→ Switcher).

## Radio

```tsx
<fieldset>
  <legend>Priority</legend>
  <Radio
    label="High"
    name="priority"
    value="high"
    checked={priority === 'high'}
    onChange={() => setPriority('high')}
  />
  <Radio
    label="Medium"
    name="priority"
    value="medium"
    checked={priority === 'medium'}
    onChange={() => setPriority('medium')}
  />
  <Radio
    label="Low"
    name="priority"
    value="low"
    checked={priority === 'low'}
    onChange={() => setPriority('low')}
  />
</fieldset>
```

Use for: exactly one option from a mutually exclusive set (2–6 options), effect on submit.
Use Select for 7+ options.

## Switcher

```tsx
<Switcher
  label="Email notifications"
  checked={enabled}
  onChange={(checked) => setEnabled(checked)}
/>
```

Use for: single binary setting with **immediate** effect.
Never use without a visible label.

## Form layout example

```tsx
import { TextInput, Select, Button } from 'ds-ngr'

function NewProjectForm({ onSubmit, onCancel }) {
  const [name, setName] = React.useState('')
  const [status, setStatus] = React.useState('')
  const isValid = name.length > 0 && status.length > 0

  return (
    <form onSubmit={onSubmit}>
      <TextInput
        label="Project name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Q4 campaign"
      />

      <Select
        label="Status"
        value={status}
        onChange={setStatus}
        options={[
          { value: '', label: 'Select status' },
          { value: 'not-started', label: 'Not started' },
          { value: 'in-progress', label: 'In progress' },
        ]}
      />

      <div style={{ display: 'flex', gap: 'var(--space-xs)', justifyContent: 'flex-end' }}>
        <Button variant="ghost" label="Cancel" onClick={onCancel} />
        <Button variant="primary" label="Create project" disabled={!isValid} onClick={onSubmit} />
      </div>
    </form>
  )
}
```

## Error message writing rules

- Full sentences with a period at the end
- Specific and instructive: what went wrong + how to fix it
- Never blame the user

| Situation | Pattern | Example |
|---|---|---|
| Required field empty | Please enter [field name]. | Please enter a project name. |
| Wrong format | Please enter [field name] in the correct format. | Please enter your email in the correct format. |
| Too short | Please enter at least [N] characters. | Please enter at least 8 characters. |
| System fault | Sorry, [what happened]. Please [action]. | Sorry, we couldn't save your changes. Please try again. |
{% endraw %}
