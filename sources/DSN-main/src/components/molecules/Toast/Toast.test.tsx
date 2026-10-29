import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Toast } from './Toast';

describe('Toast', () => {
  it('renders inline toast content and action button', () => {
    render(<Toast title="Title" severity="success" actionLabel="Button" />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Button' })).toBeInTheDocument();
  });

  it('uses alert role and assertive live region for error severity', () => {
    render(<Toast title="Connection lost" severity="error" />);

    const toast = screen.getByRole('alert');
    expect(toast).toHaveAttribute('aria-live', 'assertive');
  });

  it('calls callbacks when action and dismiss controls are clicked', () => {
    vi.useFakeTimers();
    const onAction = vi.fn();
    const onDismiss = vi.fn();

    render(
      <Toast
        title="Title"
        actionLabel="Retry"
        onAction={onAction}
        onDismiss={onDismiss}
        dismissLabel="Close"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('renders rich description only in rich variant', () => {
    const description = 'More context for the user.';
    const { rerender } = render(<Toast title="Title" description={description} variant="inline" />);

    expect(screen.queryByText(description)).not.toBeInTheDocument();

    rerender(<Toast title="Title" description={description} variant="rich" />);
    expect(screen.getByText(description)).toBeInTheDocument();
  });

  it('auto-dismisses after 5 seconds and calls onDismiss', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();

    render(<Toast title="Title" onDismiss={onDismiss} />);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  it('pauses dismissal on hover and restarts 5 second timer on mouse leave', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();

    render(<Toast title="Title" onDismiss={onDismiss} />);
    const toast = screen.getByRole('status');

    act(() => {
      vi.advanceTimersByTime(2500);
    });
    fireEvent.mouseEnter(toast);
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(onDismiss).not.toHaveBeenCalled();

    fireEvent.mouseLeave(toast);
    act(() => {
      vi.advanceTimersByTime(4999);
    });
    expect(onDismiss).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('pauses dismissal while focus is inside and resumes when focus leaves', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();

    render(<Toast title="Title" onDismiss={onDismiss} />);
    const dismiss = screen.getByRole('button', { name: 'Dismiss notification' });

    act(() => {
      dismiss.focus();
      vi.advanceTimersByTime(10000);
    });
    expect(onDismiss).not.toHaveBeenCalled();

    act(() => {
      dismiss.blur();
      vi.advanceTimersByTime(5000);
    });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('never auto-dismisses error toasts or toasts with an action', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();

    render(
      <>
        <Toast title="Failed" severity="error" onDismiss={onDismiss} />
        <Toast title="Deleted" actionLabel="Undo" onDismiss={onDismiss} />
      </>,
    );
    act(() => {
      vi.advanceTimersByTime(60000);
    });

    expect(onDismiss).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();

    vi.useRealTimers();
  });
});

describe('Toast — Figma API (Code Connect)', () => {
  it('renders content in the rich variant', () => {
    render(<Toast variant="rich" title="Uploading" content={<span>progress</span>} />);
    expect(screen.getByText('progress')).toBeInTheDocument();
  });

  it('ignores content in the inline variant', () => {
    render(<Toast variant="inline" title="Saved" content={<span>progress</span>} />);
    expect(screen.queryByText('progress')).toBeNull();
  });
});
