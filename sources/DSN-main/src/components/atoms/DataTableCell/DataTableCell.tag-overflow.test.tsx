import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DataTableCell } from './DataTableCell';

function mockRect(width: number, height = 24): DOMRect {
  return {
    width,
    height,
    top: 0,
    left: 0,
    right: width,
    bottom: height,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect;
}

describe('DataTableCell tag overflow popover', () => {
  let getBoundingClientRectSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    getBoundingClientRectSpy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      if (this.matches('[data-measure-tag], [data-measure-tag] *')) {
        return mockRect(56);
      }

      if (this.closest('.dsn-data-table-cell-tags-measure')) {
        return mockRect(56);
      }

      return mockRect(24);
    });

    vi.stubGlobal(
      'ResizeObserver',
      class {
        private callback: ResizeObserverCallback;

        constructor(callback: ResizeObserverCallback) {
          this.callback = callback;
        }

        observe(target: Element) {
          Object.defineProperty(target, 'clientWidth', {
            configurable: true,
            value: 96,
          });
          this.callback([], this);
        }

        disconnect() {}
        unobserve() {}
      },
    );
  });

  afterEach(() => {
    getBoundingClientRectSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  it('opens via click, keeps open when interacting inside the portaled panel, and dismisses on outside click', async () => {
    const user = userEvent.setup();

    render(
      <DataTableCell
        fieldType="tag"
        value={['Design', 'Engineering', 'Marketing', 'Sales', 'Support']}
        width={120}
      />,
    );

    const overflowButton = await screen.findByRole('button', { name: /Show \d+ more tags/ });
    await user.click(overflowButton);
    const dialog = screen.getByRole('dialog', { name: 'Hidden tags' });
    expect(dialog).toBeInTheDocument();

    await user.click(within(dialog).getByText('Support'));
    expect(screen.getByRole('dialog', { name: 'Hidden tags' })).toBeInTheDocument();

    await user.click(document.body);
    expect(screen.queryByRole('dialog', { name: 'Hidden tags' })).not.toBeInTheDocument();
  });
});
