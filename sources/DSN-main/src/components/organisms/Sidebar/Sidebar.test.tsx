import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Home, Plus, Settings } from 'lucide-react';
import { Sidebar, type SidebarSection } from './Sidebar';

const basicSections: SidebarSection[] = [
  {
    id: 'main',
    items: [
      { id: 'home', label: 'Home', icon: <Home size={16} />, selected: true },
      { id: 'settings', label: 'Settings', icon: <Settings size={16} /> },
    ],
  },
];

describe('Sidebar', () => {
  it('renders selector with default props', () => {
    render(<Sidebar sections={basicSections} />);
    expect(screen.getByRole('complementary', { name: 'Sidebar' })).toBeInTheDocument();
    expect(screen.getByText('Workspace')).toBeInTheDocument();
  });

  it('renders custom selector node', () => {
    render(
      <Sidebar
        selector={<button type="button">Custom org</button>}
        sections={basicSections}
      />,
    );
    expect(screen.getByRole('button', { name: 'Custom org' })).toBeInTheDocument();
  });

  it('renders menu items as SidebarMenuSelector rows', () => {
    render(<Sidebar sections={basicSections} />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('marks selected item with data-selected', () => {
    const { container } = render(<Sidebar sections={basicSections} />);
    const selectedRow = container.querySelector('[data-selected]');
    expect(selectedRow).toBeInTheDocument();
  });

  it('fires item onClick', async () => {
    const user = userEvent.setup();
    const fn = vi.fn();

    render(
      <Sidebar
        sections={[
          {
            id: 'main',
            items: [{ id: 'dashboard', label: 'Dashboard', icon: <Home size={16} />, onClick: fn }],
          },
        ]}
      />,
    );

    const buttons = screen.getAllByRole('button');
    const dashboardBtn = buttons.find((b) => b.textContent?.includes('Dashboard'));
    expect(dashboardBtn).toBeTruthy();
    await user.click(dashboardBtn!);
    expect(fn).toHaveBeenCalledOnce();
  });

  it('renders section title via SectionHeader', () => {
    render(
      <Sidebar
        sections={[
          {
            id: 'contacts',
            title: 'Contacts',
            items: [{ id: 'all', label: 'All' }],
          },
        ]}
      />,
    );
    expect(screen.getByText('Contacts')).toBeInTheDocument();
  });

  it('renders separator between sections', () => {
    const { container } = render(
      <Sidebar
        sections={[
          { id: 'a', items: [{ id: '1', label: 'One' }] },
          { id: 'b', separator: 'before', items: [{ id: '2', label: 'Two' }] },
        ]}
      />,
    );
    expect(container.querySelector('.dsn-sidebar-separator')).toBeInTheDocument();
  });

  it('renders bottom content slot', () => {
    render(
      <Sidebar
        sections={basicSections}
        bottomContent={<button type="button">Sign out</button>}
      />,
    );
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
  });

  it('hides section titles in collapsed mode', () => {
    render(
      <Sidebar
        collapsed
        sections={[
          {
            id: 'contacts',
            title: 'Contacts',
            items: [{ id: 'all', label: 'All', icon: <Home size={16} /> }],
          },
        ]}
      />,
    );
    expect(screen.queryByText('Contacts')).not.toBeInTheDocument();
  });

  it('sets data-collapsed on root in collapsed mode', () => {
    const { container } = render(
      <Sidebar collapsed sections={basicSections} />,
    );
    expect(container.querySelector('.dsn-sidebar')).toHaveAttribute('data-collapsed');
  });

  it('renders primary actions as secondary buttons', async () => {
    const user = userEvent.setup();
    const onNewChat = vi.fn();

    render(
      <Sidebar
        actions={[{ id: 'new-chat', label: 'New chat', icon: <Plus size={16} />, onClick: onNewChat }]}
        sections={basicSections}
      />,
    );

    const newChat = screen.getByRole('button', { name: 'New chat' });
    expect(newChat).toHaveAttribute('data-variant', 'secondary');
    await user.click(newChat);
    expect(onNewChat).toHaveBeenCalledOnce();
  });

  it('renders search slot when showSearch is true', () => {
    render(
      <Sidebar
        showSearch
        searchSlot={<input aria-label="Search sidebar" />}
        sections={basicSections}
      />,
    );
    expect(screen.getByLabelText('Search sidebar')).toBeInTheDocument();
  });

  it('renders collapsed search as a menu item', () => {
    render(
      <Sidebar
        collapsed
        showSearch
        searchSlot={<input aria-label="Search sidebar" />}
        sections={basicSections}
      />,
    );

    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
  });

  it('notifies when collapsed search menu item is activated', async () => {
    const user = userEvent.setup();
    const onCollapsedSearchActivate = vi.fn();

    render(
      <Sidebar
        collapsed
        showSearch
        searchSlot={<input aria-label="Search sidebar" />}
        onCollapsedSearchActivate={onCollapsedSearchActivate}
        sections={basicSections}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Search' }));
    expect(onCollapsedSearchActivate).toHaveBeenCalledOnce();
  });

  it('collapses and expands a section with disclosure', async () => {
    const user = userEvent.setup();

    render(
      <Sidebar
        sections={[
          {
            id: 'contacts',
            title: 'Contacts',
            showDisclosure: true,
            items: [
              { id: 'all', label: 'All', icon: <Home size={16} /> },
              { id: 'john', label: 'John Smith', icon: <Home size={16} /> },
            ],
          },
        ]}
      />,
    );

    expect(screen.getByText('All')).toBeInTheDocument();
    const toggle = screen.getByRole('button', { name: 'Collapse Contacts' });

    await user.click(toggle);
    expect(screen.queryByText('All')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Expand Contacts' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Expand Contacts' }));
    expect(screen.getByText('All')).toBeInTheDocument();
  });

  it('keeps section items visible when disclosure is not enabled', async () => {
    const user = userEvent.setup();

    render(
      <Sidebar
        sections={[
          {
            id: 'contacts',
            title: 'Contacts',
            items: [{ id: 'all', label: 'All', icon: <Home size={16} /> }],
          },
        ]}
      />,
    );

    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Collapse Contacts|Expand Contacts/ })).not.toBeInTheDocument();

    await user.tab();
    expect(screen.getByText('All')).toBeInTheDocument();
  });
});
