import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Moon } from 'lucide-react';
import { Switcher } from './Switcher';
import spec from './Switcher.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<typeof Switcher> = {
  title: 'Inputs & Controls/Switcher',
  component: Switcher,
  tags: ['autodocs'],
  argTypes: {
    size:     { control: 'select', options: ['md', 'sm'] },
    checked:  { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  parameters: specDocsParameters(spec),
};

export default meta;
type Story = StoryObj<typeof Switcher>;

// ─── Static snapshots ─────────────────────────────────────────────────────────

export const Playground: Story = {
  args: { checked: false, 'aria-label': 'Toggle feature' },
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {(['sm', 'md'] as const).map((size) => (
        <Row key={size} label={size} node={<Switcher {...args} size={size} checked aria-label={`Size ${size}`} />} />
      ))}
    </div>
  ),
};

/** Off, on, and both while disabled. */
export const States: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Row label="Off" node={<Switcher {...args} checked={false} aria-label="Off" />} />
      <Row label="On" node={<Switcher {...args} checked aria-label="On" />} />
      <Row label="Disabled off" node={<Switcher {...args} checked={false} disabled aria-label="Disabled off" />} />
      <Row label="Disabled on" node={<Switcher {...args} checked disabled aria-label="Disabled on" />} />
    </div>
  ),
};

// ─── Interactive (controlled) ─────────────────────────────────────────────────

export const Controlled: Story = {
  render: () => {
    const [on, setOn] = useState(false);
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'sans-serif', fontSize: 14 }}>
        <span id="lbl-notifications">Email notifications</span>
        <Switcher
          checked={on}
          onChange={setOn}
          aria-labelledby="lbl-notifications"
        />
      </div>
    );
  },
};

// ─── Paired with label ────────────────────────────────────────────────────────

export const WithLabel: Story = {
  name: 'Paired with visible label',
  render: () => {
    const [on, setOn] = useState(true);
    return (
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 24, minWidth: 240,
          fontFamily: 'sans-serif', fontSize: 14, cursor: 'pointer',
        }}
      >
        <span id="dark-mode-label">Dark mode</span>
        <Switcher id="dark-mode" checked={on} onChange={setOn} aria-labelledby="dark-mode-label" />
      </div>
    );
  },
};

// ─── Settings panel ───────────────────────────────────────────────────────────

export const SettingsPanel: Story = {
  name: 'Settings panel',
  render: () => {
    const [state, setState] = useState({
      emails: true,
      pushNotifications: false,
      weeklyDigest: true,
      marketingUpdates: false,
    });

    type Key = keyof typeof state;

    const settings: { key: Key; label: string; description: string; disabled?: boolean }[] = [
      { key: 'emails', label: 'Email notifications', description: 'Receive updates via email' },
      { key: 'pushNotifications', label: 'Push notifications', description: 'Browser push alerts' },
      { key: 'weeklyDigest', label: 'Weekly digest', description: 'Summary every Monday morning' },
      { key: 'marketingUpdates', label: 'Marketing updates', description: 'Available on Pro plan', disabled: true },
    ];

    return (
      <div style={{ width: 360, fontFamily: 'sans-serif' }}>
        {settings.map(({ key, label, description, disabled }) => (
          <div
            key={key}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 0',
              borderBottom: '1px solid #efefef',
            }}
          >
            <div>
              <div id={`lbl-${key}`} style={{ fontSize: 14, fontWeight: 500, color: disabled ? '#a1a1aa' : '#09090b' }}>
                {label}
              </div>
              <div style={{ fontSize: 12, color: '#6b6b6b', marginTop: 2 }}>
                {description}
              </div>
            </div>
            <Switcher
              id={`setting-${key}`}
              checked={state[key]}
              onChange={(val) => setState((s) => ({ ...s, [key]: val }))}
              disabled={disabled}
              aria-labelledby={`lbl-${key}`}
            />
          </div>
        ))}
      </div>
    );
  },
};

export const WithTrackContent: Story = {
  name: 'Track content (label / icon)',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Row label="md — off" node={<Switcher checked={false} aria-label="Dark mode" showLabel label="Off" />} />
      <Row label="md — on" node={<Switcher checked aria-label="Dark mode" showLabel label="On" />} />
      <Row label="md — icon" node={<Switcher checked aria-label="Dark mode" showIcon icon={Moon} />} />
      <Row label="sm — off" node={<Switcher size="sm" checked={false} aria-label="Dark mode" showLabel label="Off" />} />
      <Row label="sm — on + icon" node={<Switcher size="sm" checked aria-label="Dark mode" showIcon icon={Moon} showLabel label="On" />} />
    </div>
  ),
};

// ─── Helper ───────────────────────────────────────────────────────────────────

function Row({ label, node }: { label: string; node: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ minWidth: 120, fontSize: 12, color: 'var(--color-foreground-neutral-secondary)' }}>
        {label}
      </span>
      {node}
    </div>
  );
}
