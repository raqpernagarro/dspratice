import { useRef } from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { PopoverWrapper } from './PopoverWrapper';

describe('PopoverWrapper', () => {
  it('renders content-only mode', () => {
    render(<PopoverWrapper content={<div>Content</div>} aria-label="Popover wrapper" />);

    expect(screen.getByRole('menu', { name: 'Popover wrapper' })).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('marks a bottom bar with a single action so it renders full width', () => {
    render(
      <PopoverWrapper
        aria-label="Single action"
        content={<div>Body</div>}
        bottomBar={
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button">View all</button>
          </div>
        }
      />,
    );

    const bar = screen.getByRole('button', { name: 'View all' }).closest('.dsn-popover-wrapper-bottom-bar');
    expect(bar).toHaveAttribute('data-single-action', 'true');
  });

  it('does not mark a bottom bar with more than one action', () => {
    render(
      <PopoverWrapper
        aria-label="Two actions"
        content={<div>Body</div>}
        bottomBar={
          <div>
            <span>
              <button type="button">Cancel</button>
            </span>
            <span>
              <button type="button">Confirm</button>
            </span>
          </div>
        }
      />,
    );

    const bar = screen.getByRole('button', { name: 'Cancel' }).closest('.dsn-popover-wrapper-bottom-bar');
    expect(bar).not.toHaveAttribute('data-single-action');
  });

  it('renders optional slot sections when provided', () => {
    render(
      <PopoverWrapper
        aria-label="Popover with slots"
        header={<div>Header</div>}
        segment={<div>Segment</div>}
        search={<div>Search</div>}
        content={<div>Body</div>}
        bottomBar={<div>Bottom</div>}
      />,
    );

    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByText('Segment')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
    expect(screen.getByText('Bottom')).toBeInTheDocument();
  });

  it('positions anchored popovers with fixed coordinates after layout', async () => {
    function TestHarness() {
      const anchorRef = useRef<HTMLButtonElement>(null);
      return (
        <div>
          <button ref={anchorRef} type="button">
            Trigger
          </button>
          <PopoverWrapper anchorRef={anchorRef} content={<div>Content</div>} aria-label="Anchored popover" />
        </div>
      );
    }

    render(<TestHarness />);

    const popover = screen.getByRole('menu', { name: 'Anchored popover' });

    await waitFor(() => {
      expect(popover).toHaveStyle({ position: 'fixed' });
      expect(popover.style.visibility).not.toBe('hidden');
      expect(Number.parseFloat(popover.style.top)).toBeGreaterThanOrEqual(0);
    });
  });

  it('locks scroll on scrollable ancestors while anchored', async () => {
    function TestHarness() {
      const anchorRef = useRef<HTMLButtonElement>(null);
      return (
        <div data-testid="scroll-container" style={{ height: 120, overflow: 'auto' }}>
          <div style={{ height: 240 }}>
            <button ref={anchorRef} type="button">
              Trigger
            </button>
            <PopoverWrapper anchorRef={anchorRef} content={<div>Content</div>} aria-label="Anchored popover" />
          </div>
        </div>
      );
    }

    render(<TestHarness />);

    const scrollContainer = screen.getByTestId('scroll-container');
    await waitFor(() => {
      expect(scrollContainer).toHaveStyle({ overflow: 'hidden' });
    });
  });

  it('does not reposition when the page scrolls by default', async () => {
    function TestHarness() {
      const anchorRef = useRef<HTMLButtonElement>(null);
      return (
        <div>
          <button ref={anchorRef} type="button">
            Trigger
          </button>
          <PopoverWrapper anchorRef={anchorRef} content={<div>Content</div>} aria-label="Anchored popover" />
        </div>
      );
    }

    render(<TestHarness />);

    const trigger = screen.getByRole('button', { name: 'Trigger' });
    const popover = screen.getByRole('menu', { name: 'Anchored popover' });

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
          bottom: 240,
          right: 280,
          width: 280,
          height: 240,
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

    const initialTop = popover.style.top;

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

    expect(popover.style.top).toBe(initialTop);
  });

  it('positions below by default when space is available', async () => {
    function TestHarness() {
      const anchorRef = useRef<HTMLButtonElement>(null);
      return (
        <div>
          <button ref={anchorRef} type="button">
            Trigger
          </button>
          <PopoverWrapper anchorRef={anchorRef} content={<div>Content</div>} aria-label="Anchored popover" />
        </div>
      );
    }

    render(<TestHarness />);

    const trigger = screen.getByRole('button', { name: 'Trigger' });
    const popover = screen.getByRole('menu', { name: 'Anchored popover' });

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
          bottom: 240,
          right: 280,
          width: 280,
          height: 240,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect,
    });

    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    await waitFor(() => expect(popover).toHaveAttribute('data-placement', 'bottom'));
  });

  function mockRect(el: HTMLElement, rect: Partial<DOMRect>) {
    Object.defineProperty(el, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({ x: 0, y: 0, toJSON: () => ({}), ...rect }) as DOMRect,
    });
  }

  function RightHarness() {
    const anchorRef = useRef<HTMLButtonElement>(null);
    return (
      <div>
        <button ref={anchorRef} type="button">
          Trigger
        </button>
        <PopoverWrapper
          anchorRef={anchorRef}
          preferredPlacement="right"
          content={<div>Content</div>}
          aria-label="Anchored popover"
        />
      </div>
    );
  }

  it('opens beside the anchor, top-aligned, with preferredPlacement="right"', async () => {
    render(<RightHarness />);
    const trigger = screen.getByRole('button', { name: 'Trigger' });
    const popover = screen.getByRole('menu', { name: 'Anchored popover' });
    mockRect(trigger, { top: 100, left: 16, bottom: 132, right: 216, width: 200, height: 32 });
    mockRect(popover, { top: 0, left: 0, bottom: 240, right: 280, width: 280, height: 240 });

    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    await waitFor(() => expect(popover).toHaveAttribute('data-placement', 'right'));
    expect(Number.parseFloat(popover.style.top)).toBe(100);
    expect(Number.parseFloat(popover.style.left)).toBeGreaterThan(216);
  });

  it('falls back below when there is no room on the right', async () => {
    render(<RightHarness />);
    const trigger = screen.getByRole('button', { name: 'Trigger' });
    const popover = screen.getByRole('menu', { name: 'Anchored popover' });
    mockRect(trigger, {
      top: 100,
      left: window.innerWidth - 120,
      bottom: 132,
      right: window.innerWidth - 20,
      width: 100,
      height: 32,
    });
    mockRect(popover, { top: 0, left: 0, bottom: 240, right: 280, width: 280, height: 240 });

    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    await waitFor(() => expect(popover).toHaveAttribute('data-placement', 'bottom'));
  });

  it('flips to top when there is not enough space below', async () => {
    function TestHarness() {
      const anchorRef = useRef<HTMLButtonElement>(null);
      return (
        <div>
          <button ref={anchorRef} type="button">
            Trigger
          </button>
          <PopoverWrapper anchorRef={anchorRef} content={<div>Content</div>} aria-label="Anchored popover" />
        </div>
      );
    }

    render(<TestHarness />);

    const trigger = screen.getByRole('button', { name: 'Trigger' });
    const popover = screen.getByRole('menu', { name: 'Anchored popover' });

    Object.defineProperty(trigger, 'getBoundingClientRect', {
      configurable: true,
      value: () =>
        ({
          top: 700,
          left: 200,
          bottom: 732,
          right: 360,
          width: 160,
          height: 32,
          x: 200,
          y: 700,
          toJSON: () => ({}),
        }) as DOMRect,
    });

    Object.defineProperty(popover, 'getBoundingClientRect', {
      configurable: true,
      value: () =>
        ({
          top: 0,
          left: 0,
          bottom: 240,
          right: 280,
          width: 280,
          height: 240,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }) as DOMRect,
    });

    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    await waitFor(() => expect(popover).toHaveAttribute('data-placement', 'top'));
  });

  it('clamps horizontally to viewport-safe margins', async () => {
    function TestHarness() {
      const anchorRef = useRef<HTMLButtonElement>(null);
      return (
        <div>
          <button ref={anchorRef} type="button">
            Trigger
          </button>
          <PopoverWrapper
            anchorRef={anchorRef}
            content={<div>Content</div>}
            aria-label="Anchored popover"
            viewportMargin={16}
          />
        </div>
      );
    }

    render(<TestHarness />);

    const trigger = screen.getByRole('button', { name: 'Trigger' });
    const popover = screen.getByRole('menu', { name: 'Anchored popover' });

    Object.defineProperty(trigger, 'getBoundingClientRect', {
      configurable: true,
      value: () =>
        ({
          top: 80,
          left: 980,
          bottom: 112,
          right: 1040,
          width: 60,
          height: 32,
          x: 980,
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
          right: 300,
          width: 300,
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
      const left = Number.parseFloat(popover.style.left);
      expect(left).toBeGreaterThanOrEqual(16);
      expect(left).toBeLessThanOrEqual(window.innerWidth - 300 - 16);
    });
  });

  it('matches trigger width with a 192px minimum', async () => {
    function TestHarness() {
      const anchorRef = useRef<HTMLButtonElement>(null);
      return (
        <div>
          <button ref={anchorRef} type="button">
            Trigger
          </button>
          <PopoverWrapper
            anchorRef={anchorRef}
            matchAnchorWidth
            content={<div>Content</div>}
            aria-label="Anchored popover"
          />
        </div>
      );
    }

    render(<TestHarness />);

    const trigger = screen.getByRole('button', { name: 'Trigger' });
    const popover = screen.getByRole('menu', { name: 'Anchored popover' });

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
      expect(popover.style.minWidth).toBe('192px');
    });
  });
  describe('max-height', () => {
    function Harness() {
      const anchorRef = useRef<HTMLButtonElement>(null);
      return (
        <div>
          <button ref={anchorRef} type="button">
            Trigger
          </button>
          <PopoverWrapper
            anchorRef={anchorRef}
            content={<div>Content</div>}
            aria-label="Anchored popover"
            offset={4}
            viewportMargin={16}
            maxHeight={320}
          />
        </div>
      );
    }

    function setup(anchorTop: number, popoverHeight: number, viewportHeight = 768) {
      Object.defineProperty(window, 'innerHeight', { configurable: true, value: viewportHeight });
      render(<Harness />);
      const trigger = screen.getByRole('button', { name: 'Trigger' });
      const popover = screen.getByRole('menu', { name: 'Anchored popover' });
      mockRect(trigger, {
        top: anchorTop,
        left: 200,
        bottom: anchorTop + 32,
        right: 360,
        width: 160,
        height: 32,
      });
      mockRect(popover, { top: 0, left: 0, bottom: popoverHeight, right: 280, width: 280, height: popoverHeight });
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });
      return { popover };
    }

    const originalInnerHeight = window.innerHeight;
    afterEach(() => {
      Object.defineProperty(window, 'innerHeight', { configurable: true, value: originalInnerHeight });
    });

    it('opens a short list below without shrinking it', async () => {
      const { popover } = setup(100, 160);
      await waitFor(() => expect(popover).toHaveAttribute('data-placement', 'bottom'));
      expect(Number.parseFloat(popover.style.top)).toBe(136);
      expect(Number.parseFloat(popover.style.maxHeight)).toBe(320);
    });

    it('caps a long list at the max-height token and keeps it below', async () => {
      const { popover } = setup(100, 1400);
      await waitFor(() => expect(popover).toHaveAttribute('data-placement', 'bottom'));
      expect(Number.parseFloat(popover.style.maxHeight)).toBe(320);
    });

    it('flips a long list to the top near the viewport bottom and fits it above', async () => {
      const { popover } = setup(600, 1400);
      await waitFor(() => expect(popover).toHaveAttribute('data-placement', 'top'));
      // available above = 600 - 4 - 16 = 580 → capped at 320, ends 4px above the trigger
      expect(Number.parseFloat(popover.style.maxHeight)).toBe(320);
      expect(Number.parseFloat(popover.style.top)).toBe(600 - 4 - 320);
    });

    it('never covers the trigger when the list is taller than both sides', async () => {
      // 400px viewport, trigger in the middle: 164 above, 168 below.
      const { popover } = setup(180, 1400, 400);
      await waitFor(() => expect(popover).toHaveAttribute('data-placement', 'bottom'));
      const top = Number.parseFloat(popover.style.top);
      const maxHeight = Number.parseFloat(popover.style.maxHeight);
      expect(top).toBeGreaterThanOrEqual(212);
      expect(maxHeight).toBe(400 - 212 - 4 - 16);
    });

    it('picks the roomier side when neither fits', async () => {
      // 400px viewport, trigger low: 240 above, 92 below → top.
      const { popover } = setup(260, 1400, 400);
      await waitFor(() => expect(popover).toHaveAttribute('data-placement', 'top'));
      const top = Number.parseFloat(popover.style.top);
      const maxHeight = Number.parseFloat(popover.style.maxHeight);
      expect(maxHeight).toBe(260 - 4 - 16);
      expect(top + maxHeight).toBeLessThanOrEqual(260 - 4);
      expect(top).toBeGreaterThanOrEqual(16);
    });
  });
});
