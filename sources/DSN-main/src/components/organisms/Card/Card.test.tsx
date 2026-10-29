import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Card } from './Card';

describe('Card', () => {
  it('renders section header and content slot', () => {
    render(
      <Card title="Order summary" description="Review before checkout">
        <div>Card content</div>
      </Card>,
    );

    expect(screen.getByRole('region', { name: 'Card' })).toBeInTheDocument();
    expect(screen.getByText('Order summary')).toBeInTheDocument();
    expect(screen.getByText('Review before checkout')).toBeInTheDocument();
    expect(screen.getByText('Card content')).toBeInTheDocument();
    expect(
      document.querySelector('.dsn-section-header--card[data-size="medium"]'),
    ).toBeTruthy();
  });

  it.each(['medium', 'small', 'xsmall'] as const)(
    'uses balanced top padding on %s card section headers (matches inline inset)',
    (headerSize) => {
      render(
        <Card title="Order summary" description="Review" headerSize={headerSize} showBottomBar={false}>
          <div>Body</div>
        </Card>,
      );

      const header = document.querySelector(
        `.dsn-card-header .dsn-section-header[data-size="${headerSize}"]`,
      );
      expect(header).toBeTruthy();
      const styles = getComputedStyle(header!);
      expect(styles.paddingTop).toBe(styles.paddingLeft);
      expect(styles.paddingTop).not.toBe('0px');
    },
  );

  it('renders toolbar bottom bar when enabled', () => {
    render(
      <Card
        showBottomBar
        bottomBarLeftActions={<button type="button">Back</button>}
        bottomBarRightActions={<button type="button">Continue</button>}
      >
        <div>Body</div>
      </Card>,
    );

    expect(screen.getByRole('toolbar', { name: 'Card actions' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
  });

  it('supports custom header and custom bottom bar nodes', () => {
    render(
      <Card
        header={<div>Custom header</div>}
        showBottomBar
        bottomBar={<div>Custom bottom bar</div>}
      >
        <div>Body</div>
      </Card>,
    );

    expect(screen.getByText('Custom header')).toBeInTheDocument();
    expect(screen.getByText('Custom bottom bar')).toBeInTheDocument();
    expect(screen.queryByRole('toolbar', { name: 'Card actions' })).not.toBeInTheDocument();
  });

  it('shows card skeleton and omits chrome while loading', () => {
    const { container } = render(
      <Card loading title="Order summary" aria-label="Order card">
        <div>Card content</div>
      </Card>,
    );

    const region = screen.getByRole('region', { name: 'Order card, loading' });
    expect(region).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByText('Order summary')).not.toBeInTheDocument();
    expect(screen.queryByText('Card content')).not.toBeInTheDocument();
    expect(container.querySelector('.dsn-skeleton-loading[data-type="card"]')).toBeTruthy();
  });
});
