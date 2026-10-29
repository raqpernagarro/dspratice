import type { Meta, StoryObj } from '@storybook/react-vite';
import { Form } from './components/form/Form';
import { SPECIMENS } from './components/specimens';

const meta = {
  title: 'Base UI/Components/Form',
  component: Form,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Form>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Submit with an invalid email to see validation. */
export const Default: Story = { args: {}, render: () => <>{SPECIMENS['form']({})}</> };


