import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CustomViewTab } from './CustomViewTab';

const tabs = [
  { value: 'filter-a', label: 'Filter A', panel: <div>Filter A panel</div>, removable: true },
  { value: 'filter-b', label: 'Filter B', panel: <div>Filter B panel</div>, removable: true },
] as const;

describe('CustomViewTab', () => {
  it('renders tablist and selected panel', () => {
    render(<CustomViewTab tabs={tabs} defaultValue="filter-a" aria-label="Custom views" />);

    expect(screen.getByRole('tablist', { name: 'Custom views' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Filter A' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel', { name: 'Filter A' })).toBeInTheDocument();
  });

  it('changes selected tab on click', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<CustomViewTab tabs={tabs} defaultValue="filter-a" onChange={onChange} />);
    await user.click(screen.getByRole('tab', { name: 'Filter B' }));

    expect(onChange).toHaveBeenCalledWith('filter-b');
    expect(screen.getByRole('tab', { name: 'Filter B' })).toHaveAttribute('aria-selected', 'true');
  });

  it('calls onRemove without changing selected tab', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();

    render(<CustomViewTab tabs={tabs} defaultValue="filter-a" onRemove={onRemove} />);
    const tab = screen.getByRole('tab', { name: 'Filter A' });
    tab.focus();
    await user.keyboard('{Delete}');

    expect(onRemove).toHaveBeenCalledWith('filter-a');
    expect(screen.getByRole('tab', { name: 'Filter A' })).toHaveAttribute('aria-selected', 'true');
  });

  it('calls add action and keeps add button outside tab semantics', async () => {
    const user = userEvent.setup();
    const onAddAction = vi.fn();

    render(
      <CustomViewTab
        tabs={tabs}
        defaultValue="filter-a"
        addActionLabel="Add list"
        onAddAction={onAddAction}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Add list' }));
    expect(onAddAction).toHaveBeenCalledTimes(1);
    expect(screen.getAllByRole('tab')).toHaveLength(2);
  });
});
