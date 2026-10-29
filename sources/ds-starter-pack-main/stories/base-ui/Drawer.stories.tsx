import type { Meta, StoryObj } from '@storybook/react-vite';
import { SpecMatrix } from './shared/SpecMatrix';
import { drawerSpec } from './components/drawer/drawer.spec';
import { SPECIMENS } from './components/specimens';
import { Drawer, DrawerPreview } from './components/drawer/Drawer';

function DrawerExample() {
  return (
    <Drawer.Root>
      <Drawer.Trigger>Open filters</Drawer.Trigger>
      <Drawer.Popup>
        <Drawer.Header>
          <Drawer.Title>Filters</Drawer.Title>
          <Drawer.Description>Narrow the list down. Swipe right or press Escape to close.</Drawer.Description>
        </Drawer.Header>
        <Drawer.Actions>
          <Drawer.Close>Close</Drawer.Close>
        </Drawer.Actions>
      </Drawer.Popup>
    </Drawer.Root>
  );
}

const meta = {
  title: 'Base UI/Components/Drawer',
  component: DrawerExample,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof DrawerExample>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Slides in from the right; swipe it back, press Escape or click the backdrop. */
export const Default: Story = {};

/** The panel as designed in Figma (static). */
export const Preview: Story = { render: () => <DrawerPreview /> };

/** Every Side. */
export const Matrix: Story = {
  render: () => <SpecMatrix spec={drawerSpec} render={SPECIMENS['drawer']} />,
  parameters: { layout: 'padded' },
};
