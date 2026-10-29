import type { Meta, StoryObj } from '@storybook/react-vite';
import { PlaceholderIcon } from '../_dev/PlaceholderIcon';
import { DateTimePicker } from './DateTimePicker';
import spec from './DateTimePicker.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

const meta: Meta<typeof DateTimePicker> = {
  title: 'Inputs & Controls/Date Time Picker',
  component: DateTimePicker,
  tags: ['autodocs'],
  parameters: { ...specDocsParameters(spec), storyWidth: 'field' },
};

export default meta;
type Story = StoryObj<typeof DateTimePicker>;

const presets = [
  { id: 'today', label: 'Today', value: new Date() },
  { id: 'yesterday', label: 'Yesterday', value: new Date(new Date().setDate(new Date().getDate() - 1)) },
];

export const Playground: Story = {
  args: {
    label: 'Date and time',
    helperText: 'Help text',
    displayMode: 'popover',
    selectionMode: 'single',
    withTime: true,
  },
};

export const Optional: Story = {
  args: {
    label: 'Follow-up date',
    optional: true,
    helperText: 'Schedule a reminder if needed.',
    displayMode: 'popover',
    selectionMode: 'single',
    withTime: true,
  },
};

export const ActiveWithPopover: Story = {
  args: {
    label: 'Date and time',
    helperText: 'Help text',
    displayMode: 'popover',
    selectionMode: 'single',
    withTime: true,
    defaultOpen: true,
  },
};

export const DateRange: Story = {
  args: {
    label: 'Select a date range',
    helperText: 'Description',
    displayMode: 'popover',
    selectionMode: 'range',
    withTime: true,
  },
};

export const SingleDateWithTime: Story = {
  args: {
    label: 'Date and time',
    helperText: 'Help text',
    selectionMode: 'single',
    withTime: true,
  },
};

export const RangeWithTimeAndPresets: Story = {
  args: {
    label: 'Select a date range',
    helperText: 'Description',
    selectionMode: 'range',
    withTime: true,
    presets,
    selectedPresetId: 'today',
    showActions: true,
  },
};

export const WithoutPresets: Story = {
  name: 'Without presets',
  args: {
    label: 'Due date',
    helperText: '',
    selectionMode: 'single',
    presets: [],
    showActions: false,
    defaultOpen: true,
  },
};

export const WithHelperIcon: Story = {
  name: 'With helper icon',
  args: {
    label: 'Date and time',
    helperText: 'Help text',
    helperIcon: <PlaceholderIcon />,
    displayMode: 'popover',
    selectionMode: 'single',
    withTime: true,
  },
};

const inlineCalendarDocsHeight = {
  docs: {
    story: {
      height: '36rem',
    },
  },
} as const;

export const InlineCalendarRange: Story = {
  args: {
    label: 'Date and time picker',
    displayMode: 'inline',
    selectionMode: 'range',
    withTime: true,
  },
  parameters: inlineCalendarDocsHeight,
};

export const InlineCalendarSingle: Story = {
  args: {
    label: 'Date and time picker',
    displayMode: 'inline',
    selectionMode: 'single',
    withTime: true,
  },
  parameters: inlineCalendarDocsHeight,
};

export const Error: Story = {
  args: {
    label: 'Date and time',
    selectionMode: 'single',
    error: true,
    errorMessage: 'Select another date',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Date and time',
    selectionMode: 'single',
    helperText: 'Help text',
    disabled: true,
  },
  parameters: {
    // Intentional static disabled preview; keyboard interaction is covered by active stories/tests.
    a11y: { disable: true },
  },
};
