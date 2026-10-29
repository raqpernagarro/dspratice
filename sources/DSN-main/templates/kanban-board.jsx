import { useState } from 'react';
import { AppShell, Navbar, Sidebar, Button, SectionHeader, Toolbar, SearchBar, SegmentControl, Card, Tag, Avatar, EmptyState, PopoverMenu, SidebarMenuSelector } from 'ds-ngr';
import { LayoutDashboard, FolderKanban, ListChecks, Users, Settings, Table2, Columns3, ListFilter, CalendarDays, Plus, Ellipsis, Inbox, ChartColumn, CircleHelp } from 'lucide-react';

const columnMenuItems = [
  { id: 'rename', kind: 'menu-cell', props: { label: 'Rename column', showLeadingIcon: false, showTrailingIcon: false } },
  { id: 'sort', kind: 'menu-cell', props: { label: 'Sort tasks', showLeadingIcon: false, showTrailingIcon: false } },
  { id: 'hide', kind: 'menu-cell', props: { label: 'Hide column', showLeadingIcon: false, showTrailingIcon: false } },
];

const columns = [
  {
    id: 'todo',
    title: 'To do',
    tone: 'neutral',
    surface: 'var(--tag-background-neutral)',
    border: 'var(--size-border-sm) solid var(--tag-border-neutral)',
    ink: 'var(--tag-foreground-neutral)',
    tasks: [
      { id: 't1', title: 'Audit invoice templates', description: 'List every template still on the legacy renderer.', priority: 'Medium', type: 'Research', assignee: 'Carla Reis', initials: 'CR', due: '18 Oct' },
      { id: 't2', title: 'Draft migration plan', description: 'Phased rollout per region with fallbacks.', priority: 'High', type: 'Planning', assignee: 'Ana Costa', initials: 'AC', due: '21 Oct' },
    ],
  },
  {
    id: 'progress',
    title: 'In progress',
    tone: 'warning',
    surface: 'var(--tag-background-warning)',
    border: 'var(--size-border-sm) solid var(--tag-border-warning)',
    ink: 'var(--tag-foreground-warning)',
    tasks: [
      { id: 't3', title: 'Tax rules engine', description: 'Support reverse charge for EU B2B.', priority: 'High', type: 'Feature', assignee: 'Bruno Lima', initials: 'BL', due: '16 Oct' },
      { id: 't4', title: 'PDF export redesign', description: 'Apply the new document tokens.', priority: 'Low', type: 'Design', assignee: 'Eva Nunes', initials: 'EN', due: '24 Oct' },
      { id: 't5', title: 'Webhook retries', description: 'Exponential backoff with dead-letter queue.', priority: 'Medium', type: 'Feature', assignee: 'Diogo Sá', initials: 'DS', due: '19 Oct' },
    ],
  },
  {
    id: 'blocked',
    title: 'Blocked',
    tone: 'error',
    surface: 'var(--tag-background-error)',
    border: 'var(--size-border-sm) solid var(--tag-border-error)',
    ink: 'var(--tag-foreground-error)',
    tasks: [],
  },
  {
    id: 'done',
    title: 'Done',
    tone: 'success',
    surface: 'var(--tag-background-success)',
    border: 'var(--size-border-sm) solid var(--tag-border-success)',
    ink: 'var(--tag-foreground-success)',
    tasks: [
      { id: 't6', title: 'Payment provider spike', description: 'Compared three providers on fees and SLAs.', priority: 'Medium', type: 'Research', assignee: 'Filipe Rocha', initials: 'FR', due: '9 Oct' },
    ],
  },
];

const priorityVariant = { High: 'error', Medium: 'warning', Low: 'neutral' };

