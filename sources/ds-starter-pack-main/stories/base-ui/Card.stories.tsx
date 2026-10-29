import type { Meta, StoryObj } from '@storybook/react-vite';
import { SPECIMENS } from './components/specimens';
import { SpecMatrix } from './shared/SpecMatrix';
import { cardSpec } from './components/card/card.spec';

const meta = {
  title: 'Base UI/Components/Card',
  parameters: { layout: 'centered' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** A plan, with its title, description, body and action. */
export const Default: Story = { render: () => <>{SPECIMENS['card']({ type: 'outline' })}</> };

/** Every variant (Type). */
export const Matrix: Story = { render: () => <SpecMatrix spec={cardSpec} render={SPECIMENS['card']} />, parameters: { layout: 'padded' } };
