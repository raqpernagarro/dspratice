import type { ComponentSpec } from '../../spec/types'
import { gaugeBindings, gaugeParts, gaugeProps, valueAxis } from '../shared/gauge'

export const meterSpec: ComponentSpec = {
  name: 'Meter',
  slug: 'meter',
  axes: [valueAxis],
  parts: gaugeParts('Meter'),
  figmaProps: gaugeProps('Storage used'),
  bindings: gaugeBindings('meter', 'space/md'),
  docs: {
    summary: 'Shows a measurement within a known range: storage used, a password’s strength, a battery level.',
    baseUi: 'https://base-ui.com/react/components/meter',
    usage: ['Label what is measured and show the value (formatted with format, e.g. as a percentage or in GB).'],
    dont: ['Don’t use it for a task in progress; use Progress.'],
    accessibility: ['Renders role="meter" with aria-valuenow / min / max; the label names it.'],
  },
}
