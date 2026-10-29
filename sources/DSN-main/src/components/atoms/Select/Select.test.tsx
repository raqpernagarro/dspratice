import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Select } from './Select';

const sampleOptions = [
  { value: 'a', label: 'Option A' },
  { value: 'b', label: 'Option B' },
  { value: 'c', label: 'Option C' },
];

describe('Select', () => {
  it('renders label and helper text', () => {
    render(<Select label="Label" helperText="Help text" options={sampleOptions} />);

    expect(screen.getByText('Label')).toBeInTheDocument();
    expect(screen.getByText('Help text')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Label' })).toBeInTheDocument();
  });

  it('opens listbox popover when pressed', async () => {
    const user = userEvent.setup();
    render(<Select label="Label" helperText="Help text" options={sampleOptions} />);

    await user.click(screen.getByRole('button', { name: 'Label' }));

    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByRole('listbox')).toHaveAttribute('data-placement', 'bottom');
  });

  it('renders a leading icon for options that provide one', async () => {
    const user = userEvent.setup();
    render(
      <Select
        label="Label"
        options={[
          { value: 'a', label: 'Option A', icon: <span data-testid="icon-a" /> },
          { value: 'b', label: 'Option B' },
        ]}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Label' }));

    expect(screen.getByRole('option', { name: /Option A/ })).toContainElement(screen.getByTestId('icon-a'));
  });

  it('selects an option and emits onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <Select
        label="Label"
        helperText="Help text"
        options={sampleOptions.slice(0, 2)}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Label' }));
    await user.click(screen.getByRole('option', { name: 'Option B' }));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('b', { value: 'b', label: 'Option B' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('renders without label when aria-label is provided (control only)', () => {
    render(<Select placeholder="Choose…" aria-label="Country" options={sampleOptions.slice(0, 1)} />);

    expect(screen.queryByText('Label')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Country' })).toBeInTheDocument();
  });

  it('supports listbox keyboard navigation and escape focus return', async () => {
    const user = userEvent.setup();
    render(<Select label="Label" options={sampleOptions} />);

    const trigger = screen.getByRole('button', { name: 'Label' });
    trigger.focus();
    await user.keyboard('{Enter}');

    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Option A' })).toHaveFocus();

    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('option', { name: 'Option B' })).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  describe('search', () => {
    const manyOptions = Array.from({ length: 12 }, (_, i) => ({
      value: `v${i}`,
      label: i === 7 ? 'Avatar' : `Option ${i}`,
    }));

    it('has no search field at 10 options or fewer', async () => {
      const user = userEvent.setup();
      const ten = manyOptions.slice(0, 10);
      render(<Select label="Role" options={ten} />);
      await user.click(screen.getByRole('button', { name: 'Role' }));
      expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('shows a focused search field above 10 options and filters by label', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<Select label="Role" options={manyOptions} onChange={onChange} />);
      await user.click(screen.getByRole('button', { name: 'Role' }));

      const search = screen.getByLabelText('Search');
      expect(search).toHaveFocus();
      expect(screen.getByRole('listbox', { name: 'Role options' })).toBeInTheDocument();

      await user.keyboard('ava');
      expect(screen.getAllByRole('option')).toHaveLength(1);

      await user.keyboard('{Enter}');
      expect(onChange).toHaveBeenCalledWith('v7', { value: 'v7', label: 'Avatar' });
    });

    it('moves from the search field into the list with ArrowDown', async () => {
      const user = userEvent.setup();
      render(<Select label="Role" options={manyOptions} />);
      await user.click(screen.getByRole('button', { name: 'Role' }));
      await user.keyboard('{ArrowDown}');
      expect(screen.getByRole('option', { name: 'Option 0' })).toHaveFocus();
      await user.keyboard('{ArrowUp}');
      expect(screen.getByLabelText('Search')).toHaveFocus();
    });

    it('shows an empty state when nothing matches', async () => {
      const user = userEvent.setup();
      render(<Select label="Role" options={manyOptions} />);
      await user.click(screen.getByRole('button', { name: 'Role' }));
      await user.keyboard('zzz');
      expect(screen.queryAllByRole('option')).toHaveLength(0);
      expect(screen.getByText('No results')).toBeInTheDocument();
    });

    it('can be forced on or off with searchable', async () => {
      const user = userEvent.setup();
      render(<Select label="Role" options={manyOptions} searchable={false} />);
      await user.click(screen.getByRole('button', { name: 'Role' }));
      expect(screen.queryByLabelText('Search')).not.toBeInTheDocument();
    });
  });
});
