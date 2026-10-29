import type { Meta, StoryObj } from '@storybook/react-vite';
import { UseRenderDemo } from './demos';

const meta = {
  title: 'Base UI/Utils/useRender',
  component: UseRenderDemo,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof UseRenderDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
