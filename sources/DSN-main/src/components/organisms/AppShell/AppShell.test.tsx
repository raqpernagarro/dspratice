import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Home } from 'lucide-react';
import { AppShell } from './AppShell';
import { Sidebar, type SidebarSection } from '../Sidebar';
import { SearchBar } from '../../atoms/SearchBar';

interface ControlledHarnessProps {
  initialCollapsed?: boolean;
  initialWidth?: number;
}

function ControlledHarness({
  initialCollapsed = false,
  initialWidth = 200,
}: ControlledHarnessProps) {
  const [collapsed, setCollapsed] = React.useState(initialCollapsed);
  const [width, setWidth] = React.useState(initialWidth);

  return (
    <AppShell
      sidebar={<div>Sidebar content</div>}
      sidebarCollapsed={collapsed}
      sidebarWidth={width}
      onSidebarCollapsedChange={setCollapsed}
      onSidebarWidthChange={setWidth}
    >
      <div>Main content</div>
    </AppShell>
  );
}

const sidebarSections: SidebarSection[] = [
  {
    id: 'main',
    items: [{ id: 'home', label: 'Home', icon: <Home size={16} /> }],
  },
];

function SearchExpandHarness() {
  const [collapsed, setCollapsed] = React.useState(true);
  return (
    <AppShell
      sidebar={(
        <Sidebar
          showSearch
          searchSlot={<SearchBar variant="ghost" aria-label="Search sidebar" />}
          sections={sidebarSections}
        />
      )}
      sidebarCollapsed={collapsed}
      onSidebarCollapsedChange={setCollapsed}
    >
      <div>Main content</div>
    </AppShell>
  );
}

function dispatchPointerEvent(target: EventTarget, type: string, clientX: number): void {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX });
  target.dispatchEvent(event);
}

function dispatchPointerDown(target: EventTarget, clientX: number): void {
  dispatchPointerEvent(target, 'pointerdown', clientX);
}

function dispatchPointerMove(clientX: number): void {
  dispatchPointerEvent(window, 'pointermove', clientX);
}

function dispatchPointerUp(clientX: number): void {
  dispatchPointerEvent(window, 'pointerup', clientX);
}

describe('AppShell', () => {
  it('toggles collapsed state when resize handle is clicked', () => {
    render(<ControlledHarness />);

    const handle = screen.getByRole('button', { name: 'Collapse sidebar' });
    const shell = screen.getByLabelText('Application shell');

    fireEvent.click(handle);
    expect(shell).toHaveAttribute('data-sidebar-collapsed');

    fireEvent.click(screen.getByRole('button', { name: 'Expand sidebar' }));
    expect(shell).not.toHaveAttribute('data-sidebar-collapsed');
  });

  it('clamps drag resize to max width', () => {
    const { container } = render(<ControlledHarness initialWidth={200} />);

    const handle = screen.getByRole('button', { name: 'Collapse sidebar' });
    const sidebarColumn = container.querySelector('.dsn-app-shell-sidebar-column');
    expect(sidebarColumn).toBeTruthy();

    act(() => {
      dispatchPointerDown(handle, 200);
      dispatchPointerMove(800);
      dispatchPointerUp(800);
    });

    expect(sidebarColumn).toHaveStyle({ width: '320px' });
  });

  it('auto-collapses when dragged below minimum width', () => {
    const { container } = render(<ControlledHarness initialWidth={200} />);

    const shell = screen.getByLabelText('Application shell');
    const handle = screen.getByRole('button', { name: 'Collapse sidebar' });
    const sidebarColumn = container.querySelector('.dsn-app-shell-sidebar-column');

    act(() => {
      dispatchPointerDown(handle, 200);
      dispatchPointerMove(60);
      dispatchPointerUp(60);
    });

    expect(shell).toHaveAttribute('data-sidebar-collapsed');
    expect(sidebarColumn).toHaveStyle({ width: '48px' });
  });

  it('expands when dragging starts from collapsed mode', () => {
    const { container } = render(<ControlledHarness initialCollapsed initialWidth={200} />);

    const shell = screen.getByLabelText('Application shell');
    const handle = screen.getByRole('button', { name: 'Expand sidebar' });
    const sidebarColumn = container.querySelector('.dsn-app-shell-sidebar-column');

    act(() => {
      dispatchPointerDown(handle, 50);
      dispatchPointerMove(140);
      dispatchPointerUp(140);
    });

    expect(shell).not.toHaveAttribute('data-sidebar-collapsed');
    expect(sidebarColumn).toHaveStyle({ width: '218px' });
  });

  it('emits collapse and width callbacks from handle interactions', () => {
    const onSidebarCollapsedChange = vi.fn();
    const onSidebarWidthChange = vi.fn();

    render(
      <AppShell
        sidebar={<div>Sidebar content</div>}
        sidebarCollapsed={false}
        sidebarWidth={200}
        onSidebarCollapsedChange={onSidebarCollapsedChange}
        onSidebarWidthChange={onSidebarWidthChange}
      >
        <div>Main content</div>
      </AppShell>,
    );

    const handle = screen.getByRole('button', { name: 'Collapse sidebar' });

    fireEvent.click(handle);
    expect(onSidebarCollapsedChange).toHaveBeenCalledWith(true);

    act(() => {
      dispatchPointerDown(handle, 200);
      dispatchPointerMove(240);
      dispatchPointerUp(240);
    });

    expect(onSidebarWidthChange).toHaveBeenCalledWith(240);
    expect(onSidebarCollapsedChange).toHaveBeenCalledWith(false);
  });

  it('expands and focuses search input when collapsed search item is clicked', async () => {
    const user = userEvent.setup();
    render(<SearchExpandHarness />);

    await user.click(screen.getByRole('button', { name: 'Search' }));

    await waitFor(() => {
      expect(screen.getByLabelText('Search sidebar')).toHaveFocus();
    });
  });

  it('expands to 256px when collapsed handle is clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(<ControlledHarness initialCollapsed initialWidth={200} />);

    await user.click(screen.getByRole('button', { name: 'Expand sidebar' }));

    const sidebarColumn = container.querySelector('.dsn-app-shell-sidebar-column');
    expect(sidebarColumn).toHaveStyle({ width: '256px' });
  });
});
