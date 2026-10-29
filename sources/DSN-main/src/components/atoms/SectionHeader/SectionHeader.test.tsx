import { render, screen } from '@testing-library/react';
import { X } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { Button } from '../Button';
import { Switcher } from '../Switcher';
import { Tag } from '../Tag';
import { SectionHeader } from './SectionHeader';

describe('SectionHeader', () => {
  it('renders title and optional description', () => {
    render(<SectionHeader title="Title" description="Description" size="large" />);

    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('applies selected size variant', () => {
    render(<SectionHeader title="Compact" size="xsmall" />);

    expect(screen.getByText('Compact').closest('.dsn-section-header')).toHaveAttribute(
      'data-size',
      'xsmall',
    );
  });

  it('removes horizontal padding when flush is set', () => {
    render(<SectionHeader title="Activity" size="medium" flush />);

    expect(screen.getByText('Activity').closest('.dsn-section-header')).toHaveAttribute(
      'data-flush',
    );
  });

  it('uses border-box on the root so min-height includes padding', () => {
    render(<SectionHeader title="Filters" size="medium" />);

    const root = screen.getByText('Filters').closest('.dsn-section-header');
    expect(root).not.toBeNull();
    expect(root).toHaveAttribute('data-size', 'medium');

    const style = getComputedStyle(root!);
    expect(style.boxSizing).toBe('border-box');
    // jsdom does not resolve layout height; parity with Storybook is 48px total
    // (--space-ample min-height includes padding under border-box).
    expect(style.minHeight).toBeTruthy();
  });

  it('renders leading and trailing controls with anatomy flags', () => {
    render(
      <SectionHeader
        title="Title"
        size="medium"
        leadingControl={<span aria-hidden="true">L</span>}
        trailingControl={<span aria-hidden="true">R</span>}
      />,
    );

    const root = screen.getByText('Title').closest('.dsn-section-header');
    expect(root).toHaveAttribute('data-has-leading-control');
    expect(root).toHaveAttribute('data-has-trailing-control');
    expect(screen.getByText('L')).toBeInTheDocument();
    expect(screen.getByText('R')).toBeInTheDocument();
  });

  it('ignores non-renderable object controls', () => {
    render(
      <SectionHeader
        title="Title"
        size="medium"
        leadingControl={{} as unknown as React.ReactNode}
        trailingControl={{} as unknown as React.ReactNode}
      />,
    );

    const root = screen.getByText('Title').closest('.dsn-section-header');
    expect(root).not.toHaveAttribute('data-has-leading-control');
    expect(root).not.toHaveAttribute('data-has-trailing-control');
  });

  it('supports mixed trailing controls (switcher, tag, actions)', () => {
    render(
      <SectionHeader
        title="Title"
        size="large"
        trailingControl={
          <>
            <Tag label="Label" size="md" variant="neutral" />
            <Switcher checked={false} onChange={() => {}} size="md" aria-label="Toggle option" />
            <Button
              variant="ghost"
              size="md"
              showLabel={false}
              showLeadingIcon
              leadingIcon={<X size={16} />}
              aria-label="Close section"
            />
          </>
        }
      />,
    );

    expect(screen.getByRole('switch', { name: 'Toggle option' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Label');
    expect(screen.getByRole('button', { name: 'Close section' })).toBeInTheDocument();
  });
});
