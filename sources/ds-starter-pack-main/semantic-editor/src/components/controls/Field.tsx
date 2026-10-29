import type { ReactNode } from 'react'

export function FieldGroup({
  title,
  hint,
  value,
  customized,
  onReset,
  children,
}: {
  title: string
  hint?: string
  /** Current value summary, always shown. */
  value?: ReactNode
  customized?: boolean
  onReset?: () => void
  children: ReactNode
}) {
  return (
    <section className="field-group">
      <header className="field-group__head">
        <h3 className="field-group__title">
          {title}
          {customized ? <i className="color-editor__dot" title="Changed" /> : null}
        </h3>
        {value != null ? <span className="field-group__value">{value}</span> : null}
        {customized && onReset ? (
          <button type="button" className="field-group__reset" onClick={onReset} title="Back to the default">
            Reset
          </button>
        ) : null}
      </header>
      {hint ? <p className="field-group__hint">{hint}</p> : null}
      <div className="field-group__body">{children}</div>
    </section>
  )
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T | null
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label} style={{ ['--count' as string]: options.length }}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          className={value === o.value ? 'is-active' : ''}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  formatValue,
  marks,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  formatValue?: (value: number) => string
  /** Labels shown under the track, spread evenly. */
  marks?: string[]
}) {
  const display = formatValue ? formatValue(value) : String(value)
  return (
    <label className="slider-field">
      <div className="slider-field__header">
        <span>{label}</span>
        <span className="slider-field__value">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {marks ? (
        <div className="slider-field__marks" aria-hidden="true">
          {marks.map((m) => (
            <span key={m}>{m}</span>
          ))}
        </div>
      ) : null}
    </label>
  )
}

export function SwitchField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="switch-field">
      <span className="switch-field__text">
        <span>{label}</span>
        {description ? <small>{description}</small> : null}
      </span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="switch-field__track" aria-hidden="true" />
    </label>
  )
}

export function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  return (
    <label className="select-field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}
