import React from 'react';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { Brush } from '@visx/brush';
import { Group } from '@visx/group';
import { HeatmapRect } from '@visx/heatmap';
import { scaleBand, scaleLinear, scaleOrdinal } from '@visx/scale';
import { AreaClosed, Bar, LinePath, Pie } from '@visx/shape';
import {
  XYChart,
  AnimatedAxis,
  AnimatedGrid,
  AnimatedLineSeries,
  Tooltip,
} from '@visx/xychart';
import { SkeletonLoading } from '../../atoms/SkeletonLoading';
import { Card, type CardProps } from '../Card';
import type { ChartDataPoint, ChartDonutSlice, ChartSeries, ChartState } from '../../../types/common';
import './Charts.css';

const DATAVIZ_PALETTE = [
  'var(--color-background-dataviz-1)',
  'var(--color-background-dataviz-2)',
  'var(--color-background-dataviz-3)',
  'var(--color-background-dataviz-4)',
  'var(--color-background-dataviz-5)',
  'var(--color-background-dataviz-6)',
  'var(--color-background-dataviz-7)',
  'var(--color-background-dataviz-8)',
];
const DATAVIZ_GRID_COLOR = 'var(--color-border-dataviz-grid)';
const DATAVIZ_AXIS_COLOR = 'var(--color-border-dataviz-axis)';
const DATAVIZ_LABEL_COLOR = 'var(--color-foreground-dataviz-label)';
const CHART_WIDTH = 640;
const CHART_MARGIN = { top: 12, right: 16, bottom: 36, left: 44 };

/**
 * Measures the chart surface so SVG charts draw at the container's real pixel
 * width (crisp 12px labels, plot fills the card) instead of scaling a fixed
 * 640px drawing. Falls back to CHART_WIDTH before measurement / without
 * ResizeObserver (SSR, jsdom).
 */
function useChartWidth(): [React.RefObject<HTMLDivElement>, number] {
  const ref = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(CHART_WIDTH);
  React.useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const update = (next: number) => {
      if (next > 0) setWidth((prev) => (Math.abs(prev - next) < 1 ? prev : Math.floor(next)));
    };
    update(node.clientWidth);
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver((entries) => update(entries[0]?.contentRect.width ?? 0));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}

function resolveDatavizColor(index: number, explicitColor?: string): string {
  if (explicitColor) return explicitColor;
  return DATAVIZ_PALETTE[index % DATAVIZ_PALETTE.length];
}

function readCategory(dataPoint: ChartDataPoint, key: string): string {
  const raw = dataPoint[key];
  return raw == null ? '' : String(raw);
}

