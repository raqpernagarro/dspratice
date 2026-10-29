import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { PlaceholderIcon } from '../_dev/PlaceholderIcon';
import { CustomViewTab } from './CustomViewTab';
import './CustomViewTab.stories.css';
import spec from './CustomViewTab.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

const baseTabs = [
  {
    value: 'filter-a',
    label: 'Filter tab',
    showLeadingIcon: true,
    leadingIcon: <PlaceholderIcon />,
    removable: true,
    panel: <div>Filter A content</div>,
  },
  {
    value: 'filter-b',
    label: 'Filter tab',
    showLeadingIcon: true,
    leadingIcon: <PlaceholderIcon />,
    removable: true,
    panel: <div>Filter B content</div>,
  },
  {
    value: 'filter-c',
    label: 'Filter tab',
    showLeadingIcon: true,
    leadingIcon: <PlaceholderIcon />,
    removable: true,
    panel: <div>Filter C content</div>,
  },
] as const;

const overflowTabs = [
  ...baseTabs,
  {
    value: 'filter-d',
    label: 'Filter tab',
    showLeadingIcon: true,
    leadingIcon: <PlaceholderIcon />,
    removable: true,
    panel: <div>Filter D content</div>,
  },
  {
    value: 'filter-e',
    label: 'Filter tab',
    showLeadingIcon: true,
    leadingIcon: <PlaceholderIcon />,
    removable: true,
    panel: <div>Filter E content</div>,
  },
  {
    value: 'filter-f',
    label: 'Filter tab',
    showLeadingIcon: true,
    leadingIcon: <PlaceholderIcon />,
    removable: true,
    panel: <div>Filter F content</div>,
  },
  {
    value: 'filter-g',
    label: 'Filter tab',
    showLeadingIcon: true,
    leadingIcon: <PlaceholderIcon />,
    removable: true,
    panel: <div>Filter G content</div>,
  },
] as const;

const meta: Meta<typeof CustomViewTab> = {
  title: 'Navigation/Custom View Tab',
  component: CustomViewTab,
  tags: ['autodocs'],
  parameters: specDocsParameters(spec),
};

export default meta;
type Story = StoryObj<typeof CustomViewTab>;

export const Playground: Story = {
  args: {
    tabs: baseTabs,
    defaultValue: 'filter-a',
    showPanels: false,
    'aria-label': 'Custom views',
  },
};

export const Selected: Story = {
  args: {
    tabs: baseTabs,
    defaultValue: 'filter-c',
    showPanels: false,
    'aria-label': 'Custom views',
  },
};

export const WithAddAction: Story = {
  args: {
    tabs: baseTabs,
    defaultValue: 'filter-b',
    showPanels: false,
    addActionLabel: 'Add list',
    'aria-label': 'Custom views',
  },
};

export const WithRemoveAction: Story = {
  args: {
    tabs: baseTabs,
    defaultValue: 'filter-a',
    showPanels: false,
    addActionLabel: 'Add list',
    onRemove: () => {},
    'aria-label': 'Custom views',
  },
};

export const GroupedOnScrollableBar: Story = {
  args: {
    tabs: overflowTabs,
    defaultValue: 'filter-b',
    showPanels: false,
    addActionLabel: 'Add tab',
    addActionAriaLabel: 'Add tab',
    'aria-label': 'Custom views',
  },
  render: function GroupedOnScrollableBarStory(args) {
    const [value, setValue] = React.useState(args.defaultValue ?? args.tabs[0]?.value ?? '');
    const storyRef = React.useRef<HTMLDivElement | null>(null);

    const updateSelectedStickyEdge = React.useCallback(() => {
      const storyRoot = storyRef.current;
      if (!storyRoot) return;

      const tabList = storyRoot.querySelector<HTMLElement>('.dsn-custom-view-tabs-list');
      if (!tabList) return;

      tabList
        .querySelectorAll<HTMLElement>('.dsn-custom-view-tabs-item[data-sticky-edge]')
        .forEach((tab) => tab.removeAttribute('data-sticky-edge'));

      const selectedTab = tabList.querySelector<HTMLElement>('.dsn-custom-view-tabs-item[data-selected]');
      if (!selectedTab) return;

      const listRect = tabList.getBoundingClientRect();
      const selectedRect = selectedTab.getBoundingClientRect();
      const edgeOffset = 1;

      if (selectedRect.left <= listRect.left + edgeOffset) {
        selectedTab.setAttribute('data-sticky-edge', 'left');
      } else if (selectedRect.right >= listRect.right - edgeOffset) {
        selectedTab.setAttribute('data-sticky-edge', 'right');
      }
    }, []);

    React.useEffect(() => {
      updateSelectedStickyEdge();
      const storyRoot = storyRef.current;
      const tabList = storyRoot?.querySelector<HTMLElement>('.dsn-custom-view-tabs-list');
      if (!tabList) return;

      const handleScroll = () => updateSelectedStickyEdge();
      const handleResize = () => updateSelectedStickyEdge();

      tabList.addEventListener('scroll', handleScroll, { passive: true });
      window.addEventListener('resize', handleResize);

      return () => {
        tabList.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleResize);
      };
    }, [updateSelectedStickyEdge, value, args.tabs]);

    return (
      <div ref={storyRef} className="dsn-custom-view-tabs-bar-story">
        <CustomViewTab
          {...args}
          value={value}
          onChange={(nextValue) => {
            setValue(nextValue);
            args.onChange?.(nextValue);
          }}
        />
      </div>
    );
  },
};
