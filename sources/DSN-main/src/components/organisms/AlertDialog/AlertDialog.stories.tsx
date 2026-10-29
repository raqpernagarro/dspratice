import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from '../../atoms/Button';
import { AlertDialog, type AlertDialogProps } from './AlertDialog';
import spec from './AlertDialog.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

const meta: Meta<typeof AlertDialog> = {
  title: 'Overlays/Alert Dialog',
  component: AlertDialog,
  tags: ['autodocs'],
  parameters: specDocsParameters(spec, { iframeHeight: 400 }),
  args: {
    variant: 'default',
    title: 'Title',
    message: 'Message',
    requireAcknowledgement: false,
    acknowledgementLabel: 'Confirm',
    closeOnEscape: true,
    closeOnOverlayClick: true,
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['default', 'danger'] },
    requireAcknowledgement: { control: 'boolean' },
    closeOnEscape: { control: 'boolean' },
    closeOnOverlayClick: { control: 'boolean' },
    open: { table: { disable: true } },
    defaultOpen: { table: { disable: true } },
    acknowledgementChecked: { table: { disable: true } },
    defaultAcknowledgementChecked: { table: { disable: true } },
  },
  render: (args) => <AlertDialogDemo {...args} />,
};

export default meta;
type Story = StoryObj<typeof AlertDialog>;

/** Opens on load so the Playground shows the dialog; the button reopens it after closing. */
function AlertDialogDemo(args: AlertDialogProps) {
  const [open, setOpen] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  return (
    <div>
      <Button variant="secondary" size="md" destructive={args.variant === 'danger'} onClick={() => setOpen(true)}>
        Open alert dialog
      </Button>
      <AlertDialog
        {...args}
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setConfirmed(false);
        }}
        acknowledgementChecked={confirmed}
        onAcknowledgementChange={setConfirmed}
        onCancel={() => setOpen(false)}
        onConfirm={() => setOpen(false)}
      />
    </div>
  );
}

export const Playground: Story = {};

/** Irreversible actions: `danger` styling, and Confirm stays disabled until the checkbox is ticked. */
export const DangerWithAcknowledgement: Story = {
  args: { variant: 'danger', requireAcknowledgement: true, confirmLabel: 'Delete' },
};
