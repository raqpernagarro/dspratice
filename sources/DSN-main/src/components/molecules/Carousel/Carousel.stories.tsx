import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { Carousel, CarouselSlide } from './Carousel';
import { SkeletonLoading } from '../../atoms/SkeletonLoading';
import spec from './Carousel.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const unsplash = (id: string, w: number) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

const PHOTOS: { id: string; alt: string }[] = [
  { id: '1506905925346-21bda4d32df4', alt: 'Snow-capped peaks above a sea of clouds' },
  { id: '1469474968028-56623f02e42e', alt: 'Sunlight over a forested valley' },
  { id: '1501785888041-af3ef285b470', alt: 'Lake surrounded by mountains at dusk' },
  { id: '1441974231531-c6227db76b6e', alt: 'Sunbeams through a green forest' },
  { id: '1470071459604-3b5ec3a7fe05', alt: 'Misty hills at sunrise' },
  { id: '1472214103451-9374bd1c798e', alt: 'Rolling green fields under a cloudy sky' },
  { id: '1500530855697-b586d89ba3ee', alt: 'Road winding through a mountain landscape' },
  { id: '1447752875215-b2761acb3c5d', alt: 'Path through an autumn forest' },
  { id: '1433086966358-54859d0ed716', alt: 'Waterfall in a mossy gorge' },
  { id: '1465146344425-f00d5f5c8f07', alt: 'Wildflower meadow at golden hour' },
  { id: '1426604966848-d7adac402bff', alt: 'Mountain lake reflecting the sky' },
  { id: '1439066615861-d1af74d74000', alt: 'Calm lake with a wooden pier' },
  { id: '1418065460487-3e41a6c84dc5', alt: 'Fog drifting through pine trees' },
  { id: '1475924156734-496f6cac6ec1', alt: 'Coastal cliffs at sunset' },
  { id: '1464822759023-fed622ff2c3b', alt: 'Rocky mountain ridge in sunlight' },
  { id: '1490750967868-88aa4486c946', alt: 'Pink tulips in a field' },
  { id: '1482192596544-9eb780fc7f66', alt: 'Hot air balloons over a valley' },
  { id: '1505765050516-f72dcac9c60e', alt: 'Snowy forest under a clear sky' },
  { id: '1511593358241-7eea1f3c84e5', alt: 'Desert dunes with long shadows' },
  { id: '1497436072909-60f360e1d4b1', alt: 'Green hills with a lone tree' },
  { id: '1502082553048-f009c37129b9', alt: 'Tree on a hill under a starry sky' },
  { id: '1414609245224-afa02bfb3fda', alt: 'Wheat field at dusk' },
  { id: '1434725039720-aaad6dd32dfe', alt: 'Grassy hills under storm clouds' },
  { id: '1431794062232-2a99a5431c6c', alt: 'River valley seen from above' },
  { id: '1446329813274-7c9036bd9a1f', alt: 'Earth seen from orbit at night' },
  { id: '1473773508845-188df298d2d1', alt: 'Forest canopy from above' },
  { id: '1444090542259-0af8fa96557e', alt: 'Waves breaking on a rocky shore' },
];

const slides = (n: number) =>
  PHOTOS.slice(0, n).map(({ id, alt }) => (
    <CarouselSlide key={id} thumbnailSrc={unsplash(id, 160)} thumbnailAlt={`Show: ${alt}`}>
      <img src={unsplash(id, 1280)} alt={alt} loading="lazy" />
    </CarouselSlide>
  ));

const width = (w: number) => [
  (Story: React.ComponentType) => (
    <div style={{ width: `min(${w}px, 90vw)` }}>
      <Story />
    </div>
  ),
];

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<typeof Carousel> = {
  title: 'Data Display/Carousel',
  component: Carousel,
  tags: ['autodocs'],
  argTypes: {
    ratio: { control: 'select', options: ['16:9', '21:9', '3:2', '4:3', '1:1', '3:4', '9:16'] },
    shape: { control: 'select', options: ['rectangle', 'rounded'] },
    showCounter: { control: 'boolean' },
    showDots: { control: 'boolean' },
    showThumbnails: { control: 'boolean' },
    children: { control: false },
    index: { control: false },
  },
  parameters: specDocsParameters(spec),
  decorators: width(720),
};

