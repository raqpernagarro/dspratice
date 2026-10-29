import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { TabNav } from './TabNav';

const items = [
  { href: '/overview', label: 'Overview', current: true },
  { href: '/activity', label: 'Activity' },
  { href: '/settings', label: 'Settings' },
];

describe('TabNav', () => {
  it('renders a labelled navigation landmark of links, not a tablist', () => {
    render(<TabNav items={items} aria-label="Project sections" />);

    expect(screen.getByRole('navigation', { name: 'Project sections' })).toBeInTheDocument();
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(3);
    expect(screen.getByRole('link', { name: 'Activity' })).toHaveAttribute('href', '/activity');
  });

  it('marks only the current item with aria-current="page"', () => {
    render(<TabNav items={items} aria-label="Project sections" />);

    expect(screen.getByRole('link', { name: 'Overview' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Activity' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: 'Settings' })).not.toHaveAttribute('aria-current');
  });

  it('puts every link in the Tab order (no roving tabindex)', async () => {
    const user = userEvent.setup();
    render(<TabNav items={items} aria-label="Project sections" />);

    await user.tab();
    expect(screen.getByRole('link', { name: 'Overview' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('link', { name: 'Activity' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveFocus();
  });

  it('renders each item through linkAs when provided', () => {
    const RouterLink = React.forwardRef<HTMLAnchorElement, React.AnchorHTMLAttributes<HTMLAnchorElement>>((props, ref) => (
      <a ref={ref} data-router-link="" {...props} />
    ));
    RouterLink.displayName = 'RouterLink';

    render(<TabNav items={items} aria-label="Project sections" linkAs={RouterLink} />);

    const link = screen.getByRole('link', { name: 'Overview' });
    expect(link).toHaveAttribute('data-router-link');
    expect(link).toHaveAttribute('aria-current', 'page');
  });

  it('keeps icons out of the accessible name', () => {
    render(
      <TabNav
        aria-label="Project sections"
        items={[{ href: '/overview', label: 'Overview', showLeadingIcon: true, leadingIcon: <svg data-testid="icon" /> }]}
      />,
    );

    expect(screen.getByRole('link', { name: 'Overview' })).toBeInTheDocument();
    expect(screen.getByTestId('icon').parentElement).toHaveAttribute('aria-hidden', 'true');
  });
});
