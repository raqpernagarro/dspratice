import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { PlaceholderIcon } from '../_dev/PlaceholderIcon';
import { UploadArea } from './UploadArea';
import spec from './UploadArea.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

const meta: Meta<typeof UploadArea> = {
  title: 'Inputs & Controls/Upload Area',
  component: UploadArea,
  tags: ['autodocs'],
  parameters: { ...specDocsParameters(spec), storyWidth: 'field' },
  args: {
    onFilesSelected: fn(),
    onFilesRejected: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof UploadArea>;

export const Playground: Story = {
  args: {
    label: 'Label',
    helperText: 'Help text',
    maxSizeText: 'Up to 100 MB',
  },
};

export const WithHelperIcon: Story = {
  name: 'With helper icon',
  args: {
    label: 'Label',
    helperText: 'Help text',
    helperIcon: <PlaceholderIcon />,
    maxSizeText: 'Up to 100 MB',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Label',
    helperText: 'Help text',
    disabled: true,
    maxSizeText: 'Up to 100 MB',
  },
};

export const RestrictedTypes: Story = {
  name: 'Restricted types (drops filtered by accept)',
  args: {
    label: 'Supporting documents',
    helperText: 'Files of other types are rejected.',
    accept: '.pdf,image/png,image/jpeg',
    multiple: true,
    maxSizeText: 'PDF, PNG or JPG up to 10 MB each',
  },
};
