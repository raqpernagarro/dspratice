import { useEffect, useState } from 'react'

import { parseColor } from '../../../../stories/base-ui/tokens/color-math'

/** Type an exact color: #RRGGBB (or any CSS color). Applied on Enter or when leaving the field. */
export function HexField({ value, onChange, label }: { value: string; onChange: (hex: string) => void; label: string }) {
  const [draft, setDraft] = useState(value.toUpperCase())
  useEffect(() => setDraft(value.toUpperCase()), [value])
  const commit = () => {
    const v = draft.trim()
    const hex = /^[0-9a-f]{6}$/i.test(v) ? `#${v}` : v
    if (parseColor(hex)) onChange(hex)
    else setDraft(value.toUpperCase())
  }
  return (
    <input
      className="hex-field"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit()
      }}
      aria-label={label}
      spellCheck={false}
    />
  )
}
