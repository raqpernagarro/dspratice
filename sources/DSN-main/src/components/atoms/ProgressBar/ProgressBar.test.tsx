import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressBar } from './ProgressBar';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderProgressBar(ui: React.ReactElement) {
  const { container } = render(ui);
  return container;
}

function getRoot(container: HTMLElement) {
  return container.querySelector('.dsn-progress-bar') as HTMLElement;
}

function getTrack(container: HTMLElement) {
  return container.querySelector('.dsn-progress-bar-track') as HTMLElement;
}

function getFill(container: HTMLElement) {
  return container.querySelector('.dsn-progress-bar-fill') as HTMLElement;
}

// ─── Default rendering ────────────────────────────────────────────────────────

describe('ProgressBar — defaults', () => {
  it('renders with class dsn-progress-bar', () => {
    const container = renderProgressBar(<ProgressBar value={50} />);
    expect(getRoot(container)).toBeTruthy();
  });

  it('has role="progressbar"', () => {
    renderProgressBar(<ProgressBar value={50} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('has aria-valuemin="0"', () => {
    const container = renderProgressBar(<ProgressBar value={50} />);
    expect(getRoot(container).getAttribute('aria-valuemin')).toBe('0');
  });

  it('has aria-valuemax="100"', () => {
    const container = renderProgressBar(<ProgressBar value={50} />);
    expect(getRoot(container).getAttribute('aria-valuemax')).toBe('100');
  });

  it('renders dsn-progress-bar-track inside root', () => {
    const container = renderProgressBar(<ProgressBar value={50} />);
    expect(getTrack(container)).toBeTruthy();
  });

  it('renders dsn-progress-bar-fill inside track', () => {
    const container = renderProgressBar(<ProgressBar value={50} />);
    expect(getFill(container)).toBeTruthy();
  });
});

// ─── value prop ───────────────────────────────────────────────────────────────

describe('ProgressBar — value', () => {
  it('sets aria-valuenow to the provided value', () => {
    const container = renderProgressBar(<ProgressBar value={42} />);
    expect(getRoot(container).getAttribute('aria-valuenow')).toBe('42');
  });

  it('sets aria-valuenow=0 when value=0', () => {
    const container = renderProgressBar(<ProgressBar value={0} />);
    expect(getRoot(container).getAttribute('aria-valuenow')).toBe('0');
  });

  it('sets aria-valuenow=100 when value=100', () => {
    const container = renderProgressBar(<ProgressBar value={100} />);
    expect(getRoot(container).getAttribute('aria-valuenow')).toBe('100');
  });

  it('clamps value below 0 to 0', () => {
    const container = renderProgressBar(<ProgressBar value={-10} />);
    expect(getRoot(container).getAttribute('aria-valuenow')).toBe('0');
  });

  it('clamps value above 100 to 100', () => {
    const container = renderProgressBar(<ProgressBar value={150} />);
    expect(getRoot(container).getAttribute('aria-valuenow')).toBe('100');
  });

  it('clamps value of -Infinity to 0', () => {
    const container = renderProgressBar(<ProgressBar value={-Infinity} />);
    expect(getRoot(container).getAttribute('aria-valuenow')).toBe('0');
  });

  it('rounds non-integer values correctly', () => {
    const container = renderProgressBar(<ProgressBar value={33.5} />);
    expect(getRoot(container).getAttribute('aria-valuenow')).toBe('33.5');
  });
});

// ─── Fill width ───────────────────────────────────────────────────────────────

describe('ProgressBar — fill width', () => {
  it('fill has width 0px when value=0', () => {
    const container = renderProgressBar(<ProgressBar value={0} />);
    expect(getFill(container).style.width).toBe('0px');
  });

  it('fill has width calc(50% + 2px) when value=50', () => {
    const container = renderProgressBar(<ProgressBar value={50} />);
    expect(getFill(container).style.width).toBe('calc(50% + 2px)');
  });

  it('fill has width calc(100% + 2px) when value=100', () => {
    const container = renderProgressBar(<ProgressBar value={100} />);
    expect(getFill(container).style.width).toBe('calc(100% + 2px)');
  });

  it('fill has width 0px when value is clamped from negative', () => {
    const container = renderProgressBar(<ProgressBar value={-5} />);
    expect(getFill(container).style.width).toBe('0px');
  });

  it('fill has width calc(100% + 2px) when value is clamped from above', () => {
    const container = renderProgressBar(<ProgressBar value={999} />);
    expect(getFill(container).style.width).toBe('calc(100% + 2px)');
  });
});

// ─── aria-label ───────────────────────────────────────────────────────────────

describe('ProgressBar — label', () => {
  it('sets aria-label when label is provided', () => {
    const container = renderProgressBar(
      <ProgressBar value={60} label="Uploading file" />
    );
    expect(getRoot(container).getAttribute('aria-label')).toBe('Uploading file');
  });

  it('does not set aria-label when label is not provided', () => {
    const container = renderProgressBar(<ProgressBar value={60} />);
    expect(getRoot(container).getAttribute('aria-label')).toBeNull();
  });

  it('is queryable by accessible label when label provided', () => {
    renderProgressBar(<ProgressBar value={60} label="File upload" />);
    expect(screen.getByRole('progressbar', { name: 'File upload' })).toBeInTheDocument();
  });
});

// ─── className ────────────────────────────────────────────────────────────────

describe('ProgressBar — className', () => {
  it('merges custom className with dsn-progress-bar', () => {
    const container = renderProgressBar(
      <ProgressBar value={50} className="my-progress" />
    );
    const root = getRoot(container);
    expect(root.classList.contains('dsn-progress-bar')).toBe(true);
    expect(root.classList.contains('my-progress')).toBe(true);
  });
});

// ─── Internal structure ───────────────────────────────────────────────────────

describe('ProgressBar — internal structure', () => {
  it('track is a direct child of root', () => {
    const container = renderProgressBar(<ProgressBar value={50} />);
    const root = getRoot(container);
    const track = root.querySelector('.dsn-progress-bar-track');
    expect(track).toBeTruthy();
  });

  it('fill is inside track', () => {
    const container = renderProgressBar(<ProgressBar value={50} />);
    const track = getTrack(container);
    expect(track.querySelector('.dsn-progress-bar-fill')).toBeTruthy();
  });

  it('root has no tabIndex (not interactive)', () => {
    const container = renderProgressBar(<ProgressBar value={50} />);
    expect(getRoot(container).getAttribute('tabindex')).toBeNull();
  });
});

// ─── Smoke tests ──────────────────────────────────────────────────────────────

describe('ProgressBar — smoke tests', () => {
  [0, 10, 25, 50, 75, 90, 100].forEach((value) => {
    it(`renders value=${value} without errors`, () => {
      expect(() =>
        renderProgressBar(<ProgressBar value={value} />)
      ).not.toThrow();
    });
  });

  it('renders with label without errors', () => {
    expect(() =>
      renderProgressBar(<ProgressBar value={50} label="Loading…" />)
    ).not.toThrow();
  });

  it('renders with className without errors', () => {
    expect(() =>
      renderProgressBar(<ProgressBar value={50} className="custom" />)
    ).not.toThrow();
  });
});
