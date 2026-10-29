import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Navbar } from './Navbar';

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  });
}

afterEach(() => {
  setViewportWidth(1024);
});

describe('Navbar', () => {
  it('renders title variant by default', () => {
    render(<Navbar title="Project settings" />);
    expect(screen.getByRole('heading', { name: 'Project settings' })).toBeInTheDocument();
  });

  it('does not render arrow controls by default', () => {
    render(<Navbar title="Title" />);
    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Forward' })).not.toBeInTheDocument();
  });

  it('renders optional description row', () => {
    render(<Navbar title="Title" showDescription description="Description" />);
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('renders breadcrumb variant using current-page semantics', () => {
    render(
      <Navbar
        variant="breadcrumbs"
        breadcrumbItems={[
          { id: 'home', label: 'Home', showDisclosure: false },
          { id: 'current', label: 'Assets', variant: 'current' },
        ]}
      />,
    );

    expect(screen.getByLabelText('Page breadcrumb')).toBeInTheDocument();
    expect(screen.getByText('Assets').closest('[aria-current="page"]')).toBeInTheDocument();
  });

  it('switches to back-only mode at <=640px and triggers back callback', async () => {
    const user = userEvent.setup();
    const onBackClick = vi.fn();

    setViewportWidth(640);
    render(
      <Navbar
        variant="breadcrumbs"
        onBackClick={onBackClick}
        breadcrumbItems={[
          { id: 'home', label: 'Home', showDisclosure: false },
          { id: 'current', label: 'Assets', variant: 'current' },
        ]}
      />,
    );

    expect(screen.queryByLabelText('Page breadcrumb')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Assets' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(onBackClick).toHaveBeenCalledTimes(1);
  });

  it('keeps breadcrumb mode above breakpoint and truncates long trails', () => {
    setViewportWidth(700);
    render(
      <Navbar
        variant="breadcrumbs"
        breadcrumbItems={[
          { id: 'root', label: 'Workspace', showDisclosure: false },
          { id: 'a', label: 'Design Systems', showDisclosure: false },
          { id: 'b', label: 'Component Library', showDisclosure: false },
          { id: 'c', label: 'Navigation', showDisclosure: false },
          { id: 'd', label: 'Navbar', showDisclosure: false },
          { id: 'current', label: 'Settings', variant: 'current' },
        ]}
      />,
    );

    expect(screen.getByLabelText('Page breadcrumb')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show more breadcrumbs' })).toBeInTheDocument();
  });
});
