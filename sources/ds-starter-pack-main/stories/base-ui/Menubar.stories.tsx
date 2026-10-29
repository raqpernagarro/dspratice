import type { Meta, StoryObj } from '@storybook/react-vite';
import { Menu } from './components/menu/Menu';
import { Menubar, MenubarPreview } from './components/menubar/Menubar';
import { menubarItemSpec } from './components/menubar/menubar-item.spec';
import { SPECIMENS } from './components/specimens';
import { SpecMatrix } from './shared/SpecMatrix';

const menus = {
  File: ['New', 'Open', 'Save', null, 'Print'],
  Edit: ['Cut', 'Copy', 'Paste'],
  View: ['Zoom in', 'Zoom out', null, 'Full screen'],
};

function MenubarExample() {
  return (
    <Menubar.Root>
      {Object.entries(menus).map(([name, items]) => (
        <Menu.Root key={name}>
          <Menubar.Trigger>{name}</Menubar.Trigger>
          <Menu.Popup sideOffset={6}>
            {items.map((item, i) => (item ? <Menu.Item key={item}>{item}</Menu.Item> : <Menu.Separator key={i} />))}
          </Menu.Popup>
        </Menu.Root>
      ))}
      <Menu.Root disabled>
        <Menubar.Trigger disabled>Help</Menubar.Trigger>
      </Menu.Root>
    </Menubar.Root>
  );
}

const meta = {
  title: 'Base UI/Components/Menubar',
  component: MenubarExample,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof MenubarExample>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Open a menu, then move the pointer (or the arrow keys) along the bar. */
export const Default: Story = {};

/** The bar as designed in Figma (static). */
export const Preview: Story = { render: () => <MenubarPreview /> };

/** Every Menubar Item variant. */
export const ItemMatrix: Story = {
  render: () => <SpecMatrix spec={menubarItemSpec} render={SPECIMENS['menubar-item']} />,
  parameters: { layout: 'padded' },
};
