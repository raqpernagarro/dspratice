import { useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { Sidebar } from '../Sidebar';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NotificationCenter, type NotificationItem } from './NotificationCenter';

const items: NotificationItem[] = [
  { id: '1', title: 'Ana Silva mentioned you in Q3 roadmap', timeLabel: '5 min ago', read: false },
  { id: '2', title: 'Deploy to staging finished', timeLabel: '1 h ago', read: false },
  { id: '3', title: 'Marco Rossi approved your request', timeLabel: 'Yesterday', read: true },
];

const allRead = items.map((item) => ({ ...item, read: true }));

function openPanel() {
  return userEvent.setup();
}

describe('NotificationCenter', () => {
  it('names the trigger with the unread count and shows the badge', () => {
    const { container } = render(<NotificationCenter notifications={items} />);

    expect(screen.getByRole('button', { name: 'Notifications, 2 unread' })).toBeInTheDocument();
    expect(container.querySelector('.dsn-notification-center-count')).toHaveTextContent('2');
  });

  it('hides the badge when nothing is unread', () => {
    const { container } = render(<NotificationCenter notifications={allRead} />);

    expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument();
    expect(container.querySelector('.dsn-notification-center-count')).toBeNull();
  });

  it('opens and closes the panel from the trigger and reflects aria-expanded', async () => {
    const user = openPanel();
    render(<NotificationCenter notifications={items} />);
    const trigger = screen.getByRole('button', { name: /notifications/i });

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await user.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'Notifications' });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveAttribute('aria-controls', dialog.id);

    await user.click(trigger);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('moves focus to the first notification on open', async () => {
    const user = openPanel();
    render(<NotificationCenter notifications={items} />);

    await user.click(screen.getByRole('button', { name: /notifications/i }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Ana Silva mentioned you/ })).toHaveFocus(),
    );
  });

  it('calls onNotificationClick on mouse click before dismissing (portal-safe)', async () => {
    const user = openPanel();
    const onNotificationClick = vi.fn();
    render(<NotificationCenter notifications={items} onNotificationClick={onNotificationClick} />);

    const trigger = screen.getByRole('button', { name: /notifications/i });
    await user.click(trigger);
    await user.click(screen.getByRole('button', { name: /Deploy to staging finished/ }));

    expect(onNotificationClick).toHaveBeenCalledWith(items[1]);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('closes on outside click', async () => {
    const user = openPanel();
    render(
      <div>
        <p>Outside</p>
        <NotificationCenter notifications={items} />
      </div>,
    );

    await user.click(screen.getByRole('button', { name: /notifications/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.click(screen.getByText('Outside'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    const user = openPanel();
    render(<NotificationCenter notifications={items} />);
    const trigger = screen.getByRole('button', { name: /notifications/i });

    await user.click(trigger);
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('moves focus between rows with arrow keys, Home and End', async () => {
    const user = openPanel();
    render(<NotificationCenter notifications={items} />);

    await user.click(screen.getByRole('button', { name: /notifications/i }));
    const first = screen.getByRole('button', { name: /Ana Silva/ });
    const second = screen.getByRole('button', { name: /Deploy to staging/ });
    const third = screen.getByRole('button', { name: /Marco Rossi/ });
    await waitFor(() => expect(first).toHaveFocus());

    await user.keyboard('{ArrowDown}');
    expect(second).toHaveFocus();
    await user.keyboard('{End}');
    expect(third).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(first).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    expect(third).toHaveFocus();
    await user.keyboard('{Home}');
    expect(first).toHaveFocus();

    // Roving tabindex: only the active row is in the tab order.
    expect(first).toHaveAttribute('tabindex', '0');
    expect(second).toHaveAttribute('tabindex', '-1');
  });

  it('marks unread rows with text, not colour alone', async () => {
    const user = openPanel();
    render(<NotificationCenter notifications={items} />);

    await user.click(screen.getByRole('button', { name: /notifications/i }));
    expect(screen.getByRole('button', { name: /Ana Silva.*Unread/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Marco Rossi/ })).not.toHaveTextContent('Unread');
  });

  it('calls onMarkAllRead and disables it when nothing is unread', async () => {
    const user = openPanel();
    const onMarkAllRead = vi.fn();
    const { rerender } = render(
      <NotificationCenter notifications={items} onMarkAllRead={onMarkAllRead} defaultOpen />,
    );

    await user.click(screen.getByRole('button', { name: 'Mark all as read' }));
    expect(onMarkAllRead).toHaveBeenCalledTimes(1);

    rerender(<NotificationCenter notifications={allRead} onMarkAllRead={onMarkAllRead} defaultOpen />);
    expect(screen.getByRole('button', { name: 'Mark all as read' })).toBeDisabled();
  });

  it('hides Mark all as read and View all when their callbacks are omitted', () => {
    render(<NotificationCenter notifications={items} defaultOpen />);

    expect(screen.queryByRole('button', { name: 'Mark all as read' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'View all notifications' })).not.toBeInTheDocument();
  });

  it('calls onViewAll, closes the panel and returns focus to the trigger', async () => {
    const user = openPanel();
    const onViewAll = vi.fn();
    render(<NotificationCenter notifications={items} onViewAll={onViewAll} />);
    const trigger = screen.getByRole('button', { name: /notifications/i });

    await user.click(trigger);
    await user.click(screen.getByRole('button', { name: 'View all notifications' }));
    expect(onViewAll).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('filters to unread notifications', async () => {
    const user = openPanel();
    const onFilterChange = vi.fn();
    render(<NotificationCenter notifications={items} onFilterChange={onFilterChange} defaultOpen />);

    await user.click(screen.getByRole('radio', { name: /Unread/ }));
    expect(onFilterChange).toHaveBeenCalledWith('unread');
    const list = screen.getByRole('list', { name: 'Notifications' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
    expect(screen.queryByText(/Marco Rossi/)).not.toBeInTheDocument();
  });

  it('shows the caught-up empty state when the unread filter has no items', () => {
    render(<NotificationCenter notifications={allRead} defaultFilter="unread" defaultOpen />);

    expect(screen.getByText("You're all caught up")).toBeInTheDocument();
  });

  it('shows the first-run empty state when there are no notifications', () => {
    render(<NotificationCenter notifications={[]} defaultOpen />);

    expect(screen.getByText('No notifications yet')).toBeInTheDocument();
  });

  it('marks the list busy while loading', () => {
    render(<NotificationCenter notifications={[]} loading defaultOpen />);

    expect(screen.getByRole('list', { name: 'Loading notifications' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
  });

  it('respects controlled open and filter props', async () => {
    const user = openPanel();
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <NotificationCenter notifications={items} open={false} onOpenChange={onOpenChange} filter="unread" />,
    );

    await user.click(screen.getByRole('button', { name: /notifications/i }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    rerender(
      <NotificationCenter notifications={items} open onOpenChange={onOpenChange} filter="unread" />,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.queryByText(/Marco Rossi/)).not.toBeInTheDocument();
  });

  it('announces new unread notifications but stays silent on mount', () => {
    function Harness() {
      const [list, setList] = useState(items);
      return (
        <>
          <button
            type="button"
            onClick={() =>
              setList((prev) => [
                { id: '4', title: 'New comment on Budget', timeLabel: 'Just now' },
                ...prev,
              ])
            }
          >
            Push
          </button>
          <NotificationCenter notifications={list} />
        </>
      );
    }
    render(<Harness />);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('');

    act(() => {
      screen.getByRole('button', { name: 'Push' }).click();
    });
    expect(status).toHaveTextContent('1 new notification');
  });

  describe('opened from a Sidebar item (external anchorRef)', () => {
    function SidebarHarness({
      onNotificationClick,
      onViewAll,
    }: {
      onNotificationClick?: () => void;
      onViewAll?: () => void;
    }) {
      const itemRef = useRef<HTMLButtonElement>(null);
      const [open, setOpen] = useState(false);
      return (
        <>
          <Sidebar
            sections={[
              {
                id: 'main',
                items: [
                  {
                    id: 'notifications',
                    label: 'Notifications',
                    icon: <Bell size={16} />,
                    showBadge: true,
                    badgeCount: 2,
                    buttonRef: itemRef,
                    'aria-haspopup': 'dialog',
                    'aria-expanded': open,
                    'aria-controls': open ? 'notifications-panel' : undefined,
                    onClick: () => setOpen((value) => !value),
                  },
                  { id: 'dashboard', label: 'Dashboard' },
                ],
              },
            ]}
          />
          <NotificationCenter
            id="notifications-panel"
            anchorRef={itemRef}
            open={open}
            onOpenChange={setOpen}
            notifications={items}
            onNotificationClick={onNotificationClick}
            onViewAll={onViewAll}
          />
        </>
      );
    }

    it('renders no bell and toggles from the sidebar item', async () => {
      const user = userEvent.setup();
      render(<SidebarHarness />);

      expect(screen.queryByRole('button', { name: /^Notifications, / })).not.toBeInTheDocument();
      const item = screen.getByRole('button', { name: /Notifications/ });
      expect(item).toHaveAttribute('aria-haspopup', 'dialog');
      expect(item).toHaveAttribute('aria-expanded', 'false');

      await user.click(item);
      expect(screen.getByRole('dialog', { name: 'Notifications' })).toHaveAttribute(
        'id',
        'notifications-panel',
      );
      expect(item).toHaveAttribute('aria-expanded', 'true');
      expect(item).toHaveAttribute('aria-controls', 'notifications-panel');

      // Clicking the trigger again closes (mousedown on the anchor is not an outside click).
      await user.click(item);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('returns focus to the sidebar item on Escape and on row activation', async () => {
      const user = userEvent.setup();
      const onNotificationClick = vi.fn();
      render(<SidebarHarness onNotificationClick={onNotificationClick} />);
      const item = screen.getByRole('button', { name: /Notifications/ });

      await user.click(item);
      await user.keyboard('{Escape}');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(item).toHaveFocus();

      await user.click(item);
      await user.click(screen.getByRole('button', { name: /Deploy to staging/ }));
      expect(onNotificationClick).toHaveBeenCalledTimes(1);
      expect(item).toHaveFocus();
    });

    it('closes on View all and returns focus to the sidebar item', async () => {
      const user = userEvent.setup();
      const onViewAll = vi.fn();
      render(<SidebarHarness onViewAll={onViewAll} />);
      const item = screen.getByRole('button', { name: /Notifications/ });

      await user.click(item);
      await user.click(screen.getByRole('button', { name: 'View all notifications' }));
      expect(onViewAll).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(item).toHaveFocus();
      expect(item).toHaveAttribute('aria-expanded', 'false');
    });

    it('closes when another sidebar item is clicked', async () => {
      const user = userEvent.setup();
      render(<SidebarHarness />);

      await user.click(screen.getByRole('button', { name: /Notifications/ }));
      await user.click(screen.getByRole('button', { name: 'Dashboard' }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
