import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useDialogFocus } from './useDialogFocus';

function TestDialog({ open, id }: { open: boolean; id: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useDialogFocus({ isOpen: open, dialogRef: ref, onEscape: () => {} });
  if (!open) return null;
  return createPortal(
    <div data-testid={`${id}-root`}>
      <div ref={ref} role="dialog" aria-modal="true" tabIndex={-1} />
    </div>,
    document.body,
  );
}

describe('useDialogFocus', () => {
  it('makes siblings of the portal root inert while open and restores them on close', () => {
    const live = document.createElement('div');
    live.setAttribute('aria-live', 'polite');
    document.body.appendChild(live);

    const { container, rerender, getByTestId } = render(<TestDialog open id="a" />);
    expect(container).toHaveAttribute('inert');
    expect(getByTestId('a-root')).not.toHaveAttribute('inert');
    expect(live).not.toHaveAttribute('inert');

    rerender(<TestDialog open={false} id="a" />);
    expect(container).not.toHaveAttribute('inert');
    live.remove();
  });

  it('leaves the outer dialog inert-free again when a nested dialog closes', () => {
    const { rerender, getByTestId } = render(
      <>
        <TestDialog open id="outer" />
        <TestDialog open={false} id="inner" />
      </>,
    );
    const outer = getByTestId('outer-root');
    expect(outer).not.toHaveAttribute('inert');

    rerender(
      <>
        <TestDialog open id="outer" />
        <TestDialog open id="inner" />
      </>,
    );
    expect(outer).toHaveAttribute('inert');
    expect(getByTestId('inner-root')).not.toHaveAttribute('inert');

    rerender(
      <>
        <TestDialog open id="outer" />
        <TestDialog open={false} id="inner" />
      </>,
    );
    expect(outer).not.toHaveAttribute('inert');
  });
});
