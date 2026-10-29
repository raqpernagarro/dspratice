import type { Meta, StoryObj } from '@storybook/react-vite';
import { Stat } from './Stat';
import spec from './Stat.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

const meta: Meta<typeof Stat> = {
  title: 'Data Display/Stat',
  component: Stat,
  tags: ['autodocs'],
  parameters: specDocsParameters(spec),
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'card'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Stat>;

export const Playground: Story = {
  args: {
    title: 'Title',
    value: '1234',
    variant: 'default',
  },
};

export const Card: Story = {
  args: {
    title: 'Title',
    value: '1234',
    variant: 'card',
  },
};

export const NeutralExamples: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <Stat title="Revenue" value="1234" />
      <Stat title="Revenue" value="1234" variant="card" />
    </div>
  ),
};
