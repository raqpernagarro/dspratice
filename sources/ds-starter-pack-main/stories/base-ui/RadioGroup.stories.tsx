import type { Meta, StoryObj } from '@storybook/react-vite';
import { Radio } from './components/radio/Radio';
import { radioSpec } from './components/radio/radio.spec';
import { RadioGroup } from './components/radio-group/RadioGroup';
import { radioGroupSpec } from './components/radio-group/radio-group.spec';
import { SPECIMENS } from './components/specimens';
import { SpecMatrix } from './shared/SpecMatrix';

const meta = {
  title: 'Base UI/Components/Radio Group',
  component: RadioGroup,
  parameters: { layout: 'centered' },
  argTypes: { size: { control: 'select', options: ['sm', 'md', 'lg'] }, disabled: { control: 'boolean' } },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: 'Best apple', size: 'md', defaultValue: 'fuji-apple' },
  render: (args) => (
    <RadioGroup {...args}>
      <Radio value="fuji-apple">Fuji</Radio>
      <Radio value="gala-apple">Gala</Radio>
      <Radio value="granny-smith-apple">Granny Smith</Radio>
    </RadioGroup>
  ),
};

/** Every Radio Group variant (Size). */
export const GroupMatrix: Story = {
  args: {},
  render: () => <SpecMatrix spec={radioGroupSpec} render={SPECIMENS['radio-group']} sections={[]} columns="size" />,
  parameters: { layout: 'padded' },
};

/** Every Radio variant (Checked × Size × State), states shown statically. */
export const RadioMatrix: Story = {
  args: {},
  render: () => <SpecMatrix spec={radioSpec} render={SPECIMENS['radio']} />,
  parameters: { layout: 'padded' },
};
