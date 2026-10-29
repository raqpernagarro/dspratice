import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Bold } from 'lucide-react';
import { ToggleButton } from './ToggleButton';

describe('ToggleButton', () => {
  it('renders with aria-pressed state', () => {
    render(<ToggleButton icon={<Bold size={16} />} selected aria-label="Bold" />);
    expect(screen.getByRole('button', { name: 'Bold' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('emits selected changes on click', async () => {
    const user = userEvent.setup();
    const onSelectedChange = vi.fn();

    render(
      <ToggleButton
        icon={<Bold size={16} />}
        selected={false}
        aria-label="Bold"
        onSelectedChange={onSelectedChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Bold' }));
    expect(onSelectedChange).toHaveBeenCalledWith(true);
  });

  it('does not emit selected changes when disabled', async () => {
    const user = userEvent.setup();
    const onSelectedChange = vi.fn();

    render(
      <ToggleButton
        icon={<Bold size={16} />}
        selected={false}
        disabled
        aria-label="Bold"
        onSelectedChange={onSelectedChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Bold' }));
    expect(onSelectedChange).not.toHaveBeenCalled();
  });
});

describe('ToggleButton — Figma API (Code Connect)', () => {
  it('renders a visible label that names the button', () => {
    render(<ToggleButton leadingIcon={<Bold />} label="Bold" showLabel />);
    expect(screen.getByRole('button', { name: 'Bold' })).toBeInTheDocument();
    expect(screen.getByText('Bold')).toBeInTheDocument();
  });

  it('uses label as the accessible name when the label is hidden', () => {
    render(<ToggleButton leadingIcon={<Bold />} label="Bold" />);
    expect(screen.getByRole('button', { name: 'Bold' })).toBeInTheDocument();
    expect(screen.queryByText('Bold')).toBeNull();
  });

  it('can hide the leading icon', () => {
    const { container } = render(
      <ToggleButton leadingIcon={<Bold />} showLeadingIcon={false} label="Bold" showLabel />,
    );
    expect(container.querySelector('.dsn-toggle-button-icon')).toBeNull();
  });
});
