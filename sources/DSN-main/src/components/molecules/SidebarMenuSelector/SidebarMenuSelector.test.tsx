import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SidebarMenuSelector } from './SidebarMenuSelector';

describe('SidebarMenuSelector', () => {
  it('renders label in full variant', () => {
    render(<SidebarMenuSelector label="Notes" />);
    expect(screen.getByText('Notes')).toBeInTheDocument();
  });

  it('fires onClick', async () => {
    const user = userEvent.setup();
    const fn = vi.fn();
    render(<SidebarMenuSelector label="Click me" onClick={fn} />);
    await user.click(screen.getByRole('button'));
    expect(fn).toHaveBeenCalledOnce();
  });

  it('does not fire when disabled', async () => {
    const user = userEvent.setup();
    const fn = vi.fn();
    render(<SidebarMenuSelector label="Nope" disabled onClick={fn} />);
    await user.click(screen.getByRole('button'));
    expect(fn).not.toHaveBeenCalled();
  });

  it('marks only the selected item as the current page', () => {
    const { rerender } = render(<SidebarMenuSelector label="Sel" selected />);
    expect(screen.getByRole('button', { name: 'Sel' })).toHaveAttribute('aria-current', 'page');
    rerender(<SidebarMenuSelector label="Sel" />);
    expect(screen.getByRole('button', { name: 'Sel' })).not.toHaveAttribute('aria-current');
  });

  it('sets data-selected attribute', () => {
    const { container } = render(<SidebarMenuSelector label="Sel" selected />);
    const root = container.querySelector('.dsn-sidebar-selector');
    expect(root).toHaveAttribute('data-selected');
  });

  it('renders rail indicator when selected', () => {
    const { container } = render(<SidebarMenuSelector label="Sel" selected />);
    expect(container.querySelector('.dsn-sidebar-selector-rail')).toBeInTheDocument();
  });

  it('does not render rail when not selected', () => {
    const { container } = render(<SidebarMenuSelector label="Nope" />);
    expect(container.querySelector('.dsn-sidebar-selector-rail')).not.toBeInTheDocument();
  });

  it('renders avatar when showAvatar is true', () => {
    render(
      <SidebarMenuSelector
        label="Acme"
        showAvatar
        avatarProps={{ initials: 'AC', name: 'Acme Inc.' }}
      />,
    );
    expect(screen.getByLabelText('Acme Inc.')).toBeInTheDocument();
  });

  it('renders badge when showBadge is true', () => {
    const { container } = render(
      <SidebarMenuSelector label="Inbox" showBadge badgeCount={5} />,
    );
    expect(container.querySelector('.dsn-sidebar-selector-badge-wrap')).toBeInTheDocument();
  });

  it('hides label in icon variant', () => {
    render(<SidebarMenuSelector variant="icon" label="Hidden" />);
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
  });

  it('provides aria-label in icon variant', () => {
    render(<SidebarMenuSelector variant="icon" label="Settings" />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Settings');
  });

  it('renders no icon slot when icon is omitted', () => {
    const { container } = render(<SidebarMenuSelector label="Settings" />);
    expect(container.querySelector('.dsn-sidebar-selector-icon-wrap')).not.toBeInTheDocument();
  });

  it('renders the provided icon', () => {
    const { container } = render(
      <SidebarMenuSelector label="Settings" icon={<svg data-testid="settings-icon" />} />,
    );
    expect(container.querySelector('.dsn-sidebar-selector-icon-wrap [data-testid="settings-icon"]')).toBeInTheDocument();
  });
});
