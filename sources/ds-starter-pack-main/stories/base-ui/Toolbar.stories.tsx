import type { Meta, StoryObj } from '@storybook/react-vite';
import { SPECIMENS } from './components/specimens';

const meta = {
  title: 'Base UI/Components/Toolbar',
  parameters: { layout: 'centered' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Tab into it once, then use the arrow keys. */
export const Default: Story = { render: () => <>{SPECIMENS['toolbar']({})}</> };
