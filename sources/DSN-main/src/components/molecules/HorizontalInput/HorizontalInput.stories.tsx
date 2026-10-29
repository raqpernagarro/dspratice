import type { Meta, StoryObj } from '@storybook/react-vite';
import { PlaceholderIcon } from '../../atoms/_dev/PlaceholderIcon';
import { NumberInput } from '../../atoms/NumberInput';
import { PasswordInput } from '../../atoms/PasswordInput';
import { PhoneInput } from '../../atoms/PhoneInput';
import { Select } from '../../atoms/Select';
import { TextArea } from '../../atoms/TextArea';
import { TextInput } from '../../atoms/TextInput';
import { HorizontalInput } from './HorizontalInput';
import spec from './HorizontalInput.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

const meta: Meta<typeof HorizontalInput> = {
  title: 'Inputs & Controls/Horizontal Input',
  component: HorizontalInput,
  tags: ['autodocs'],
  parameters: { ...specDocsParameters(spec), storyWidth: 'container' },
};

export default meta;
type Story = StoryObj<typeof HorizontalInput>;

export const Playground: Story = {
  args: {
    label: 'Label',
    showDescription: false,
    children: <TextInput aria-label="Horizontal text input" placeholder="Content slot" />,
  },
};

export const WithoutDescription: Story = {
  args: {
    label: 'Label',
    description: 'Description',
    showDescription: false,
    children: <TextInput aria-label="Horizontal text input" placeholder="Content slot" />,
  },
};

export const WithDefaultIcon: Story = {
  args: {
    label: 'Label',
    showDescription: false,
    showIcon: true,
    children: <TextInput aria-label="Horizontal text input" placeholder="Content slot" />,
  },
};

export const WithCustomIcon: Story = {
  args: {
    label: 'Label',
    showDescription: false,
    showIcon: true,
    iconSlot: <PlaceholderIcon />,
    children: <TextInput aria-label="Horizontal text input" placeholder="Content slot" />,
  },
};

export const Error: Story = {
  args: {
    label: 'Label',
    description: 'Description',
    showIcon: true,
    error: true,
    children: <TextInput aria-label="Horizontal text input error" placeholder="Content slot" error />,
  },
};

export const AlignedRows: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 0 }}>
      <HorizontalInput label="Name" showDescription={false} labelWidth="180px">
        <TextInput aria-label="Name" placeholder="Enter name" />
      </HorizontalInput>
      <HorizontalInput label="Status" showDescription={false} labelWidth="180px" showIcon>
        <Select aria-label="Status" label="" helperText="" placeholder="Select status" />
      </HorizontalInput>
      <HorizontalInput label="Priority" showDescription={false} labelWidth="180px">
        <NumberInput aria-label="Priority" placeholder="Set priority" />
      </HorizontalInput>
      <HorizontalInput label="Password" showDescription={false} labelWidth="180px">
        <PasswordInput aria-label="Password" placeholder="Enter password" />
      </HorizontalInput>
      <HorizontalInput label="Phone" showDescription={false} labelWidth="180px" showIcon>
        <PhoneInput aria-label="Phone" placeholder="Enter phone number" />
      </HorizontalInput>
      <HorizontalInput label="Bio" showDescription={false} labelWidth="180px">
        <TextArea aria-label="Bio" placeholder="Write a short bio" />
      </HorizontalInput>
    </div>
  ),
};
