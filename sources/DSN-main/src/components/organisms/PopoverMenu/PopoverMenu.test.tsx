import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { PopoverMenu } from './PopoverMenu';

describe('PopoverMenu', () => {
  it('renders rich optional sections when enabled', () => {
    render(
      <PopoverMenu
        variant="rich"
        title="Menu title"
        showHeader
        showSegmentControl
        showSearch
        showBottomBar
        choiceLists={[
          {
            id: 'list-1',
            showSectionHeaders: true,
            sections: [
              {
                id: 'sec-1',
                title: 'Title',
                items: [{ id: 'item-1', kind: 'menu-cell', props: { label: 'Action' } }],
              },
            ],
          },
        ]}
      />,
    );

    expect(screen.getByRole('menu', { name: 'Popover menu' })).toBeInTheDocument();
    expect(screen.getByText('Menu title')).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: 'Segment control' })).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Search' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
  });

  it('renders simple variant with default list and no header', () => {
    render(<PopoverMenu variant="simple" showHeader={false} />);

    expect(screen.queryByText('Title')).not.toBeInTheDocument();
    expect(screen.getByRole('menu', { name: 'Popover menu' })).toBeInTheDocument();
  });

  it('forwards Escape from choice list keyboard model', async () => {
    const user = userEvent.setup();
    const onEscape = vi.fn();
    render(<PopoverMenu variant="simple" onEscape={onEscape} />);

    await user.tab();
    await user.keyboard('{Escape}');

    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it('uses spaced button group in default bottom bar actions', () => {
    render(<PopoverMenu variant="rich" showBottomBar />);

    const actionGroup = screen.getByRole('group', { name: 'Popover actions' });
    expect(actionGroup).toHaveAttribute('data-space-between');
  });

  it('renders immediate single select without bottom bar', () => {
    render(
      <PopoverMenu
        variant="rich"
        title="View mode"
        aria-label="View mode"
        showHeader
        showSegmentControl
        showSearch
        showBottomBar={false}
        choiceLists={[
          {
            id: 'view-mode',
            showSectionHeaders: true,
            sections: [
              {
                id: 'layouts',
                title: 'Layout',
                items: [
                  {
                    id: 'list',
                    kind: 'menu-cell',
                    props: { label: 'List', selected: true, showTrailingIcon: true },
                  },
                  {
                    id: 'grid',
                    kind: 'menu-cell',
                    props: { label: 'Grid', showTrailingIcon: true },
                  },
                ],
              },
            ],
          },
        ]}
      />,
    );

    expect(screen.getByRole('menu', { name: 'View mode' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'List' })).toHaveAttribute('data-selected');
    expect(screen.queryByRole('button', { name: 'Confirm' })).not.toBeInTheDocument();
  });

  it('renders per-section radio select with confirm actions', () => {
    render(
      <PopoverMenu
        variant="rich"
        title="Sort"
        aria-label="Sort options"
        showHeader
        showBottomBar
        choiceLists={[
          {
            id: 'sort',
            showSectionHeaders: true,
            sections: [
              {
                id: 'sort-by',
                title: 'Sort by',
                items: [
                  { id: 'name', kind: 'radio-cell', props: { label: 'Name', checked: true } },
                  { id: 'date', kind: 'radio-cell', props: { label: 'Date' } },
                ],
              },
            ],
          },
        ]}
      />,
    );

    expect(screen.getAllByRole('radio')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
  });

  it('shows Clear in the header when filter checkboxes are selected', () => {
    render(
      <PopoverMenu
        variant="rich"
        title="Filters"
        showHeader
        showBottomBar
        choiceLists={[
          {
            id: 'filters',
            showSectionHeaders: true,
            sections: [
              {
                id: 'status',
                title: 'Status',
                items: [
                  {
                    id: 'open',
                    kind: 'checkbox-cell',
                    props: { label: 'Open', checked: true, showLeadingIcon: false, showTrailingIcon: false },
                  },
                  {
                    id: 'done',
                    kind: 'checkbox-cell',
                    props: { label: 'Done', showLeadingIcon: false, showTrailingIcon: false },
                  },
                ],
              },
            ],
          },
        ]}
      />,
    );

    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
  });

  it('hides Clear in the header when no filter checkboxes are selected', () => {
    render(
      <PopoverMenu
        variant="rich"
        title="Filters"
        showHeader
        showBottomBar
        choiceLists={[
          {
            id: 'filters',
            showSectionHeaders: true,
            sections: [
              {
                id: 'status',
                title: 'Status',
                items: [
                  {
                    id: 'open',
                    kind: 'checkbox-cell',
                    props: { label: 'Open', showLeadingIcon: false, showTrailingIcon: false },
                  },
                ],
              },
            ],
          },
        ]}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
  });

  it('clears all filter checkboxes when Clear is clicked', async () => {
    const user = userEvent.setup();
    const onClearFilters = vi.fn();

    render(
      <PopoverMenu
        variant="rich"
        title="Filters"
        showHeader
        showBottomBar
        onClearFilters={onClearFilters}
        choiceLists={[
          {
            id: 'filters',
            showSectionHeaders: true,
            sections: [
              {
                id: 'status',
                title: 'Status',
                items: [
                  {
                    id: 'open',
                    kind: 'checkbox-cell',
                    props: { label: 'Open', checked: true, showLeadingIcon: false, showTrailingIcon: false },
                  },
                  {
                    id: 'done',
                    kind: 'checkbox-cell',
                    props: { label: 'Done', checked: true, showLeadingIcon: false, showTrailingIcon: false },
                  },
                ],
              },
            ],
          },
        ]}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Clear' }));

    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Open' })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Done' })).not.toBeChecked();
    expect(onClearFilters).toHaveBeenCalledTimes(1);
  });

  it('does not show Clear for non-filter popovers', () => {
    render(
      <PopoverMenu
        variant="rich"
        title="Sort"
        showHeader
        showBottomBar
        choiceLists={[
          {
            id: 'sort',
            showSectionHeaders: true,
            sections: [
              {
                id: 'sort-by',
                title: 'Sort by',
                items: [{ id: 'name', kind: 'radio-cell', props: { label: 'Name', checked: true } }],
              },
            ],
          },
        ]}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
  });

  it('renders popover header at medium SectionHeader height under border-box', () => {
    render(
      <PopoverMenu
        variant="rich"
        title="Filters"
        showHeader
        showBottomBar
        choiceLists={[
          {
            id: 'filters',
            showSectionHeaders: true,
            sections: [
              {
                id: 'status',
                title: 'Status',
                items: [
                  {
                    id: 'open',
                    kind: 'checkbox-cell',
                    props: { label: 'Open', checked: true },
                  },
                ],
              },
            ],
          },
        ]}
      />,
    );

    const header = document.querySelector('.dsn-popover-menu .dsn-section-header[data-size="medium"]');
    expect(header).not.toBeNull();
    expect(getComputedStyle(header!).boxSizing).toBe('border-box');
  });

  it('renders a single popover shell when anchored', () => {
    function AnchoredHarness() {
      const anchorRef = useRef<HTMLButtonElement>(null);
      return (
        <div>
          <button ref={anchorRef} type="button">
            Trigger
          </button>
          <PopoverMenu
            anchorRef={anchorRef}
            variant="rich"
            aria-label="Filter options"
            showBottomBar
            choiceLists={[
              {
                id: 'filters',
                showSectionHeaders: true,
                sections: [
                  {
                    id: 'status',
                    title: 'Status',
                    items: [
                      {
                        id: 'open',
                        kind: 'checkbox-cell',
                        props: { label: 'Open', checked: true },
                      },
                    ],
                  },
                ],
              },
            ]}
          />
        </div>
      );
    }

    render(<AnchoredHarness />);

    expect(document.querySelectorAll('.dsn-popover-wrapper')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
  });

  it('does not squeeze anchored rich menus to trigger width by default', async () => {
    function AnchoredHarness() {
      const anchorRef = useRef<HTMLButtonElement>(null);
      return (
        <div>
          <button ref={anchorRef} type="button">
            Trigger
          </button>
          <PopoverMenu
            anchorRef={anchorRef}
            variant="rich"
            aria-label="Filter options"
            showBottomBar
          />
        </div>
      );
    }

    render(<AnchoredHarness />);

    const trigger = screen.getByRole('button', { name: 'Trigger' });
    const popover = screen.getByRole('dialog', { name: 'Filter options' });

    Object.defineProperty(trigger, 'getBoundingClientRect', {
      configurable: true,
      value: () =>
        ({
          top: 80,
          left: 100,
          bottom: 112,
          right: 180,
          width: 80,
          height: 32,
          x: 100,
          y: 80,
          toJSON: () => ({}),
        }) as DOMRect,
    });

    Object.defineProperty(popover, 'getBoundingClientRect', {
      configurable: true,
      value: () =>
        ({
          top: 0,
          left: 0,
          bottom: 320,
          right: 256,
          width: 256,
          height: 320,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect,
    });

    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    await waitFor(() => {
      expect(popover.style.position).toBe('fixed');
      expect(popover.style.width).toBe('');
    });
  });

  it('repositions anchored popovers when the page scrolls', async () => {
    function AnchoredHarness() {
      const anchorRef = useRef<HTMLButtonElement>(null);
      return (
        <div>
          <button ref={anchorRef} type="button">
            Trigger
          </button>
          <PopoverMenu
            anchorRef={anchorRef}
            variant="rich"
            aria-label="Filter options"
            showBottomBar
            choiceLists={[
              {
                id: 'filters',
                showSectionHeaders: true,
                sections: [
                  {
                    id: 'status',
                    title: 'Status',
                    items: [
                      {
                        id: 'open',
                        kind: 'checkbox-cell',
                        props: { label: 'Open', checked: true },
                      },
                    ],
                  },
                ],
              },
            ]}
          />
        </div>
      );
    }

    render(<AnchoredHarness />);

    const trigger = screen.getByRole('button', { name: 'Trigger' });
    const popover = screen.getByRole('dialog', { name: 'Filter options' });

    Object.defineProperty(trigger, 'getBoundingClientRect', {
      configurable: true,
      value: () =>
        ({
          top: 100,
          left: 200,
          bottom: 132,
          right: 360,
          width: 160,
          height: 32,
          x: 200,
          y: 100,
          toJSON: () => ({}),
        }) as DOMRect,
    });

    Object.defineProperty(popover, 'getBoundingClientRect', {
      configurable: true,
      value: () =>
        ({
          top: 0,
          left: 0,
          bottom: 320,
          right: 256,
          width: 256,
          height: 320,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect,
    });

    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    await waitFor(() => {
      expect(popover.style.top).not.toBe('');
    });

    const initialTop = Number.parseFloat(popover.style.top);

    Object.defineProperty(trigger, 'getBoundingClientRect', {
      configurable: true,
      value: () =>
        ({
          top: 300,
          left: 200,
          bottom: 332,
          right: 360,
          width: 160,
          height: 32,
          x: 200,
          y: 300,
          toJSON: () => ({}),
        }) as DOMRect,
    });

    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });

    await waitFor(() => {
      expect(Number.parseFloat(popover.style.top)).toBeGreaterThan(initialTop);
    });
  });

  it('forwards matchAnchorWidth to the popover shell when enabled', async () => {
    function AnchoredHarness() {
      const anchorRef = useRef<HTMLButtonElement>(null);
      return (
        <div>
          <button ref={anchorRef} type="button">
            Trigger
          </button>
          <PopoverMenu
            anchorRef={anchorRef}
            matchAnchorWidth
            variant="simple"
            showHeader={false}
            aria-label="Simple menu"
          />
        </div>
      );
    }

    render(<AnchoredHarness />);

    const trigger = screen.getByRole('button', { name: 'Trigger' });
    const popover = screen.getByRole('dialog', { name: 'Simple menu' });

    Object.defineProperty(trigger, 'getBoundingClientRect', {
      configurable: true,
      value: () =>
        ({
          top: 80,
          left: 100,
          bottom: 112,
          right: 180,
          width: 80,
          height: 32,
          x: 100,
          y: 80,
          toJSON: () => ({}),
        }) as DOMRect,
    });

    Object.defineProperty(popover, 'getBoundingClientRect', {
      configurable: true,
      value: () =>
        ({
          top: 0,
          left: 0,
          bottom: 220,
          right: 200,
          width: 200,
          height: 220,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect,
    });

    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    await waitFor(() => {
      expect(popover.style.width).toBe('192px');
    });
  });
});
