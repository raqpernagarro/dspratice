import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within, waitFor, screen } from 'storybook/test';
import { Menu, MenuPreview } from './components/menu/Menu';
import { menuItemSpec } from './components/menu/menu-item.spec';
import { SPECIMENS } from './components/specimens';
import { SpecMatrix } from './shared/SpecMatrix';

function MenuExample({ onItemClick }: { onItemClick?: (item: string) => void }) {
  const [shuffle, setShuffle] = React.useState(true);
  const [sort, setSort] = React.useState('date');
  return (
    <Menu.Root>
      <Menu.Trigger>Song</Menu.Trigger>
      <Menu.Popup>
        <Menu.Group>
          <Menu.GroupLabel>Library</Menu.GroupLabel>
          <Menu.Item onClick={() => onItemClick?.('Add to Library')}>Add to Library</Menu.Item>
          <Menu.Item onClick={() => onItemClick?.('Add to Playlist')}>Add to Playlist</Menu.Item>
          <Menu.SubmenuRoot>
            <Menu.SubmenuTrigger>Share</Menu.SubmenuTrigger>
            <Menu.Popup side="right" align="start" sideOffset={4}>
              <Menu.Item>Copy link</Menu.Item>
              <Menu.Item>Email</Menu.Item>
            </Menu.Popup>
          </Menu.SubmenuRoot>
          <Menu.Item disabled>Download</Menu.Item>
        </Menu.Group>
        <Menu.Separator />
        <Menu.CheckboxItem checked={shuffle} onCheckedChange={setShuffle}>
          Shuffle
        </Menu.CheckboxItem>
        <Menu.Separator />
        <Menu.Group>
          <Menu.GroupLabel>Sort by</Menu.GroupLabel>
          <Menu.RadioGroup value={sort} onValueChange={setSort}>
            <Menu.RadioItem value="date">Date added</Menu.RadioItem>
            <Menu.RadioItem value="title">Title</Menu.RadioItem>
          </Menu.RadioGroup>
        </Menu.Group>
      </Menu.Popup>
    </Menu.Root>
  );
}

const meta = {
  title: 'Base UI/Components/Menu',
  component: MenuExample,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof MenuExample>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Items, a submenu, a disabled item, a checkbox item and a radio group. */
export const Default: Story = {};

/** The popup as designed in Figma (static). */
export const Popup: Story = {
  render: () => <MenuPreview />,
};

/** Every Menu Item variant (Type × State × Checked), drawn statically. */
export const ItemMatrix: Story = {
  render: () => <SpecMatrix spec={menuItemSpec} render={SPECIMENS['menu-item']} />,
  parameters: { layout: 'padded' },
};

/* ------------------------------------------------------------ behavior tests */

/** Behavior test: ArrowDown moves the highlight, Enter runs the item and closes the menu. */
export const KeyboardRunsItem: Story = {
  args: { onItemClick: fn() },
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Song' }));
    const menu = await screen.findByRole('menu');
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(within(menu).getByRole('menuitem', { name: 'Add to Library' })).toHaveAttribute('data-highlighted'));
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(within(menu).getByRole('menuitem', { name: 'Add to Playlist' })).toHaveAttribute('data-highlighted'));
    await userEvent.keyboard('{Enter}');
    await expect(args.onItemClick).toHaveBeenCalledWith('Add to Playlist');
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
  },
};
