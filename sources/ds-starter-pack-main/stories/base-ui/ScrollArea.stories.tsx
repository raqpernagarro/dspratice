import type { Meta, StoryObj } from '@storybook/react-vite';
import { SPECIMENS } from './components/specimens';

const meta = {
  title: 'Base UI/Components/Scroll Area',
  parameters: { layout: 'centered' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Hover or scroll to show the scrollbar. */
export const Default: Story = { render: () => <>{SPECIMENS['scroll-area']({})}</> };
