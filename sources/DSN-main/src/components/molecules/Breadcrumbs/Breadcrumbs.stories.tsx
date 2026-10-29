import type { Meta, StoryObj } from '@storybook/react-vite';
import { Breadcrumbs } from './Breadcrumbs';
import spec from './Breadcrumbs.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

const meta: Meta<typeof Breadcrumbs> = {
  title: 'Navigation/Breadcrumbs',
  component: Breadcrumbs,
  tags: ['autodocs'],
  parameters: { ...specDocsParameters(spec), storyWidth: 'full' },
  argTypes: {
    size: {
      control: 'inline-radio',
      options: ['sm', 'lg'],
    },
    maxVisibleItems: {
      control: { type: 'number', min: 3, max: 8, step: 1 },
    },
    showEllipsis: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Breadcrumbs>;

const pageLevelItems = [
  { id: 'home', label: 'Home', href: '#' },
  { id: 'projects', label: 'Projects', href: '#' },
  { id: 'q4-campaign', label: 'Q4 Campaign', href: '#' },
  { id: 'assets', label: 'Assets' },
];

const longItems = [
  { id: 'home', label: 'Home', href: '#' },
  { id: 'workspace', label: 'Workspace', href: '#' },
  { id: 'marketing', label: 'Marketing', href: '#' },
  { id: 'campaigns', label: 'Campaigns', href: '#' },
  { id: 'q4-campaign', label: 'Q4 Campaign', href: '#' },
  { id: 'assets', label: 'Assets' },
];

export const Playground: Story = {
  args: {
    items: pageLevelItems,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Compact (`size="sm"`, default) breadcrumb trail for in-content hierarchy. All visible ancestor levels are links and the last item is the current location with `aria-current="page"`.',
      },
    },
  },
};

export const CollapsedWithEllipsis: Story = {
  args: {
    items: longItems,
    maxVisibleItems: 4,
    showEllipsis: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Truncation behavior for long paths: middle levels collapse into an ellipsis while preserving the root item and current location.',
      },
    },
  },
};

export const ExpandedTrail: Story = {
  args: {
    items: longItems,
    maxVisibleItems: 8,
    showEllipsis: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Full hierarchy without truncation. Use when layout width is sufficient and exposing all ancestor levels improves wayfinding.',
      },
    },
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    items: [
      { id: 'products', label: 'Products' },
      { id: 'collections', label: 'Collections' },
      { id: 'summer-launch', label: 'Summer Launch' },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Page-level trail (`size="lg"`). Rendered by `Navbar variant="breadcrumbs"` in place of the page title.',
      },
    },
  },
};

export const LargeWithDisclosure: Story = {
  args: {
    size: 'lg',
    items: [
      { id: 'workspace', label: 'Workspace', showDisclosure: true },
      { id: 'project', label: 'Project Alpha', showDisclosure: true },
      { id: 'current', label: 'Settings' },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Set `showDisclosure: true` on items that open a dropdown of sibling pages. `size="lg"` only.',
      },
    },
  },
};

export const LargeCollapsed: Story = {
  args: {
    size: 'lg',
    items: longItems,
    maxVisibleItems: 4,
    showEllipsis: true,
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Breadcrumbs size="sm" items={pageLevelItems} aria-label="Small breadcrumb" />
      <Breadcrumbs size="lg" items={pageLevelItems} aria-label="Large breadcrumb" />
    </div>
  ),
};
