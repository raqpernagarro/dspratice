import type { Meta, StoryObj } from '@storybook/react-vite';
import { SpecMatrix } from './shared/SpecMatrix';
import { popoverSpec } from './components/popover/popover.spec';
import { SPECIMENS } from './components/specimens';
import { Popover, PopoverPreview } from './components/popover/Popover';

function PopoverExample() {
  return (
    <Popover.Root>
      <Popover.Trigger>Notifications</Popover.Trigger>
      <Popover.Popup>
        <Popover.Title>Notifications</Popover.Title>
        <Popover.Description>You are all caught up. Good job!</Popover.Description>
      </Popover.Popup>
    </Popover.Root>
  );
}

const meta = {
  title: 'Base UI/Components/Popover',
  component: PopoverExample,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof PopoverExample>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Click the button; Escape or a click outside closes it. */
export const Default: Story = {};

/** The popup as designed in Figma (static). */
export const Preview: Story = { render: () => <PopoverPreview /> };

/** Every Side (the arrow faces the trigger). */
export const Matrix: Story = {
  render: () => <SpecMatrix spec={popoverSpec} render={SPECIMENS['popover']} />,
  parameters: { layout: 'padded' },
};
