// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=5291-723275
// source=src/components/atoms/ProgressBar/ProgressBar.tsx
// component=ProgressBar
import figma from 'figma'

export default {
  example: figma.code`<ProgressBar value={60} label="Upload progress" />`,
  imports: [
    "import { ProgressBar } from 'ds-ngr'",
  ],
  id: 'progress-bar',
  metadata: { nestable: true, props: {} },
}
