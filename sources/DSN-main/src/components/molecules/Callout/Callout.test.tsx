import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from '../../atoms/Button';
import { Callout } from './Callout';

describe('Callout', () => {
  it('renders title and description', () => {
    render(<Callout title="Title" description="Description" />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('uses alert role and assertive live region for error severity', () => {
    render(<Callout severity="error" title="Error title" description="Error description" />);

    const callout = screen.getByRole('alert');
    expect(callout).toHaveAttribute('aria-live', 'assertive');
  });

  it('calls onDismiss when dismiss button is clicked', () => {
    const onDismiss = vi.fn();
    render(<Callout title="Title" dismissLabel="Dismiss" onDismiss={onDismiss} />);

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('hides dismiss button when dismissible is false', () => {
    render(<Callout title="Title" dismissible={false} />);

    expect(screen.queryByRole('button', { name: /dismiss/i })).not.toBeInTheDocument();
  });

  it('renders content and footer slots when provided', () => {
    render(
      <Callout
        title="Title"
        content={<div>Slot content</div>}
        supporting={<span>Label</span>}
        actions={<Button size="md">Confirm</Button>}
      />,
    );

    expect(screen.getByText('Slot content')).toBeInTheDocument();
    expect(screen.getByText('Label')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
  });
});
