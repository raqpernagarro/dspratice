import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';
import type { BadgeSize, BadgeVariant } from './Badge';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderBadge(ui: React.ReactElement) {
  const { container } = render(ui);
  return container;
}

function getBadge(container: HTMLElement) {
  return container.querySelector('.dsn-badge') as HTMLElement;
}

// ─── Default rendering ────────────────────────────────────────────────────────

describe('Badge — defaults', () => {
  it('renders a <span> element', () => {
    const container = renderBadge(<Badge />);
    const badge = getBadge(container);
    expect(badge.tagName.toLowerCase()).toBe('span');
  });

  it('has class dsn-badge', () => {
    const container = renderBadge(<Badge />);
    expect(getBadge(container)).toBeTruthy();
  });

  it('defaults to size=sm', () => {
    const container = renderBadge(<Badge />);
    expect(getBadge(container).dataset.size).toBe('sm');
  });

  it('defaults to variant=highlight-soft', () => {
    const container = renderBadge(<Badge />);
    expect(getBadge(container).dataset.variant).toBe('highlight-soft');
  });

  it('renders empty with no count', () => {
    const container = renderBadge(<Badge />);
    expect(getBadge(container).textContent).toBe('');
  });
});

// ─── Count behaviour ──────────────────────────────────────────────────────────

describe('Badge — count display (sm)', () => {
  it('renders count=1 as "1"', () => {
    const container = renderBadge(<Badge size="sm" count={1} />);
    expect(getBadge(container).textContent).toBe('1');
  });

  it('renders count=9 as "9"', () => {
    const container = renderBadge(<Badge size="sm" count={9} />);
    expect(getBadge(container).textContent).toBe('9');
  });

  it('renders count=99 as "99"', () => {
    const container = renderBadge(<Badge size="sm" count={99} />);
    expect(getBadge(container).textContent).toBe('99');
  });

  it('renders count=100 as "99+"', () => {
    const container = renderBadge(<Badge size="sm" count={100} />);
    expect(getBadge(container).textContent).toBe('99+');
  });

  it('renders count=999 as "99+"', () => {
    const container = renderBadge(<Badge size="sm" count={999} />);
    expect(getBadge(container).textContent).toBe('99+');
  });

  it('renders count=0 as "0"', () => {
    const container = renderBadge(<Badge size="sm" count={0} />);
    expect(getBadge(container).textContent).toBe('0');
  });
});

// ─── Dot behaviour ────────────────────────────────────────────────────────────

describe('Badge — dot size', () => {
  it('renders no text for dot, even when count is provided', () => {
    const container = renderBadge(<Badge size="dot" count={5} />);
    expect(getBadge(container).textContent).toBe('');
  });

  it('sets aria-hidden=true on dot by default', () => {
    const container = renderBadge(<Badge size="dot" />);
    expect(getBadge(container).getAttribute('aria-hidden')).toBe('true');
  });

  it('does NOT set aria-hidden when aria-label is provided', () => {
    const container = renderBadge(<Badge size="dot" aria-label="Online" />);
    const badge = getBadge(container);
    expect(badge.getAttribute('aria-hidden')).toBeNull();
    expect(badge.getAttribute('aria-label')).toBe('Online');
  });
});

// ─── data-* attributes ────────────────────────────────────────────────────────

describe('Badge — data attributes', () => {
  const sizes: BadgeSize[] = ['sm', 'dot'];
  const variants: BadgeVariant[] = [
    'highlight-soft',
    'highlight-strong',
    'informative',
    'inverted',
    'critical',
  ];

  sizes.forEach((size) => {
    it(`sets data-size="${size}"`, () => {
      const container = renderBadge(<Badge size={size} />);
      expect(getBadge(container).dataset.size).toBe(size);
    });
  });

  variants.forEach((variant) => {
    it(`sets data-variant="${variant}"`, () => {
      const container = renderBadge(<Badge variant={variant} />);
      expect(getBadge(container).dataset.variant).toBe(variant);
    });
  });
});

// ─── Accessibility ────────────────────────────────────────────────────────────

describe('Badge — accessibility', () => {
  it('passes aria-label to the root span', () => {
    const container = renderBadge(<Badge count={3} aria-label="3 notifications" />);
    expect(getBadge(container).getAttribute('aria-label')).toBe('3 notifications');
  });

  it('does not set aria-hidden on sm/lg even without aria-label', () => {
    const container = renderBadge(<Badge size="sm" count={1} />);
    expect(getBadge(container).getAttribute('aria-hidden')).toBeNull();
  });
});

// ─── className pass-through ───────────────────────────────────────────────────

describe('Badge — className', () => {
  it('merges custom className', () => {
    const container = renderBadge(<Badge className="custom-class" />);
    const badge = getBadge(container);
    expect(badge.classList.contains('dsn-badge')).toBe(true);
    expect(badge.classList.contains('custom-class')).toBe(true);
  });
});

// ─── Variant × size matrix (smoke tests) ─────────────────────────────────────

describe('Badge — variant × size smoke tests', () => {
  const variants: BadgeVariant[] = [
    'highlight-soft',
    'highlight-strong',
    'informative',
    'inverted',
    'critical',
  ];
  const sizes: BadgeSize[] = ['sm', 'dot'];

  variants.forEach((variant) => {
    sizes.forEach((size) => {
      it(`renders ${variant} × ${size} without errors`, () => {
        expect(() =>
          renderBadge(<Badge size={size} variant={variant} count={1} />)
        ).not.toThrow();
      });
    });
  });
});