export default function TaskBoardPage() {
  const [openColumnMenu, setOpenColumnMenu] = useState(null);

  return (
    <div style={{ height: '100vh', display: 'flex' }}>
      <AppShell
        header={
          <Navbar
            variant="title"
            title="Tasks"
            rightActions={<Button variant="primary" size="md" showLeadingIcon leadingIcon={<Plus size={16} />}>New task</Button>}
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
                  { id: 'billing-revamp', label: 'Billing revamp', showAvatar: true, avatarProps: { size: 'xs', variant: 'organization', fill: 'initials', initials: 'BR', name: 'Billing revamp' }, selected: true },
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
        <SectionHeader title="Billing revamp" description="Sprint 14 · ends 25 Oct" size="large" />
        <Toolbar
          variant="filter-bar"
          aria-label="Filter tasks"
          leftActions={
            <>
              <SegmentControl
                defaultValue="board"
                options={[
                  { value: 'table', label: 'Table', showLeadingIcon: true, leadingIcon: <Table2 size={16} /> },
                  { value: 'board', label: 'Board', showLeadingIcon: true, leadingIcon: <Columns3 size={16} /> },
                ]}
              />
              <SearchBar variant="ghost" placeholder="Search tasks" aria-label="Search tasks" />
            </>
          }
          rightActions={
            <>
              <Button variant="secondary" size="sm" showLeadingIcon leadingIcon={<ListFilter size={16} />}>Assignee</Button>
              <Button variant="secondary" size="sm" showLeadingIcon leadingIcon={<ListFilter size={16} />}>Priority</Button>
            </>
          }
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(13rem, 1fr))', gap: 'var(--space-md)', width: '100%', overflowX: 'auto', alignItems: 'start' }}>
          {columns.map((column) => (
            <section
              key={column.id}
              data-status={column.tone}
              aria-label={column.title}
              style={{
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-2xs)',
                borderRadius: 'var(--card-radius)',
                border: column.border,
                background: column.surface,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 'var(--space-2xs)',
                  paddingBlockStart: 'var(--space-md)',
                  paddingBlockEnd: 'var(--space-xs)',
                  paddingInline: 'var(--space-md)',
                  color: column.ink,
                  fontSize: 'var(--font-size-label)',
                  fontWeight: 'var(--font-weight-medium)',
                  lineHeight: 'var(--font-line-height-label)',
                }}
              >
                <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{column.title}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  showLabel={false}
                  showLeadingIcon
                  leadingIcon={<Ellipsis size={16} />}
                  aria-label={`${column.title} column options`}
                  aria-haspopup="dialog"
                  aria-expanded={openColumnMenu === column.id}
                  onClick={() => setOpenColumnMenu((current) => (current === column.id ? null : column.id))}
                />
              </div>
              {openColumnMenu === column.id && (
                <PopoverMenu
                  variant="simple"
                  showHeader={false}
                  aria-label={`${column.title} column options`}
                  onEscape={() => setOpenColumnMenu(null)}
                  simpleItems={columnMenuItems}
                />
              )}
              {column.tasks.length === 0 ? (
                <EmptyState size="small" hasIcon={false} title="Nothing blocked" subtitle="Tasks waiting on someone land here." hasActions={false} showHelpText={false} />
              ) : (
                column.tasks.map((task) => (
                  <Card
                    key={task.id}
                    title={task.title}
                    description={task.description}
                    headerSize="small"
                    showBottomBar
                    bottomBarLeftActions={<Avatar size="xs" fill="initials" initials={task.initials} name={task.assignee} />}
                    bottomBarRightActions={
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2xs)', fontSize: 'var(--font-size-body-sm)', color: 'var(--color-foreground-neutral-secondary)' }}>
                        <CalendarDays size={14} /> {task.due}
                      </span>
                    }
                  >
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2xs)' }}>
                      <Tag variant={priorityVariant[task.priority]} size="sm" label={task.priority} />
                      <Tag variant="neutral" size="sm" label={task.type} />
                    </div>
                  </Card>
                ))
              )}
            </section>
          ))}
        </div>
      </AppShell>
    </div>
  );
}
