import type { Meta, StoryObj } from '@storybook/react-vite';
import { ContextMenu } from './components/context-menu/ContextMenu';

function ContextMenuExample() {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger
        style={{
          display: 'grid',
          placeItems: 'center',
          width: 280,
          height: 160,
          border: '1px dashed var(--color-border-neutral-regular)',
          borderRadius: 'var(--shape-radius-md)',
          color: 'var(--color-foreground-neutral-secondary)',
        }}
      >
        Right-click here
      </ContextMenu.Trigger>
      <ContextMenu.Popup>
        <ContextMenu.Item>Add to Library</ContextMenu.Item>
        <ContextMenu.Item>Add to Playlist</ContextMenu.Item>
        <ContextMenu.Separator />
        <ContextMenu.Item>Play Next</ContextMenu.Item>
        <ContextMenu.Item>Play Last</ContextMenu.Item>
        <ContextMenu.Separator />
        <ContextMenu.Item>Favorite</ContextMenu.Item>
        <ContextMenu.Item disabled>Share</ContextMenu.Item>
      </ContextMenu.Popup>
    </ContextMenu.Root>
  );
}

const meta = {
  title: 'Base UI/Components/Context Menu',
  component: ContextMenuExample,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof ContextMenuExample>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Right-click (or long-press) the area. The menu is Menu’s popup and items. */
export const Default: Story = {};
