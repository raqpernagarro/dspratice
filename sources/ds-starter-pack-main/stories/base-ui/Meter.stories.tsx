import type { Meta, StoryObj } from '@storybook/react-vite';
import { SpecMatrix } from './shared/SpecMatrix';
import { meterSpec } from './components/meter/meter.spec';
import { SPECIMENS } from './components/specimens';

const meta = {
  title: 'Base UI/Components/Meter',
  parameters: { layout: 'centered' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Storage used: 64%. */
export const Default: Story = { render: () => <>{SPECIMENS['meter']({})}</> };

/** Every Value step. */
export const Matrix: Story = {
  render: () => <SpecMatrix spec={meterSpec} render={SPECIMENS['meter']} />,
  parameters: { layout: 'padded' },
};
