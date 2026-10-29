import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SearchBar } from './SearchBar';

describe('SearchBar', () => {
  it('renders label and helper in default variant', () => {
    render(
      <SearchBar
        variant="default"
        label="Label"
        helperText="Help text"
        placeholder="Search"
      />,
    );

    expect(screen.getByText('Label')).toBeInTheDocument();
    expect(screen.getByText('Help text')).toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  it('does not render label in ghost variant', () => {
    render(<SearchBar variant="ghost" label="Label" placeholder="Search" />);

    expect(screen.queryByText('Label')).not.toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  it('shows clear button when there is a value', () => {
    render(<SearchBar variant="ghost" value="Search" />);

    expect(screen.getByRole('button', { name: 'Clear search' })).toBeInTheDocument();
  });

  it('calls onClear when clear action is clicked', async () => {
    const onClear = vi.fn();
    const user = userEvent.setup();

    render(<SearchBar variant="ghost" value="Search" onClear={onClear} />);
    await user.click(screen.getByRole('button', { name: 'Clear search' }));

    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
