/** Starter screen for the playground — follows AI.md so it validates clean. */
export const EXAMPLE_SOURCE = `import { AppShell, Navbar, Sidebar, Button, SectionHeader, Card, Stat, DataTable, Tag } from 'ds-ngr';
import { LayoutDashboard, FolderKanban, Users, Settings, Plus } from 'lucide-react';

const projects = [
  { id: 'p1', cells: { name: 'Billing revamp', owner: 'Ana Costa', status: 'On track', budget: 120000 } },
  { id: 'p2', cells: { name: 'Mobile onboarding', owner: 'Jonas Weber', status: 'At risk', budget: 86000 } },
  { id: 'p3', cells: { name: 'Data platform', owner: 'Priya Nair', status: 'Blocked', budget: 240000 } },
  { id: 'p4', cells: { name: 'Design tokens v3', owner: 'Rui Dias', status: 'Draft', budget: 30000 } },
];

const statusVariant = { 'On track': 'success', 'At risk': 'warning', Blocked: 'error', Draft: 'neutral' };

export default function Projects() {
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
            sections={[
              {
                id: 'main',
                items: [
                  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
                  { id: 'projects', label: 'Projects', icon: <FolderKanban size={16} />, selected: true },
                  { id: 'people', label: 'People', icon: <Users size={16} /> },
                  { id: 'settings', label: 'Settings', icon: <Settings size={16} /> },
                ],
              },
            ]}
          />
        }
      >
        <SectionHeader title="Projects" size="large" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(12rem, 1fr))', gap: 'var(--space-md)' }}>
          <Stat variant="card" title="Active projects" value="14" />
          <Stat variant="card" title="At risk" value="3" />
          <Stat variant="card" title="Budget used" value="62%" />
        </div>
        <SectionHeader title="All projects" size="medium" />
        <DataTable
          aria-label="Projects"
          columns={[
            { id: 'name', header: 'Name', fieldType: 'string', widthMode: 'stretch', sortable: true },
            { id: 'owner', header: 'Owner', fieldType: 'string', widthMode: 'fixed', width: 180 },
            {
              id: 'status',
              header: 'Status',
              fieldType: 'string',
              widthMode: 'fixed',
              width: 140,
              render: (value) => <Tag variant={statusVariant[value]} label={value} />,
            },
            {
              id: 'budget',
              header: 'Budget',
              fieldType: 'number',
              align: 'right',
              render: (value) => '€' + value.toLocaleString(),
            },
          ]}
          rows={projects}
        />
      </AppShell>
    </div>
  );
}
`;
