import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../../atoms/Button';
import {
  AreaChart,
  BarChart,
  BrushLineChart,
  ChartCard,
  DonutChart,
  HeatmapChart,
  HorizontalStackedBarChart,
  LineChart,
  StreamgraphChart,
  XYLineChart,
} from './Charts';
import areaChartSpec from './AreaChart.spec.md?raw';
import barChartSpec from './BarChart.spec.md?raw';
import brushLineChartSpec from './BrushLineChart.spec.md?raw';
import chartCardSpec from './ChartCard.spec.md?raw';
import donutChartSpec from './DonutChart.spec.md?raw';
import heatmapChartSpec from './HeatmapChart.spec.md?raw';
import horizontalStackedBarChartSpec from './HorizontalStackedBarChart.spec.md?raw';
import lineChartSpec from './LineChart.spec.md?raw';
import streamgraphChartSpec from './StreamgraphChart.spec.md?raw';
import xyLineChartSpec from './XYLineChart.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

const lineData = [
  { month: 'Jan', active: 34 },
  { month: 'Feb', active: 45 },
  { month: 'Mar', active: 41 },
  { month: 'Apr', active: 57 },
  { month: 'May', active: 62 },
  { month: 'Jun', active: 58 },
];

const barData = [
  { quarter: 'Q1', inbound: 120, outbound: 90 },
  { quarter: 'Q2', inbound: 140, outbound: 110 },
  { quarter: 'Q3', inbound: 160, outbound: 130 },
  { quarter: 'Q4', inbound: 180, outbound: 150 },
];

const donutData = [
  { id: 'new', label: 'New', value: 44 },
  { id: 'qualified', label: 'Qualified', value: 31 },
  { id: 'won', label: 'Won', value: 25 },
];

const lineComparisonData = [
  { month: 'Jan', current: 34, previous: 27 },
  { month: 'Feb', current: 45, previous: 30 },
  { month: 'Mar', current: 41, previous: 37 },
  { month: 'Apr', current: 57, previous: 43 },
  { month: 'May', current: 62, previous: 49 },
  { month: 'Jun', current: 58, previous: 52 },
];

const monthlyBarData = [
  { month: 'Jan', inbound: 95, outbound: 66, resolved: 58 },
  { month: 'Feb', inbound: 104, outbound: 71, resolved: 62 },
  { month: 'Mar', inbound: 117, outbound: 84, resolved: 70 },
  { month: 'Apr', inbound: 123, outbound: 88, resolved: 73 },
  { month: 'May', inbound: 139, outbound: 96, resolved: 80 },
  { month: 'Jun', inbound: 151, outbound: 109, resolved: 92 },
];

const donutDetailedData = [
  { id: 'lead', label: 'Lead', value: 26 },
  { id: 'qualified', label: 'Qualified', value: 19 },
  { id: 'proposal', label: 'Proposal', value: 15 },
  { id: 'negotiation', label: 'Negotiation', value: 11 },
  { id: 'won', label: 'Won', value: 29 },
];

const segmentData = [
  { segment: 'Enterprise', productA: 140, productB: 92, productC: 54 },
  { segment: 'Mid-market', productA: 110, productB: 81, productC: 67 },
  { segment: 'SMB', productA: 90, productB: 74, productC: 58 },
  { segment: 'Startup', productA: 63, productB: 49, productC: 34 },
];

const heatmapData = [
  {
    x: 'Mon',
    bins: [
      { y: '09:00', value: 12 },
      { y: '12:00', value: 28 },
      { y: '15:00', value: 19 },
      { y: '18:00', value: 8 },
    ],
  },
  {
    x: 'Tue',
    bins: [
      { y: '09:00', value: 14 },
      { y: '12:00', value: 31 },
      { y: '15:00', value: 21 },
      { y: '18:00', value: 10 },
    ],
  },
  {
    x: 'Wed',
    bins: [
      { y: '09:00', value: 18 },
      { y: '12:00', value: 36 },
      { y: '15:00', value: 26 },
      { y: '18:00', value: 12 },
    ],
  },
  {
    x: 'Thu',
    bins: [
      { y: '09:00', value: 11 },
      { y: '12:00', value: 29 },
      { y: '15:00', value: 20 },
      { y: '18:00', value: 9 },
    ],
  },
  {
    x: 'Fri',
    bins: [
      { y: '09:00', value: 9 },
      { y: '12:00', value: 23 },
      { y: '15:00', value: 16 },
      { y: '18:00', value: 7 },
    ],
  },
];

const meta: Meta<typeof LineChart> = {
  title: 'Data Display/Charts',
  component: LineChart,
  tags: ['autodocs'],
  parameters: specDocsParameters(lineChartSpec),
};

export default meta;
type Story = StoryObj<typeof LineChart>;

export const Playground: Story = {
  args: {
    data: lineData,
    xKey: 'month',
    series: [{ key: 'active', label: 'Active users' }],
    'aria-label': 'Monthly active users',
  },
  parameters: specDocsParameters(lineChartSpec),
};

export const Bars: StoryObj<typeof BarChart> = {
  render: () => (
    <BarChart
      data={barData}
      xKey="quarter"
      series={[
        { key: 'inbound', label: 'Inbound' },
        { key: 'outbound', label: 'Outbound' },
      ]}
      aria-label="Quarterly traffic"
    />
  ),
  parameters: specDocsParameters(barChartSpec),
};

export const Donut: StoryObj<typeof DonutChart> = {
  render: () => <DonutChart data={donutData} aria-label="Pipeline composition" />,
  parameters: specDocsParameters(donutChartSpec),
};