function readSeriesValue(dataPoint: ChartDataPoint, key: string): number {
  const raw = dataPoint[key];
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string') {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

interface ChartStateProps {
  state: ChartState;
  emptyMessage: string;
  errorMessage: string;
  loadingLabel: string;
}

function ChartStateView({ state, emptyMessage, errorMessage, loadingLabel }: ChartStateProps) {
  if (state === 'loading') {
    return (
      <div
        className="dsn-chart-state dsn-chart-state--loading"
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label={loadingLabel}
      >
        <div className="dsn-chart-loading-skeleton">
          <SkeletonLoading type="card" />
        </div>
      </div>
    );
  }
  if (state === 'error') {
    return (
      <div className="dsn-chart-state" role="alert">
        {errorMessage}
      </div>
    );
  }
  return <div className="dsn-chart-state">{emptyMessage}</div>;
}

export interface LineChartProps {
  data: ChartDataPoint[];
  xKey: string;
  series: ChartSeries[];
  height?: number;
  state?: ChartState;
  emptyMessage?: string;
  errorMessage?: string;
  loadingLabel?: string;
  className?: string;
  'aria-label'?: string;
}

/**
 * Static multi-series line chart over a categorical x-axis with point markers.
 *
 * @aiSelectWhen Showing trends over ordered categories without hover tooltips
 * @aiSelectWhen Comparing two series (e.g. current vs previous) at a glance
 *
 * @aiAvoid Do not use when hover value inspection is required — use XYLineChart instead
 * @aiAvoid Do not use when the user must brush-zoom a long x-range — use BrushLineChart instead
 * @aiAvoid Do not use when filled area emphasis is needed — use AreaChart instead
 *
 * @aiSpatial Fills parent width (100%); height from height prop — parent owns horizontal layout
 *
 * @aiCompose Wrap in ChartCard on dashboard surfaces; bare chart allowed in drawers or pre-chromed slots
 */
export function LineChart({
  data,
  xKey,
  series,
  height = 240,
  state = 'default',
  emptyMessage = 'No data available.',
  errorMessage = 'Unable to load chart data.',
  loadingLabel = 'Loading chart data...',
  className,
  'aria-label': ariaLabel = 'Line chart',
}: LineChartProps) {
  const rootClass = ['dsn-chart', className].filter(Boolean).join(' ');
  const [surfaceRef, chartWidth] = useChartWidth();
  const shouldShowState = state !== 'default' || data.length === 0 || series.length === 0;
  const yMax = height - CHART_MARGIN.top - CHART_MARGIN.bottom;
  const xMax = Math.max(0, chartWidth - CHART_MARGIN.left - CHART_MARGIN.right);
  const categories = data.map((entry) => readCategory(entry, xKey));
  const maxY = Math.max(
    1,
    ...data.flatMap((entry) => series.map((seriesEntry) => readSeriesValue(entry, seriesEntry.key))),
  );
  const xScale = scaleBand<string>({
    domain: categories,
    range: [0, xMax],
    padding: 0.28,
  });
  const yScale = scaleLinear<number>({
    domain: [0, maxY],
    range: [yMax, 0],
    nice: true,
  });

  return (
    <div className={rootClass} role="img" aria-label={ariaLabel}>
      <div ref={surfaceRef} className="dsn-chart-surface" style={{ height: `${height}px` }}>
        {shouldShowState ? (
          <ChartStateView
            state={state === 'default' ? 'empty' : state}
            emptyMessage={emptyMessage}
            errorMessage={errorMessage}
            loadingLabel={loadingLabel}
          />
        ) : (
          <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${height}`} aria-hidden="true">
            <Group left={CHART_MARGIN.left} top={CHART_MARGIN.top}>
              {yScale.ticks(4).map((tick) => {
                const y = yScale(tick);
                return (
                  <line
                    key={`line-grid-${tick}`}
                    x1={0}
                    x2={xMax}
                    y1={y}
                    y2={y}
                    stroke={DATAVIZ_GRID_COLOR}
                    strokeDasharray="3 3"
                  />
                );
              })}
              {series.map((seriesEntry, seriesIndex) => {
                const color = resolveDatavizColor(seriesIndex, seriesEntry.color);
                const points = data.map((entry) => ({
                  x: (xScale(readCategory(entry, xKey)) ?? 0) + xScale.bandwidth() / 2,
                  y: yScale(readSeriesValue(entry, seriesEntry.key)),
                }));
                return (
                  <g key={seriesEntry.key}>
                    <LinePath data={points} x={(d) => d.x} y={(d) => d.y} stroke={color} strokeWidth={2} />
                    {points.map((point, index) => (
                      <circle
                        key={`${seriesEntry.key}-${index}`}
                        cx={point.x}
                        cy={point.y}
                        r={3}
                        fill="var(--color-background-neutral-primary)"
                        stroke={color}
                        strokeWidth={1.5}
                      />
                    ))}
                  </g>
                );
              })}
              <AxisBottom
                top={yMax}
                scale={xScale}
                stroke={DATAVIZ_AXIS_COLOR}
                tickStroke={DATAVIZ_AXIS_COLOR}
                tickLabelProps={() => ({
                  fill: DATAVIZ_LABEL_COLOR,
                  fontSize: 12,
                  textAnchor: 'middle',
                  dy: '0.8em',
                })}
              />
              <AxisLeft
                scale={yScale}
                numTicks={4}
                stroke={DATAVIZ_AXIS_COLOR}
                tickStroke={DATAVIZ_AXIS_COLOR}
                tickLabelProps={() => ({
                  fill: DATAVIZ_LABEL_COLOR,
                  fontSize: 12,
                  textAnchor: 'end',
                  dx: '-0.3em',
                  dy: '0.25em',
                })}
              />
            </Group>
          </svg>
        )}
      </div>
    </div>
  );
}

export interface BarChartProps {
  data: ChartDataPoint[];
  xKey: string;
  series: ChartSeries[];
  height?: number;
  state?: ChartState;
  emptyMessage?: string;
  errorMessage?: string;
  loadingLabel?: string;
  className?: string;
  'aria-label'?: string;
}

/**
 * Vertical grouped bar chart — categories on x-axis, clustered bars per series.
 *
 * @aiSelectWhen Comparing discrete magnitudes across categories with grouped bars
 * @aiSelectWhen Two or three metrics per category need side-by-side comparison
 *
 * @aiAvoid Do not use when row stacks must sum to a whole — use HorizontalStackedBarChart instead
 * @aiAvoid Do not use for continuous trends — use LineChart instead
 * @aiAvoid Do not use for part-to-whole with few slices — use DonutChart instead
 *
 * @aiSpatial Fills parent width (100%); height from height prop — parent owns horizontal layout
 *
 * @aiCompose Wrap in ChartCard on dashboard surfaces; bare chart allowed in drawers or pre-chromed slots
 */
export function BarChart({
  data,
  xKey,
  series,
  height = 240,
  state = 'default',
  emptyMessage = 'No data available.',
  errorMessage = 'Unable to load chart data.',
  loadingLabel = 'Loading chart data...',
  className,
  'aria-label': ariaLabel = 'Bar chart',
}: BarChartProps) {
  const rootClass = ['dsn-chart', className].filter(Boolean).join(' ');
  const [surfaceRef, chartWidth] = useChartWidth();
  const shouldShowState = state !== 'default' || data.length === 0 || series.length === 0;
  const yMax = height - CHART_MARGIN.top - CHART_MARGIN.bottom;
  const xMax = Math.max(0, chartWidth - CHART_MARGIN.left - CHART_MARGIN.right);
  const categories = data.map((entry) => readCategory(entry, xKey));
  const seriesKeys = series.map((entry) => entry.key);
  const maxY = Math.max(
    1,
    ...data.flatMap((entry) => series.map((seriesEntry) => readSeriesValue(entry, seriesEntry.key))),
  );
  const x0Scale = scaleBand<string>({
    domain: categories,
    range: [0, xMax],
    padding: 0.2,
  });
  const x1Scale = scaleBand<string>({
    domain: seriesKeys,
    range: [0, x0Scale.bandwidth()],
    padding: 0.12,
  });
  const yScale = scaleLinear<number>({
    domain: [0, maxY],
    range: [yMax, 0],
    nice: true,
  });

  return (
    <div className={rootClass} role="img" aria-label={ariaLabel}>
      <div ref={surfaceRef} className="dsn-chart-surface" style={{ height: `${height}px` }}>
        {shouldShowState ? (
          <ChartStateView
            state={state === 'default' ? 'empty' : state}
            emptyMessage={emptyMessage}
            errorMessage={errorMessage}
            loadingLabel={loadingLabel}
          />
        ) : (
          <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${height}`} aria-hidden="true">
            <Group left={CHART_MARGIN.left} top={CHART_MARGIN.top}>
              {yScale.ticks(4).map((tick) => {
                const y = yScale(tick);
                return (
                  <line
                    key={`bar-grid-${tick}`}
                    x1={0}
                    x2={xMax}
                    y1={y}
                    y2={y}
                    stroke={DATAVIZ_GRID_COLOR}
                    strokeDasharray="3 3"
                  />
                );
              })}
              {data.map((entry) => {
                const category = readCategory(entry, xKey);
                const groupX = x0Scale(category) ?? 0;
                return series.map((seriesEntry, seriesIndex) => {
                  const barValue = readSeriesValue(entry, seriesEntry.key);
                  const barX = groupX + (x1Scale(seriesEntry.key) ?? 0);
                  const barY = yScale(barValue);
                  const barWidth = x1Scale.bandwidth();
                  const barHeight = yMax - barY;
                  return (
                    <Bar
                      key={`${category}-${seriesEntry.key}`}
                      x={barX}
                      y={barY}
                      width={barWidth}
                      height={Math.max(0, barHeight)}
                      fill={resolveDatavizColor(seriesIndex, seriesEntry.color)}
                      rx={4}
                    />
                  );
                });
              })}
              <AxisBottom
                top={yMax}
                scale={x0Scale}
                stroke={DATAVIZ_AXIS_COLOR}
                tickStroke={DATAVIZ_AXIS_COLOR}
                tickLabelProps={() => ({
                  fill: DATAVIZ_LABEL_COLOR,
                  fontSize: 12,
                  textAnchor: 'middle',
                  dy: '0.8em',
                })}
              />
              <AxisLeft
                scale={yScale}
                numTicks={4}
                stroke={DATAVIZ_AXIS_COLOR}
                tickStroke={DATAVIZ_AXIS_COLOR}
                tickLabelProps={() => ({
                  fill: DATAVIZ_LABEL_COLOR,
                  fontSize: 12,
                  textAnchor: 'end',
                  dx: '-0.3em',
                  dy: '0.25em',
                })}
              />
            </Group>
          </svg>
        )}
      </div>
    </div>
  );
}

