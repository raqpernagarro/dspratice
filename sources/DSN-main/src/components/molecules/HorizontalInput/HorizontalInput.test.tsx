import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HorizontalInput } from './HorizontalInput';

describe('HorizontalInput', () => {
  it('renders label and content slot', () => {
    render(
      <HorizontalInput label="Status">
        <input aria-label="Status value" />
      </HorizontalInput>,
    );

    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Status value' })).toBeInTheDocument();
  });

  it('renders description only when enabled', () => {
    const { rerender } = render(
      <HorizontalInput label="Status" description="Description" showDescription>
        <input aria-label="Status value" />
      </HorizontalInput>,
    );

    expect(screen.getByText('Description')).toBeInTheDocument();

    rerender(
      <HorizontalInput label="Status" description="Description" showDescription={false}>
        <input aria-label="Status value" />
      </HorizontalInput>,
    );

    expect(screen.queryByText('Description')).not.toBeInTheDocument();
  });

  it('renders default icon when showIcon is true', () => {
    const { container } = render(
      <HorizontalInput label="Status" showIcon>
        <input aria-label="Status value" />
      </HorizontalInput>,
    );

    expect(container.querySelector('.dsn-horizontal-input-icon svg')).toBeInTheDocument();
  });

  it('renders custom icon when provided', () => {
    render(
      <HorizontalInput
        label="Status"
        showIcon
        iconSlot={<span data-testid="custom-horizontal-icon" />}
      >
        <input aria-label="Status value" />
      </HorizontalInput>,
    );

    expect(screen.getByTestId('custom-horizontal-icon')).toBeInTheDocument();
  });

  it('applies error state data attribute', () => {
    const { container } = render(
      <HorizontalInput label="Status" description="Description" error>
        <input aria-label="Status value" />
      </HorizontalInput>,
    );

    expect(container.querySelector('.dsn-horizontal-input')).toHaveAttribute('data-error');
  });
});
