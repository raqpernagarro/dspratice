import type { Meta, StoryObj } from '@storybook/react-vite';
import { SPECIMENS } from './components/specimens';
import { SpecMatrix } from './shared/SpecMatrix';
import { collapsibleSpec } from './components/collapsible/collapsible.spec';
import { Collapsible } from './components/collapsible/Collapsible';

const meta = {
  title: 'Base UI/Components/Collapsible',
  parameters: { layout: 'centered' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Click the trigger. */
export const Default: Story = { render: () => (
    <div style={{ width: 220 }}>
      <Collapsible label="Recovery keys">
        <div>alien-bean-pasta</div>
        <div>wild-irish-burrito</div>
        <div>horse-battery-staple</div>
      </Collapsible>
    </div>
  ) };

/** Every variant (Open × State). */
export const Matrix: Story = { render: () => <SpecMatrix spec={collapsibleSpec} render={SPECIMENS['collapsible']} />, parameters: { layout: 'padded' } };
