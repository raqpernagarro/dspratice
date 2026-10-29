import { AppShell, Navbar, Sidebar, Button, SectionHeader, Card, ChartCard, LineChart, BarChart, DonutChart, DataTable, Tag, SegmentControl, SearchBar, SidebarMenuSelector } from 'ds-ngr';
import { LayoutDashboard, FolderKanban, ListChecks, Users, Settings, Download, Inbox, ChartColumn, Plus, CircleHelp } from 'lucide-react';

const kpis = [
  { title: 'Active projects', value: '14', trend: '+2 this week', positive: true },
  { title: 'Open tasks', value: '128', trend: '−9 since Monday', positive: true },
  { title: 'Utilisation', value: '82%', trend: '+4 pts vs last month', positive: true },
  { title: 'Overdue', value: '6', trend: '+3 this week', positive: false },
];

const throughput = [
  { week: 'W32', completed: 34, created: 41 },
  { week: 'W33', completed: 39, created: 37 },
  { week: 'W34', completed: 45, created: 40 },
  { week: 'W35', completed: 42, created: 48 },
  { week: 'W36', completed: 51, created: 44 },
  { week: 'W37', completed: 56, created: 49 },
  { week: 'W38', completed: 53, created: 46 },
  { week: 'W39', completed: 61, created: 52 },
];

const hoursByTeam = [
  { team: 'Design', billable: 320, internal: 80 },
  { team: 'Frontend', billable: 540, internal: 120 },
  { team: 'Backend', billable: 610, internal: 95 },
  { team: 'QA', billable: 210, internal: 60 },
  { team: 'PM', billable: 180, internal: 140 },
];

const taskStatus = [
  { id: 'done', label: 'Done', value: 214 },
  { id: 'progress', label: 'In progress', value: 86 },
  { id: 'review', label: 'In review', value: 31 },
  { id: 'blocked', label: 'Blocked', value: 11 },
];

const activity = [
  { id: 'a1', cells: { event: 'Billing revamp moved to QA', project: 'Billing revamp', who: 'Ana Costa', when: '10 min ago', type: 'Milestone' } },
  { id: 'a2', cells: { event: 'Budget raised to €140k', project: 'Data platform', who: 'Filipe Rocha', when: '1 h ago', type: 'Budget' } },
  { id: 'a3', cells: { event: 'Two tasks blocked by API freeze', project: 'Mobile onboarding', who: 'Diogo Sá', when: '3 h ago', type: 'Risk' } },
  { id: 'a4', cells: { event: 'Kick-off scheduled for 14 Oct', project: 'Partner portal', who: 'Eva Nunes', when: 'Yesterday', type: 'Milestone' } },
];

const typeVariant = { Milestone: 'success', Budget: 'highlight', Risk: 'warning' };

