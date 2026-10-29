import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Separator } from './Separator';
import type { SeparatorDirection } from './Separator';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderSeparator(ui: React.ReactElement) {
  const { container } = render(ui);
  return container;
}

function getSeparator(container: HTMLElement) {
  return container.querySelector('.dsn-separator') as HTMLElement;
}

// ─── Default rendering ────────────────────────────────────────────────────────

describe('Separator — defaults', () => {
  it('renders with class dsn-separator', () => {
    const container = renderSeparator(<Separator />);
    expect(getSeparator(container)).toBeTruthy();
  });

  it('defaults to direction=horizontal (renders as <hr>)', () => {
    const container = renderSeparator(<Separator />);
    expect(getSeparator(container).tagName.toLowerCase()).toBe('hr');
  });

  it('defaults to data-direction="horizontal"', () => {
    const container = renderSeparator(<Separator />);
    expect(getSeparator(container).dataset.direction).toBe('horizontal');
  });

  it('has role="separator" by default (via <hr>)', () => {
    renderSeparator(<Separator />);
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  it('defaults to decorative=false — no aria-hidden', () => {
    const container = renderSeparator(<Separator />);
    expect(getSeparator(container).getAttribute('aria-hidden')).toBeNull();
  });
});

// ─── direction="horizontal" ───────────────────────────────────────────────────

describe('Separator — direction="horizontal"', () => {
  it('renders as <hr>', () => {
    const container = renderSeparator(<Separator direction="horizontal" />);
    expect(getSeparator(container).tagName.toLowerCase()).toBe('hr');
  });

  it('sets data-direction="horizontal"', () => {
    const container = renderSeparator(<Separator direction="horizontal" />);
    expect(getSeparator(container).dataset.direction).toBe('horizontal');
  });

  it('has role="separator" (implicit on <hr>)', () => {
    renderSeparator(<Separator direction="horizontal" />);
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  it('does not have aria-orientation attribute (implicit horizontal on <hr>)', () => {
    const container = renderSeparator(<Separator direction="horizontal" />);
    expect(getSeparator(container).getAttribute('aria-orientation')).toBeNull();
  });
});

// ─── direction="vertical" ─────────────────────────────────────────────────────

describe('Separator — direction="vertical"', () => {
  it('renders as <div>', () => {
    const container = renderSeparator(<Separator direction="vertical" />);
    expect(getSeparator(container).tagName.toLowerCase()).toBe('div');
  });

  it('sets data-direction="vertical"', () => {
    const container = renderSeparator(<Separator direction="vertical" />);
    expect(getSeparator(container).dataset.direction).toBe('vertical');
  });

  it('has role="separator"', () => {
    renderSeparator(<Separator direction="vertical" />);
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  it('has aria-orientation="vertical"', () => {
    const container = renderSeparator(<Separator direction="vertical" />);
    expect(getSeparator(container).getAttribute('aria-orientation')).toBe('vertical');
  });
});

// ─── decorative prop ──────────────────────────────────────────────────────────

describe('Separator — decorative', () => {
  it('does NOT set aria-hidden when decorative=false', () => {
    const container = renderSeparator(<Separator decorative={false} />);
    expect(getSeparator(container).getAttribute('aria-hidden')).toBeNull();
  });

  it('sets aria-hidden="true" when decorative=true (horizontal)', () => {
    const container = renderSeparator(<Separator decorative={true} />);
    expect(getSeparator(container).getAttribute('aria-hidden')).toBe('true');
  });

  it('sets aria-hidden="true" when decorative=true (vertical)', () => {
    const container = renderSeparator(<Separator direction="vertical" decorative={true} />);
    expect(getSeparator(container).getAttribute('aria-hidden')).toBe('true');
  });

  it('does NOT set aria-hidden when decorative=false (vertical)', () => {
    const container = renderSeparator(<Separator direction="vertical" decorative={false} />);
    expect(getSeparator(container).getAttribute('aria-hidden')).toBeNull();
  });
});

// ─── className ───────────────────────────────────────────────────────────────

describe('Separator — className', () => {
  it('merges custom className with dsn-separator', () => {
    const container = renderSeparator(<Separator className="my-divider" />);
    const sep = getSeparator(container);
    expect(sep.classList.contains('dsn-separator')).toBe(true);
    expect(sep.classList.contains('my-divider')).toBe(true);
  });

  it('works with both direction=horizontal and custom className', () => {
    const container = renderSeparator(<Separator direction="horizontal" className="section-break" />);
    const sep = getSeparator(container);
    expect(sep.classList.contains('dsn-separator')).toBe(true);
    expect(sep.classList.contains('section-break')).toBe(true);
  });

  it('works with direction=vertical and custom className', () => {
    const container = renderSeparator(<Separator direction="vertical" className="inline-divider" />);
    const sep = getSeparator(container);
    expect(sep.classList.contains('dsn-separator')).toBe(true);
    expect(sep.classList.contains('inline-divider')).toBe(true);
  });
});

// ─── Accessibility ────────────────────────────────────────────────────────────

describe('Separator — accessibility', () => {
  it('non-decorative horizontal is queryable by role', () => {
    renderSeparator(<Separator />);
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  it('non-decorative vertical is queryable by role', () => {
    renderSeparator(<Separator direction="vertical" />);
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  it('decorative horizontal has aria-hidden="true"', () => {
    const container = renderSeparator(<Separator decorative />);
    expect(getSeparator(container).getAttribute('aria-hidden')).toBe('true');
  });

  it('decorative vertical has aria-hidden="true"', () => {
    const container = renderSeparator(<Separator direction="vertical" decorative />);
    expect(getSeparator(container).getAttribute('aria-hidden')).toBe('true');
  });
});

// ─── Direction variations smoke tests ─────────────────────────────────────────

describe('Separator — smoke tests', () => {
  const directions: SeparatorDirection[] = ['horizontal', 'vertical'];
  const decorativeStates = [true, false];

  directions.forEach((direction) => {
    decorativeStates.forEach((decorative) => {
      it(`renders direction=${direction} × decorative=${decorative} without errors`, () => {
        expect(() =>
          renderSeparator(<Separator direction={direction} decorative={decorative} />)
        ).not.toThrow();
      });
    });
  });
});
