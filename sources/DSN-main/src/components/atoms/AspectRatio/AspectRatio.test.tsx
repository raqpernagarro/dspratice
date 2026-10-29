import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AspectRatio } from './AspectRatio';
import type { AspectRatioRatio, AspectRatioShape, AspectRatioFit } from './AspectRatio';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRoot(container: HTMLElement) {
  return container.querySelector('.dsn-aspect-ratio') as HTMLElement;
}

const IMG = <img src="photo.jpg" alt="Mountain range at sunset" />;

// ─── Default rendering ────────────────────────────────────────────────────────

describe('AspectRatio — defaults', () => {
  it('renders the child inside the content slot', () => {
    const { container } = render(<AspectRatio ratio="16:9">{IMG}</AspectRatio>);
    const img = screen.getByRole('img', { name: 'Mountain range at sunset' });
    expect(img.parentElement).toHaveClass('dsn-aspect-ratio-content');
    expect(img.parentElement?.parentElement).toBe(getRoot(container));
  });

  it('defaults to shape="rectangle"', () => {
    const { container } = render(<AspectRatio ratio="16:9">{IMG}</AspectRatio>);
    expect(getRoot(container).dataset.shape).toBe('rectangle');
  });

  it('omits data-fit when fit is not set', () => {
    const { container } = render(<AspectRatio ratio="16:9">{IMG}</AspectRatio>);
    expect(getRoot(container)).not.toHaveAttribute('data-fit');
  });

  it('does not set an inline aspect-ratio (ratio stays overridable from CSS)', () => {
    const { container } = render(<AspectRatio ratio="16:9">{IMG}</AspectRatio>);
    expect(getRoot(container).getAttribute('style')).toBeNull();
  });
});

// ─── Props → data attributes ─────────────────────────────────────────────────

describe('AspectRatio — props', () => {
  const ratios: AspectRatioRatio[] = ['1:1', '4:3', '3:2', '16:9', '21:9', '3:4', '9:16'];
  it.each(ratios)('sets data-ratio="%s"', (ratio) => {
    const { container } = render(<AspectRatio ratio={ratio}>{IMG}</AspectRatio>);
    expect(getRoot(container).dataset.ratio).toBe(ratio);
  });

  const shapes: AspectRatioShape[] = ['rectangle', 'rounded', 'ellipse'];
  it.each(shapes)('sets data-shape="%s"', (shape) => {
    const { container } = render(<AspectRatio ratio="1:1" shape={shape}>{IMG}</AspectRatio>);
    expect(getRoot(container).dataset.shape).toBe(shape);
  });

  const fits: AspectRatioFit[] = ['cover', 'contain', 'center'];
  it.each(fits)('sets data-fit="%s"', (fit) => {
    const { container } = render(<AspectRatio ratio="4:3" fit={fit}>{IMG}</AspectRatio>);
    expect(getRoot(container).dataset.fit).toBe(fit);
  });

  it('merges className onto the root', () => {
    const { container } = render(
      <AspectRatio ratio="16:9" className="hero-media">{IMG}</AspectRatio>,
    );
    expect(getRoot(container)).toHaveClass('dsn-aspect-ratio', 'hero-media');
  });
});

// ─── Accessibility ────────────────────────────────────────────────────────────

describe('AspectRatio — accessibility', () => {
  it('adds no role or aria attributes; the child carries the description', () => {
    const { container } = render(<AspectRatio ratio="16:9" fit="cover">{IMG}</AspectRatio>);
    const root = getRoot(container);
    expect(root).not.toHaveAttribute('role');
    expect(root.getAttributeNames().filter((n) => n.startsWith('aria-'))).toEqual([]);
    expect(root).not.toHaveAttribute('tabindex');
  });
});
