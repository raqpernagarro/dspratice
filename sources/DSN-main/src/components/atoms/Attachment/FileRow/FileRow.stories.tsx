import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { FileRow } from './FileRow';
import spec from './FileRow.spec.md?raw';
import { specDocsParameters } from '../../../../docs/stripSpecTitle';

const samplePreview =
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=96&q=80';

const meta: Meta<typeof FileRow> = {
  title: 'Data Display/Attachment/File Row',
  component: FileRow,
  tags: ['autodocs'],
  parameters: { ...specDocsParameters(spec), storyWidth: 'full' },
  args: {
    fileName: 'project-brief.pdf',
    fileType: 'PDF',
    fileSize: '10 MB',
    previewVariant: 'file',
    state: 'default',
    uploadProgress: 40,
    onCopyLink: fn(),
    onDownload: fn(),
    onCancelUpload: fn(),
  },
  argTypes: {
    state: {
      control: 'radio',
      options: ['default', 'hover', 'uploading'],
    },
    uploadProgress: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
    },
  },
};

export default meta;
type Story = StoryObj<typeof FileRow>;

export const Playground: Story = {};

export const ImagePreview: Story = {
  args: {
    fileName: 'site-plan.png',
    fileType: 'PNG',
    fileSize: '4.2 MB',
    previewVariant: 'image',
    previewSrc: samplePreview,
  },
};

export const DownloadOnly: Story = {
  name: 'Download only (no copy link)',
  args: {
    state: 'hover',
    onCopyLink: undefined,
  },
};

export const ReadOnly: Story = {
  name: 'Read-only (no actions)',
  args: {
    onCopyLink: undefined,
    onDownload: undefined,
  },
};

export const Uploading: Story = {
  args: {
    state: 'uploading',
    uploadProgress: 40,
  },
};
