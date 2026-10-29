import type { Meta, StoryObj } from '@storybook/react-vite';
import { Fieldset } from './components/fieldset/Fieldset';
import { fieldsetSpec } from './components/fieldset/fieldset.spec';
import { SPECIMENS } from './components/specimens';
import { SpecMatrix } from './shared/SpecMatrix';

const meta = {
  title: 'Base UI/Components/Fieldset',
  component: Fieldset,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Fieldset>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { legend: 'Billing details' }, render: () => <>{SPECIMENS['fieldset']({ size: 'md' })}</> };

/** Every Figma variant (Size). */
export const Matrix: Story = {
  args: { legend: '' },
  render: () => <SpecMatrix spec={fieldsetSpec} render={SPECIMENS['fieldset']} sections={[]} columns="size" />,
  parameters: { layout: 'padded' },
};
