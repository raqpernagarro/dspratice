import { AppShell, Navbar, Sidebar, Button, SectionHeader, Tab, Card, Avatar, TextInput, Select, HorizontalInput, Switcher, SearchBar, SidebarMenuSelector } from 'ds-ngr';
import { LayoutDashboard, FolderKanban, ListChecks, Users, Settings, Mail, Bell, MessageSquare, CalendarClock, Inbox, ChartColumn, Plus, CircleHelp } from 'lucide-react';

const timezones = [
  { value: 'lisbon', label: 'Europe/Lisbon (GMT+1)' },
  { value: 'berlin', label: 'Europe/Berlin (GMT+2)' },
  { value: 'kolkata', label: 'Asia/Kolkata (GMT+5:30)' },
  { value: 'newyork', label: 'America/New_York (GMT−4)' },
];

const languages = [
  { value: 'en', label: 'English' },
  { value: 'de', label: 'Deutsch' },
  { value: 'pt', label: 'Português' },
];

const notifications = [
  { id: 'mentions', label: 'Mentions', description: 'When someone @mentions you in a task or comment', icon: <MessageSquare size={16} />, on: true },
  { id: 'assigned', label: 'Assignments', description: 'When a task is assigned to you', icon: <Bell size={16} />, on: true },
  { id: 'digest', label: 'Weekly digest', description: 'A Monday summary of your projects by email', icon: <Mail size={16} />, on: false },
  { id: 'deadlines', label: 'Deadline reminders', description: 'One day before a task you own is due', icon: <CalendarClock size={16} />, on: true },
];

export default function SettingsPage() {
  return (
    <div style={{ height: '100vh', display: 'flex' }}>
      <AppShell
        header={<Navbar variant="title" title="Settings" />}
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
                <SidebarMenuSelector variant="full" label="Settings" showIcon icon={<Settings size={16} />} selected />
                <SidebarMenuSelector variant="full" label="Ana Costa" showAvatar avatarProps={{ size: 'xs', fill: 'initials', initials: 'AC', name: 'Ana Costa' }} />
              </>
            }
          />
        }
      >
        <div style={{ maxWidth: 'var(--size-container-xl)', marginInline: 'auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          <SectionHeader title="Settings" description="Manage your profile, notifications and workspace preferences." size="large" />
          <Tab
            defaultValue="general"
            showPanels={false}
            tabs={[
              { value: 'general', label: 'General' },
              { value: 'notifications', label: 'Notifications' },
              { value: 'security', label: 'Security' },
              { value: 'billing', label: 'Billing' },
            ]}
          />

          <Card
            title="Profile"
            description="How you appear to teammates and clients."
            headerSize="medium"
            showBottomBar
            bottomBarRightActions={
              <>
                <Button variant="ghost" size="md">Discard</Button>
                <Button variant="primary" size="md" shortcut shortcutLabel="⌘↵" shortcutAriaLabel="Command Enter">Save changes</Button>
              </>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                <Avatar size="xl" fill="initials" initials="AC" name="Ana Costa" />
                <Button variant="secondary" size="sm">Upload photo</Button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(18rem, 1fr))', gap: 'var(--space-md)' }}>
                <TextInput label="Full name" defaultValue="Ana Costa" />
                <TextInput label="Job title" optional defaultValue="Delivery manager" />
                <TextInput label="Email" defaultValue="ana.costa@example.com" helperText="Used for sign-in and notifications." />
                <Select label="Time zone" options={timezones} defaultValue="lisbon" />
                <Select label="Language" options={languages} defaultValue="en" />
              </div>
            </div>
          </Card>

          <Card title="Notifications" description="Changes apply immediately." headerSize="medium" showBottomBar={false}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {notifications.map((item) => (
                <HorizontalInput key={item.id} label={item.label} description={item.description} showDescription showIcon iconSlot={item.icon}>
                  <Switcher checked={item.on} aria-label={item.label} />
                </HorizontalInput>
              ))}
            </div>
          </Card>

          <Card title="Danger zone" description="Leaving removes your access to all projects in this workspace." headerSize="medium" showBottomBar={false}>
            <div>
              <Button variant="secondary" size="md" destructive>Leave workspace</Button>
            </div>
          </Card>
        </div>
      </AppShell>
    </div>
  );
}
