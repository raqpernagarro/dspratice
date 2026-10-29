// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=8868-25925
// source=src/components/organisms/Charts/DonutChart.tsx
// component=DonutChart
import figma from 'figma'

export default {
  example: figma.code`<DonutChart
  data={slices}
/>`,
  imports: [
    "import { DonutChart } from 'ds-ngr'",
  ],
  id: 'donut-chart',
  metadata: { nestable: true, props: {} },
}
