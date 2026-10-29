import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, screen } from 'storybook/test';
import { Dialog, DialogPreview } from './components/dialog/Dialog';

function DialogExample() {
  return (
    <Dialog.Root>
      <Dialog.Trigger>View notifications</Dialog.Trigger>
      <Dialog.Popup>
        <Dialog.Header>
          <Dialog.Title>Notifications</Dialog.Title>
          <Dialog.Description>You are all caught up. Good job!</Dialog.Description>
        </Dialog.Header>
        <Dialog.Actions>
          <Dialog.Close>Close</Dialog.Close>
        </Dialog.Actions>
      </Dialog.Popup>
    </Dialog.Root>
  );
}

const meta = {
  title: 'Base UI/Components/Dialog',
  component: DialogExample,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof DialogExample>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Escape, a click on the backdrop or Close dismisses it. */
export const Default: Story = {};

/** The popup as designed in Figma (static). */
export const Preview: Story = { render: () => <DialogPreview /> };

/* ------------------------------------------------------------ behavior tests */

/** Behavior test: the trigger opens it and focus moves inside; Escape closes it and focus returns. */
export const OpenAndEscape: Story = {
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'View notifications' });
    await userEvent.click(trigger);
    const dialog = await screen.findByRole('dialog', { name: 'Notifications' });
    await waitFor(() => expect(dialog).toContainElement(document.activeElement as HTMLElement));
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};
