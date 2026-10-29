import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Tab } from './Tab';

const tabs = [
  { value: 'overview', label: 'Overview', panel: <div>Overview panel</div> },
  { value: 'activity', label: 'Activity', panel: <div>Activity panel</div> },
  { value: 'settings', label: 'Settings', panel: <div>Settings panel</div>, disabled: true },
] as const;

describe('Tab', () => {
  it('renders tablist and selected panel', () => {
    render(<Tab tabs={tabs} defaultValue="overview" aria-label="Sections" />);

    expect(screen.getByRole('tablist', { name: 'Sections' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel', { name: 'Overview' })).toBeInTheDocument();
    expect(screen.getByText('Overview panel')).toBeInTheDocument();
  });

  it('changes selected tab on click', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();

    render(<Tab tabs={tabs} defaultValue="overview" onChange={onChange} />);
    await user.click(screen.getByRole('tab', { name: 'Activity' }));

    expect(onChange).toHaveBeenCalledWith('activity');
    expect(screen.getByRole('tab', { name: 'Activity' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel', { name: 'Activity' })).toBeInTheDocument();
  });

  it('supports arrow key navigation and Enter to select focused tab', async () => {
    const user = userEvent.setup();

    render(<Tab tabs={tabs} defaultValue="overview" aria-label="Sections" />);

    await user.tab();
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveFocus();

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Activity' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{Enter}');
    expect(screen.getByRole('tab', { name: 'Activity' })).toHaveAttribute('aria-selected', 'true');
  });

  it('keeps only selected tab in natural tab order', () => {
    render(<Tab tabs={tabs} defaultValue="activity" />);

    expect(screen.getByRole('tab', { name: 'Activity' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('tab', { name: 'Settings' })).toHaveAttribute('tabindex', '-1');
  });
});