export interface DonutChartProps {
  data: ChartDonutSlice[];
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  state?: ChartState;
  emptyMessage?: string;
  errorMessage?: string;
  loadingLabel?: string;
  className?: string;
  'aria-label'?: string;
}

/**
 * Part-to-whole donut chart with built-in legend below the plot.
 *
 * @aiSelectWhen Showing composition with 3–7 slices at a single point in time
 * @aiSelectWhen Slice labels must appear in a built-in legend without external markup
 *
 * @aiAvoid Do not use with many slices (8+) — use BarChart or HorizontalStackedBarChart instead
 * @aiAvoid Do not use for trends over time — use LineChart or BarChart instead
 * @aiAvoid Do not use cartesian data + series arrays — pass ChartDonutSlice[] instead
 *
 * @aiSpatial Fills parent width; plot height from height prop; legend adds below surface
 *
 * @aiCompose Wrap in ChartCard on dashboard surfaces; bare chart allowed in drawers or pre-chromed slots
 */
export function DonutChart({
  data,
  height = 240,
  innerRadius = 56,
  outerRadius = 84,
  state = 'default',
  emptyMessage = 'No data available.',
  errorMessage = 'Unable to load chart data.',
  loadingLabel = 'Loading chart data...',
  className,
  'aria-label': ariaLabel = 'Donut chart',
}: DonutChartProps) {
  const rootClass = ['dsn-chart', className].filter(Boolean).join(' ');
  const [surfaceRef, chartWidth] = useChartWidth();
  const shouldShowState = state !== 'default' || data.length === 0;
  const safeOuterRadius = Math.min(outerRadius, height / 2 - 16, chartWidth / 2 - 16);
  const safeInnerRadius = Math.min(innerRadius, safeOuterRadius - 8);
  const colorScale = scaleOrdinal<string, string>({
    domain: data.map((entry) => entry.id),
    range: data.map((entry, index) => resolveDatavizColor(index, entry.color)),
  });

  return (
    <div className={rootClass} role="img" aria-label={ariaLabel}>
      <div ref={surfaceRef} className="dsn-chart-surface" style={{ height: `${height}px` }}>
        {shouldShowState ? (
          <ChartStateView
            state={state === 'default' ? 'empty' : state}
            emptyMessage={emptyMessage}
            errorMessage={errorMessage}
            loadingLabel={loadingLabel}
          />
        ) : (
          <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${height}`} aria-hidden="true">
            <Group top={height / 2} left={chartWidth / 2}>
              <Pie
                data={data}
                pieValue={(entry) => entry.value}
                outerRadius={safeOuterRadius}
                innerRadius={safeInnerRadius}
                padAngle={0.01}
              >
                {(pie) =>
                  pie.arcs.map((arc) => (
                    <path
                      key={`donut-${arc.data.id}`}
                      d={pie.path(arc) ?? ''}
                      fill={colorScale(arc.data.id)}
                      stroke="var(--color-background-neutral-primary)"
                      strokeWidth={2}
                    />
                  ))
                }
              </Pie>
            </Group>
          </svg>
        )}
      </div>
      {!shouldShowState ? (
        <ul className="dsn-chart-legend" aria-label="Chart legend">
          {data.map((entry, index) => (
            <li key={entry.id} className="dsn-chart-legend-item">
              <span
                className="dsn-chart-legend-swatch"
                  style={{ background: resolveDatavizColor(index, entry.color) }}
                aria-hidden="true"
              />
              <span className="dsn-chart-legend-label">{entry.label}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export interface ChartCardProps extends Omit<CardProps, 'children'> {
  children: React.ReactNode;
}

export interface AreaChartProps {
  data: ChartDataPoint[];
  xKey: string;
  series: ChartSeries[];
  height?: number;
  state?: ChartState;
  emptyMessage?: string;
  errorMessage?: string;
  loadingLabel?: string;
  className?: string;
  'aria-label'?: string;
}

/**
 * Static multi-series area chart with gradient fill under each line.
 *
 * @aiSelectWhen Trend plus volume perception matters and filled area adds meaning
 * @aiSelectWhen One or two series where area fill helps comparison
 *
 * @aiAvoid Do not use with many overlapping series — use LineChart instead
 * @aiAvoid Do not use when hover tooltips are required — use XYLineChart instead
 * @aiAvoid Do not use for stacked proportions over time — use StreamgraphChart instead
 *
 * @aiSpatial Fills parent width (100%); height from height prop — parent owns horizontal layout
 *
 * @aiCompose Wrap in ChartCard on dashboard surfaces; bare chart allowed in drawers or pre-chromed slots
 */
export function AreaChart({
  data,
  xKey,
  series,
  height = 240,
  state = 'default',
  emptyMessage = 'No data available.',
  errorMessage = 'Unable to load chart data.',
  loadingLabel = 'Loading chart data...',
  className,
  'aria-label': ariaLabel = 'Area chart',
}: AreaChartProps) {
  const areaFillGradientPrefix = React.useId().replace(/:/g, '');
  const rootClass = ['dsn-chart', className].filter(Boolean).join(' ');
  const [surfaceRef, chartWidth] = useChartWidth();
  const shouldShowState = state !== 'default' || data.length === 0 || series.length === 0;
  const yMax = height - CHART_MARGIN.top - CHART_MARGIN.bottom;
  const xMax = Math.max(0, chartWidth - CHART_MARGIN.left - CHART_MARGIN.right);
  const categories = data.map((entry) => readCategory(entry, xKey));
  const maxY = Math.max(
    1,
    ...data.flatMap((entry) => series.map((seriesEntry) => readSeriesValue(entry, seriesEntry.key))),
  );
  const xScale = scaleBand<string>({
    domain: categories,
    range: [0, xMax],
    padding: 0.2,
  });
  const yScale = scaleLinear<number>({
    domain: [0, maxY],
    range: [yMax, 0],
    nice: true,
  });

  return (
    <div className={rootClass} role="img" aria-label={ariaLabel}>
      <div ref={surfaceRef} className="dsn-chart-surface" style={{ height: `${height}px` }}>
        {shouldShowState ? (
          <ChartStateView
            state={state === 'default' ? 'empty' : state}
            emptyMessage={emptyMessage}
            errorMessage={errorMessage}
            loadingLabel={loadingLabel}
          />
        ) : (
          <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${height}`} aria-hidden="true">
            <defs>
              {series.map((seriesEntry, seriesIndex) => {
                const color = resolveDatavizColor(seriesIndex, seriesEntry.color);
                const gradId = `${areaFillGradientPrefix}-area-${seriesIndex}`;
                return (
                  <linearGradient
                    key={gradId}
                    id={gradId}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                    gradientUnits="objectBoundingBox"
                  >
                    <stop offset="0%" stopColor={color} stopOpacity={0.45} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                );
              })}
            </defs>
            <Group left={CHART_MARGIN.left} top={CHART_MARGIN.top}>
              {yScale.ticks(4).map((tick) => (
                <line
                  key={`area-grid-${tick}`}
                  x1={0}
                  x2={xMax}
                  y1={yScale(tick)}
                  y2={yScale(tick)}
                  stroke={DATAVIZ_GRID_COLOR}
                  strokeDasharray="3 3"
                />
              ))}
              {series.map((seriesEntry, seriesIndex) => {
                const color = resolveDatavizColor(seriesIndex, seriesEntry.color);
                const points = data.map((entry) => ({
                  x: (xScale(readCategory(entry, xKey)) ?? 0) + xScale.bandwidth() / 2,
                  y: readSeriesValue(entry, seriesEntry.key),
                }));
                const fillGradientId = `${areaFillGradientPrefix}-area-${seriesIndex}`;
                return (
                  <g key={seriesEntry.key}>
                    <AreaClosed
                      data={points}
                      x={(d) => d.x}
                      y={(d) => yScale(d.y)}
                      yScale={yScale}
                      stroke="none"
                      strokeWidth={0}
                      fill={`url(#${fillGradientId})`}
                    />
                    <LinePath
                      data={points}
                      x={(d) => d.x}
                      y={(d) => yScale(d.y)}
                      stroke={color}
                      strokeWidth={2}
                    />
                  </g>
                );
              })}
              <AxisBottom
                top={yMax}
                scale={xScale}
                stroke={DATAVIZ_AXIS_COLOR}
                tickStroke={DATAVIZ_AXIS_COLOR}
                tickLabelProps={() => ({
                  fill: DATAVIZ_LABEL_COLOR,
                  fontSize: 12,
                  textAnchor: 'middle',
                  dy: '0.8em',
                })}
              />
              <AxisLeft
                scale={yScale}
                numTicks={4}
                stroke={DATAVIZ_AXIS_COLOR}
                tickStroke={DATAVIZ_AXIS_COLOR}
                tickLabelProps={() => ({
                  fill: DATAVIZ_LABEL_COLOR,
                  fontSize: 12,
                  textAnchor: 'end',
                  dx: '-0.3em',
                  dy: '0.25em',
                })}
              />
            </Group>
          </svg>
        )}
      </div>
    </div>
  );
}

