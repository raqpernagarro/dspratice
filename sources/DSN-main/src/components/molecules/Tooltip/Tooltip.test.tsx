import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Tooltip } from './Tooltip';

describe('Tooltip', () => {
  it('renders tooltip on hover after delay', async () => {
    vi.useFakeTimers();

    render(
      <Tooltip content="Tooltip text" delay={150}>
        <button type="button">Trigger</button>
      </Tooltip>,
    );

    fireEvent.mouseEnter(screen.getByRole('button', { name: 'Trigger' }));
    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(screen.getByRole('tooltip', { name: 'Tooltip text' })).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('opens on focus and closes on blur', () => {
    vi.useFakeTimers();

    render(
      <Tooltip content="Keyboard tooltip">
        <button type="button">Trigger</button>
      </Tooltip>,
    );

    const trigger = screen.getByRole('button', { name: 'Trigger' });
    fireEvent.focus(trigger);
    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(screen.getByRole('tooltip', { name: 'Keyboard tooltip' })).toBeInTheDocument();
    fireEvent.blur(trigger);
    expect(screen.queryByRole('tooltip', { name: 'Keyboard tooltip' })).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it('closes on Escape key', () => {
    vi.useFakeTimers();

    render(
      <Tooltip content="Dismiss me">
        <button type="button">Trigger</button>
      </Tooltip>,
    );

    fireEvent.mouseEnter(screen.getByRole('button', { name: 'Trigger' }));
    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(screen.getByRole('tooltip', { name: 'Dismiss me' })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('tooltip', { name: 'Dismiss me' })).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it('prefers top placement and flips to bottom near top edge', async () => {
    const { container, rerender } = render(
      <Tooltip content="Placement tooltip" open>
        <button type="button">Trigger</button>
      </Tooltip>,
    );

    const trigger = container.querySelector('.dsn-tooltip-trigger') as HTMLSpanElement;
    const bubble = screen.getByRole('tooltip', { name: 'Placement tooltip' });

    Object.defineProperty(trigger, 'getBoundingClientRect', {
      configurable: true,
      value: () =>
        ({
          top: 200,
          left: 200,
          bottom: 232,
          right: 260,
          width: 60,
          height: 32,
          x: 200,
          y: 200,
          toJSON: () => ({}),
        }) as DOMRect,
    });

    Object.defineProperty(bubble, 'getBoundingClientRect', {
      configurable: true,
      value: () =>
        ({
          top: 0,
          left: 0,
          bottom: 48,
          right: 180,
          width: 180,
          height: 48,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect,
    });

    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    await waitFor(() => expect(bubble).toHaveAttribute('data-placement', 'top'));

    rerender(
      <Tooltip content="Placement tooltip" open>
        <button type="button">Trigger</button>
      </Tooltip>,
    );

    Object.defineProperty(trigger, 'getBoundingClientRect', {
      configurable: true,
      value: () =>
        ({
          top: 12,
          left: 200,
          bottom: 44,
          right: 260,
          width: 60,
          height: 32,
          x: 200,
          y: 12,
          toJSON: () => ({}),
        }) as DOMRect,
    });

    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    await waitFor(() => expect(bubble).toHaveAttribute('data-placement', 'bottom'));
  });

  it('clamps tooltip inside viewport margins', async () => {
    const { container } = render(
      <Tooltip content="Clamp tooltip" open>
        <button type="button">Trigger</button>
      </Tooltip>,
    );

    const trigger = container.querySelector('.dsn-tooltip-trigger') as HTMLSpanElement;
    const bubble = screen.getByRole('tooltip', { name: 'Clamp tooltip' });

    Object.defineProperty(trigger, 'getBoundingClientRect', {
      configurable: true,
      value: () =>
        ({
          top: 240,
          left: 1000,
          bottom: 272,
          right: 1060,
          width: 60,
          height: 32,
          x: 1000,
          y: 240,
          toJSON: () => ({}),
        }) as DOMRect,
    });

    Object.defineProperty(bubble, 'getBoundingClientRect', {
      configurable: true,
      value: () =>
        ({
          top: 0,
          left: 0,
          bottom: 64,
          right: 256,
          width: 256,
          height: 64,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect,
    });

    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    await waitFor(() => {
      const left = Number.parseFloat(bubble.style.left);
      expect(left).toBeGreaterThanOrEqual(8);
      expect(left).toBeLessThanOrEqual(window.innerWidth - 256 - 8);
    });
  });
});
