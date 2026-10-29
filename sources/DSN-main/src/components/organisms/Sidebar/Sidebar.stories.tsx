import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Bell,
  Calendar,
  ChevronDown,
  Smile,
  Clipboard,
  Copy,
  Ellipsis,
  Home,
  Inbox,
  BarChart3,
  Notebook,
  Plus,
  Rocket,
  Settings,
  SquareKanban,
  Users,
  Zap,
} from 'lucide-react';
import { Avatar } from '../../atoms/Avatar';
import { Button } from '../../atoms/Button';
import { SearchBar } from '../../atoms/SearchBar';
import { SidebarMenuSelector } from '../../molecules/SidebarMenuSelector';
import { Sidebar, type SidebarSection } from './Sidebar';
import spec from './Sidebar.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

const meta: Meta<typeof Sidebar> = {
  title: 'Navigation/Sidebar',
  component: Sidebar,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    ...specDocsParameters(spec),
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh', display: 'flex' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Sidebar>;

const mainItems: SidebarSection = {
  id: 'main',
  items: [
    { id: 'welcome', label: 'Welcome', icon: <Home size={16} /> },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <Bell size={16} />,
      showBadge: true,
      badgeCount: 3,
      badgeVariant: 'highlight-strong',
    },
    { id: 'inbox', label: 'Inbox', icon: <Inbox size={16} /> },
    { id: 'tasks', label: 'Tasks', icon: <Clipboard size={16} /> },
    { id: 'calendar', label: 'Calendar', icon: <Calendar size={16} /> },
    { id: 'notes', label: 'Notes', icon: <Notebook size={16} />, selected: true },
    { id: 'pipeline', label: 'Pipeline', icon: <SquareKanban size={16} /> },
    { id: 'reports', label: 'Reports', icon: <BarChart3 size={16} /> },
  ],
};

const contactsSection: SidebarSection = {
  id: 'contacts',
  title: 'Contacts',
  showDisclosure: true,
  separator: 'before',
  trailingAction: (
    <Button
      variant="ghost"
      size="sm"
      showLabel={false}
      showLeadingIcon
      leadingIcon={<Plus size={16} />}
      aria-label="Add contact"
    />
  ),
  items: [
    {
      id: 'all',
      label: 'All',
      showAvatar: true,
      avatarProps: { size: 'xs', variant: 'profile', fill: 'icon', icon: Users, name: 'All contacts' },
    },
    {
      id: 'john1',
      label: 'John Smith',
      showAvatar: true,
      avatarProps: { size: 'xs', variant: 'profile', fill: 'initials', initials: 'JS', name: 'John Smith' },
    },
    {
      id: 'john2',
      label: 'John Smith',
      showAvatar: true,
      avatarProps: { size: 'xs', variant: 'profile', fill: 'initials', initials: 'JS', name: 'John Smith' },
    },
  ],
};

const listsSection: SidebarSection = {
  id: 'lists',
  title: 'Lists',
  showDisclosure: true,
  trailingAction: (
    <Button
      variant="ghost"
      size="sm"
      showLabel={false}
      showLeadingIcon
      leadingIcon={<Plus size={16} />}
      aria-label="Add list"
    />
  ),
  items: [
    { id: 'followup-next', label: 'Follow up next', icon: <Rocket size={16} /> },
    { id: 'to-follow-up', label: 'To follow up', icon: <span aria-hidden="true">⭐</span> },
  ],
};

const bottomItems: SidebarSection = {
  id: 'bottom-items',
  separator: 'before',
  items: [
    { id: 'automations', label: 'Automations', icon: <Zap size={16} /> },
    { id: 'agents', label: 'Agents', icon: <Smile size={16} /> },
  ],
};

const allSections = [mainItems, contactsSection, listsSection, bottomItems];

export const Playground: Story = {
  args: {
    selectorProps: {
      label: 'Acme Inc.',
      showAvatar: true,
      avatarProps: {
        size: 'xs',
        variant: 'organization',
        fill: 'initials',
        initials: 'AC',
        name: 'Acme Inc.',
      },
      showDisclosure: true,
    },
    showSearch: true,
    searchSlot: (
      <>
        <SearchBar placeholder="Search" aria-label="Search sidebar" />
        <Button
          variant="secondary"
          size="md"
          showLabel={false}
          showLeadingIcon
          leadingIcon={<Plus size={16} />}
          aria-label="Add item"
        />
      </>
    ),
    sections: allSections,
    bottomContent: (
      <>
        <SidebarMenuSelector
          label="Settings"
          showIcon
          icon={<Settings size={16} />}
        />
        <SidebarMenuSelector
          label="User Name"
          showIcon={false}
          showAvatar
          avatarProps={{ size: 'xs', variant: 'profile', fill: 'initials', initials: 'UN', name: 'User Name' }}
          showRightButton
          rightButton={
            <Button
              variant="ghost"
              size="sm"
              showLabel={false}
              showLeadingIcon
              leadingIcon={<Ellipsis size={16} />}
              aria-label="More options"
            />
          }
        />
      </>
    ),
  },
};

export const Collapsed: Story = {
  name: 'Collapsed (icon-only)',
  args: {
    collapsed: true,
    selector: (
      <SidebarMenuSelector
        variant="icon"
        label="Acme Inc."
        showAvatar
        avatarProps={{
          size: 'xs',
          variant: 'organization',
          fill: 'initials',
          initials: 'AC',
          name: 'Acme Inc.',
        }}
      />
    ),
    showSearch: true,
    searchSlot: (
      <>
        <Button
          variant="ghost"
          size="sm"
          showLabel={false}
          showLeadingIcon
          leadingIcon={
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M11.5 11.5L14 14M12.667 7.333A5.333 5.333 0 1 1 2 7.333a5.333 5.333 0 0 1 10.667 0Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
          aria-label="Search"
        />
        <Button
          variant="secondary"
          size="sm"
          showLabel={false}
          showLeadingIcon
          leadingIcon={<Plus size={16} />}
          aria-label="Add item"
        />
      </>
    ),
    sections: allSections,
    bottomContent: (
      <>
        <SidebarMenuSelector
          variant="icon"
          label="Settings"
          showIcon
          icon={<Settings size={16} />}
        />
        <SidebarMenuSelector
          variant="icon"
          label="User"
          showAvatar
          avatarProps={{ size: 'xs', variant: 'profile', fill: 'initials', initials: 'UN', name: 'User Name' }}
        />
      </>
    ),
  },
};

export const CollapsedWithSelected: Story = {
  name: 'Collapsed — Selected item',
  args: {
    ...Collapsed.args,
  },
};

export const MinimalSidebar: Story = {
  name: 'Minimal — no search, no sections',
  args: {
    selectorProps: {
      label: 'My App',
      showIcon: true,
    },
    sections: [
      {
        id: 'main',
        items: [
          { id: 'home', label: 'Home', icon: <Home size={16} />, selected: true },
          { id: 'settings', label: 'Settings', icon: <Settings size={16} /> },
        ],
      },
    ],
  },
};
