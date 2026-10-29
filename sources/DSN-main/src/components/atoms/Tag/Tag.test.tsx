import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Star } from 'lucide-react';
import { Tag } from './Tag';
import type { TagVariant } from './Tag';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderTag(ui: React.ReactElement) {
  const { container } = render(ui);
  return container;
}

function getTag(container: HTMLElement) {
  return container.querySelector('.dsn-tag') as HTMLElement;
}

// ─── Default rendering ────────────────────────────────────────────────────────

describe('Tag — defaults', () => {
  it('renders a <span> element', () => {
    const container = renderTag(<Tag label="Active" />);
    expect(getTag(container).tagName.toLowerCase()).toBe('span');
  });

  it('has class dsn-tag', () => {
    const container = renderTag(<Tag label="Active" />);
    expect(getTag(container)).toBeTruthy();
  });

  it('defaults to variant=neutral', () => {
    const container = renderTag(<Tag label="Active" />);
    expect(getTag(container).dataset.variant).toBe('neutral');
  });

  it('renders the label text', () => {
    renderTag(<Tag label="In review" />);
    expect(screen.getByText('In review')).toBeInTheDocument();
  });

  it('renders with role="status"', () => {
    renderTag(<Tag label="Active" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('does not render icon containers by default', () => {
    const container = renderTag(<Tag label="Active" />);
    expect(container.querySelector('.dsn-tag-icon')).toBeNull();
  });
});

// ─── Label ────────────────────────────────────────────────────────────────────

describe('Tag — label', () => {
  it('renders the label inside dsn-tag-label', () => {
    const container = renderTag(<Tag label="Pending" />);
    const labelEl = container.querySelector('.dsn-tag-label') as HTMLElement;
    expect(labelEl.textContent).toBe('Pending');
  });

  it('renders long label text', () => {
    renderTag(<Tag label="In progress" />);
    expect(screen.getByText('In progress')).toBeInTheDocument();
  });
});

// ─── Variants ─────────────────────────────────────────────────────────────────

describe('Tag — variants', () => {
  const variants: TagVariant[] = ['highlight', 'warning', 'error', 'success', 'neutral'];

  variants.forEach((variant) => {
    it(`sets data-variant="${variant}"`, () => {
      const container = renderTag(<Tag label="Label" variant={variant} />);
      expect(getTag(container).dataset.variant).toBe(variant);
    });
  });
});

// ─── Icon behaviour ───────────────────────────────────────────────────────────

describe('Tag — icon', () => {
  it('renders icon left when iconLeft is provided', () => {
    const container = renderTag(<Tag label="Featured" iconLeft={Star} />);
    const icons = container.querySelectorAll('.dsn-tag-icon');
    expect(icons.length).toBe(1);
    expect(icons[0].classList.contains('dsn-tag-icon-left')).toBe(true);
    expect(icons[0].querySelector('svg')).toBeTruthy();
  });

  it('renders icon right when iconRight is provided', () => {
    const container = renderTag(<Tag label="Dismiss" iconRight={Star} />);
    const icons = container.querySelectorAll('.dsn-tag-icon');
    expect(icons.length).toBe(1);
    expect(icons[0].classList.contains('dsn-tag-icon-right')).toBe(true);
    expect(icons[0].querySelector('svg')).toBeTruthy();
  });

  it('renders both left and right icons when both props are provided', () => {
    const container = renderTag(
      <Tag label="Both" iconLeft={Star} iconRight={Star} />
    );
    const icons = container.querySelectorAll('.dsn-tag-icon');
    expect(icons.length).toBe(2);
    expect(icons[0].classList.contains('dsn-tag-icon-left')).toBe(true);
    expect(icons[1].classList.contains('dsn-tag-icon-right')).toBe(true);
  });

  it('icon wrappers are aria-hidden', () => {
    const container = renderTag(<Tag label="Label" iconLeft={Star} />);
    const icon = container.querySelector('.dsn-tag-icon') as HTMLElement;
    expect(icon.getAttribute('aria-hidden')).toBe('true');
  });
});

// ─── Accessibility ────────────────────────────────────────────────────────────

describe('Tag — accessibility', () => {
  it('passes aria-label to the root span', () => {
    const container = renderTag(<Tag label="Active" aria-label="Status: Active" />);
    expect(getTag(container).getAttribute('aria-label')).toBe('Status: Active');
  });

  it('has role=status', () => {
    renderTag(<Tag label="Active" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('label text is accessible', () => {
    renderTag(<Tag label="Blocked" />);
    expect(screen.getByText('Blocked')).toBeInTheDocument();
  });
});

// ─── className pass-through ───────────────────────────────────────────────────

describe('Tag — className', () => {
  it('merges custom className', () => {
    const container = renderTag(<Tag label="Active" className="my-tag" />);
    const tag = getTag(container);
    expect(tag.classList.contains('dsn-tag')).toBe(true);
    expect(tag.classList.contains('my-tag')).toBe(true);
  });
});

// ─── Variant smoke tests ──────────────────────────────────────────────────────

describe('Tag — variant smoke tests', () => {
  const variants: TagVariant[] = ['highlight', 'warning', 'error', 'success', 'neutral'];

  variants.forEach((variant) => {
    it(`renders ${variant} without errors`, () => {
      expect(() => renderTag(<Tag label="Label" variant={variant} />)).not.toThrow();
    });
  });
});

describe('Tag — Figma API (Code Connect)', () => {
  it('renders leading and trailing icons from components or elements', () => {
    const container = renderTag(
      <Tag label="Label" leadingIcon={Star} trailingIcon={<Star />} />,
    );
    expect(container.querySelectorAll('svg')).toHaveLength(2);
  });

  it('hides each side independently', () => {
    const container = renderTag(
      <Tag label="Label" leadingIcon={Star} trailingIcon={Star} showLeadingIcon={false} />,
    );
    expect(container.querySelector('.dsn-tag-icon-left')).toBeNull();
    expect(container.querySelector('.dsn-tag-icon-right')).not.toBeNull();
  });

  it('renders a disclosure chevron', () => {
    const container = renderTag(<Tag label="Label" disclosure />);
    expect(container.querySelector('[data-disclosure] svg')).not.toBeNull();
  });

  it('keeps deprecated iconLeft / showIcon working', () => {
    const container = renderTag(<Tag label="Label" iconLeft={Star} showIcon={false} />);
    expect(container.querySelector('svg')).toBeNull();
  });
});
