import { AppShell, Navbar, Sidebar, Button, SectionHeader, Toolbar, SearchBar, SegmentControl, DataTable, Tag, AvatarGroup, ProgressBar, SidebarMenuSelector } from 'ds-ngr';
import { LayoutDashboard, FolderKanban, ListChecks, Users, Settings, Table2, Columns3, ListFilter, Plus, Inbox, ChartColumn, CircleHelp } from 'lucide-react';

const projects = [
  { id: 'p1', cells: { id: 'p1', name: 'Billing revamp', client: 'Northwind', status: 'On track', progress: 72, team: ['Ana Costa', 'Bruno Lima', 'Carla Reis'], due: '2026-11-14' } },
  { id: 'p2', cells: { id: 'p2', name: 'Mobile onboarding', client: 'Contoso', status: 'At risk', progress: 41, team: ['Diogo Sá', 'Eva Nunes'], due: '2026-10-30' } },
  { id: 'p3', cells: { id: 'p3', name: 'Data platform', client: 'Fabrikam', status: 'Blocked', progress: 18, team: ['Filipe Rocha', 'Ana Costa', 'Eva Nunes', 'Bruno Lima'], due: '2027-01-20' } },
  { id: 'p4', cells: { id: 'p4', name: 'Design tokens v3', client: 'Internal', status: 'Draft', progress: 5, team: ['Carla Reis'], due: '2026-12-05' } },
  { id: 'p5', cells: { id: 'p5', name: 'Partner portal', client: 'Tailspin', status: 'On track', progress: 88, team: ['Diogo Sá', 'Filipe Rocha'], due: '2026-10-21' } },
  { id: 'p6', cells: { id: 'p6', name: 'Support chatbot', client: 'Northwind', status: 'In review', progress: 64, team: ['Eva Nunes', 'Carla Reis'], due: '2026-11-02' } },
  { id: 'p7', cells: { id: 'p7', name: 'Warehouse scanner app', client: 'Adventure Works', status: 'On track', progress: 53, team: ['Bruno Lima'], due: '2026-12-18' } },
  { id: 'p8', cells: { id: 'p8', name: 'Pricing experiments', client: 'Contoso', status: 'At risk', progress: 37, team: ['Ana Costa', 'Diogo Sá'], due: '2026-11-09' } },
];

const statusVariant = { 'On track': 'success', 'In review': 'highlight', 'At risk': 'warning', Blocked: 'error', Draft: 'neutral' };

export default function ProjectsPage() {
  return (
    <div style={{ height: '100vh', display: 'flex' }}>
      <AppShell
        header={
          <Navbar
            variant="title"
            title="Projects"
            rightActions={<Button variant="primary" size="md" showLeadingIcon leadingIcon={<Plus size={16} />}>New project</Button>}
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
                  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
                  { id: 'inbox', label: 'Inbox', icon: <Inbox size={16} />, showBadge: true, badgeCount: 3, badgeVariant: 'highlight-strong' },
                  { id: 'projects', label: 'Projects', icon: <FolderKanban size={16} />, selected: true },
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
        <SectionHeader title="Projects" description="8 active engagements across 6 clients" size="large" />
        <Toolbar
          variant="filter-bar"
          aria-label="Filter projects"
          leftActions={
            <>
              <SegmentControl
                defaultValue="table"
                options={[
                  { value: 'table', label: 'Table', showLeadingIcon: true, leadingIcon: <Table2 size={16} /> },
                  { value: 'board', label: 'Board', showLeadingIcon: true, leadingIcon: <Columns3 size={16} /> },
                ]}
              />
              <SearchBar variant="ghost" placeholder="Search projects" aria-label="Search projects" />
            </>
          }
          rightActions={
            <>
              <Button variant="secondary" size="sm" showLeadingIcon leadingIcon={<ListFilter size={16} />}>Status</Button>
              <Button variant="secondary" size="sm" showLeadingIcon leadingIcon={<ListFilter size={16} />}>Client</Button>
            </>
          }
        />
        <DataTable
          aria-label="Projects"
          columns={[
            { id: 'name', header: 'Name', fieldType: 'string', widthMode: 'stretch', sortable: true },
            { id: 'client', header: 'Client', fieldType: 'string', widthMode: 'fixed', width: 160, sortable: true },
            {
              id: 'status',
              header: 'Status',
              fieldType: 'tag',
              widthMode: 'fixed',
              width: 130,
              render: (value) => <Tag variant={statusVariant[value]} size="sm" label={value} />,
            },
            {
              id: 'progress',
              header: 'Progress',
              fieldType: 'number',
              widthMode: 'fixed',
              width: 160,
              render: (value) => <ProgressBar value={value} label={value + '%'} />,
            },
            {
              id: 'team',
              header: 'Team',
              fieldType: 'user',
              widthMode: 'fixed',
              width: 140,
              render: (value) => <AvatarGroup size="xs" maxVisible={3} avatars={value.map((name) => ({ name, fill: 'initials', initials: name.split(' ').map((p) => p.charAt(0)).join('') }))} />,
            },
            { id: 'due', header: 'Due', fieldType: 'date', widthMode: 'fixed', width: 120, sortable: true },
          ]}
          rows={projects}
        />
      </AppShell>
    </div>
  );
}