export const LineComparison: StoryObj<typeof LineChart> = {
  render: () => (
    <LineChart
      data={lineComparisonData}
      xKey="month"
      series={[
        { key: 'current', label: 'Current period' },
        { key: 'previous', label: 'Previous period' },
      ]}
      aria-label="Current versus previous performance"
    />
  ),
  parameters: specDocsParameters(lineChartSpec),
};

export const Area: StoryObj<typeof AreaChart> = {
  render: () => (
    <AreaChart
      data={lineComparisonData}
      xKey="month"
      series={[
        { key: 'current', label: 'Current period' },
        { key: 'previous', label: 'Previous period' },
      ]}
      aria-label="Area chart comparison"
    />
  ),
  parameters: specDocsParameters(areaChartSpec),
};

export const BarsThreeSeries: StoryObj<typeof BarChart> = {
  render: () => (
    <BarChart
      data={monthlyBarData}
      xKey="month"
      series={[
        { key: 'inbound', label: 'Inbound' },
        { key: 'outbound', label: 'Outbound' },
        { key: 'resolved', label: 'Resolved' },
      ]}
      height={280}
      aria-label="Monthly inbound outbound resolved volume"
    />
  ),
  parameters: specDocsParameters(barChartSpec),
};

export const HorizontalStackedBars: StoryObj<typeof HorizontalStackedBarChart> = {
  render: () => (
    <HorizontalStackedBarChart
      data={segmentData}
      categoryKey="segment"
      series={[
        { key: 'productA', label: 'Product A' },
        { key: 'productB', label: 'Product B' },
        { key: 'productC', label: 'Product C' },
      ]}
      aria-label="Horizontal stacked bar chart"
    />
  ),
  parameters: specDocsParameters(horizontalStackedBarChartSpec),
};

export const Streamgraph: StoryObj<typeof StreamgraphChart> = {
  render: () => (
    <StreamgraphChart
      data={monthlyBarData}
      xKey="month"
      series={[
        { key: 'inbound', label: 'Inbound' },
        { key: 'outbound', label: 'Outbound' },
        { key: 'resolved', label: 'Resolved' },
      ]}
      aria-label="Streamgraph chart"
    />
  ),
  parameters: specDocsParameters(streamgraphChartSpec),
};

export const Brush: StoryObj<typeof BrushLineChart> = {
  render: () => (
    <BrushLineChart
      data={lineComparisonData}
      xKey="month"
      series={[
        { key: 'current', label: 'Current period' },
        { key: 'previous', label: 'Previous period' },
      ]}
      aria-label="Brush line chart"
    />
  ),
  parameters: specDocsParameters(brushLineChartSpec),
};

export const XY: StoryObj<typeof XYLineChart> = {
  render: () => (
    <XYLineChart
      data={lineComparisonData}
      xKey="month"
      series={[
        { key: 'current', label: 'Current period' },
        { key: 'previous', label: 'Previous period' },
      ]}
      aria-label="XY chart line"
    />
  ),
  parameters: specDocsParameters(xyLineChartSpec),
};

export const Heatmap: StoryObj<typeof HeatmapChart> = {
  render: () => <HeatmapChart data={heatmapData} aria-label="Weekly activity heatmap" />,
  parameters: specDocsParameters(heatmapChartSpec),
};

export const DonutDetailed: StoryObj<typeof DonutChart> = {
  render: () => (
    <DonutChart
      data={donutDetailedData}
      innerRadius={62}
      outerRadius={98}
      height={300}
      aria-label="Detailed pipeline stages"
    />
  ),
  parameters: specDocsParameters(donutChartSpec),
};

export const InCard: StoryObj<typeof ChartCard> = {
  render: () => (
    <div style={{ maxWidth: 480 }}>
      <ChartCard
        title="Pipeline overview"
        description="Current distribution by stage"
        showBottomBar
        bottomBarRightActions={
          <Button variant="secondary" size="md">
            More details
          </Button>
        }
      >
        <DonutChart data={donutData} aria-label="Pipeline overview chart" />
      </ChartCard>
    </div>
  ),
  parameters: specDocsParameters(chartCardSpec),
};

export const LoadingState: StoryObj<typeof LineChart> = {
  args: {
    data: [],
    xKey: 'month',
    series: [{ key: 'active', label: 'Active users' }],
    state: 'loading',
    'aria-label': 'Loading line chart',
  },
  parameters: specDocsParameters(lineChartSpec),
};

export const EmptyState: StoryObj<typeof BarChart> = {
  render: () => (
    <BarChart
      data={[]}
      xKey="month"
      series={[{ key: 'value', label: 'Value' }]}
      state="empty"
      emptyMessage="No chart data for the selected period."
      aria-label="Empty bar chart"
    />
  ),
  parameters: specDocsParameters(barChartSpec),
};

export const Error: StoryObj<typeof DonutChart> = {
  render: () => (
    <DonutChart
      data={[]}
      state="error"
      errorMessage="Could not load pipeline data."
      aria-label="Errored donut chart"
    />
  ),
  parameters: specDocsParameters(donutChartSpec),
};

export const LineInCard: StoryObj<typeof ChartCard> = {
  render: () => (
    <div style={{ maxWidth: 760 }}>
      <ChartCard
        title="Monthly active users"
        description="Current period compared with previous period"
        showBottomBar
        bottomBarRightActions={
          <Button variant="secondary" size="md">
            Export CSV
          </Button>
        }
      >
        <LineChart
          data={lineComparisonData}
          xKey="month"
          series={[
            { key: 'current', label: 'Current period' },
            { key: 'previous', label: 'Previous period' },
          ]}
          aria-label="Monthly active users in card"
        />
      </ChartCard>
    </div>
  ),
  parameters: specDocsParameters(chartCardSpec),
};
