import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from '../../atoms/Button';
import { Modal, type ModalProps } from './Modal';
import spec from './Modal.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

const meta: Meta<typeof Modal> = {
  title: 'Overlays/Modal',
  component: Modal,
  tags: ['autodocs'],
  parameters: specDocsParameters(spec, { iframeHeight: 480 }),
  args: {
    title: 'Title',
    showHeader: true,
    headerSize: 'large',
    showCloseButton: true,
    showBottomBar: true,
    bottomBarSize: 'lg',
    closeOnEscape: true,
    closeOnOverlayClick: true,
  },
  argTypes: {
    headerSize: { control: 'select', options: ['xsmall', 'small', 'medium', 'large'] },
    bottomBarSize: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    showHeader: { control: 'boolean' },
    showCloseButton: { control: 'boolean' },
    showBottomBar: { control: 'boolean' },
    closeOnEscape: { control: 'boolean' },
    closeOnOverlayClick: { control: 'boolean' },
    open: { table: { disable: true } },
    defaultOpen: { table: { disable: true } },
  },
  render: (args) => <ModalDemo {...args} />,
};

export default meta;
type Story = StoryObj<typeof Modal>;

/** Opens on load so the Playground shows the dialog; the button reopens it after closing. */
function ModalDemo({ children, ...args }: ModalProps) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <Button variant="primary" size="md" onClick={() => setOpen(true)}>
        Open modal
      </Button>
      <Modal {...args} open={open} onOpenChange={setOpen} onCancel={() => setOpen(false)} onConfirm={() => setOpen(false)}>
        {children ?? (
          <div
            style={{
              width: '100%',
              padding: 'var(--space-md)',
              border: '1px dashed var(--color-border-neutral-secondary)',
              color: 'var(--color-foreground-neutral-tertiary)',
              textAlign: 'center',
              boxSizing: 'border-box',
            }}
          >
            Content slot
          </div>
        )}
      </Modal>
    </div>
  );
}

export const Playground: Story = {};

/** Content only — no Cancel / Confirm bar. Close with the header button or Escape. */
export const WithoutBottomBar: Story = {
  args: { showBottomBar: false },
};
