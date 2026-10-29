import { AppShell, Navbar, Sidebar, Button, SectionHeader, Toolbar, SearchBar, DataTable, Tag, Drawer, DataListCell, Avatar, AvatarGroup, ProgressBar, SidebarMenuSelector } from 'ds-ngr';
import { LayoutDashboard, FolderKanban, ListChecks, Users, Settings, CircleDot, UserRound, Building2, CalendarDays, Wallet, Gauge, Plus, Inbox, ChartColumn, CircleHelp } from 'lucide-react';

const projects = [
  { id: 'p1', cells: { name: 'Billing revamp', client: 'Northwind', status: 'On track', lead: 'Ana Costa', due: '14 Nov 2026' } },
  { id: 'p2', cells: { name: 'Mobile onboarding', client: 'Contoso', status: 'At risk', lead: 'Diogo Sá', due: '30 Oct 2026' } },
  { id: 'p3', cells: { name: 'Data platform', client: 'Fabrikam', status: 'Blocked', lead: 'Filipe Rocha', due: '20 Jan 2027' } },
  { id: 'p4', cells: { name: 'Design tokens v3', client: 'Internal', status: 'Draft', lead: 'Carla Reis', due: '5 Dec 2026' } },
  { id: 'p5', cells: { name: 'Partner portal', client: 'Tailspin', status: 'On track', lead: 'Eva Nunes', due: '21 Oct 2026' } },
];

const statusVariant = { 'On track': 'success', 'At risk': 'warning', Blocked: 'error', Draft: 'neutral' };

const peopleByName = {
  'Ana Costa': { name: 'Ana Costa', initials: 'AC', src: 'https://i.pravatar.cc/80?img=47' },
  'Diogo Sá': { name: 'Diogo Sá', initials: 'DS', src: 'https://i.pravatar.cc/80?img=12' },
  'Filipe Rocha': { name: 'Filipe Rocha', initials: 'FR', src: 'https://i.pravatar.cc/80?img=33' },
  'Carla Reis': { name: 'Carla Reis', initials: 'CR', src: 'https://i.pravatar.cc/80?img=25' },
  'Eva Nunes': { name: 'Eva Nunes', initials: 'EN', src: 'https://i.pravatar.cc/80?img=31' },
};

const clientsByName = {
  Northwind: { name: 'Northwind', initials: 'NW', logoSrc: 'https://i.pravatar.cc/80?u=northwind-traders' },
  Contoso: { name: 'Contoso', initials: 'CO', logoSrc: 'https://i.pravatar.cc/80?u=contoso-ltd' },
  Fabrikam: { name: 'Fabrikam', initials: 'FA', logoSrc: 'https://i.pravatar.cc/80?u=fabrikam-inc' },
  Internal: { name: 'Internal', initials: 'IN' },
  Tailspin: { name: 'Tailspin', initials: 'TA', logoSrc: 'https://i.pravatar.cc/80?u=tailspin-toys' },
};

const selected = {
  name: 'Mobile onboarding',
  status: 'At risk',
  lead: peopleByName['Diogo Sá'],
  client: clientsByName.Contoso,
  due: '30 Oct 2026',
  budget: '€86,000 · 64% used',
  progress: 41,
  team: [
    { name: 'Diogo Sá', fill: 'initials', initials: 'DS' },
    { name: 'Eva Nunes', fill: 'initials', initials: 'EN' },
    { name: 'Bruno Lima', fill: 'initials', initials: 'BL' },
  ],
  description: 'Rebuild the first-run experience for the Contoso field app: account linking, permissions primer and a guided first task. Two tasks are blocked by the API freeze until 18 Oct.',
};

