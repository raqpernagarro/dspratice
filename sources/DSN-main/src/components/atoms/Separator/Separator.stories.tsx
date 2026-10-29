import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Separator } from './Separator';
import spec from './Separator.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<typeof Separator> = {
  title: 'Layout/Separator',
  component: Separator,
  tags: ['autodocs'],
  argTypes: {
    direction:  { control: 'select', options: ['horizontal', 'vertical'] },
    decorative: { control: 'boolean' },
  },
  parameters: { ...specDocsParameters(spec), storyWidth: 'full' },
};

export default meta;
type Story = StoryObj<typeof Separator>;

// ─── Static variants ──────────────────────────────────────────────────────────

/** `decorative` hides the separator from assistive tech when it is purely visual. */
export const Playground: Story = {
  args: { direction: 'horizontal' },
  decorators: [
    (Story, { args }) =>
      args.direction === 'vertical' ? (
        <div style={{ display: 'flex', height: 40, alignItems: 'stretch' }}>
          <Story />
        </div>
      ) : (
        <Story />
      ),
  ],
};

export const Orientations: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Row label="horizontal">
        <div style={{ width: 240 }}>
          <Separator {...args} direction="horizontal" />
        </div>
      </Row>
      <Row label="vertical">
        <div style={{ display: 'flex', height: 32, alignItems: 'stretch' }}>
          <Separator {...args} direction="vertical" />
        </div>
      </Row>
    </div>
  ),
};

// ─── In context: Settings panel ───────────────────────────────────────────────

export const InSettingsPanel: Story = {
  name: 'In a settings panel',
  render: () => (
    <div style={{ width: 360, fontFamily: 'sans-serif' }}>
      {[
        { label: 'Profile',       description: 'Edit your name, photo, and bio' },
        { label: 'Notifications', description: 'Manage email and push alerts' },
        { label: 'Billing',       description: 'Subscription and payment methods' },
        { label: 'Security',      description: 'Password and two-factor auth' },
      ].map((item, i, arr) => (
        <React.Fragment key={item.label}>
          <div style={{ padding: '12px 0' }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#09090b' }}>
              {item.label}
            </div>
            <div style={{ fontSize: 12, color: '#6b6b6b', marginTop: 2 }}>
              {item.description}
            </div>
          </div>
          {i < arr.length - 1 && <Separator />}
        </React.Fragment>
      ))}
    </div>
  ),
};

// ─── In context: Inline toolbar ───────────────────────────────────────────────

export const InToolbar: Story = {
  name: 'In an inline toolbar',
  render: () => (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 12px',
        border: '1px solid #efefef',
        borderRadius: 8,
        fontFamily: 'sans-serif',
        fontSize: 13,
        color: '#09090b',
      }}
    >
      <span style={{ cursor: 'pointer' }}>Bold</span>
      <Separator direction="vertical" />
      <span style={{ cursor: 'pointer' }}>Italic</span>
      <Separator direction="vertical" />
      <span style={{ cursor: 'pointer' }}>Underline</span>
      <Separator direction="vertical" />
      <span style={{ cursor: 'pointer' }}>Strikethrough</span>
    </div>
  ),
};

// ─── All directions ───────────────────────────────────────────────────────────

// ─── Helper ───────────────────────────────────────────────────────────────────

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <span style={{ minWidth: 120, fontSize: 'var(--font-size-body-sm)', color: 'var(--color-foreground-neutral-secondary)' }}>{label}</span>
      {children}
    </div>
  );
}
