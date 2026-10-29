import { BarChart, Card, ChartCard, LineChart, SectionHeader } from 'ds-ngr';
import { Layout } from '../Layout';

const kpis = [
  { title: 'Active projects', value: '14', trend: '+2 this week', positive: true },
  { title: 'Open tasks', value: '128', trend: '−6 since Monday', positive: true },
  { title: 'Overdue', value: '5', trend: '+3 this week', positive: false },
  { title: 'Team members', value: '23', trend: '+1 this month', positive: true },
];

const tasksByStatus = [
  { status: 'To do', count: 42 },
  { status: 'In progress', count: 31 },
  { status: 'In review', count: 18 },
  { status: 'Done', count: 64 },
];

const progress = [
  { week: 'W1', planned: 10, done: 8 },
  { week: 'W2', planned: 20, done: 17 },
  { week: 'W3', planned: 30, done: 29 },
  { week: 'W4', planned: 40, done: 36 },
  { week: 'W5', planned: 50, done: 47 },
  { week: 'W6', planned: 60, done: 58 },
];

export default function Home() {
  return (
    <Layout title="Dashboard">
      <SectionHeader title="Dashboard" size="large" />

      {/* KPI stat grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(12rem, 1fr))', gap: 'var(--space-md)', width: '100%' }}>
        {kpis.map((kpi) => (
          <Card key={kpi.title} title={kpi.title} showBottomBar={false}>
            <div style={{ fontSize: 'var(--font-size-display-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-foreground-neutral-primary)' }}>
              {kpi.value}
            </div>
            <div
              style={{
                fontSize: 'var(--font-size-body-sm)',
                color: kpi.positive ? 'var(--color-foreground-success-strong)' : 'var(--color-foreground-error-strong)',
                marginTop: 'var(--space-2xs)',
              }}
            >
              {kpi.trend}
            </div>
          </Card>
        ))}
      </div>

      <SectionHeader title="Overview" size="medium" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(20rem, 1fr))', gap: 'var(--space-md)', width: '100%' }}>
        <ChartCard title="Tasks by status" showBottomBar={false}>
          <BarChart data={tasksByStatus} xKey="status" series={[{ key: 'count', label: 'Tasks' }]} aria-label="Tasks by status" />
        </ChartCard>
        <ChartCard title="Project progress" showBottomBar={false}>
          <LineChart
            data={progress}
            xKey="week"
            series={[
              { key: 'planned', label: 'Planned' },
              { key: 'done', label: 'Done' },
            ]}
            aria-label="Planned vs done tasks per week"
          />
        </ChartCard>
      </div>
    </Layout>
  );
}