export default function ProjectDetailDrawerPage() {
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
        <SectionHeader title="Projects" size="large" />
        <Toolbar variant="filter-bar" aria-label="Filter projects" leftActions={<SearchBar variant="ghost" placeholder="Search projects" aria-label="Search projects" />} />
        <DataTable
          aria-label="Projects"
          columns={[
            { id: 'name', header: 'Name', fieldType: 'string', widthMode: 'stretch', sortable: true },
            {
              id: 'client',
              header: 'Client',
              fieldType: 'string',
              widthMode: 'fixed',
              width: 160,
              render: (value) => {
                const organization = clientsByName[value] ?? { name: value, initials: value.slice(0, 2).toUpperCase() };
                return (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2xs)', minWidth: 0 }}>
                    <Avatar size="xs" variant="organization" fill={organization.logoSrc ? 'picture' : 'initials'} src={organization.logoSrc} initials={organization.initials} name={organization.name} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{organization.name}</span>
                  </span>
                );
              },
            },
            {
              id: 'status',
              header: 'Status',
              fieldType: 'tag',
              widthMode: 'fixed',
              width: 130,
              render: (value) => <Tag variant={statusVariant[value]} size="sm" label={value} />,
            },
            {
              id: 'lead',
              header: 'Lead',
              fieldType: 'string',
              widthMode: 'fixed',
              width: 160,
              render: (value) => {
                const person = peopleByName[value] ?? { name: value, initials: value.split(' ').map((part) => part[0]).join('').slice(0, 2) };
                return (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2xs)', minWidth: 0 }}>
                    <Avatar size="xs" variant="profile" fill={person.src ? 'picture' : 'initials'} src={person.src} initials={person.initials} name={person.name} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{person.name}</span>
                  </span>
                );
              },
            },
            { id: 'due', header: 'Due', fieldType: 'date', widthMode: 'fixed', width: 130 },
          ]}
          rows={projects}
          selectedRowIds={['p2']}
        />

        <Drawer
          open
          title={selected.name}
          description={selected.client.name}
          width={420}
          showBottomBar
          bottomBarRightActions={
            <>
              <Button variant="ghost" size="md" destructive>Delete</Button>
              <Button variant="secondary" size="md">Edit project</Button>
            </>
          }
        >
          <>
            <DataListCell alignment="inline" title="Status" icon={<CircleDot size={16} />} showActions={false} content={<Tag variant={statusVariant[selected.status]} size="sm" label={selected.status} />} />
            <DataListCell
              alignment="inline"
              title="Lead"
              icon={<UserRound size={16} />}
              showActions={false}
              content={
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2xs)', minWidth: 0 }}>
                  <Avatar size="xs" variant="profile" fill={selected.lead.src ? 'picture' : 'initials'} src={selected.lead.src} initials={selected.lead.initials} name={selected.lead.name} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.lead.name}</span>
                </span>
              }
            />
            <DataListCell
              alignment="inline"
              title="Client"
              icon={<Building2 size={16} />}
              showActions={false}
              content={
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2xs)', minWidth: 0 }}>
                  <Avatar size="xs" variant="organization" fill={selected.client.logoSrc ? 'picture' : 'initials'} src={selected.client.logoSrc} initials={selected.client.initials} name={selected.client.name} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.client.name}</span>
                </span>
              }
            />
            <DataListCell alignment="inline" title="Due date" icon={<CalendarDays size={16} />} showActions={false} description={selected.due} />
            <DataListCell alignment="inline" title="Budget" icon={<Wallet size={16} />} showActions={false} description={selected.budget} />
            <DataListCell alignment="inline" title="Progress" icon={<Gauge size={16} />} showActions={false} content={<ProgressBar value={selected.progress} label={selected.progress + '% complete'} />} />
            <DataListCell alignment="inline" title="Team" icon={<Users size={16} />} showActions={false} content={<AvatarGroup size="xs" avatars={selected.team} />} />
            <DataListCell alignment="inline" title="Description" icon={<ListChecks size={16} />} showActions={false} description={selected.description} />
          </>
        </Drawer>
      </AppShell>
    </div>
  );
}
