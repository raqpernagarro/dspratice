import type { Meta, StoryObj } from '@storybook/react-vite';
import { CspProviderDemo } from './demos';

const meta = {
  title: 'Base UI/Utils/CSP Provider',
  component: CspProviderDemo,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof CspProviderDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
