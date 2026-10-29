import { useRef, useState, type ComponentProps, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import {
  BarChart3,
  Bell,
  FileText,
  FolderKanban,
  GitPullRequest,
  LayoutGrid,
  Rocket,
  SquareCheck,
  Users,
} from 'lucide-react';
import { Sidebar } from '../Sidebar';
import { NotificationCenter, type NotificationItem } from './NotificationCenter';
import spec from './NotificationCenter.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

const notifications: NotificationItem[] = [
  {
    id: 'n1',
    title: 'Ana Silva mentioned you in Q3 roadmap',
    description: 'Can you confirm the launch date for the billing migration before Friday?',
    timeLabel: '5 min ago',
    dateTime: '2026-10-08T09:55:00Z',
    avatar: { fill: 'initials', initials: 'AS', name: 'Ana Silva' },
  },
  {
    id: 'n2',
    title: 'Deploy to staging finished',
    description: 'Build 1482 is live on staging.',
    timeLabel: '1 h ago',
    dateTime: '2026-10-08T09:00:00Z',
    avatar: { fill: 'icon', icon: Rocket, name: 'Deployments' },
  },
  {
    id: 'n3',
    title: 'Marco Rossi approved your access request',
    timeLabel: 'Yesterday',
    dateTime: '2026-10-07T15:20:00Z',
    read: true,
    avatar: { fill: 'initials', initials: 'MR', name: 'Marco Rossi' },
  },
  {
    id: 'n4',
    title: 'Review requested on “Add export to CSV”',
    timeLabel: '2 days ago',
    dateTime: '2026-10-06T11:00:00Z',
    read: true,
    avatar: { fill: 'icon', icon: GitPullRequest, name: 'Pull requests' },
  },
];

/**
 * Notifications lives in the Sidebar: the item's `buttonRef` is the panel's `anchorRef`,
 * so the panel opens to the right of the item. The item carries the unread badge and the
 * popup ARIA. The app owns read state, the way a real app would.
 */
function SidebarExample(args: ComponentProps<typeof NotificationCenter>) {
  const itemRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [list, setList] = useState(args.notifications);
  const unread = list.filter((n) => !n.read).length;
  const nav = (id: string, label: string, icon: ReactNode) => ({ id, label, icon });

  return (
    <div style={{ display: 'flex', height: '36rem' }}>
      <Sidebar
        sections={[
          {
            id: 'main',
            items: [
              {
                id: 'notifications',
                label: 'Notifications',
                icon: <Bell size={16} />,
                showBadge: unread > 0,
                badgeCount: unread,
                selected: open,
                buttonRef: itemRef,
                'aria-haspopup': 'dialog',
                'aria-expanded': open,
                'aria-controls': open ? 'sidebar-notifications' : undefined,
                onClick: () => setOpen((value) => !value),
              },
              nav('dashboard', 'Dashboard', <LayoutGrid size={16} />),
              nav('projects', 'Projects', <FolderKanban size={16} />),
              nav('tasks', 'Tasks', <SquareCheck size={16} />),
              nav('people', 'People', <Users size={16} />),
              nav('reports', 'Reports', <BarChart3 size={16} />),
              nav('notes', 'Notes', <FileText size={16} />),
            ],
          },
        ]}
      />
      <NotificationCenter
        {...args}
        id="sidebar-notifications"
        anchorRef={itemRef}
        open={open}
        onOpenChange={(next) => {
          args.onOpenChange?.(next);
          setOpen(next);
        }}
        notifications={list}
        onNotificationClick={(item) => {
          args.onNotificationClick?.(item);
          setList((prev) => prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)));
        }}
        onMarkAllRead={() => {
          args.onMarkAllRead?.();
          setList((prev) => prev.map((n) => ({ ...n, read: true })));
        }}
      />
    </div>
  );
}

const meta: Meta<typeof NotificationCenter> = {
  title: 'Overlays/Notification Center',
  component: NotificationCenter,
  tags: ['autodocs'],
  parameters: { ...specDocsParameters(spec), layout: 'padded' },
  args: {
    notifications,
    onNotificationClick: fn(),
    onMarkAllRead: fn(),
    onViewAll: fn(),
    onOpenChange: fn(),
    onFilterChange: fn(),
  },
  render: (args) => <SidebarExample {...args} />,
};

export default meta;
type Story = StoryObj<typeof NotificationCenter>;

export const Playground: Story = {};

/** Interaction test for the Playground setup. */
export const Interaction: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const item = canvas.getByRole('button', { name: /Notifications/ });

    // Open from the sidebar item; focus lands on the first notification.
    await userEvent.click(item);
    // Opens to the right of the item when the viewport has room, otherwise below.
    await body.findByRole('dialog', { name: 'Notifications' });
    await expect(item).toHaveAttribute('aria-expanded', 'true');
    const first = body.getByRole('button', { name: /Ana Silva mentioned you/ });
    await waitFor(() => expect(first).toHaveFocus());

    // Arrow keys move between rows; Enter activates and returns focus to the item.
    await userEvent.keyboard('{ArrowDown}');
    await expect(body.getByRole('button', { name: /Deploy to staging finished/ })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onNotificationClick).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'n2' }),
    );
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
    await expect(item).toHaveFocus();

    // Reopen and mark everything read; View all closes the panel and returns focus.
    await userEvent.keyboard('{Enter}');
    const markAll = await body.findByRole('button', { name: 'Mark all as read' });
    await userEvent.click(markAll);
    await expect(args.onMarkAllRead).toHaveBeenCalledTimes(1);
    await expect(markAll).toBeDisabled();

    await userEvent.click(body.getByRole('button', { name: 'View all notifications' }));
    await expect(args.onViewAll).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
    await expect(item).toHaveFocus();

    // Escape also closes and returns focus to the item.
    await userEvent.keyboard('{Enter}');
    await body.findByRole('dialog', { name: 'Notifications' });
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
    await expect(item).toHaveFocus();
    await expect(args.onOpenChange).toHaveBeenCalledWith(false);
  },
};
