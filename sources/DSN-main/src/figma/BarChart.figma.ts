// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=8868-25923
// source=src/components/organisms/Charts/BarChart.tsx
// component=BarChart
import figma from 'figma'

export default {
  example: figma.code`<BarChart
  data={data}
  xKey="month"
  series={series}
/>`,
  imports: [
    "import { BarChart } from 'ds-ngr'",
  ],
  id: 'bar-chart',
  metadata: { nestable: true, props: {} },
}
