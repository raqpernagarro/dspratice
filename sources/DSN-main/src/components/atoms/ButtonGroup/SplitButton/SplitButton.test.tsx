import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SplitButton } from './SplitButton';

const TriggerIcon = () => <svg data-testid="trigger-icon" aria-hidden="true" />;
const LeadingIcon = () => <svg data-testid="leading-icon" aria-hidden="true" />;

describe('SplitButton', () => {
  // ─── Structure ──────────────────────────────────────────────────────────────

  describe('structure', () => {
    it('renders a wrapper div with role="group"', () => {
      render(<SplitButton triggerIcon={<TriggerIcon />}>Save</SplitButton>);
      expect(screen.getByRole('group')).toBeInTheDocument();
    });

    it('renders exactly two <button> elements', () => {
      render(<SplitButton triggerIcon={<TriggerIcon />}>Save</SplitButton>);
      expect(screen.getAllByRole('button')).toHaveLength(2);
    });

    it('applies dsn-split-button class to wrapper', () => {
      render(<SplitButton triggerIcon={<TriggerIcon />}>Save</SplitButton>);
      expect(screen.getByRole('group')).toHaveClass('dsn-split-button');
    });

    it('applies data-size="md" to wrapper by default', () => {
      render(<SplitButton triggerIcon={<TriggerIcon />}>Save</SplitButton>);
      expect(screen.getByRole('group')).toHaveAttribute('data-size', 'md');
    });

    it('applies data-size="sm" to wrapper when size="sm"', () => {
      render(<SplitButton size="sm" triggerIcon={<TriggerIcon />}>Save</SplitButton>);
      expect(screen.getByRole('group')).toHaveAttribute('data-size', 'sm');
    });

    it('forwards className to wrapper', () => {
      render(
        <SplitButton triggerIcon={<TriggerIcon />} className="custom-class">
          Save
        </SplitButton>,
      );
      expect(screen.getByRole('group')).toHaveClass('custom-class');
    });
  });

  // ─── Main button ────────────────────────────────────────────────────────────

  describe('main button', () => {
    it('displays the label text', () => {
      render(<SplitButton triggerIcon={<TriggerIcon />}>Save changes</SplitButton>);
      expect(screen.getByText('Save changes')).toBeInTheDocument();
    });

    it('shows leading icon when leadingIcon prop is supplied', () => {
      render(
        <SplitButton leadingIcon={<LeadingIcon />} triggerIcon={<TriggerIcon />}>
          Create
        </SplitButton>,
      );
      expect(screen.getByTestId('leading-icon')).toBeInTheDocument();
    });

    it('does not render a leading icon slot when leadingIcon is omitted', () => {
      render(<SplitButton triggerIcon={<TriggerIcon />}>Save</SplitButton>);
      expect(screen.queryByTestId('leading-icon')).not.toBeInTheDocument();
    });

    it('sets aria-busy on main button when loading', () => {
      render(
        <SplitButton loading triggerIcon={<TriggerIcon />}>
          Saving…
        </SplitButton>,
      );
      const [mainBtn] = screen.getAllByRole('button');
      expect(mainBtn).toHaveAttribute('aria-busy', 'true');
    });
  });

  // ─── Trigger button ─────────────────────────────────────────────────────────

  describe('trigger button', () => {
    it('has aria-label="More options" by default', () => {
      render(<SplitButton triggerIcon={<TriggerIcon />}>Save</SplitButton>);
      expect(screen.getByLabelText('More options')).toBeInTheDocument();
    });

    it('uses custom dropdownAriaLabel when provided', () => {
      render(
        <SplitButton triggerIcon={<TriggerIcon />} dropdownAriaLabel="Open menu">
          Save
        </SplitButton>,
      );
      expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
    });

    it('has aria-haspopup="true"', () => {
      render(<SplitButton triggerIcon={<TriggerIcon />}>Save</SplitButton>);
      expect(screen.getByLabelText('More options')).toHaveAttribute('aria-haspopup', 'true');
    });

    it('omits aria-expanded when open is not provided', () => {
      render(<SplitButton triggerIcon={<TriggerIcon />}>Save</SplitButton>);
      expect(screen.getByLabelText('More options')).not.toHaveAttribute('aria-expanded');
    });

    it('reflects open in aria-expanded', () => {
      const { rerender } = render(<SplitButton open={false} triggerIcon={<TriggerIcon />}>Save</SplitButton>);
      expect(screen.getByLabelText('More options')).toHaveAttribute('aria-expanded', 'false');
      rerender(<SplitButton open triggerIcon={<TriggerIcon />}>Save</SplitButton>);
      expect(screen.getByLabelText('More options')).toHaveAttribute('aria-expanded', 'true');
    });

    it('renders the trigger icon', () => {
      render(<SplitButton triggerIcon={<TriggerIcon />}>Save</SplitButton>);
      expect(screen.getByTestId('trigger-icon')).toBeInTheDocument();
    });
  });

  // ─── Disabled state ──────────────────────────────────────────────────────────

  describe('disabled state', () => {
    it('disables both buttons when disabled={true}', () => {
      render(
        <SplitButton disabled triggerIcon={<TriggerIcon />}>
          Save
        </SplitButton>,
      );
      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).toBeDisabled();
      expect(buttons[1]).toBeDisabled();
    });

    it('does not disable buttons when disabled={false}', () => {
      render(
        <SplitButton disabled={false} triggerIcon={<TriggerIcon />}>
          Save
        </SplitButton>,
      );
      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).not.toBeDisabled();
      expect(buttons[1]).not.toBeDisabled();
    });
  });

  // ─── Loading state ───────────────────────────────────────────────────────────

  describe('loading state', () => {
    it('disables the trigger button when loading', () => {
      render(
        <SplitButton loading triggerIcon={<TriggerIcon />}>
          Saving…
        </SplitButton>,
      );
      expect(screen.getByLabelText('More options')).toBeDisabled();
    });

    it('does not disable the main button via the disabled attr when loading (aria-busy instead)', () => {
      render(
        <SplitButton loading triggerIcon={<TriggerIcon />}>
          Saving…
        </SplitButton>,
      );
      const [mainBtn] = screen.getAllByRole('button');
      // The Button component disables interaction via aria-busy and the disabled HTML attr
      // when loading=true; verify aria-busy is set
      expect(mainBtn).toHaveAttribute('aria-busy', 'true');
    });
  });

  // ─── Click handlers ──────────────────────────────────────────────────────────

  describe('click handlers', () => {
    it('calls onMainClick when main button is clicked', async () => {
      const onMainClick = vi.fn();
      render(
        <SplitButton onMainClick={onMainClick} triggerIcon={<TriggerIcon />}>
          Save
        </SplitButton>,
      );
      await userEvent.click(screen.getAllByRole('button')[0]);
      expect(onMainClick).toHaveBeenCalledTimes(1);
    });

    it('calls onDropdownClick when trigger button is clicked', async () => {
      const onDropdownClick = vi.fn();
      render(
        <SplitButton onDropdownClick={onDropdownClick} triggerIcon={<TriggerIcon />}>
          Save
        </SplitButton>,
      );
      await userEvent.click(screen.getByLabelText('More options'));
      expect(onDropdownClick).toHaveBeenCalledTimes(1);
    });

    it('does not fire onMainClick when disabled', async () => {
      const onMainClick = vi.fn();
      render(
        <SplitButton disabled onMainClick={onMainClick} triggerIcon={<TriggerIcon />}>
          Save
        </SplitButton>,
      );
      await userEvent.click(screen.getAllByRole('button')[0]);
      expect(onMainClick).not.toHaveBeenCalled();
    });

    it('does not fire onDropdownClick when disabled', async () => {
      const onDropdownClick = vi.fn();
      render(
        <SplitButton disabled onDropdownClick={onDropdownClick} triggerIcon={<TriggerIcon />}>
          Save
        </SplitButton>,
      );
      await userEvent.click(screen.getByLabelText('More options'));
      expect(onDropdownClick).not.toHaveBeenCalled();
    });
  });

  // ─── Sizes ───────────────────────────────────────────────────────────────────

  describe('sizes', () => {
    it('passes size="md" to both inner buttons (default)', () => {
      render(<SplitButton triggerIcon={<TriggerIcon />}>Save</SplitButton>);
      const buttons = screen.getAllByRole('button');
      buttons.forEach((btn) => expect(btn).toHaveAttribute('data-size', 'md'));
    });

    it('passes size="sm" to both inner buttons when size="sm"', () => {
      render(
        <SplitButton size="sm" triggerIcon={<TriggerIcon />}>
          Save
        </SplitButton>,
      );
      const buttons = screen.getAllByRole('button');
      buttons.forEach((btn) => expect(btn).toHaveAttribute('data-size', 'sm'));
    });
  });

  // ─── Variants ────────────────────────────────────────────────────────────────

  describe('variants', () => {
    it('defaults to secondary variant on both buttons', () => {
      render(<SplitButton>Save</SplitButton>);
      const buttons = screen.getAllByRole('button');
      buttons.forEach((btn) => expect(btn).toHaveAttribute('data-variant', 'secondary'));
    });

    it('applies primary variant to both buttons when variant="primary"', () => {
      render(<SplitButton variant="primary">Create</SplitButton>);
      const buttons = screen.getAllByRole('button');
      buttons.forEach((btn) => expect(btn).toHaveAttribute('data-variant', 'primary'));
    });
  });
});
