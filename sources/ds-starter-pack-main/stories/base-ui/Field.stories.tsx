import type { Meta, StoryObj } from '@storybook/react-vite';
import { Field } from './components/field/Field';
import { fieldSpec } from './components/field/field.spec';
import { SPECIMENS } from './components/specimens';
import { SpecMatrix } from './shared/SpecMatrix';
import { Input } from './components/input/Input';

const meta = {
  title: 'Base UI/Components/Field',
  component: Field,
  parameters: { layout: 'centered' },
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    invalid: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: 'Name', description: 'Visible on your profile', error: 'Please enter your name', size: 'md', children: null },
  render: (args) => (
    <Field {...args}>
      <Input required placeholder="Required" />
    </Field>
  ),
};

/** Every Figma variant (Size × Invalid). */
export const Matrix: Story = {
  args: { label: '', children: null },
  render: () => <SpecMatrix spec={fieldSpec} render={SPECIMENS['field']} columns="invalid" />,
  parameters: { layout: 'padded' },
};
