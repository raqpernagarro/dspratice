import type { Meta, StoryObj } from '@storybook/react-vite';
import { SPECIMENS } from './components/specimens';
import { SpecMatrix } from './shared/SpecMatrix';
import { accordionItemSpec } from './components/accordion/accordion-item.spec';

const meta = {
  title: 'Base UI/Components/Accordion',
  parameters: { layout: 'centered' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** The first item starts open; one item open at a time. */
export const Default: Story = { render: () => <>{SPECIMENS['accordion']({})}</> };

/** Every Accordion Item variant (Open × State). */
export const ItemMatrix: Story = { render: () => <SpecMatrix spec={accordionItemSpec} render={SPECIMENS['accordion-item']} />, parameters: { layout: 'padded' } };
