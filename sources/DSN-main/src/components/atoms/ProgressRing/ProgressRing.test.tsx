import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressRing } from './ProgressRing';
import type { ProgressRingSize } from './ProgressRing';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CIRCUMFERENCE = 2 * Math.PI * 15; // ≈ 94.25

function renderRing(ui: React.ReactElement) {
  const { container } = render(ui);
  return container;
}

function getRoot(container: HTMLElement) {
  return container.querySelector('.dsn-progress-ring') as HTMLElement;
}

function getSvg(container: HTMLElement) {
  return container.querySelector('svg') as SVGSVGElement;
}

function getTrack(container: HTMLElement) {
  return container.querySelector('.dsn-progress-ring-track') as SVGCircleElement;
}

function getFill(container: HTMLElement) {
  return container.querySelector('.dsn-progress-ring-fill') as SVGCircleElement;
}

// ─── Default rendering ────────────────────────────────────────────────────────

describe('ProgressRing — defaults', () => {
  it('renders with class dsn-progress-ring', () => {
    const container = renderRing(<ProgressRing />);
    expect(getRoot(container)).toBeTruthy();
  });

  it('defaults to indeterminate mode (role="status")', () => {
    renderRing(<ProgressRing />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('defaults to data-size="lg"', () => {
    const container = renderRing(<ProgressRing />);
    expect(getRoot(container).dataset.size).toBe('lg');
  });

  it('defaults to data-mode="indeterminate"', () => {
    const container = renderRing(<ProgressRing />);
    expect(getRoot(container).dataset.mode).toBe('indeterminate');
  });

  it('has aria-live="polite"', () => {
    const container = renderRing(<ProgressRing />);
    expect(getRoot(container).getAttribute('aria-live')).toBe('polite');
  });

  it('does not expose aria-valuemin or aria-valuemax when indeterminate', () => {
    const container = renderRing(<ProgressRing />);
    expect(getRoot(container).getAttribute('aria-valuemin')).toBeNull();
    expect(getRoot(container).getAttribute('aria-valuemax')).toBeNull();
  });
});

// ─── Indeterminate mode ───────────────────────────────────────────────────────

describe('ProgressRing — indeterminate', () => {
  it('uses role="status" when value is not provided', () => {
    renderRing(<ProgressRing />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('does NOT set aria-valuenow when indeterminate', () => {
    const container = renderRing(<ProgressRing />);
    expect(getRoot(container).getAttribute('aria-valuenow')).toBeNull();
  });

  it('fill has 270° dasharray (same as Spinner)', () => {
    const container = renderRing(<ProgressRing />);
    expect(getFill(container).getAttribute('stroke-dasharray')).toBe('70.7 23.6');
  });

  it('fill has no inline stroke-dashoffset', () => {
    const container = renderRing(<ProgressRing />);
    // dashoffset undefined → not set as inline style or attribute
    const offset = getFill(container).getAttribute('stroke-dashoffset');
    expect(offset === null || offset === '').toBe(true);
  });
});

// ─── Determinate mode ─────────────────────────────────────────────────────────

describe('ProgressRing — determinate', () => {
  it('uses role="progressbar" when value is provided', () => {
    renderRing(<ProgressRing value={50} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('sets data-mode="determinate" when value is provided', () => {
    const container = renderRing(<ProgressRing value={50} />);
    expect(getRoot(container).dataset.mode).toBe('determinate');
  });

  it('sets aria-valuenow to the provided value', () => {
    const container = renderRing(<ProgressRing value={75} />);
    expect(getRoot(container).getAttribute('aria-valuenow')).toBe('75');
  });

  it('has aria-valuemin=0 and aria-valuemax=100 when determinate', () => {
    const container = renderRing(<ProgressRing value={50} />);
    expect(getRoot(container).getAttribute('aria-valuemin')).toBe('0');
    expect(getRoot(container).getAttribute('aria-valuemax')).toBe('100');
  });

  it('clamps value below 0 to 0', () => {
    const container = renderRing(<ProgressRing value={-10} />);
    expect(getRoot(container).getAttribute('aria-valuenow')).toBe('0');
  });

  it('clamps value above 100 to 100', () => {
    const container = renderRing(<ProgressRing value={150} />);
    expect(getRoot(container).getAttribute('aria-valuenow')).toBe('100');
  });

  it('fill uses full circumference as dasharray', () => {
    const container = renderRing(<ProgressRing value={50} />);
    const da = getFill(container).getAttribute('stroke-dasharray');
    expect(parseFloat(da!)).toBeCloseTo(CIRCUMFERENCE, 1);
  });

  it('fill dashoffset = 0 at value=100 (full ring)', () => {
    const container = renderRing(<ProgressRing value={100} />);
    const offset = parseFloat(getFill(container).getAttribute('stroke-dashoffset')!);
    expect(offset).toBeCloseTo(0, 1);
  });

  it('fill dashoffset = circumference at value=0 (empty ring)', () => {
    const container = renderRing(<ProgressRing value={0} />);
    const offset = parseFloat(getFill(container).getAttribute('stroke-dashoffset')!);
    expect(offset).toBeCloseTo(CIRCUMFERENCE, 1);
  });

  it('fill dashoffset ≈ half circumference at value=50', () => {
    const container = renderRing(<ProgressRing value={50} />);
    const offset = parseFloat(getFill(container).getAttribute('stroke-dashoffset')!);
    expect(offset).toBeCloseTo(CIRCUMFERENCE / 2, 1);
  });
});

// ─── Size prop ────────────────────────────────────────────────────────────────

describe('ProgressRing — size', () => {
  const sizes: ProgressRingSize[] = ['sm', 'lg', 'xl', 'xxl'];
  sizes.forEach((size) => {
    it(`sets data-size="${size}"`, () => {
      const container = renderRing(<ProgressRing size={size} />);
      expect(getRoot(container).dataset.size).toBe(size);
    });
  });
});

// ─── label prop ───────────────────────────────────────────────────────────────

describe('ProgressRing — label', () => {
  it('sets aria-label when label is provided', () => {
    const container = renderRing(<ProgressRing label="Uploading" />);
    expect(getRoot(container).getAttribute('aria-label')).toBe('Uploading');
  });

  it('does not set aria-label when label is omitted', () => {
    const container = renderRing(<ProgressRing />);
    expect(getRoot(container).getAttribute('aria-label')).toBeNull();
  });

  it('determinate ring is queryable by accessible name', () => {
    renderRing(<ProgressRing value={60} label="File upload" />);
    expect(screen.getByRole('progressbar', { name: 'File upload' })).toBeInTheDocument();
  });
});

// ─── className ────────────────────────────────────────────────────────────────

describe('ProgressRing — className', () => {
  it('merges custom className', () => {
    const container = renderRing(<ProgressRing className="my-ring" />);
    const root = getRoot(container);
    expect(root.classList.contains('dsn-progress-ring')).toBe(true);
    expect(root.classList.contains('my-ring')).toBe(true);
  });
});

// ─── SVG structure ───────────────────────────────────────────────────────────

describe('ProgressRing — SVG structure', () => {
  it('renders an SVG', () => {
    const container = renderRing(<ProgressRing />);
    expect(getSvg(container)).toBeTruthy();
  });

  it('SVG has aria-hidden="true"', () => {
    const container = renderRing(<ProgressRing />);
    expect(getSvg(container).getAttribute('aria-hidden')).toBe('true');
  });

  it('SVG has viewBox="0 0 36 36"', () => {
    const container = renderRing(<ProgressRing />);
    expect(getSvg(container).getAttribute('viewBox')).toBe('0 0 36 36');
  });

  it('does NOT render a track circle when indeterminate', () => {
    const container = renderRing(<ProgressRing />);
    expect(getTrack(container)).toBeNull();
  });

  it('renders a track circle when determinate', () => {
    const container = renderRing(<ProgressRing value={50} />);
    expect(getTrack(container)).toBeTruthy();
  });

  it('renders a fill circle', () => {
    const container = renderRing(<ProgressRing />);
    expect(getFill(container)).toBeTruthy();
  });

  it('track has fill="none" (determinate)', () => {
    const container = renderRing(<ProgressRing value={50} />);
    expect(getTrack(container).getAttribute('fill')).toBe('none');
  });

  it('fill has fill="none"', () => {
    const container = renderRing(<ProgressRing />);
    expect(getFill(container).getAttribute('fill')).toBe('none');
  });

  it('fill has stroke-linecap="round"', () => {
    const container = renderRing(<ProgressRing />);
    expect(getFill(container).getAttribute('stroke-linecap')).toBe('round');
  });

  it('fill has rotate transform for 12 o\'clock start', () => {
    const container = renderRing(<ProgressRing />);
    expect(getFill(container).getAttribute('transform')).toBe('rotate(-90 18 18)');
  });

  it('fill circle has correct cx, cy, r (indeterminate)', () => {
    const container = renderRing(<ProgressRing />);
    const fill = getFill(container);
    expect(fill.getAttribute('cx')).toBe('18');
    expect(fill.getAttribute('cy')).toBe('18');
    expect(fill.getAttribute('r')).toBe('15');
  });

  it('both circles share same cx, cy, r (determinate)', () => {
    const container = renderRing(<ProgressRing value={50} />);
    const track = getTrack(container);
    const fill  = getFill(container);
    expect(track.getAttribute('cx')).toBe('18');
    expect(track.getAttribute('cy')).toBe('18');
    expect(track.getAttribute('r')).toBe('15');
    expect(fill.getAttribute('cx')).toBe('18');
    expect(fill.getAttribute('cy')).toBe('18');
    expect(fill.getAttribute('r')).toBe('15');
  });
});

// ─── Smoke tests ──────────────────────────────────────────────────────────────

describe('ProgressRing — smoke tests', () => {
  const sizes: ProgressRingSize[] = ['sm', 'lg', 'xl', 'xxl'];

  sizes.forEach((size) => {
    it(`renders size="${size}" indeterminate without errors`, () => {
      expect(() => renderRing(<ProgressRing size={size} />)).not.toThrow();
    });

    it(`renders size="${size}" determinate value=50 without errors`, () => {
      expect(() =>
        renderRing(<ProgressRing size={size} value={50} />)
      ).not.toThrow();
    });
  });

  [0, 25, 50, 75, 100].forEach((value) => {
    it(`renders determinate value=${value} without errors`, () => {
      expect(() => renderRing(<ProgressRing value={value} />)).not.toThrow();
    });
  });
});
