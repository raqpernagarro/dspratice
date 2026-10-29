import type { Meta, StoryObj } from '@storybook/react-vite';
import { PlaceholderIcon } from '../_dev/PlaceholderIcon';
import { SegmentControl, type SegmentControlOption } from './SegmentControl';
import spec from './SegmentControl.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

const baseOptions: SegmentControlOption[] = [
  { value: 'list', label: 'List', showLeadingIcon: true, leadingIcon: <PlaceholderIcon /> },
  { value: 'grid', label: 'Grid', showLeadingIcon: true, leadingIcon: <PlaceholderIcon /> },
  { value: 'board', label: 'Board', showLeadingIcon: true, leadingIcon: <PlaceholderIcon /> },
  { value: 'map', label: 'Map', showLeadingIcon: true, leadingIcon: <PlaceholderIcon /> },
];

const meta: Meta<typeof SegmentControl> = {
  title: 'Navigation/Segment Control',
  component: SegmentControl,
  tags: ['autodocs'],
  parameters: specDocsParameters(spec),
};

export default meta;
type Story = StoryObj<typeof SegmentControl>;

export const Playground: Story = {
  args: {
    options: baseOptions,
    defaultValue: 'list',
    'aria-label': 'View mode',
  },
};

export const FullWidth: Story = {
  args: {
    options: baseOptions.slice(0, 3),
    defaultValue: 'list',
    fullWidth: true,
    'aria-label': 'View mode',
  },
  decorators: [(Story) => <div style={{ width: 360 }}>{Story()}</div>],
};

export const FiveOptions: Story = {
  args: {
    options: [
      ...baseOptions,
      { value: 'timeline', label: 'Timeline', showLeadingIcon: true, leadingIcon: <PlaceholderIcon /> },
    ],
    defaultValue: 'grid',
    'aria-label': 'Display mode',
  },
};

export const DisabledOption: Story = {
  args: {
    options: [
      { value: 'default', label: 'Default', showLeadingIcon: true, leadingIcon: <PlaceholderIcon /> },
      { value: 'custom', label: 'Custom', showLeadingIcon: true, leadingIcon: <PlaceholderIcon />, disabled: true },
      { value: 'advanced', label: 'Advanced', showLeadingIcon: true, leadingIcon: <PlaceholderIcon /> },
    ],
    defaultValue: 'default',
    'aria-label': 'Configuration mode',
  },
};
