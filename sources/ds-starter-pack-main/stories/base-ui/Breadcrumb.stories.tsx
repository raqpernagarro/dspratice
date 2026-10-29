import type { Meta, StoryObj } from '@storybook/react-vite';
import { SPECIMENS } from './components/specimens';
import { SpecMatrix } from './shared/SpecMatrix';
import { breadcrumbItemSpec } from './components/breadcrumb/breadcrumb-item.spec';

const meta = {
  title: 'Base UI/Components/Breadcrumb',
  parameters: { layout: 'centered' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Three levels: two links, then the current page. */
export const Default: Story = { render: () => <>{SPECIMENS['breadcrumb']({})}</> };

/** Every Breadcrumb Item variant (State). */
export const ItemMatrix: Story = { render: () => <SpecMatrix spec={breadcrumbItemSpec} render={SPECIMENS['breadcrumb-item']} />, parameters: { layout: 'padded' } };
