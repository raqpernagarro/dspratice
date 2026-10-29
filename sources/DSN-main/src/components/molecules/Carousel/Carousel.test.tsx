import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Carousel, CarouselSlide } from './Carousel';
import type { CarouselProps } from './Carousel';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderCarousel(count: number, props: Partial<CarouselProps> = {}) {
  return render(
    <Carousel label="Project photos" {...props}>
      {Array.from({ length: count }, (_, i) => (
        <CarouselSlide key={i} thumbnailSrc={`thumb-${i + 1}.jpg`}>
          <img src={`photo-${i + 1}.jpg`} alt={`Photo ${i + 1}`} />
        </CarouselSlide>
      ))}
    </Carousel>,
  );
}

const counter = (container: HTMLElement) =>
  container.querySelector('.dsn-carousel-counter')?.textContent;
const slides = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>('.dsn-carousel-slide'));

// ─── Structure ────────────────────────────────────────────────────────────────

describe('Carousel — structure', () => {
  it('renders a labelled carousel region with one group per slide', () => {
    const { container } = renderCarousel(3);
    const region = screen.getByRole('region', { name: 'Project photos' });
    expect(region).toHaveAttribute('aria-roledescription', 'carousel');
    const s = slides(container);
    expect(s).toHaveLength(3);
    expect(s[1]).toHaveAttribute('aria-roledescription', 'slide');
    expect(s[1]).toHaveAttribute('aria-label', '2 of 3');
  });

  it('shows the "1 / n" counter by default', () => {
    const { container } = renderCarousel(27);
    expect(counter(container)).toBe('1 / 27');
  });

  it('hides non-current slides from assistive tech and focus', () => {
    const { container } = renderCarousel(3);
    const [first, second] = slides(container);
    expect(first).not.toHaveAttribute('aria-hidden');
    expect(first).not.toHaveAttribute('inert');
    expect(second).toHaveAttribute('aria-hidden', 'true');
    expect(second).toHaveAttribute('inert');
  });

  it('renders no controls or counter for a single slide', () => {
    const { container } = renderCarousel(1, { showDots: true, showThumbnails: true });
    expect(screen.queryByRole('button')).toBeNull();
    expect(counter(container)).toBeUndefined();
  });
});

// ─── Arrow buttons ────────────────────────────────────────────────────────────

