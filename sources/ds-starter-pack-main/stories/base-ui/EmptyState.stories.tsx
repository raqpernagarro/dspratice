import type { Meta, StoryObj } from '@storybook/react-vite';
import { SPECIMENS } from './components/specimens';
import { SpecMatrix } from './shared/SpecMatrix';
import { emptyStateSpec } from './components/empty-state/empty-state.spec';

const meta = {
  title: 'Base UI/Components/Empty State',
  parameters: { layout: 'centered' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** An empty project list, with the action that fills it. */
export const Default: Story = { render: () => <>{SPECIMENS['empty-state']({})}</> };

/** Every variant. */
export const Matrix: Story = { render: () => <SpecMatrix spec={emptyStateSpec} render={SPECIMENS['empty-state']} />, parameters: { layout: 'padded' } };
