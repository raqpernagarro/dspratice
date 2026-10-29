import type { Meta, StoryObj } from '@storybook/react-vite';
import { Plus, Settings, Users, PanelLeft } from 'lucide-react';
import { SidebarMenuSelector } from './SidebarMenuSelector';
import { Button } from '../../atoms/Button';
import spec from './SidebarMenuSelector.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

const meta: Meta<typeof SidebarMenuSelector> = {
  title: 'Navigation/Sidebar Menu Selector',
  component: SidebarMenuSelector,
  tags: ['autodocs'],
  parameters: { ...specDocsParameters(spec), storyWidth: 'full' },
  argTypes: {
    variant: { control: 'select', options: ['full', 'icon'] },
    selected: { control: 'boolean' },
    disabled: { control: 'boolean' },
    showIcon: { control: 'boolean' },
    showAvatar: { control: 'boolean' },
    showBadge: { control: 'boolean' },
    showDisclosure: { control: 'boolean' },
    showRightButton: { control: 'boolean' },
  },
};
export default meta;
type Story = StoryObj<typeof SidebarMenuSelector>;

export const Playground: Story = {
  args: {
    variant: 'full',
    label: 'Welcome',
    showIcon: true,
    icon: <PanelLeft size={16} />,
  },
};

export const WithAvatarAndDisclosure: Story = {
  name: 'Full — Avatar + Label + Disclosure',
  args: {
    variant: 'full',
    label: 'Acme Inc.',
    showIcon: false,
    showAvatar: true,
    avatarProps: { size: 'xs', variant: 'organization', fill: 'initials', initials: 'AC', name: 'Acme Inc.' },
    showDisclosure: true,
  },
};

export const WithBadge: Story = {
  name: 'Full — Icon + Label + Badge',
  args: {
    variant: 'full',
    label: 'Notifications',
    showIcon: true,
    icon: <Settings size={16} />,
    showBadge: true,
    badgeCount: 3,
    badgeVariant: 'highlight-strong',
  },
};

export const WithRightButton: Story = {
  name: 'Full — Label + Right Button',
  args: {
    variant: 'full',
    label: 'Contacts',
    showIcon: true,
    icon: <Users size={16} />,
    showDisclosure: true,
    showRightButton: true,
    rightButton: (
      <Button
        variant="ghost"
        size="sm"
        showLabel={false}
        showLeadingIcon
        leadingIcon={<Plus size={16} />}
        aria-label="Add contact"
      />
    ),
  },
};

export const Selected: Story = {
  name: 'Full — Selected',
  args: {
    variant: 'full',
    label: 'Notes',
    showIcon: true,
    icon: <PanelLeft size={16} />,
    selected: true,
  },
};

export const Disabled: Story = {
  name: 'Full — Disabled',
  args: {
    variant: 'full',
    label: 'Disabled item',
    showIcon: true,
    icon: <PanelLeft size={16} />,
    disabled: true,
  },
};

export const IconOnly: Story = {
  name: 'Icon-only',
  args: {
    variant: 'icon',
    label: 'Welcome',
    showIcon: true,
    icon: <PanelLeft size={16} />,
  },
};

export const IconOnlySelected: Story = {
  name: 'Icon-only — Selected',
  args: {
    variant: 'icon',
    label: 'Welcome',
    showIcon: true,
    icon: <PanelLeft size={16} />,
    selected: true,
  },
};

export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 280 }}>
      <SidebarMenuSelector
        label="Default"
        showIcon
        icon={<PanelLeft size={16} />}
      />
      <SidebarMenuSelector
        label="Selected"
        showIcon
        icon={<PanelLeft size={16} />}
        selected
      />
      <SidebarMenuSelector
        label="Disabled"
        showIcon
        icon={<PanelLeft size={16} />}
        disabled
      />
      <SidebarMenuSelector
        label="Acme Inc."
        showIcon={false}
        showAvatar
        avatarProps={{ size: 'xs', variant: 'organization', fill: 'initials', initials: 'AC', name: 'Acme Inc.' }}
        showDisclosure
      />
    </div>
  ),
};
