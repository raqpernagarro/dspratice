import * as React from 'react'

/** Shared markup of Progress and Meter: header (label, value) over track › indicator. */
export interface GaugeParts {
  Root: React.ElementType
  Label: React.ElementType
  Value: React.ElementType
  Track: React.ElementType
  Indicator: React.ElementType
}

export function gauge(slug: string, P: GaugeParts) {
  return function Gauge({ label, showValue = true, className, ...props }: { label?: React.ReactNode; showValue?: boolean; className?: string } & Record<string, unknown>) {
    return (
      <P.Root className={[`ds-${slug}`, className].filter(Boolean).join(' ')} {...props}>
        {label || showValue ? (
          <div className={`ds-${slug}__header`}>
            {label ? <P.Label className={`ds-${slug}__label`}>{label}</P.Label> : <span />}
            {showValue ? <P.Value className={`ds-${slug}__value`} /> : null}
          </div>
        ) : null}
        <P.Track className={`ds-${slug}__track`}>
          <P.Indicator className={`ds-${slug}__indicator`} />
        </P.Track>
      </P.Root>
    )
  }
}
