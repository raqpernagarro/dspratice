import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Accordion } from './Accordion';

describe('Accordion', () => {
  it('renders collapsed by default', () => {
    render(<Accordion title="Title" />);

    expect(screen.getByRole('button', { name: 'Title' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it('toggles in uncontrolled mode when trigger is clicked', async () => {
    const user = userEvent.setup();
    render(<Accordion title="Title">Content slot</Accordion>);
    const trigger = screen.getByRole('button', { name: 'Title' });

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('region')).toHaveTextContent('Content slot');

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it('supports controlled mode', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    render(
      <Accordion title="Title" expanded={false} onExpandedChange={onExpandedChange}>
        Content slot
      </Accordion>,
    );

    await user.click(screen.getByRole('button', { name: 'Title' }));
    expect(onExpandedChange).toHaveBeenCalledWith(true);
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it('supports keyboard activation and ARIA linkage', async () => {
    const user = userEvent.setup();
    render(<Accordion title="Title">Content slot</Accordion>);
    const trigger = screen.getByRole('button', { name: 'Title' });

    trigger.focus();
    await user.keyboard('{Enter}');

    const region = screen.getByRole('region');
    expect(trigger).toHaveAttribute('aria-controls', region.getAttribute('id'));
    expect(region).toHaveAttribute('aria-labelledby', trigger.getAttribute('id'));
  });

  it('does not toggle when disabled', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    render(
      <Accordion title="Title" disabled onExpandedChange={onExpandedChange}>
        Content slot
      </Accordion>,
    );

    const trigger = screen.getByRole('button', { name: 'Title' });
    expect(trigger).toBeDisabled();
    await user.click(trigger);
    expect(onExpandedChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });
});
