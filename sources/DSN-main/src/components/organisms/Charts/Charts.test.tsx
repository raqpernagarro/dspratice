import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
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
} from './Charts';

describe('Charts', () => {
  it('renders line chart container with aria label', () => {
    render(
      <LineChart
        data={[
          { month: 'Jan', active: 10 },
          { month: 'Feb', active: 20 },
        ]}
        xKey="month"
        series={[{ key: 'active', label: 'Active users' }]}
        aria-label="Activity chart"
      />,
    );

    expect(screen.getByRole('img', { name: 'Activity chart' })).toBeInTheDocument();
  });

  it('renders bar chart empty state', () => {
    render(<BarChart data={[]} xKey="quarter" series={[]} aria-label="Quarterly chart" />);

    expect(screen.getByText('No data available.')).toBeInTheDocument();
  });

  it('renders card skeleton for loading state with accessible status label', () => {
    const { container } = render(
      <LineChart
        data={[{ month: 'Jan', active: 10 }]}
        xKey="month"
        series={[{ key: 'active', label: 'Active' }]}
        state="loading"
        loadingLabel="Fetching metrics…"
        aria-label="Trend chart"
      />,
    );

    const status = screen.getByRole('status', { name: 'Fetching metrics…' });
    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByText('Loading chart data...')).not.toBeInTheDocument();
    expect(container.querySelector('.dsn-skeleton-loading[data-type="card"]')).toBeTruthy();
  });

  it('renders donut legend entries', () => {
    render(
      <DonutChart
        data={[
          { id: 'a', label: 'A', value: 40 },
          { id: 'b', label: 'B', value: 60 },
        ]}
      />,
    );

    expect(screen.getByRole('list', { name: 'Chart legend' })).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('renders chart inside chart card', () => {
    render(
      <ChartCard title="Performance">
        <LineChart
          data={[
            { month: 'Jan', active: 10 },
            { month: 'Feb', active: 20 },
          ]}
          xKey="month"
          series={[{ key: 'active', label: 'Active users' }]}
          aria-label="Card chart"
        />
      </ChartCard>,
    );

    expect(screen.getByRole('region', { name: 'Card' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Card chart' })).toBeInTheDocument();
  });

  it('renders additional visx chart variants', () => {
    render(
      <>
        <AreaChart
          data={[
            { month: 'Jan', a: 10, b: 6 },
            { month: 'Feb', a: 20, b: 12 },
          ]}
          xKey="month"
          series={[
            { key: 'a', label: 'A' },
            { key: 'b', label: 'B' },
          ]}
          aria-label="Area variant"
        />
        <HorizontalStackedBarChart
          data={[
            { team: 'A', x: 10, y: 5 },
            { team: 'B', x: 12, y: 8 },
          ]}
          categoryKey="team"
          series={[
            { key: 'x', label: 'X' },
            { key: 'y', label: 'Y' },
          ]}
          aria-label="Horizontal stack variant"
        />
        <StreamgraphChart
          data={[
            { month: 'Jan', alpha: 8, beta: 5 },
            { month: 'Feb', alpha: 12, beta: 9 },
          ]}
          xKey="month"
          series={[
            { key: 'alpha', label: 'Alpha' },
            { key: 'beta', label: 'Beta' },
          ]}
          aria-label="Streamgraph variant"
        />
        <BrushLineChart
          data={[
            { month: 'Jan', active: 10 },
            { month: 'Feb', active: 20 },
            { month: 'Mar', active: 30 },
          ]}
          xKey="month"
          series={[{ key: 'active', label: 'Active' }]}
          aria-label="Brush variant"
        />
        <HeatmapChart
          data={[
            {
              x: 'Mon',
              bins: [
                { y: 'Morning', value: 10 },
                { y: 'Afternoon', value: 22 },
              ],
            },
            {
              x: 'Tue',
              bins: [
                { y: 'Morning', value: 14 },
                { y: 'Afternoon', value: 18 },
              ],
            },
          ]}
          aria-label="Heatmap variant"
        />
      </>,
    );

    expect(screen.getByRole('img', { name: 'Area variant' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Horizontal stack variant' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Streamgraph variant' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Brush variant' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Heatmap variant' })).toBeInTheDocument();
  });
});