export interface HorizontalStackedBarChartProps {
  data: ChartDataPoint[];
  categoryKey: string;
  series: ChartSeries[];
  height?: number;
  state?: ChartState;
  emptyMessage?: string;
  errorMessage?: string;
  loadingLabel?: string;
  className?: string;
  'aria-label'?: string;
}

/**
 * Horizontal stacked bar chart — one bar per row, segments show part-to-whole per category.
 *
 * @aiSelectWhen Each row is a category and series segments stack to a total
 * @aiSelectWhen Long category labels need horizontal y-axis room
 *
 * @aiAvoid Do not use for side-by-side bar comparison per category — use BarChart instead
 * @aiAvoid Do not use for layers flowing over ordered time — use StreamgraphChart instead
 * @aiAvoid Do not use categoryKey as xKey — this chart uses categoryKey for row labels
 *
 * @aiSpatial Fills parent width (100%); height from height prop — parent owns horizontal layout
 *
 * @aiCompose Wrap in ChartCard on dashboard surfaces; bare chart allowed in drawers or pre-chromed slots
 */
export function HorizontalStackedBarChart({
  data,
  categoryKey,
  series,
  height = 260,
  state = 'default',
  emptyMessage = 'No data available.',
  errorMessage = 'Unable to load chart data.',
  loadingLabel = 'Loading chart data...',
  className,
  'aria-label': ariaLabel = 'Horizontal stacked bar chart',
}: HorizontalStackedBarChartProps) {
  const rootClass = ['dsn-chart', className].filter(Boolean).join(' ');
  const [surfaceRef, chartWidth] = useChartWidth();
  const shouldShowState = state !== 'default' || data.length === 0 || series.length === 0;
  const yMax = height - CHART_MARGIN.top - CHART_MARGIN.bottom;
  const xMax = Math.max(0, chartWidth - CHART_MARGIN.left - CHART_MARGIN.right);
  const categories = data.map((entry) => readCategory(entry, categoryKey));
  const maxStackValue = Math.max(
    1,
    ...data.map((entry) =>
      series.reduce((acc, seriesEntry) => acc + readSeriesValue(entry, seriesEntry.key), 0),
    ),
  );
  const yScale = scaleBand<string>({
    domain: categories,
    range: [0, yMax],
    padding: 0.22,
  });
  const xScale = scaleLinear<number>({
    domain: [0, maxStackValue],
    range: [0, xMax],
    nice: true,
  });

  return (
    <div className={rootClass} role="img" aria-label={ariaLabel}>
      <div ref={surfaceRef} className="dsn-chart-surface" style={{ height: `${height}px` }}>
        {shouldShowState ? (
          <ChartStateView
            state={state === 'default' ? 'empty' : state}
            emptyMessage={emptyMessage}
            errorMessage={errorMessage}
            loadingLabel={loadingLabel}
          />
        ) : (
          <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${height}`} aria-hidden="true">
            <Group left={CHART_MARGIN.left} top={CHART_MARGIN.top}>
              {xScale.ticks(4).map((tick) => (
                <line
                  key={`hstack-grid-${tick}`}
                  x1={xScale(tick)}
                  x2={xScale(tick)}
                  y1={0}
                  y2={yMax}
                  stroke={DATAVIZ_GRID_COLOR}
                  strokeDasharray="3 3"
                />
              ))}
              {data.map((entry) => {
                const category = readCategory(entry, categoryKey);
                const y = yScale(category) ?? 0;
                const barHeight = yScale.bandwidth();
                let cumulative = 0;
                return series.map((seriesEntry, seriesIndex) => {
                  const value = readSeriesValue(entry, seriesEntry.key);
                  const xStart = xScale(cumulative);
                  const width = Math.max(0, xScale(cumulative + value) - xStart);
                  cumulative += value;
                  return (
                    <Bar
                      key={`${category}-${seriesEntry.key}`}
                      x={xStart}
                      y={y}
                      width={width}
                      height={barHeight}
                      fill={resolveDatavizColor(seriesIndex, seriesEntry.color)}
                    />
                  );
                });
              })}
              <AxisBottom
                top={yMax}
                scale={xScale}
                stroke={DATAVIZ_AXIS_COLOR}
                tickStroke={DATAVIZ_AXIS_COLOR}
                tickLabelProps={() => ({
                  fill: DATAVIZ_LABEL_COLOR,
                  fontSize: 12,
                  textAnchor: 'middle',
                  dy: '0.8em',
                })}
              />
              <AxisLeft
                scale={yScale}
                stroke={DATAVIZ_AXIS_COLOR}
                tickStroke={DATAVIZ_AXIS_COLOR}
                tickLabelProps={() => ({
                  fill: DATAVIZ_LABEL_COLOR,
                  fontSize: 12,
                  textAnchor: 'end',
                  dx: '-0.3em',
                  dy: '0.25em',
                })}
              />
            </Group>
          </svg>
        )}
      </div>
    </div>
  );
}

export interface StreamgraphChartProps {
  data: ChartDataPoint[];
  xKey: string;
  series: ChartSeries[];
  height?: number;
  state?: ChartState;
  emptyMessage?: string;
  errorMessage?: string;
  loadingLabel?: string;
  className?: string;
  'aria-label'?: string;
}

/**
 * Stacked streamgraph — series layers flow symmetrically over ordered categories.
 *
 * @aiSelectWhen Multiple series form a shifting total and stream shape is the insight
 * @aiSelectWhen Three or more compositional series over ordered x (typically time)
 *
 * @aiAvoid Do not use for precise magnitude comparison — use BarChart or LineChart instead
 * @aiAvoid Do not use for single-snapshot part-to-whole — use DonutChart instead
 * @aiAvoid Do not use with only one or two series — use AreaChart instead
 *
 * @aiSpatial Fills parent width (100%); height from height prop — parent owns horizontal layout
 *
 * @aiCompose Wrap in ChartCard on dashboard surfaces; bare chart allowed in drawers or pre-chromed slots
 */
export function StreamgraphChart({
  data,
  xKey,
  series,
  height = 260,
  state = 'default',
  emptyMessage = 'No data available.',
  errorMessage = 'Unable to load chart data.',
  loadingLabel = 'Loading chart data...',
  className,
  'aria-label': ariaLabel = 'Streamgraph chart',
}: StreamgraphChartProps) {
  const rootClass = ['dsn-chart', className].filter(Boolean).join(' ');
  const [surfaceRef, chartWidth] = useChartWidth();
  const shouldShowState = state !== 'default' || data.length === 0 || series.length === 0;
  const yMax = height - CHART_MARGIN.top - CHART_MARGIN.bottom;
  const xMax = Math.max(0, chartWidth - CHART_MARGIN.left - CHART_MARGIN.right);
  const categories = data.map((entry) => readCategory(entry, xKey));
  const totals = data.map((entry) =>
    series.reduce((acc, seriesEntry) => acc + readSeriesValue(entry, seriesEntry.key), 0),
  );
  const maxAbs = Math.max(1, ...totals.map((total) => total / 2));
  const xScale = scaleBand<string>({
    domain: categories,
    range: [0, xMax],
    padding: 0.05,
  });
  const yScale = scaleLinear<number>({
    domain: [-maxAbs, maxAbs],
    range: [yMax, 0],
    nice: true,
  });

  return (
    <div className={rootClass} role="img" aria-label={ariaLabel}>
      <div ref={surfaceRef} className="dsn-chart-surface" style={{ height: `${height}px` }}>
        {shouldShowState ? (
          <ChartStateView
            state={state === 'default' ? 'empty' : state}
            emptyMessage={emptyMessage}
            errorMessage={errorMessage}
            loadingLabel={loadingLabel}
          />
        ) : (
          <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${height}`} aria-hidden="true">
            <Group left={CHART_MARGIN.left} top={CHART_MARGIN.top}>
              {series.map((seriesEntry, seriesIndex) => {
                const layerPoints = data.map((entry) => {
                  const total = series.reduce(
                    (acc, currentSeries) => acc + readSeriesValue(entry, currentSeries.key),
                    0,
                  );
                  const lowerOffset =
                    -total / 2 +
                    series
                      .slice(0, seriesIndex)
                      .reduce((acc, currentSeries) => acc + readSeriesValue(entry, currentSeries.key), 0);
                  const upperOffset = lowerOffset + readSeriesValue(entry, seriesEntry.key);
                  return {
                    x: (xScale(readCategory(entry, xKey)) ?? 0) + xScale.bandwidth() / 2,
                    y0: lowerOffset,
                    y1: upperOffset,
                  };
                });

                return (
                  <AreaClosed
                    key={`stream-layer-${seriesEntry.key}`}
                    data={layerPoints}
                    x={(d) => d.x}
                    yScale={yScale}
                    y0={(d) => yScale(d.y0)}
                    y1={(d) => yScale(d.y1)}
                    fill={resolveDatavizColor(seriesIndex, seriesEntry.color)}
                    fillOpacity={0.8}
                    stroke="none"
                  />
                );
              })}
              <AxisBottom
                top={yMax}
                scale={xScale}
                stroke={DATAVIZ_AXIS_COLOR}
                tickStroke={DATAVIZ_AXIS_COLOR}
                tickLabelProps={() => ({
                  fill: DATAVIZ_LABEL_COLOR,
                  fontSize: 12,
                  textAnchor: 'middle',
                  dy: '0.8em',
                })}
              />
            </Group>
          </svg>
        )}
      </div>
    </div>
  );
}

