import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from '../../atoms/Button';
import { Drawer, type DrawerProps } from './Drawer';
import spec from './Drawer.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

const contentSlot = (
  <div
    style={{
      width: '100%',
      minHeight: 320,
      border: '1px dashed var(--color-border-neutral-secondary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--color-foreground-neutral-tertiary)',
      boxSizing: 'border-box',
      padding: 'var(--space-md)',
    }}
  >
    Content slot
  </div>
);

const meta: Meta<typeof Drawer> = {
  title: 'Overlays/Drawer',
  component: Drawer,
  tags: ['autodocs'],
  parameters: specDocsParameters(spec, { iframeHeight: 560 }),
  args: {
    variant: 'overlay',
    placement: 'right',
    title: 'Title',
    showHeader: true,
    showCloseButton: true,
    showToggle: true,
    showBottomBar: true,
    closeOnEscape: true,
    closeOnOverlayClick: true,
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['overlay', 'stacked'] },
    placement: { control: 'inline-radio', options: ['left', 'right'] },
    headerSize: { control: 'select', options: ['xsmall', 'small', 'medium', 'large'] },
    bottomBarSize: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    showHeader: { control: 'boolean' },
    showCloseButton: { control: 'boolean' },
    showToggle: { control: 'boolean' },
    showBottomBar: { control: 'boolean' },
    closeOnEscape: { control: 'boolean' },
    closeOnOverlayClick: { control: 'boolean' },
    open: { table: { disable: true } },
    defaultOpen: { table: { disable: true } },
    toggleChecked: { table: { disable: true } },
  },
  render: (args) => <DrawerDemo {...args} />,
};

export default meta;
type Story = StoryObj<typeof Drawer>;

/**
 * `overlay` opens on load over the page (the button reopens it). `stacked` sits beside the
 * page content and pushes it aside.
 */
function DrawerDemo(args: DrawerProps) {
  const [open, setOpen] = useState(true);
  const [toggle, setToggle] = useState(false);
  const drawer = (
    <Drawer
      {...args}
      width={args.variant === 'stacked' ? 320 : args.width}
      open={open}
      onOpenChange={setOpen}
      toggleChecked={toggle}
      onToggleChange={setToggle}
      onCancel={() => setOpen(false)}
      onConfirm={() => setOpen(false)}
    >
      {contentSlot}
    </Drawer>
  );
  if (args.variant === 'stacked') {
    const page = <div style={{ flex: 1, padding: 'var(--space-md)' }}>Main page/layout content area</div>;
    return (
      <div style={{ display: 'flex', height: 520, border: '1px solid var(--color-border-neutral-primary)' }}>
        {args.placement === 'left' ? <>{drawer}{page}</> : <>{page}{drawer}</>}
      </div>
    );
  }
  return (
    <div>
      <Button variant="primary" size="md" onClick={() => setOpen(true)}>
        Open drawer
      </Button>
      {drawer}
    </div>
  );
}

export const Playground: Story = {};

/** Inline beside the page content, for persistent side panels. */
export const Stacked: Story = {
  args: { variant: 'stacked' },
};
