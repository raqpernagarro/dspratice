import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Drawer } from './Drawer';

describe('Drawer', () => {
  it('renders overlay drawer as dialog', () => {
    render(
      <Drawer variant="overlay" open title="Filters">
        <div>Body</div>
      </Drawer>,
    );

    expect(screen.getByRole('dialog', { name: 'Filters' })).toBeInTheDocument();
  });

  it('closes overlay via close button', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Drawer variant="overlay" open title="Filters" onOpenChange={onOpenChange}>
        <div>Body</div>
      </Drawer>,
    );

    await user.click(screen.getByRole('button', { name: 'Close drawer' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('closes overlay via escape', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Drawer variant="overlay" open title="Filters" onOpenChange={onOpenChange}>
        <div>Body</div>
      </Drawer>,
    );

    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('renders stacked drawer as complementary landmark', () => {
    render(
      <Drawer variant="stacked" open title="Stacked">
        <div>Body</div>
      </Drawer>,
    );

    expect(screen.getByRole('complementary', { name: 'Stacked' })).toBeInTheDocument();
  });
});