export interface BrushLineChartProps extends Omit<LineChartProps, 'height'> {
  height?: number;
}

/**
 * Line chart with brush strip — mini-chart selects the visible x-range on the main plot.
 *
 * @aiSelectWhen Many categorical points need overview plus focus on a sub-range
 * @aiSelectWhen Ordered x-axis and brush zoom without hover tooltips
 *
 * @aiAvoid Do not use for short series that always fit — use LineChart instead
 * @aiAvoid Do not use when hover value inspection is primary — use XYLineChart instead
 *
 * @aiSpatial Fills parent width; default height 300 includes brush strip — parent owns width
 *
 * @aiCompose Wrap in ChartCard on dashboard surfaces; bare chart allowed in drawers or pre-chromed slots
 */
export function BrushLineChart({
  data,
  xKey,
  series,
  height = 300,
  state = 'default',
  emptyMessage = 'No data available.',
  errorMessage = 'Unable to load chart data.',
  loadingLabel = 'Loading chart data...',
  className,
  'aria-label': ariaLabel = 'Brush line chart',
}: BrushLineChartProps) {
  const rootClass = ['dsn-chart', className].filter(Boolean).join(' ');
  const [surfaceRef, chartWidth] = useChartWidth();
  const shouldShowState = state !== 'default' || data.length === 0 || series.length === 0;
  const mainHeight = height - 76;
  const brushHeight = 52;
  const yMax = mainHeight - CHART_MARGIN.top - CHART_MARGIN.bottom;
  const xMax = Math.max(0, chartWidth - CHART_MARGIN.left - CHART_MARGIN.right);
  const categories = data.map((entry) => readCategory(entry, xKey));
  const [range, setRange] = React.useState<{ start: number; end: number } | null>(null);
  const maxY = Math.max(
    1,
    ...data.flatMap((entry) => series.map((seriesEntry) => readSeriesValue(entry, seriesEntry.key))),
  );

  const getIndexFromX = (value: number) =>
    Math.max(0, Math.min(categories.length - 1, Math.floor((value / Math.max(xMax, 1)) * categories.length)));

  const visibleData =
    range == null
      ? data
      : data.slice(Math.min(range.start, range.end), Math.max(range.start, range.end) + 1);

  const visibleCategories = visibleData.map((entry) => readCategory(entry, xKey));
  const xScale = scaleBand<string>({
    domain: visibleCategories,
    range: [0, xMax],
    padding: 0.28,
  });
  const yScale = scaleLinear<number>({
    domain: [0, maxY],
    range: [yMax, 0],
    nice: true,
  });
  const brushXScale = scaleLinear<number>({
    domain: [0, Math.max(categories.length - 1, 1)],
    range: [0, xMax],
  });

  return (
    <div className={rootClass} role="img" aria-label={ariaLabel}>
      <div ref={surfaceRef} className="dsn-chart-surface" style={{ height: `${height}px` }}>
        {shouldShowState ? (
          <ChartStateView
            state={state === 'default' ? 'empty' : state}
            emptyMessage={emptyMessage}
            errorMessage={errorMessage}
            loadingLabel={loadingLabel}
          />
        ) : (
          <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${height}`} aria-hidden="true">
            <Group left={CHART_MARGIN.left} top={CHART_MARGIN.top}>
              {series.map((seriesEntry, seriesIndex) => {
                const color = resolveDatavizColor(seriesIndex, seriesEntry.color);
                const points = visibleData.map((entry) => ({
                  x: (xScale(readCategory(entry, xKey)) ?? 0) + xScale.bandwidth() / 2,
                  y: yScale(readSeriesValue(entry, seriesEntry.key)),
                }));
                return (
                  <LinePath
                    key={`brush-main-${seriesEntry.key}`}
                    data={points}
                    x={(d) => d.x}
                    y={(d) => d.y}
                    stroke={color}
                    strokeWidth={2}
                  />
                );
              })}
              <AxisBottom
                top={yMax}
                scale={xScale}
                stroke={DATAVIZ_AXIS_COLOR}
                tickStroke={DATAVIZ_AXIS_COLOR}
                tickLabelProps={() => ({
                  fill: DATAVIZ_LABEL_COLOR,
                  fontSize: 12,
                  textAnchor: 'middle',
                  dy: '0.8em',
                })}
              />
            </Group>
            <Group left={CHART_MARGIN.left} top={mainHeight + 8}>
              <line x1={0} x2={xMax} y1={brushHeight} y2={brushHeight} stroke={DATAVIZ_GRID_COLOR} />
              {series.slice(0, 1).map((seriesEntry, seriesIndex) => {
                const color = resolveDatavizColor(seriesIndex, seriesEntry.color);
                const points = data.map((entry, index) => ({
                  x: brushXScale(index),
                  y: brushHeight - (readSeriesValue(entry, seriesEntry.key) / maxY) * brushHeight,
                }));
                return (
                  <LinePath
                    key={`brush-preview-${seriesEntry.key}`}
                    data={points}
                    x={(d) => d.x}
                    y={(d) => d.y}
                    stroke={color}
                    strokeWidth={1.5}
                  />
                );
              })}
              <Brush
                xScale={brushXScale}
                yScale={scaleLinear<number>({ domain: [0, 1], range: [brushHeight, 0] })}
                width={xMax}
                height={brushHeight}
                margin={{ top: 0, left: 0, right: 0, bottom: 0 }}
                handleSize={8}
                resizeTriggerAreas={['left', 'right']}
                onChange={(domain) => {
                  const next = domain as { x0?: number; x1?: number } | null;
                  if (!next || next.x0 == null || next.x1 == null) {
                    setRange(null);
                    return;
                  }
                  setRange({ start: getIndexFromX(next.x0), end: getIndexFromX(next.x1) });
                }}
                selectedBoxStyle={{
                  fill: 'var(--color-background-dataviz-1)',
                  fillOpacity: 0.2,
                  stroke: 'var(--color-background-dataviz-1)',
                }}
              />
            </Group>
          </svg>
        )}
      </div>
    </div>
  );
}

export interface XYLineChartProps extends Omit<LineChartProps, 'height'> {
  height?: number;
}

/**
 * Interactive multi-series line chart with animated tooltip and crosshair (@visx/xychart).
 *
 * @aiSelectWhen Readers must inspect exact values on hover
 * @aiSelectWhen Pointer tooltip and crosshair are part of the analytics workflow
 *
 * @aiAvoid Do not use when a static chart is enough — use LineChart instead
 * @aiAvoid Do not use when brush range selection is required — use BrushLineChart instead
 *
 * @aiSpatial Fills parent width (100%); height passed to XYChart — parent owns horizontal layout
 *
 * @aiCompose Wrap in ChartCard on dashboard surfaces; bare chart allowed in drawers or pre-chromed slots
 */
export function XYLineChart({
  data,
  xKey,
  series,
  height = 260,
  state = 'default',
  emptyMessage = 'No data available.',
  errorMessage = 'Unable to load chart data.',
  loadingLabel = 'Loading chart data...',
  className,
  'aria-label': ariaLabel = 'XY line chart',
}: XYLineChartProps) {
  const rootClass = ['dsn-chart', className].filter(Boolean).join(' ');
  const shouldShowState = state !== 'default' || data.length === 0 || series.length === 0;

  return (
    <div className={rootClass} role="img" aria-label={ariaLabel}>
      <div className="dsn-chart-surface" style={{ height: `${height}px` }}>
        {shouldShowState ? (
          <ChartStateView
            state={state === 'default' ? 'empty' : state}
            emptyMessage={emptyMessage}
            errorMessage={errorMessage}
            loadingLabel={loadingLabel}
          />
        ) : (
          <XYChart height={height} xScale={{ type: 'band' }} yScale={{ type: 'linear' }}>
            <AnimatedGrid columns={false} numTicks={4} stroke={DATAVIZ_GRID_COLOR} />
            <AnimatedAxis orientation="bottom" stroke={DATAVIZ_AXIS_COLOR} tickStroke={DATAVIZ_AXIS_COLOR} />
            <AnimatedAxis orientation="left" stroke={DATAVIZ_AXIS_COLOR} tickStroke={DATAVIZ_AXIS_COLOR} />
            {series.map((seriesEntry, index) => (
              <AnimatedLineSeries
                key={seriesEntry.key}
                dataKey={seriesEntry.label}
                data={data}
                xAccessor={(d) => readCategory(d, xKey)}
                yAccessor={(d) => readSeriesValue(d, seriesEntry.key)}
                stroke={resolveDatavizColor(index, seriesEntry.color)}
              />
            ))}
            <Tooltip
              showVerticalCrosshair
              showSeriesGlyphs
              renderTooltip={({ tooltipData }) => {
                const datum = tooltipData?.nearestDatum?.datum as ChartDataPoint | undefined;
                if (!datum) return null;
                return (
                  <div>
                    {readCategory(datum, xKey)} - {series.map((entry) => `${entry.label}: ${readSeriesValue(datum, entry.key)}`).join(' | ')}
                  </div>
                );
              }}
              style={{
                background: 'var(--color-background-dataviz-tooltip)',
                border: '1px solid var(--color-border-dataviz-tooltip)',
                color: DATAVIZ_LABEL_COLOR,
              }}
            />
          </XYChart>
        )}
      </div>
    </div>
  );
}

export interface HeatmapChartCell {
  y: string;
  value: number;
}

export interface HeatmapChartColumn {
  x: string;
  bins: HeatmapChartCell[];
}

export interface HeatmapChartProps {
  data: HeatmapChartColumn[];
  height?: number;
  state?: ChartState;
  emptyMessage?: string;
  errorMessage?: string;
  loadingLabel?: string;
  className?: string;
  'aria-label'?: string;
}

/**
 * Grid heatmap — columns (x), rows (y), cell value drives color intensity.
 *
 * @aiSelectWhen Two categorical axes and cell density or count forms a matrix pattern
 * @aiSelectWhen Activity or usage patterns across day × hour (or similar bins)
 *
 * @aiAvoid Do not use simple category vs magnitude — use BarChart instead
 * @aiAvoid Do not use ChartDataPoint[] — use HeatmapChartColumn[] with bins per column
 * @aiAvoid Do not use for part-to-whole slices — use DonutChart instead
 *
 * @aiSpatial Fills parent width (100%); height from height prop — parent owns horizontal layout
 *
 * @aiCompose Wrap in ChartCard on dashboard surfaces; bare chart allowed in drawers or pre-chromed slots
 */
export function HeatmapChart({
  data,
  height = 280,
  state = 'default',
  emptyMessage = 'No data available.',
  errorMessage = 'Unable to load chart data.',
  loadingLabel = 'Loading chart data...',
  className,
  'aria-label': ariaLabel = 'Heatmap chart',
}: HeatmapChartProps) {
  const rootClass = ['dsn-chart', className].filter(Boolean).join(' ');
  const [surfaceRef, chartWidth] = useChartWidth();
  const yLabels = data[0]?.bins.map((bin) => bin.y) ?? [];
  const shouldShowState = state !== 'default' || data.length === 0 || yLabels.length === 0;
  const yMax = height - CHART_MARGIN.top - CHART_MARGIN.bottom;
  const xMax = Math.max(0, chartWidth - CHART_MARGIN.left - CHART_MARGIN.right);
  const xLabels = data.map((column) => column.x);
  const maxValue = Math.max(1, ...data.flatMap((column) => column.bins.map((bin) => bin.value)));

  const xBand = scaleBand<string>({
    domain: xLabels,
    range: [0, xMax],
    padding: 0.08,
  });
  const yBand = scaleBand<string>({
    domain: yLabels,
    range: [0, yMax],
    padding: 0.08,
  });
  // Intensity is carried by opacity: scaleLinear cannot interpolate between two
  // CSS var() strings, so a colour ramp would paint every cell the end colour.
  const opacityScale = scaleLinear<number>({
    domain: [0, maxValue],
    range: [0.12, 1],
  });

  return (
    <div className={rootClass} role="img" aria-label={ariaLabel}>
      <div ref={surfaceRef} className="dsn-chart-surface" style={{ height: `${height}px` }}>
        {shouldShowState ? (
          <ChartStateView
            state={state === 'default' ? 'empty' : state}
            emptyMessage={emptyMessage}
            errorMessage={errorMessage}
            loadingLabel={loadingLabel}
          />
        ) : (
          <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${height}`} aria-hidden="true">
            <Group left={CHART_MARGIN.left} top={CHART_MARGIN.top}>
              <HeatmapRect<HeatmapChartColumn, HeatmapChartCell>
                data={data}
                xScale={(columnIndex) => xBand(xLabels[columnIndex]) ?? 0}
                yScale={(rowIndex) => yBand(yLabels[rowIndex]) ?? 0}
                binWidth={xBand.bandwidth()}
                binHeight={yBand.bandwidth()}
                colorScale={() => 'var(--color-background-dataviz-1)'}
                opacityScale={(count) => opacityScale(Number(count))}
                bins={(column) => column.bins}
                count={(bin) => bin.value}
                gap={2}
              />
              <AxisBottom
                top={yMax}
                scale={xBand}
                stroke={DATAVIZ_AXIS_COLOR}
                tickStroke={DATAVIZ_AXIS_COLOR}
                tickLabelProps={() => ({
                  fill: DATAVIZ_LABEL_COLOR,
                  fontSize: 12,
                  textAnchor: 'middle',
                  dy: '0.8em',
                })}
              />
              <AxisLeft
                scale={yBand}
                stroke={DATAVIZ_AXIS_COLOR}
                tickStroke={DATAVIZ_AXIS_COLOR}
                tickLabelProps={() => ({
                  fill: DATAVIZ_LABEL_COLOR,
                  fontSize: 12,
                  textAnchor: 'end',
                  dx: '-0.3em',
                  dy: '0.25em',
                })}
              />
            </Group>
          </svg>
        )}
      </div>
    </div>
  );
}

/**
 * Card wrapper with chart-specific content padding for dashboard chart surfaces.
 *
 * @aiSelectWhen Placing a chart on a dashboard with title, description, and optional footer actions
 * @aiSelectWhen Assembling dashboard chart grids per specs/patterns/dashboard.md
 *
 * @aiAvoid Do not require ChartCard in drawers or slots that already provide chrome — bare charts are allowed
 * @aiAvoid Do not use for non-chart content — use Card instead
 * @aiAvoid Do not wrap DataTable — that rule does not apply to charts
 *
 * @aiSpatial Owns chart-specific card content padding (var(--space-lg)) — do not add padding on the child chart
 *
 * @aiCompose Place exactly one chart primitive as children; pass CardProps for header and bottom bar
 */
export function ChartCard({ children, className, ...props }: ChartCardProps) {
  const rootClass = ['dsn-chart-card', className].filter(Boolean).join(' ');
  return (
    <Card {...props} className={rootClass}>
      <div className="dsn-chart-card-content">{children}</div>
    </Card>
  );
}
