import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Pagination } from './components/pagination/Pagination';
import { SPECIMENS } from './components/specimens';
import { SpecMatrix } from './shared/SpecMatrix';
import { paginationSpec } from './components/pagination/pagination.spec';

const meta = {
  title: 'Base UI/Components/Pagination',
  parameters: { layout: 'centered' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Ten pages, on page 5: the first and last page, the current one with a neighbour on each side, and ellipses for the rest. */
export const Default: Story = { render: () => <Pagination pageCount={10} defaultPage={5} /> };

/** Every variant (Size). */
export const Matrix: Story = { render: () => <SpecMatrix spec={paginationSpec} render={SPECIMENS['pagination']} />, parameters: { layout: 'padded' } };

/* behavior tests */

/** Next moves to page 6; the last page disables Next. */
export const NextAndLast: Story = {
  render: () => <Pagination pageCount={10} defaultPage={5} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Next page' }));
    await expect(canvas.getByRole('button', { name: 'Page 6' })).toHaveAttribute('aria-current', 'page');
    await userEvent.click(canvas.getByRole('button', { name: 'Page 10' }));
    await expect(canvas.getByRole('button', { name: 'Next page' })).toBeDisabled();
  },
};
