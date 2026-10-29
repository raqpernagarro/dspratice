import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SplitButton } from './SplitButton';
import { PopoverMenu } from '../../../organisms/PopoverMenu';
import spec from './SplitButton.spec.md?raw';
import { specDocsParameters } from '../../../../docs/stripSpecTitle';
import { PlaceholderIcon } from '../../_dev/PlaceholderIcon';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<typeof SplitButton> = {
  title: 'Actions/Button Group/Split Button',
  component: SplitButton,
  tags: ['autodocs'],
  parameters: specDocsParameters(spec),
  argTypes: {
    variant: {
      control: 'select',
      options: ['secondary', 'primary'],
      description: 'Visual hierarchy variant. Applied to both button segments.',
      table: { defaultValue: { summary: 'secondary' } },
    },
    size: {
      control: 'select',
      options: ['md', 'sm'],
      description: '`md` = 32 px (default). `sm` = 24 px for dense layouts.',
      table: { defaultValue: { summary: 'md' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Disables both button segments.',
      table: { defaultValue: { summary: 'false' } },
    },
    loading: {
      control: 'boolean',
      description: 'Loading state on the main button; trigger is also disabled while loading.',
      table: { defaultValue: { summary: 'false' } },
    },
    children: {
      control: 'text',
      description: 'Label text for the main action button.',
    },
    open: {
      control: 'boolean',
      description: 'Open state of the menu the trigger opens; sets aria-expanded on the trigger.',
    },
    dropdownAriaLabel: {
      control: 'text',
      description: 'Accessible label for the trigger button.',
      table: { defaultValue: { summary: 'More options' } },
    },
  },
};

export default meta;
type Story = StoryObj<typeof SplitButton>;

// ─── Stories ──────────────────────────────────────────────────────────────────

/**
 * Default split button — secondary variant, medium size, label only on main segment.
 * The right segment shows the built-in ChevronDown icon.
 */
export const Playground: Story = {
  args: {
    size: 'md',
    children: 'Save changes',
  },
};

export const Variants: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
      <SplitButton {...args} variant="primary">Primary</SplitButton>
      <SplitButton {...args} variant="secondary">Secondary</SplitButton>
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
      <SplitButton {...args} size="sm">Small</SplitButton>
      <SplitButton {...args} size="md">Medium</SplitButton>
    </div>
  ),
};

export const States: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
      <SplitButton {...args}>Default</SplitButton>
      <SplitButton {...args} loading>Saving…</SplitButton>
      <SplitButton {...args} disabled>Disabled</SplitButton>
    </div>
  ),
};

/**
 * Main segment with a leading icon.
 */
export const WithIcons: Story = {
  args: {
    size: 'md',
    children: 'Create project',
    leadingIcon: <PlaceholderIcon />,
  },
};

function WithMenuHarness() {
  const anchorRef = React.useRef<HTMLDivElement>(null);
  const [open, setOpen] = React.useState(false);
  const close = () => {
    setOpen(false);
    anchorRef.current?.querySelector<HTMLButtonElement>('[aria-label="More save options"]')?.focus();
  };

  return (
    <div style={{ minHeight: '16rem' }}>
      <div ref={anchorRef} style={{ display: 'inline-block' }}>
        <SplitButton
          open={open}
          onDropdownClick={() => setOpen((value) => !value)}
          dropdownAriaLabel="More save options"
        >
          Save
        </SplitButton>
      </div>
      {open && (
        <PopoverMenu
          variant="simple"
          showHeader={false}
          aria-label="Save options"
          anchorRef={anchorRef}
          onEscape={close}
          simpleItems={[
            { id: 'draft', kind: 'menu-cell', props: { label: 'Save as draft', showLeadingIcon: false, showTrailingIcon: false, onClick: close } },
            { id: 'template', kind: 'menu-cell', props: { label: 'Save as template', showLeadingIcon: false, showTrailingIcon: false, onClick: close } },
          ]}
        />
      )}
    </div>
  );
}

/**
 * The trigger opens a PopoverMenu anchored to the SplitButton; `open` keeps
 * `aria-expanded` on the trigger in sync with the menu.
 */
export const WithMenu: Story = {
  name: 'With menu',
  render: () => <WithMenuHarness />,
};
