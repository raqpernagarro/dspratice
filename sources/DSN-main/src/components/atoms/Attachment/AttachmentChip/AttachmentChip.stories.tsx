import type { Meta, StoryObj } from '@storybook/react-vite';
import { AttachmentChip } from './AttachmentChip';
import spec from './AttachmentChip.spec.md?raw';
import { specDocsParameters } from '../../../../docs/stripSpecTitle';

const sampleImage =
  'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=512&q=80';

const meta: Meta<typeof AttachmentChip> = {
  title: 'Data Display/Attachment/Attachment Chip',
  component: AttachmentChip,
  tags: ['autodocs'],
  parameters: specDocsParameters(spec),
  args: {
    fileName: 'Proposal.pdf',
    fileSize: '10 MB',
    size: 'md',
    action: 'more',
  },
};

export default meta;
type Story = StoryObj<typeof AttachmentChip>;

export const Playground: Story = {};

export const RemoveAction: Story = {
  args: {
    action: 'remove',
  },
};

export const Loading: Story = {
  args: {
    loading: true,
    action: 'remove',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
  parameters: {
    // Intentional static disabled preview; keyboard interaction is covered by active stories/tests.
    a11y: { disable: true },
  },
};

export const PreviewableImage: Story = {
  args: {
    previewVariant: 'image',
    previewSrc: sampleImage,
    fileName: 'preview.png',
    fileSize: '2.3 MB',
    action: 'remove',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
  },
};
