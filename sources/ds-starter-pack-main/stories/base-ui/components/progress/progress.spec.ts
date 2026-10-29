import type { ComponentSpec } from '../../spec/types'
import { gaugeBindings, gaugeParts, gaugeProps, valueAxis } from '../shared/gauge'

export const progressSpec: ComponentSpec = {
  name: 'Progress',
  slug: 'progress',
  axes: [valueAxis],
  parts: gaugeParts('Progress'),
  figmaProps: gaugeProps('Export data'),
  bindings: gaugeBindings('progress', 'space/xs'),
  docs: {
    summary: 'Shows how far a task has got: an upload, an export, a multi-step process.',
    baseUi: 'https://base-ui.com/react/components/progress',
    usage: [
      'Label what is in progress; show the value when the user benefits from the number.',
      'Pass value={null} while the total is unknown: the bar becomes indeterminate (it sweeps).',
    ],
    dont: ['Don’t use it for a quantity that isn’t moving towards done (disk usage); use Meter.'],
    accessibility: ['Renders role="progressbar" with aria-valuenow; the label names it.'],
  },
}
