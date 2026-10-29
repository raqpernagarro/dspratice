import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { AttachmentCard } from './AttachmentCard';
import spec from './AttachmentCard.spec.md?raw';
import { specDocsParameters } from '../../../../docs/stripSpecTitle';

const sampleImage =
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=512&q=80';

const meta: Meta<typeof AttachmentCard> = {
  title: 'Data Display/Attachment/Attachment Card',
  component: AttachmentCard,
  tags: ['autodocs'],
  parameters: specDocsParameters(spec),
  args: {
    title: 'Title',
    metaData: 'Meta data',
    variant: 'file',
    descriptionPosition: 'outside',
    action: 'remove',
    onActionClick: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof AttachmentCard>;

export const Playground: Story = {};

export const ReadOnly: Story = {
  name: 'Read-only (default action="none")',
  args: {
    action: undefined,
  },
};

export const FileOutsideMoreAction: Story = {
  args: {
    action: 'more',
  },
};

export const FileOutsideLoading: Story = {
  args: {
    loading: true,
  },
};

export const PictureOutside: Story = {
  args: {
    variant: 'picture',
    imageSrc: sampleImage,
  },
};

export const FileInside: Story = {
  args: {
    descriptionPosition: 'inside',
  },
};

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <AttachmentCard title="Title" metaData="Meta data" variant="file" descriptionPosition="outside" action="none" />
      <AttachmentCard title="Title" metaData="Meta data" variant="file" descriptionPosition="outside" action="remove" />
      <AttachmentCard title="Title" metaData="Meta data" variant="file" descriptionPosition="outside" loading action="remove" />
      <AttachmentCard title="Title" metaData="Meta data" variant="picture" imageSrc={sampleImage} descriptionPosition="outside" action="none" />
      <AttachmentCard title="Title" metaData="Meta data" variant="picture" imageSrc={sampleImage} descriptionPosition="outside" action="remove" />
      <AttachmentCard title="Title" metaData="Meta data" variant="file" descriptionPosition="inside" action="none" />
      <AttachmentCard title="Title" metaData="Meta data" variant="file" descriptionPosition="inside" action="remove" />
      <AttachmentCard title="Title" metaData="Meta data" variant="file" descriptionPosition="inside" loading action="remove" />
    </div>
  ),
};
