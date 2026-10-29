// url=https://www.figma.com/design/9Lqv0lrj1pRM14NVs4TsSk/DS-Nagarro?node-id=8868-25924
// source=src/components/organisms/Charts/LineChart.tsx
// component=LineChart
import figma from 'figma'

export default {
  example: figma.code`<LineChart
  data={data}
  xKey="month"
  series={series}
/>`,
  imports: [
    "import { LineChart } from 'ds-ngr'",
  ],
  id: 'line-chart',
  metadata: { nestable: true, props: {} },
}
