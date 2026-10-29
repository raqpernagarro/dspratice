import type { Meta, StoryObj } from '@storybook/react-vite';
import { FileThumbnail, type FileThumbnailSize } from './FileThumbnail';
import spec from './FileThumbnail.spec.md?raw';
import { specDocsParameters } from '../../../../docs/stripSpecTitle';

const sampleImage =
  'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=512&q=80';

const SIZES: FileThumbnailSize[] = [
  'xxSmall',
  'xSmall',
  'small',
  'medium',
  'large',
  'xLarge',
  'xxLarge',
];

const meta: Meta<typeof FileThumbnail> = {
  title: 'Data Display/Attachment/File Thumbnail',
  component: FileThumbnail,
  tags: ['autodocs'],
  parameters: specDocsParameters(spec),
  args: {
    variant: 'file',
    size: 'medium',
  },
  argTypes: {
    variant: { control: 'select', options: ['file', 'image'] },
    size: {
      control: 'select',
      options: SIZES,
    },
  },
};

export default meta;
type Story = StoryObj<typeof FileThumbnail>;

export const Playground: Story = {
  args: {
    variant: 'file',
    size: 'medium',
    imageSrc: sampleImage,
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
      {SIZES.map((size) => (
        <FileThumbnail key={`file-${size}`} variant="file" size={size} />
      ))}
      {SIZES.map((size) => (
        <FileThumbnail key={`img-${size}`} variant="image" size={size} imageSrc={sampleImage} />
      ))}
    </div>
  ),
};

export const ImageWithoutSource: Story = {
  name: 'Image without source (falls back to file icon)',
  args: {
    variant: 'image',
    size: 'large',
    imageSrc: undefined,
  },
};
