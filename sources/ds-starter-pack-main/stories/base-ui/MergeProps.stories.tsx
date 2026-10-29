import type { Meta, StoryObj } from '@storybook/react-vite';
import { MergePropsDemo } from './demos';

const meta = {
  title: 'Base UI/Utils/mergeProps',
  component: MergePropsDemo,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof MergePropsDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
