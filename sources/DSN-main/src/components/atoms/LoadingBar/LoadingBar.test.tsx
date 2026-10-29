import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingBar } from './LoadingBar';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderBar(ui: React.ReactElement) {
  const { container } = render(ui);
  return container;
}

function getRoot(container: HTMLElement) {
  return container.querySelector('.dsn-loading-bar') as HTMLElement;
}

function getFill(container: HTMLElement) {
  return container.querySelector('.dsn-loading-bar-fill') as HTMLElement;
}

// ─── Shared ARIA structure ────────────────────────────────────────────────────

describe('LoadingBar — ARIA structure', () => {
  it('has role="progressbar"', () => {
    renderBar(<LoadingBar />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('has aria-valuemin="0"', () => {
    const container = renderBar(<LoadingBar />);
    expect(getRoot(container).getAttribute('aria-valuemin')).toBe('0');
  });

  it('has aria-valuemax="100"', () => {
    const container = renderBar(<LoadingBar />);
    expect(getRoot(container).getAttribute('aria-valuemax')).toBe('100');
  });

  it('has aria-live="polite"', () => {
    const container = renderBar(<LoadingBar />);
    expect(getRoot(container).getAttribute('aria-live')).toBe('polite');
  });

  it('sets aria-label when label is provided', () => {
    const container = renderBar(<LoadingBar label="Navigating" />);
    expect(getRoot(container).getAttribute('aria-label')).toBe('Navigating');
  });

  it('does not set aria-label when label is omitted', () => {
    const container = renderBar(<LoadingBar />);
    expect(getRoot(container).getAttribute('aria-label')).toBeNull();
  });
});

// ─── Indeterminate mode ───────────────────────────────────────────────────────

describe('LoadingBar — indeterminate mode (no value prop)', () => {
  it('sets data-mode="indeterminate" when value is not provided', () => {
    const container = renderBar(<LoadingBar />);
    expect(getRoot(container).dataset.mode).toBe('indeterminate');
  });

  it('does NOT set aria-valuenow when indeterminate', () => {
    const container = renderBar(<LoadingBar />);
    expect(getRoot(container).getAttribute('aria-valuenow')).toBeNull();
  });

  it('does NOT set inline width on the fill when indeterminate', () => {
    const container = renderBar(<LoadingBar />);
    expect(getFill(container).style.width).toBe('');
  });
});

// ─── Determinate mode ─────────────────────────────────────────────────────────

describe('LoadingBar — determinate mode (value prop provided)', () => {
  it('sets data-mode="determinate" when value is provided', () => {
    const container = renderBar(<LoadingBar value={50} />);
    expect(getRoot(container).dataset.mode).toBe('determinate');
  });

  it('sets aria-valuenow to the provided value', () => {
    const container = renderBar(<LoadingBar value={60} />);
    expect(getRoot(container).getAttribute('aria-valuenow')).toBe('60');
  });

  it('sets aria-valuenow=0 when value=0', () => {
    const container = renderBar(<LoadingBar value={0} />);
    expect(getRoot(container).getAttribute('aria-valuenow')).toBe('0');
  });

  it('sets aria-valuenow=100 when value=100', () => {
    const container = renderBar(<LoadingBar value={100} />);
    expect(getRoot(container).getAttribute('aria-valuenow')).toBe('100');
  });

  it('clamps value below 0 to 0', () => {
    const container = renderBar(<LoadingBar value={-20} />);
    expect(getRoot(container).getAttribute('aria-valuenow')).toBe('0');
  });

  it('clamps value above 100 to 100', () => {
    const container = renderBar(<LoadingBar value={200} />);
    expect(getRoot(container).getAttribute('aria-valuenow')).toBe('100');
  });

  it('sets fill width to value%', () => {
    const container = renderBar(<LoadingBar value={75} />);
    expect(getFill(container).style.width).toBe('75%');
  });

  it('sets fill width to 0% when value=0', () => {
    const container = renderBar(<LoadingBar value={0} />);
    expect(getFill(container).style.width).toBe('0%');
  });

  it('sets fill width to 100% when value=100', () => {
    const container = renderBar(<LoadingBar value={100} />);
    expect(getFill(container).style.width).toBe('100%');
  });

  it('handles fractional values correctly', () => {
    const container = renderBar(<LoadingBar value={33.5} />);
    expect(getRoot(container).getAttribute('aria-valuenow')).toBe('33.5');
    expect(getFill(container).style.width).toBe('33.5%');
  });
});

// ─── className ────────────────────────────────────────────────────────────────

describe('LoadingBar — className', () => {
  it('merges custom className with dsn-loading-bar', () => {
    const container = renderBar(<LoadingBar className="my-bar" />);
    const root = getRoot(container);
    expect(root.classList.contains('dsn-loading-bar')).toBe(true);
    expect(root.classList.contains('my-bar')).toBe(true);
  });
});

// ─── Internal structure ───────────────────────────────────────────────────────

describe('LoadingBar — internal structure', () => {
  it('renders a fill child inside root', () => {
    const container = renderBar(<LoadingBar />);
    expect(getFill(container)).toBeTruthy();
  });

  it('fill is a direct child of root', () => {
    const container = renderBar(<LoadingBar />);
    const root = getRoot(container);
    const fill = root.querySelector('.dsn-loading-bar-fill');
    expect(fill).toBeTruthy();
  });

  it('root is not interactive (no tabIndex)', () => {
    const container = renderBar(<LoadingBar />);
    expect(getRoot(container).getAttribute('tabindex')).toBeNull();
  });
});

// ─── Smoke tests ──────────────────────────────────────────────────────────────

describe('LoadingBar — smoke tests', () => {
  it('renders indeterminate without errors', () => {
    expect(() => renderBar(<LoadingBar />)).not.toThrow();
  });

  it('renders indeterminate with label without errors', () => {
    expect(() => renderBar(<LoadingBar label="Loading page" />)).not.toThrow();
  });

  [0, 25, 50, 75, 100].forEach((value) => {
    it(`renders determinate value=${value} without errors`, () => {
      expect(() => renderBar(<LoadingBar value={value} />)).not.toThrow();
    });
  });

  it('renders with className without errors', () => {
    expect(() => renderBar(<LoadingBar className="test" />)).not.toThrow();
  });
});
