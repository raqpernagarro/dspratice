import type { Meta, StoryObj } from '@storybook/react-vite';
import { AlertDialog, AlertDialogPreview } from './components/alert-dialog/AlertDialog';

function AlertDialogExample() {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger destructive variant="ghost">
        Discard draft
      </AlertDialog.Trigger>
      <AlertDialog.Popup>
        <AlertDialog.Header>
          <AlertDialog.Title>Discard draft?</AlertDialog.Title>
          <AlertDialog.Description>You can’t undo this action.</AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Actions>
          <AlertDialog.Close>Cancel</AlertDialog.Close>
          <AlertDialog.Close variant="primary" destructive>
            Discard
          </AlertDialog.Close>
        </AlertDialog.Actions>
      </AlertDialog.Popup>
    </AlertDialog.Root>
  );
}

const meta = {
  title: 'Base UI/Components/Alert Dialog',
  component: AlertDialogExample,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof AlertDialogExample>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Clicking the backdrop doesn’t close it: the user has to answer. */
export const Default: Story = {};

/** The popup as designed in Figma (static). */
export const Preview: Story = { render: () => <AlertDialogPreview /> };
