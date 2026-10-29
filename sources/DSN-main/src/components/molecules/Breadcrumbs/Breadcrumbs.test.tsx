import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Breadcrumbs } from './Breadcrumbs';

describe('Breadcrumbs', () => {
  const items = [
    { id: 'home', label: 'Home' },
    { id: 'projects', label: 'Projects' },
    { id: 'q4-campaign', label: 'Q4 Campaign' },
    { id: 'assets', label: 'Assets' },
  ];

  it('renders a breadcrumb navigation landmark with ordered list', () => {
    const { container } = render(<Breadcrumbs items={items} />);
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
    expect(container.querySelector('ol')).toBeInTheDocument();
  });

  it('marks only the last item as current page', () => {
    render(<Breadcrumbs items={items} />);
    expect(screen.getByText('Assets')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('Home')).not.toHaveAttribute('aria-current');
  });

  it('renders middle ellipsis controller when list exceeds maxVisibleItems', () => {
    const longItems = [
      { id: 'home', label: 'Home' },
      { id: 'workspace', label: 'Workspace' },
      { id: 'marketing', label: 'Marketing' },
      { id: 'campaigns', label: 'Campaigns' },
      { id: 'q4-campaign', label: 'Q4 Campaign' },
      { id: 'assets', label: 'Assets' },
    ];

    render(<Breadcrumbs items={longItems} maxVisibleItems={4} />);
    expect(screen.getByRole('button', { name: 'Show more breadcrumbs' })).toBeInTheDocument();
    expect(screen.queryByText('Marketing')).not.toBeInTheDocument();
  });

  it('expands hidden items after ellipsis is clicked', async () => {
    const user = userEvent.setup();
    const longItems = [
      { id: 'home', label: 'Home' },
      { id: 'workspace', label: 'Workspace' },
      { id: 'marketing', label: 'Marketing' },
      { id: 'campaigns', label: 'Campaigns' },
      { id: 'q4-campaign', label: 'Q4 Campaign' },
      { id: 'assets', label: 'Assets' },
    ];

    render(<Breadcrumbs items={longItems} maxVisibleItems={4} />);

    await user.click(screen.getByRole('button', { name: 'Show more breadcrumbs' }));
    expect(screen.getByText('Marketing')).toBeInTheDocument();
    expect(screen.getByText('Campaigns')).toBeInTheDocument();
  });

  it('calls onItemClick when a previous item button is clicked', async () => {
    const user = userEvent.setup();
    const onItemClick = vi.fn();

    render(<Breadcrumbs items={items} onItemClick={onItemClick} />);

    await user.click(screen.getByRole('button', { name: 'Projects' }));
    expect(onItemClick).toHaveBeenCalledTimes(1);
    expect(onItemClick).toHaveBeenCalledWith(expect.any(Object), items[1], 1);
  });

  describe('size="lg"', () => {
    const largeItems = [
      { id: 'products', label: 'Products' },
      { id: 'collections', label: 'Collections' },
      { id: 'summer-launch', label: 'Summer Launch' },
    ];

    it('applies the large modifier class', () => {
      render(<Breadcrumbs size="lg" items={largeItems} />);
      expect(screen.getByRole('navigation')).toHaveClass('dsn-breadcrumbs-large');
    });

    it('renders current item as page current text', () => {
      render(<Breadcrumbs size="lg" items={largeItems} />);
      expect(screen.getByText('Summer Launch').closest('[aria-current="page"]')).toBeInTheDocument();
    });

    it('renders previous items as buttons without disclosure by default', () => {
      render(<Breadcrumbs size="lg" items={largeItems} />);
      const productsBtn = screen.getByRole('button', { name: 'Products' });
      expect(productsBtn.querySelector('.dsn-breadcrumbs-large-disclosure')).not.toBeInTheDocument();
    });

    it('shows disclosure chevron only when showDisclosure is true', () => {
      render(
        <Breadcrumbs
          size="lg"
          items={[
            { id: 'products', label: 'Products', showDisclosure: true },
            { id: 'current', label: 'Current' },
          ]}
        />,
      );
      const productsBtn = screen.getByRole('button', { name: 'Products' });
      expect(productsBtn.querySelector('.dsn-breadcrumbs-large-disclosure')).toBeInTheDocument();
    });

    it('renders items with href as links', () => {
      render(
        <Breadcrumbs
          size="lg"
          items={[
            { id: 'projects', label: 'Projects', href: '/projects' },
            { id: 'current', label: 'Q4 Campaign' },
          ]}
        />,
      );
      expect(screen.getByRole('link', { name: 'Projects' })).toHaveAttribute('href', '/projects');
    });

    it('calls onItemClick for previous item', async () => {
      const user = userEvent.setup();
      const onItemClick = vi.fn();
      render(<Breadcrumbs size="lg" items={largeItems} onItemClick={onItemClick} />);
      await user.click(screen.getByRole('button', { name: 'Collections' }));
      expect(onItemClick).toHaveBeenCalledWith(expect.any(Object), largeItems[1], 1);
    });
  });
});
