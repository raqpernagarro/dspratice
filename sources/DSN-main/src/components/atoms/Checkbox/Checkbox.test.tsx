import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('renders role checkbox with label', () => {
    render(<Checkbox label="Subscribe" />);
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
    expect(screen.getByText('Subscribe')).toBeInTheDocument();
  });

  it('maps checked state to aria-checked', () => {
    render(<Checkbox checked />);
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true');
  });

  it('maps indeterminate to aria-checked mixed', () => {
    render(<Checkbox indeterminate />);
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'mixed');
  });

  it('calls onCheckedChange on click', async () => {
    const onCheckedChange = vi.fn();
    render(<Checkbox checked={false} onCheckedChange={onCheckedChange} />);
    await userEvent.click(screen.getByRole('checkbox'));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('toggles on space key', async () => {
    const onCheckedChange = vi.fn();
    render(<Checkbox checked={false} onCheckedChange={onCheckedChange} />);
    const el = screen.getByRole('checkbox');
    el.focus();
    await userEvent.keyboard(' ');
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('does not toggle when disabled', async () => {
    const onCheckedChange = vi.fn();
    render(<Checkbox disabled checked={false} onCheckedChange={onCheckedChange} />);
    await userEvent.click(screen.getByRole('checkbox'));
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it('is removed from tab order when disabled', () => {
    render(<Checkbox disabled label="Subscribe" />);
    expect(screen.getByRole('checkbox')).toHaveAttribute('tabindex', '-1');
  });

  it('does not bubble nested action button clicks to row toggle', async () => {
    const onCheckedChange = vi.fn();
    const onActionClick = vi.fn();
    render(
      <Checkbox
        label="Subscribe"
        showButtons
        onCheckedChange={onCheckedChange}
        onActionClick={onActionClick}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Open actions' }));
    expect(onActionClick).toHaveBeenCalledTimes(1);
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it('renders optional slots', () => {
    render(
      <Checkbox
        label="Label"
        showDescription
        description="Description"
        showDescriptionRight
        descriptionRight="Assist"
        showBadge
        showTag
        showButtons
      />,
    );
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Assist')).toBeInTheDocument();
    expect(screen.getAllByText('Label').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Open actions' })).toBeInTheDocument();
  });

  it('supports indicator-only mode with no content', () => {
    const { container } = render(<Checkbox showContent={false} aria-label="Select row" />);
    expect(screen.getByRole('checkbox', { name: 'Select row' })).toBeInTheDocument();
    expect(container.querySelector('.dsn-checkbox-content')).toBeNull();
  });
});
