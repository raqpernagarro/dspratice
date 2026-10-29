import type { Meta, StoryObj } from '@storybook/react-vite';
import { AttachmentField } from './AttachmentField';
import spec from './AttachmentField.spec.md?raw';
import { specDocsParameters } from '../../../../docs/stripSpecTitle';

const mockFile = {
  name: 'file.extension',
  size: 10 * 1024 * 1024,
  type: 'application/pdf',
} as File;

const meta: Meta<typeof AttachmentField> = {
  title: 'Inputs & Controls/Attachment Field',
  component: AttachmentField,
  tags: ['autodocs'],
  parameters: { ...specDocsParameters(spec), storyWidth: 'field' },
};

export default meta;
type Story = StoryObj<typeof AttachmentField>;

export const Playground: Story = {
  args: {
    label: 'Label',
    helperText: 'Help text',
  },
};

export const FileUploadedLoading: Story = {
  args: {
    label: 'Label',
    helperText: 'Help text',
    value: mockFile,
    loading: true,
  },
};

export const Uploaded: Story = {
  args: {
    label: 'Label',
    helperText: 'Help text',
    value: mockFile,
  },
};

export const Error: Story = {
  args: {
    label: 'Label',
    value: {
      name: 'file.extension',
      size: 100 * 1024 * 1024 * 1024,
      type: 'application/pdf',
    } as File,
    error: true,
    errorMessage: 'File exceeds 10 MB',
  },
};