describe('Carousel — arrows', () => {
  it('moves forward and back and updates the counter', async () => {
    const user = userEvent.setup();
    const { container } = renderCarousel(27);
    await user.click(screen.getByRole('button', { name: 'Next slide' }));
    await user.click(screen.getByRole('button', { name: 'Next slide' }));
    expect(counter(container)).toBe('3 / 27');
    await user.click(screen.getByRole('button', { name: 'Previous slide' }));
    expect(counter(container)).toBe('2 / 27');
  });

  it('hides Previous on the first slide and Next on the last', async () => {
    const user = userEvent.setup();
    renderCarousel(2);
    expect(screen.queryByRole('button', { name: 'Previous slide' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Next slide' }));
    expect(screen.queryByRole('button', { name: 'Next slide' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Previous slide' })).toBeInTheDocument();
  });

  it('moves focus to Previous when Next disappears on the last slide', async () => {
    const user = userEvent.setup();
    renderCarousel(2);
    await user.click(screen.getByRole('button', { name: 'Next slide' }));
    expect(screen.getByRole('button', { name: 'Previous slide' })).toHaveFocus();
  });

  it('announces the new position in a polite live region after navigation', async () => {
    const user = userEvent.setup();
    const { container } = renderCarousel(5);
    const live = container.querySelector('[aria-live="polite"]') as HTMLElement;
    expect(live.textContent).toBe('');
    await user.click(screen.getByRole('button', { name: 'Next slide' }));
    expect(live.textContent).toBe('Slide 2 of 5');
  });
});

// ─── Keyboard ─────────────────────────────────────────────────────────────────

describe('Carousel — keyboard', () => {
  it('ArrowRight / ArrowLeft / End / Home move between slides', async () => {
    const user = userEvent.setup();
    const { container } = renderCarousel(5);
    await user.tab(); // Previous is hidden on the first slide → focus lands on Next
    expect(screen.getByRole('button', { name: 'Next slide' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(counter(container)).toBe('2 / 5');
    await user.keyboard('{End}');
    expect(counter(container)).toBe('5 / 5');
    // Next is now hidden — focus moved to Previous instead of dropping to <body>.
    expect(screen.getByRole('button', { name: 'Previous slide' })).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(counter(container)).toBe('4 / 5');
    await user.keyboard('{Home}');
    expect(counter(container)).toBe('1 / 5');
  });

  it('does not move past either end', async () => {
    const user = userEvent.setup();
    const { container } = renderCarousel(3, { defaultIndex: 2 });
    await user.tab();
    await user.keyboard('{ArrowRight}');
    expect(counter(container)).toBe('3 / 3');
  });
});

// ─── Dots and thumbnails ──────────────────────────────────────────────────────

describe('Carousel — dots and thumbnails', () => {
  it('a dot jumps to its slide and is marked current', async () => {
    const user = userEvent.setup();
    const { container } = renderCarousel(5, { showDots: true });
    const dot = screen.getByRole('button', { name: 'Go to slide 4' });
    await user.click(dot);
    expect(counter(container)).toBe('4 / 5');
    expect(dot).toHaveAttribute('aria-current', 'true');
  });

  it('hides dots for more than 10 slides', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    renderCarousel(11, { showDots: true });
    expect(screen.queryByRole('button', { name: 'Go to slide 1' })).toBeNull();
    warn.mockRestore();
  });

  it('a thumbnail jumps to its slide and is marked current', async () => {
    const user = userEvent.setup();
    const { container } = renderCarousel(6, { showThumbnails: true });
    const thumb = screen.getByRole('button', { name: 'Show slide 5' });
    await user.click(thumb);
    expect(counter(container)).toBe('5 / 6');
    expect(thumb).toHaveAttribute('aria-current', 'true');
  });
});

// ─── Swipe ────────────────────────────────────────────────────────────────────

describe('Carousel — swipe', () => {
  // jsdom has no PointerEvent; a MouseEvent subclass carries clientX/Y + pointerType.
  beforeAll(() => {
    if (!('PointerEvent' in window)) {
      class PointerEventPolyfill extends MouseEvent {
        pointerType: string;
        constructor(type: string, init: PointerEventInit = {}) {
          super(type, init);
          this.pointerType = init.pointerType ?? 'mouse';
        }
      }
      (window as unknown as { PointerEvent: unknown }).PointerEvent = PointerEventPolyfill;
    }
  });

  // fireEvent: userEvent cannot model touch-pointer swipes.
  const swipe = (el: Element, fromX: number, toX: number, pointerType = 'touch') => {
    fireEvent.pointerDown(el, { clientX: fromX, clientY: 100, pointerType });
    fireEvent.pointerUp(el, { clientX: toX, clientY: 100, pointerType });
  };

  it('a left swipe goes to the next slide, a right swipe to the previous', () => {
    const { container } = renderCarousel(4);
    const viewport = container.querySelector('.dsn-carousel-viewport')!;
    swipe(viewport, 300, 100);
    expect(counter(container)).toBe('2 / 4');
    swipe(viewport, 100, 300);
    expect(counter(container)).toBe('1 / 4');
  });

  it('ignores short swipes and mouse drags', () => {
    const { container } = renderCarousel(4);
    const viewport = container.querySelector('.dsn-carousel-viewport')!;
    swipe(viewport, 300, 280);
    swipe(viewport, 300, 100, 'mouse');
    expect(counter(container)).toBe('1 / 4');
  });
});

// ─── Controlled ───────────────────────────────────────────────────────────────

describe('Carousel — controlled', () => {
  it('calls onIndexChange and follows the index prop', async () => {
    const user = userEvent.setup();
    const onIndexChange = vi.fn();
    function Controlled() {
      const [index, setIndex] = useState(1);
      return (
        <Carousel
          label="Project photos"
          index={index}
          onIndexChange={(i) => { onIndexChange(i); setIndex(i); }}
        >
          {[1, 2, 3].map((n) => (
            <CarouselSlide key={n}><img src={`p${n}.jpg`} alt={`Photo ${n}`} /></CarouselSlide>
          ))}
        </Carousel>
      );
    }
    const { container } = render(<Controlled />);
    expect(counter(container)).toBe('2 / 3');
    await user.click(screen.getByRole('button', { name: 'Next slide' }));
    expect(onIndexChange).toHaveBeenCalledWith(2);
    expect(counter(container)).toBe('3 / 3');
  });
});
