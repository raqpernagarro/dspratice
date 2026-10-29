import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  BarChart3,
  Bell,
  Calendar,
  ClipboardCheck,
  Ellipsis,
  FolderOpen,
  LayoutDashboard,
  Menu,
  Notebook,
  Plus,
  Settings,
  Smile,
  Zap,
} from 'lucide-react';
import { Button } from '../../atoms/Button';
import { SearchBar } from '../../atoms/SearchBar';
import { SidebarMenuSelector } from '../../molecules/SidebarMenuSelector';
import { Navbar } from '../Navbar';
import { Sidebar, type SidebarSection } from '../Sidebar';
import { Drawer } from '../Drawer';
import { AppShell } from './AppShell';
import spec from './AppShell.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

const meta: Meta<typeof AppShell> = {
  title: 'Layout/App Shell',
  component: AppShell,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    ...specDocsParameters(spec),
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh', display: 'flex' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AppShell>;
const STORAGE_NAMESPACE = 'dsn-storybook-app-shell';

const starterSections: SidebarSection[] = [
  {
    id: 'main',
    items: [
      {
        id: 'notifications',
        label: 'Notifications',
        icon: <Bell size={16} />,
        showBadge: true,
        badgeCount: 3,
        badgeVariant: 'highlight-strong',
      },
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
      { id: 'reports', label: 'Reports', icon: <BarChart3 size={16} /> },
      { id: 'projects', label: 'Projects', icon: <FolderOpen size={16} /> },
      { id: 'tasks', label: 'Tasks', icon: <ClipboardCheck size={16} />, selected: true },
      { id: 'calendar', label: 'Calendar', icon: <Calendar size={16} /> },
      { id: 'notes', label: 'Notes', icon: <Notebook size={16} /> },
    ],
  },
  {
    id: 'bookmarked',
    title: 'Bookmarked',
    showDisclosure: true,
    separator: 'before',
    items: [
      { id: 'q3-report', label: 'Q3 Report' },
      {
        id: 'john-smith',
        label: 'John Smith',
        showAvatar: true,
        avatarProps: {
          size: 'xs',
          variant: 'profile',
          fill: 'initials',
          initials: 'JS',
          name: 'John Smith',
        },
      },
      {
        id: 'project-x',
        label: 'Project X',
        icon: <span aria-hidden="true">⌛</span>,
      },
    ],
  },
  {
    id: 'automation',
    separator: 'before',
    items: [
      { id: 'automations', label: 'Automations', icon: <Zap size={16} /> },
      { id: 'agents', label: 'Agents', icon: <Smile size={16} /> },
    ],
  },
];

interface StarterSidebarProps {
  collapsed?: boolean;
}

function StarterSidebar({ collapsed = false }: StarterSidebarProps) {
  const rowVariant = collapsed ? 'icon' : 'full';

  return (
    <Sidebar
      collapsed={collapsed}
      selectorProps={{
        label: 'Acme Inc.',
        showAvatar: true,
        avatarProps: {
          size: 'xs',
          variant: 'organization',
          fill: 'initials',
          initials: 'AC',
          name: 'Acme Inc.',
        },
        showDisclosure: true,
      }}
      showSearch
      searchSlot={(
        <>
          <SearchBar placeholder="Search" aria-label="Search sidebar" />
          <Button
            variant="secondary"
            size="md"
            showLabel={false}
            showLeadingIcon
            leadingIcon={<Plus size={16} />}
            aria-label="Add item"
          />
        </>
      )}
      sections={starterSections}
      bottomContent={(
        <>
          <SidebarMenuSelector
            variant={rowVariant}
            label="Settings"
            showIcon
            icon={<Settings size={16} />}
          />
          <SidebarMenuSelector
            variant={rowVariant}
            label="User Name"
            showAvatar
            avatarProps={{ size: 'xs', variant: 'profile', fill: 'initials', initials: 'UN', name: 'User Name' }}
            showRightButton={!collapsed}
            rightButton={(
              <Button
                variant="ghost"
                size="sm"
                showLabel={false}
                showLeadingIcon
                leadingIcon={<Ellipsis size={16} />}
                aria-label="More options"
              />
            )}
          />
        </>
      )}
    />
  );
}

function readStoredBoolean(key: string, fallback: boolean): boolean {
  if (typeof window === 'undefined') return fallback;
  const value = window.localStorage.getItem(key);
  if (value === null) return fallback;
  return value === 'true';
}

function readStoredNumber(key: string, fallback: number): number {
  if (typeof window === 'undefined') return fallback;
  const value = window.localStorage.getItem(key);
  const parsed = value ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

interface ResizableShellExampleProps {
  storageScope: string;
  initialCollapsed?: boolean;
  initialWidth?: number;
}

function ResizableShellExample({
  storageScope,
  initialCollapsed = false,
  initialWidth = 200,
}: ResizableShellExampleProps) {
  const collapsedKey = `${STORAGE_NAMESPACE}:${storageScope}:collapsed`;
  const widthKey = `${STORAGE_NAMESPACE}:${storageScope}:width`;

  const [sidebarCollapsed, setSidebarCollapsed] = React.useState<boolean>(() =>
    readStoredBoolean(collapsedKey, initialCollapsed),
  );
  const [sidebarWidth, setSidebarWidth] = React.useState<number>(() =>
    readStoredNumber(widthKey, initialWidth),
  );

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(collapsedKey, String(sidebarCollapsed));
  }, [collapsedKey, sidebarCollapsed]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(widthKey, String(sidebarWidth));
  }, [sidebarWidth, widthKey]);

  return (
    <AppShell
      sidebar={<StarterSidebar collapsed={sidebarCollapsed} />}
      header={(
        <Navbar
          variant="title"
          title="Dashboard"
          rightActions={<Button variant="primary" size="md">Create</Button>}
        />
      )}
      sidebarCollapsed={sidebarCollapsed}
      sidebarWidth={sidebarWidth}
      onSidebarCollapsedChange={setSidebarCollapsed}
      onSidebarWidthChange={setSidebarWidth}
    >
      <StarterMainContent />
    </AppShell>
  );
}

function StarterMainContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
      <section
        style={{
          border: 'var(--size-border-sm) solid var(--color-border-neutral-primary)',
          borderRadius: 'var(--shape-radius-md)',
          padding: 'var(--space-md)',
          background: 'var(--color-background-neutral-primary)',
        }}
      >
        <h2 style={{ margin: 0, fontSize: 'var(--font-size-body-md)', color: 'var(--color-foreground-neutral-primary)' }}>
          Page Starter
        </h2>
        <p style={{ margin: 'var(--space-2xs) 0 0', color: 'var(--color-foreground-neutral-secondary)' }}>
          Start every page here: replace this area with your feature content.
        </p>
      </section>
      <section
        style={{
          border: 'var(--size-border-sm) solid var(--color-border-neutral-primary)',
          borderRadius: 'var(--shape-radius-md)',
          padding: 'var(--space-md)',
          background: 'var(--color-background-neutral-primary)',
        }}
      >
        <p style={{ margin: 0, color: 'var(--color-foreground-neutral-secondary)' }}>
          Keep page-level layout in `AppShell` and domain logic in route components.
        </p>
      </section>
    </div>
  );
}

export const Playground: Story = {
  args: {
    sidebar: <StarterSidebar />,
    header: (
      <Navbar
        variant="title"
        title="Dashboard"
        rightActions={<Button variant="primary" size="md">Create</Button>}
      />
    ),
    children: <StarterMainContent />,
  },
};

export const ResizablePersistent: Story = {
  name: 'Resizable (persisted)',
  render: function ResizablePersistentStory() {
    return <ResizableShellExample storageScope="default" />;
  },
};

export const ResizableCollapsedStart: Story = {
  name: 'Resizable (collapsed start)',
  render: function ResizableCollapsedStartStory() {
    return <ResizableShellExample storageScope="collapsed" initialCollapsed initialWidth={200} />;
  },
};

export const ResizableAtBounds: Story = {
  name: 'Resizable (boundary checks)',
  render: function ResizableAtBoundsStory() {
    return (
      <ResizableShellExample
        storageScope="bounds"
        initialCollapsed={false}
        initialWidth={320}
      />
    );
  },
};

export const ContentOnly: Story = {
  args: {
    header: (
      <Navbar
        variant="title"
        title="New Page"
        rightActions={<Button variant="primary" size="md">Create</Button>}
      />
    ),
    children: <StarterMainContent />,
  },
};

export const MobileWithDrawer: Story = {
  render: function MobileWithDrawerStory() {
    const [open, setOpen] = React.useState(false);

    return (
      <>
        <AppShell
          header={(
            <Navbar
              variant="title"
              title="Dashboard"
              leftActions={(
                <Button
                  variant="ghost"
                  size="md"
                  showLabel={false}
                  showLeadingIcon
                  leadingIcon={<Menu size={16} />}
                  aria-label="Open navigation menu"
                  onClick={() => setOpen(true)}
                />
              )}
            />
          )}
        >
          <StarterMainContent />
        </AppShell>

        <Drawer
          variant="overlay"
          placement="left"
          open={open}
          onClose={() => setOpen(false)}
          onOpenChange={setOpen}
          showHeader={false}
          showBottomBar={false}
          aria-label="Mobile navigation"
        >
          <StarterSidebar />
        </Drawer>
      </>
    );
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};
