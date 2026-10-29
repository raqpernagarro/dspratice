import type { Meta, StoryObj } from '@storybook/react-vite';
import { PlaceholderIcon } from '../_dev/PlaceholderIcon';
import { Tab, type TabItem } from './Tab';
import spec from './Tab.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

const baseTabs: TabItem[] = [
  {
    value: 'overview',
    label: 'Overview',
    showLeadingIcon: true,
    leadingIcon: <PlaceholderIcon />,
    panel: <div>Overview content</div>,
  },
  {
    value: 'activity',
    label: 'Activity',
    showLeadingIcon: true,
    leadingIcon: <PlaceholderIcon />,
    panel: <div>Activity content</div>,
  },
  {
    value: 'settings',
    label: 'Settings',
    showLeadingIcon: true,
    leadingIcon: <PlaceholderIcon />,
    panel: <div>Settings content</div>,
  },
];

const meta: Meta<typeof Tab> = {
  title: 'Navigation/Tab',
  component: Tab,
  tags: ['autodocs'],
  parameters: { ...specDocsParameters(spec), storyWidth: 'full' },
};

export default meta;
type Story = StoryObj<typeof Tab>;

export const Playground: Story = {
  args: {
    tabs: baseTabs,
    defaultValue: 'overview',
    'aria-label': 'Profile sections',
  },
};

export const WithDisabledTab: Story = {
  args: {
    tabs: [
      ...baseTabs.slice(0, 2),
      {
        value: 'billing',
        label: 'Billing',
        showLeadingIcon: true,
        leadingIcon: <PlaceholderIcon />,
        disabled: true,
        panel: <div>Billing content</div>,
      },
    ],
    defaultValue: 'overview',
    'aria-label': 'Account sections',
  },
};

export const TabListOnly: Story = {
  args: {
    tabs: baseTabs,
    defaultValue: 'activity',
    showPanels: false,
    'aria-label': 'View sections',
  },
};
