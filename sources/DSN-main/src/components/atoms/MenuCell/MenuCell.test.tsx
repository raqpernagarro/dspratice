import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MenuCell } from './MenuCell';

describe('MenuCell', () => {
  it('renders label by default', () => {
    render(<MenuCell label="Profile" />);
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('supports optional shortcut, avatar, and tag', () => {
    render(
      <MenuCell
        label="Profile"
        shortcut
        shortcutAriaLabel="Command Enter"
        showAvatar
        showTag
        tagLabel="Active"
      />,
    );
    expect(screen.getByLabelText('Command Enter')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('supports selected + disabled flags', () => {
    const { container } = render(<MenuCell label="Profile" selected disabled />);
    const root = container.querySelector('.dsn-menu-cell');
    expect(root).toHaveAttribute('data-selected');
    expect(root).toHaveAttribute('data-disabled');
  });

  it('supports destructive variant flag', () => {
    const { container } = render(<MenuCell label="Delete file" destructive />);
    const root = container.querySelector('.dsn-menu-cell');
    expect(root).toHaveAttribute('data-destructive');
  });

  it('renders switcher in switcher variant', () => {
    render(<MenuCell variant="switcher" selected switcherChecked />);
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('calls onSwitcherChange when switcher is toggled', async () => {
    const onSwitcherChange = vi.fn();
    render(
      <MenuCell
        variant="switcher"
        selected={false}
        switcherChecked={false}
        onSwitcherChange={onSwitcherChange}
      />,
    );
    await userEvent.click(screen.getByRole('switch'));
    expect(onSwitcherChange).toHaveBeenCalledWith(true);
  });

  it('calls onClick when row is clicked', async () => {
    const onClick = vi.fn();
    render(<MenuCell onClick={onClick} />);
    await userEvent.click(screen.getByRole('menuitem'));
    expect(onClick).toHaveBeenCalled();
  });

  it('supports keyboard activation with Enter and Space', async () => {
    const onClick = vi.fn();
    render(<MenuCell label="Profile" onClick={onClick} />);
    const menuItem = screen.getByRole('menuitem');

    menuItem.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');

    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('removes disabled root from keyboard interaction', async () => {
    render(<MenuCell label="Profile" disabled />);
    const menuItem = screen.getByRole('menuitem');

    await userEvent.tab();

    expect(menuItem).toHaveAttribute('data-disabled');
    expect(menuItem).not.toHaveFocus();
  });

  it('supports optional action button', async () => {
    const onActionClick = vi.fn();
    const onClick = vi.fn();
    render(
      <MenuCell
        showButtons
        actionAriaLabel="Open actions"
        onActionClick={onActionClick}
        onClick={onClick}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Open actions' }));
    expect(onActionClick).toHaveBeenCalled();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders a default action icon and accepts a custom actionIcon', () => {
    const { rerender } = render(<MenuCell showButtons actionAriaLabel="Open actions" />);
    expect(screen.getByRole('button', { name: 'Open actions' }).querySelector('svg.lucide-ellipsis')).toBeInTheDocument();

    rerender(
      <MenuCell
        showButtons
        actionAriaLabel="Edit item"
        actionIcon={<svg data-testid="custom-action-icon" aria-hidden="true" />}
      />,
    );
    const button = screen.getByRole('button', { name: 'Edit item' });
    expect(button.querySelector('[data-testid="custom-action-icon"]')).toBeInTheDocument();
    expect(button.querySelector('svg.lucide-ellipsis')).not.toBeInTheDocument();
  });
});
