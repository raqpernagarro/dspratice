import { AppShell, Navbar, Sidebar, Button, SectionHeader, Card, TextInput, TextArea, Select, NumberInput, CheckboxField, Callout, SearchBar, SidebarMenuSelector } from 'ds-ngr';
import { LayoutDashboard, FolderKanban, ListChecks, Users, Settings, Inbox, ChartColumn, Plus, CircleHelp } from 'lucide-react';

const clients = [
  { value: 'northwind', label: 'Northwind' },
  { value: 'contoso', label: 'Contoso' },
  { value: 'fabrikam', label: 'Fabrikam' },
  { value: 'tailspin', label: 'Tailspin' },
];

const statuses = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
];

const people = [
  { value: 'ana', label: 'Ana Costa', description: 'Delivery manager' },
  { value: 'bruno', label: 'Bruno Lima', description: 'Tech lead' },
  { value: 'carla', label: 'Carla Reis', description: 'Product designer' },
  { value: 'diogo', label: 'Diogo Sá', description: 'Engineer' },
];

export default function NewProjectPage() {
  return (
    <div style={{ height: '100vh', display: 'flex' }}>
      <AppShell
        header={<Navbar variant="title" title="New project" />}
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
        <SectionHeader title="New project" description="All fields are required unless marked optional." size="large" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', width: '100%' }}>
          <Card title="Project details" headerSize="medium" showBottomBar={false}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <TextInput label="Project name" placeholder="e.g. Billing revamp" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))', gap: 'var(--space-md)' }}>
                <Select label="Client" placeholder="Choose a client" options={clients} />
                <Select label="Status" options={statuses} defaultValue="draft" />
              </div>
              <TextArea label="Description" optional placeholder="What does this project deliver, and for whom?" minRows={3} helperText="Shown on the project overview." />
            </div>
          </Card>

          <Card title="Budget" headerSize="medium" showBottomBar={false}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))', gap: 'var(--space-md)' }}>
                <NumberInput label="Budget (€)" placeholder="0" />
                <NumberInput label="Estimated hours" optional placeholder="0" />
              </div>
              <CheckboxField label="Billing" checkboxLabel="Billable to client" helperText="Billable hours appear on the client's monthly invoice." defaultChecked />
            </div>
          </Card>

          <Card
            title="Team"
            headerSize="medium"
            showBottomBar
            bottomBarRightActions={
              <>
                <Button variant="ghost" size="md">Cancel</Button>
                <Button variant="primary" size="md" disabled shortcut shortcutLabel="⌘↵" shortcutAriaLabel="Command Enter">Create project</Button>
              </>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <Select label="Project lead" placeholder="Choose a person" options={people} />
              <Callout severity="default" title="Team members are invited after creation" description="You can add the rest of the team from the project's People tab." />
            </div>
          </Card>
        </div>
      </AppShell>
    </div>
  );
}
