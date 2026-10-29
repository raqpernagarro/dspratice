import type { Meta, StoryObj } from '@storybook/react-vite';
import { DirectionProviderDemo } from './demos';

const meta = {
  title: 'Base UI/Utils/Direction Provider',
  component: DirectionProviderDemo,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof DirectionProviderDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
