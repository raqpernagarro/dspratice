import { fireEvent, render, screen } from '@testing-library/react';
import { FolderOpen, Search } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders title, subtitle and all actions by default without an icon', () => {
    const { container } = render(<EmptyState />);

    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Subtitle.')).toBeInTheDocument();
    expect(screen.getByText('Help text')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Button' })).toHaveLength(4);
    expect(container.querySelector('.dsn-empty-state-icon')).not.toBeInTheDocument();
  });

  it('renders a swappable icon when hasIcon and icon are provided', () => {
    const { container } = render(
      <EmptyState hasIcon icon={FolderOpen} />,
    );

    expect(container.querySelector('.dsn-empty-state-icon')).toBeInTheDocument();
    expect(container.querySelector('.dsn-empty-state-icon svg')).toBeInTheDocument();
  });

  it('does not render an icon when hasIcon is true but icon is omitted', () => {
    const { container } = render(<EmptyState hasIcon />);

    expect(container.querySelector('.dsn-empty-state-icon')).not.toBeInTheDocument();
  });

  it('hides optional sections when booleans are disabled', () => {
    const { container } = render(
      <EmptyState
        hasIcon={false}
        hasTitle={false}
        hasSubtitle={false}
        hasActions={false}
      />,
    );

    expect(container.querySelector('.dsn-empty-state-icon')).not.toBeInTheDocument();
    expect(screen.queryByText('Title')).not.toBeInTheDocument();
    expect(screen.queryByText('Subtitle.')).not.toBeInTheDocument();
    expect(screen.queryByText('Help text')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Button' })).not.toBeInTheDocument();
  });

  it('uses small sizing data attribute when size is small', () => {
    const { container } = render(<EmptyState size="small" hasIcon icon={Search} />);
    expect(container.querySelector('.dsn-empty-state')).toHaveAttribute('data-size', 'small');
  });

  it('calls action handlers for enabled actions', () => {
    const onMainCtaClick = vi.fn();
    const onSecondaryOptionClick = vi.fn();
    const onTertiaryOptionClick = vi.fn();
    const onLinkClick = vi.fn();

    render(
      <EmptyState
        mainCtaLabel="Primary"
        secondaryOptionLabel="Secondary"
        tertiaryOptionLabel="Tertiary"
        linkLabel="Link"
        onMainCtaClick={onMainCtaClick}
        onSecondaryOptionClick={onSecondaryOptionClick}
        onTertiaryOptionClick={onTertiaryOptionClick}
        onLinkClick={onLinkClick}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Primary' }));
    fireEvent.click(screen.getByRole('button', { name: 'Secondary' }));
    fireEvent.click(screen.getByRole('button', { name: 'Tertiary' }));
    fireEvent.click(screen.getByRole('button', { name: 'Link' }));

    expect(onMainCtaClick).toHaveBeenCalledTimes(1);
    expect(onSecondaryOptionClick).toHaveBeenCalledTimes(1);
    expect(onTertiaryOptionClick).toHaveBeenCalledTimes(1);
    expect(onLinkClick).toHaveBeenCalledTimes(1);
  });
});