export default meta;
type Story = StoryObj<typeof Carousel>;

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Playground: Story = {
  args: {
    label: 'Project photos',
    ratio: '16:9',
    children: slides(27),
  },
};

/** Interaction test for the Playground setup. */
export const Interaction: Story = {
  args: {
    label: 'Project photos',
    ratio: '16:9',
    children: slides(27),
  },
  play: async ({ canvas, canvasElement }) => {
    const counter = () => canvasElement.querySelector('.dsn-carousel-counter')?.textContent;
    await expect(counter()).toBe('1 / 27');
    await expect(canvas.queryByRole('button', { name: 'Previous slide' })).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Next slide' }));
    await expect(counter()).toBe('2 / 27');
    await userEvent.keyboard('{End}');
    await expect(counter()).toBe('27 / 27');
    await expect(canvas.queryByRole('button', { name: 'Next slide' })).toBeNull();
    await userEvent.keyboard('{Home}');
    await expect(counter()).toBe('1 / 27');
  },
};

export const WithThumbnails: Story = {
  name: 'With thumbnails',
  args: {
    label: 'Project photos',
    ratio: '3:2',
    shape: 'rounded',
    showThumbnails: true,
    children: slides(27),
  },
  play: async ({ canvas, canvasElement }) => {
    const thumb = canvas.getByRole('button', { name: `Show: ${PHOTOS[4].alt}` });
    await userEvent.click(thumb);
    await expect(thumb).toHaveAttribute('aria-current', 'true');
    await expect(canvasElement.querySelector('.dsn-carousel-counter')?.textContent).toBe('5 / 27');
  },
};

export const WithDots: Story = {
  name: 'With dots (small set)',
  args: {
    label: 'Featured places',
    ratio: '16:9',
    shape: 'rounded',
    showDots: true,
    showCounter: false,
    children: slides(5),
  },
  play: async ({ canvas }) => {
    const dot = canvas.getByRole('button', { name: 'Go to slide 3' });
    await userEvent.click(dot);
    await expect(dot).toHaveAttribute('aria-current', 'true');
  },
};

export const Rounded: Story = {
  name: 'Rounded 4:3',
  args: {
    label: 'Project photos',
    ratio: '4:3',
    shape: 'rounded',
    children: slides(8),
  },
  decorators: width(480),
};

export const SingleImage: Story = {
  name: 'Single image (no controls)',
  args: {
    label: 'Project photo',
    children: slides(1),
  },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('button')).toBeNull();
  },
};

const ControlledDemo = (args: React.ComponentProps<typeof Carousel>) => {
  const [index, setIndex] = useState(3);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
      <Carousel
        {...args}
        index={index}
        onIndexChange={(i) => {
          setIndex(i);
          args.onIndexChange?.(i);
        }}
      />
      <span style={{ fontSize: 'var(--font-size-label)', color: 'var(--color-foreground-neutral-secondary)' }}>
        Selected: {PHOTOS[index].alt}
      </span>
    </div>
  );
};

export const Controlled: Story = {
  name: 'Controlled index',
  args: {
    label: 'Project photos',
    onIndexChange: fn(),
    children: slides(10),
  },
  render: (args) => <ControlledDemo {...args} />,
  play: async ({ args, canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Next slide' }));
    await expect(args.onIndexChange).toHaveBeenCalledWith(4);
    await expect(canvas.getByText(`Selected: ${PHOTOS[4].alt}`)).toBeInTheDocument();
  },
};

export const Loading: Story = {
  name: 'Loading',
  args: {
    label: 'Project photos',
    showCounter: false,
    children: [
      <CarouselSlide key="loading">
        <SkeletonLoading type="image" />
      </CarouselSlide>,
    ],
  },
};