export default function DashboardPage() {
  return (
    <div style={{ height: '100vh', display: 'flex' }}>
      <AppShell
        header={
          <Navbar
            variant="title"
            title="Dashboard"
            rightActions={<Button variant="secondary" size="md" showLeadingIcon leadingIcon={<Download size={16} />}>Export report</Button>}
          />
        }
        sidebar={
          <Sidebar
            selectorProps={{ label: 'Nagarro', avatarProps: { size: 'xs', variant: 'organization', fill: 'initials', initials: 'NG', name: 'Nagarro' } }}
            showSearch
            searchSlot={<SearchBar variant="ghost" placeholder="Search" aria-label="Search" />}
            sections={[
              {
                id: 'main',
                items: [
                  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} />, selected: true },
                  { id: 'inbox', label: 'Inbox', icon: <Inbox size={16} />, showBadge: true, badgeCount: 3, badgeVariant: 'highlight-strong' },
                  { id: 'projects', label: 'Projects', icon: <FolderKanban size={16} /> },
                  { id: 'tasks', label: 'Tasks', icon: <ListChecks size={16} /> },
                  { id: 'people', label: 'People', icon: <Users size={16} /> },
                  { id: 'reports', label: 'Reports', icon: <ChartColumn size={16} /> },
                ],
              },
              {
                id: 'pinned',
                title: 'Pinned projects',
                showDisclosure: true,
                separator: 'before',
                trailingAction: <Button variant="ghost" size="sm" showLabel={false} showLeadingIcon leadingIcon={<Plus size={16} />} aria-label="Pin a project" />,
                items: [
                  { id: 'billing-revamp', label: 'Billing revamp', showAvatar: true, avatarProps: { size: 'xs', variant: 'organization', fill: 'initials', initials: 'BR', name: 'Billing revamp' } },
                  { id: 'mobile-onboarding', label: 'Mobile onboarding', showAvatar: true, avatarProps: { size: 'xs', variant: 'organization', fill: 'initials', initials: 'MO', name: 'Mobile onboarding' } },
                  { id: 'data-platform', label: 'Data platform', showAvatar: true, avatarProps: { size: 'xs', variant: 'organization', fill: 'initials', initials: 'DP', name: 'Data platform' } },
                ],
              },
              {
                id: 'teams',
                title: 'Teams',
                showDisclosure: true,
                items: [
                  { id: 'team-design', label: 'Design', showAvatar: true, avatarProps: { size: 'xs', variant: 'organization', fill: 'initials', initials: 'DE', name: 'Design team' } },
                  { id: 'team-frontend', label: 'Frontend', showAvatar: true, avatarProps: { size: 'xs', variant: 'organization', fill: 'initials', initials: 'FE', name: 'Frontend team' } },
                  { id: 'team-backend', label: 'Backend', showAvatar: true, avatarProps: { size: 'xs', variant: 'organization', fill: 'initials', initials: 'BE', name: 'Backend team' } },
                  { id: 'team-qa', label: 'QA', showAvatar: true, avatarProps: { size: 'xs', variant: 'organization', fill: 'initials', initials: 'QA', name: 'QA team' } },
                ],
              },
            ]}
            bottomContent={
              <>
                <SidebarMenuSelector variant="full" label="Help" showIcon icon={<CircleHelp size={16} />} />
                <SidebarMenuSelector variant="full" label="Settings" showIcon icon={<Settings size={16} />} />
                <SidebarMenuSelector variant="full" label="Ana Costa" showAvatar avatarProps={{ size: 'xs', fill: 'initials', initials: 'AC', name: 'Ana Costa' }} />
              </>
            }
          />
        }
      >
        <SectionHeader
          title="Dashboard"
          description="Delivery health across all active engagements"
          size="large"
          trailingControl={
            <SegmentControl
              defaultValue="30d"
              options={[
                { value: '7d', label: '7 days' },
                { value: '30d', label: '30 days' },
                { value: 'qtd', label: 'Quarter' },
              ]}
            />
          }
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))', gap: 'var(--space-md)', width: '100%' }}>
          {kpis.map((kpi) => (
            <Card key={kpi.title} title={kpi.title} headerSize="small" showBottomBar={false}>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(18rem, 1fr))', gap: 'var(--space-md)', width: '100%' }}>
          <ChartCard title="Task throughput" description="Completed vs created, per week" headerSize="medium" showBottomBar={false}>
            <LineChart
              data={throughput}
              xKey="week"
              series={[
                { key: 'completed', label: 'Completed' },
                { key: 'created', label: 'Created' },
              ]}
              height={220}
            />
          </ChartCard>
          <ChartCard title="Hours by team" description="Last 30 days" headerSize="medium" showBottomBar={false}>
            <BarChart
              data={hoursByTeam}
              xKey="team"
              series={[
                { key: 'billable', label: 'Billable' },
                { key: 'internal', label: 'Internal' },
              ]}
              height={220}
            />
          </ChartCard>
          <ChartCard title="Tasks by status" description="All open projects" headerSize="medium" showBottomBar={false}>
            <DonutChart data={taskStatus} height={220} />
          </ChartCard>
        </div>

        <SectionHeader title="Recent activity" size="medium" />
        <DataTable
          aria-label="Recent activity"
          columns={[
            { id: 'event', header: 'Event', fieldType: 'string', widthMode: 'stretch' },
            { id: 'project', header: 'Project', fieldType: 'string', widthMode: 'fixed', width: 180 },
            {
              id: 'type',
              header: 'Type',
              fieldType: 'tag',
              widthMode: 'fixed',
              width: 120,
              render: (value) => <Tag variant={typeVariant[value]} size="sm" label={value} />,
            },
            { id: 'who', header: 'By', fieldType: 'string', widthMode: 'fixed', width: 150 },
            { id: 'when', header: 'When', fieldType: 'string', widthMode: 'fixed', width: 120 },
          ]}
          rows={activity}
        />
      </AppShell>
    </div>
  );
}
