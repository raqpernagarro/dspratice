import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Stat } from './Stat';

describe('Stat', () => {
  it('renders title and value', () => {
    render(<Stat title="Title" value="1234" />);

    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('1234')).toBeInTheDocument();
  });

  it('uses default variant when not provided', () => {
    const { container } = render(<Stat title="Title" value="1234" />);
    const root = container.querySelector('.dsn-stat');

    expect(root).toHaveAttribute('data-variant', 'default');
  });

  it('applies card variant', () => {
    const { container } = render(<Stat title="Title" value="1234" variant="card" />);
    const root = container.querySelector('.dsn-stat');

    expect(root).toHaveAttribute('data-variant', 'card');
  });
});
