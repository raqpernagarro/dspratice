import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../../atoms/Button';
import { Toast, type ToastProps } from './Toast';
import spec from './Toast.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

function ToastStoryPreview(args: ToastProps) {
  const [show, setShow] = useState(false);

  return (
    <div>
      <Button variant="secondary" size="md" onClick={() => setShow(true)} disabled={show}>
        Show toast
      </Button>
      {show ? <Toast {...args} onDismiss={() => setShow(false)} /> : null}
    </div>
  );
}

const meta: Meta<typeof Toast> = {
  title: 'Feedback/Toast',
  component: Toast,
  tags: ['autodocs'],
  parameters: { ...specDocsParameters(spec), storyWidth: 'container' },
  render: (args) => <ToastStoryPreview {...args} />,
  argTypes: {
    variant: {
      control: 'select',
      options: ['inline', 'rich'],
    },
    severity: {
      control: 'select',
      options: ['default', 'success', 'warning', 'error'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Toast>;

export const Playground: Story = {
  args: {
    variant: 'inline',
    severity: 'default',
    title: 'Title',
    actionLabel: 'Button',
  },
};

export const Rich: Story = {
  args: {
    variant: 'rich',
    severity: 'default',
    title: 'Changes saved',
    description: 'Your settings were updated and are now active.',
    actionLabel: 'View details',
  },
};

// ─── All versions ─────────────────────────────────────────────────────────────
// autoDismiss={false} keeps every toast visible for the showcase.

export const Variants: Story = {
  parameters: { layout: 'padded' },
  render: () => (
    <>
      {/* Override fixed positioning so toasts flow inside the flex layout */}
      <style>{`
        .dsn-toast-showcase .dsn-toast {
          position: static;
          transform: none;
          width: min(480px, 100%);
          max-width: 480px;
          min-width: 0;
        }
      `}</style>

      <div
        className="dsn-toast-showcase"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-xs)',
          width: '100%',
        }}
      >
        <Toast
          variant="rich"
          autoDismiss={false}
          severity="default"
          title="Export ready"
          description="Your report has been generated and is ready to download."
          actionLabel="Download"
        />
        <Toast
          variant="rich"
          autoDismiss={false}
          severity="success"
          title="Changes saved"
          description="Your settings were updated and are now active."
          actionLabel="View"
        />
        <Toast
          variant="rich"
          autoDismiss={false}
          severity="warning"
          title="Session expiring soon"
          description="You'll be signed out in 5 minutes. Save your work to avoid losing changes."
          actionLabel="Stay signed in"
        />
        <Toast
          variant="rich"
          autoDismiss={false}
          severity="error"
          title="Couldn't save changes"
          description="Check your connection and try again. Your unsaved changes are still here."
          actionLabel="Retry"
        />
      </div>
    </>
  ),
};
