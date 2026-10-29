import type { Meta, StoryObj } from '@storybook/react-vite';
import { Heart } from '@phosphor-icons/react';
import { Toggle } from './components/toggle/Toggle';
import { toggleSpec } from './components/toggle/toggle.spec';
import { SPECIMENS } from './components/specimens';
import { SpecMatrix } from './shared/SpecMatrix';

const meta = {
  title: 'Base UI/Components/Toggle',
  component: Toggle,
  parameters: { layout: 'centered' },
  argTypes: { size: { control: 'select', options: ['sm', 'md', 'lg'] }, disabled: { control: 'boolean' }, icon: { control: false } },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Click it: the heart switches from a line to a filled icon. */
export const Default: Story = { args: { icon: Heart, label: 'Favorite', size: 'md', disabled: false } };

/** Every Figma variant (Selected × Size × State), states shown statically. */
export const Matrix: Story = {
  args: { icon: Heart, label: 'Favorite' },
  render: () => <SpecMatrix spec={toggleSpec} render={SPECIMENS['toggle']} />,
  parameters: { layout: 'padded' },
};
