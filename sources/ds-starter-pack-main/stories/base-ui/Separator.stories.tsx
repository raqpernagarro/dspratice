import type { Meta, StoryObj } from '@storybook/react-vite';
import { SpecMatrix } from './shared/SpecMatrix';
import { separatorSpec } from './components/separator/separator.spec';
import { SPECIMENS } from './components/specimens';

const meta = {
  title: 'Base UI/Components/Separator',
  parameters: { layout: 'centered' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Horizontal between blocks, vertical inside a row. */
export const Default: Story = { render: () => <>{SPECIMENS['separator']({})}</> };

/** Both orientations. */
export const Matrix: Story = {
  render: () => <SpecMatrix spec={separatorSpec} render={SPECIMENS['separator']} />,
  parameters: { layout: 'padded' },
};
