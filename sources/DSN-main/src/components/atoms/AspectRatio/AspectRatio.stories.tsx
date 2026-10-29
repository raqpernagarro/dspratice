import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { AspectRatio } from './AspectRatio';
import type { AspectRatioRatio, AspectRatioShape, AspectRatioFit } from './AspectRatio';
import { SkeletonLoading } from '../SkeletonLoading';
import spec from './AspectRatio.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const unsplash = (id: string, w = 960) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

const MOUNTAINS = unsplash('1506905925346-21bda4d32df4');
const PORTRAIT = unsplash('1494790108377-be9c29b29330', 640);

const GALLERY = [
  { src: unsplash('1469474968028-56623f02e42e', 640), alt: 'Sunlight over a forested valley' },
  { src: unsplash('1501785888041-af3ef285b470', 640), alt: 'Lake surrounded by mountains at dusk' },
  { src: unsplash('1441974231531-c6227db76b6e', 640), alt: 'Sunbeams through a green forest' },
  { src: unsplash('1470071459604-3b5ec3a7fe05', 640), alt: 'Misty hills at sunrise' },
  { src: unsplash('1472214103451-9374bd1c798e', 640), alt: 'Rolling green fields under a cloudy sky' },
  { src: unsplash('1500530855697-b586d89ba3ee', 640), alt: 'Road winding through a mountain landscape' },
];

const RATIOS: AspectRatioRatio[] = ['16:9', '21:9', '3:2', '4:3', '1:1', '3:4', '9:16'];
const SHAPES: AspectRatioShape[] = ['rectangle', 'rounded', 'ellipse'];
const FITS: AspectRatioFit[] = ['cover', 'contain', 'center'];

const mediumWidth = [(Story: React.ComponentType) => <div style={{ width: 'min(480px, 90vw)' }}><Story /></div>];

const captionStyle: React.CSSProperties = {
  fontSize: 'var(--font-size-label)',
  color: 'var(--color-foreground-neutral-secondary)',
  marginTop: 'var(--space-xs)',
};

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<typeof AspectRatio> = {
  title: 'Layout/Aspect Ratio',
  component: AspectRatio,
  tags: ['autodocs'],
  argTypes: {
    ratio: { control: 'select', options: RATIOS },
    fit:   { control: 'select', options: [undefined, ...FITS] },
    shape: { control: 'select', options: SHAPES },
    children: { control: false },
  },
  parameters: specDocsParameters(spec),
};

export default meta;
type Story = StoryObj<typeof AspectRatio>;

// ─── Basic ────────────────────────────────────────────────────────────────────

export const Playground: Story = {
  decorators: mediumWidth,
  args: {
    ratio: '16:9',
    fit: 'cover',
    shape: 'rectangle',
    children: <img src={MOUNTAINS} alt="Snow-capped peaks above a sea of clouds" />,
  },
};

/** Interaction test for the Playground setup. */
export const Interaction: Story = {
  decorators: mediumWidth,
  args: {
    ratio: '16:9',
    fit: 'cover',
    shape: 'rectangle',
    children: <img src={MOUNTAINS} alt="Snow-capped peaks above a sea of clouds" />,
  },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByRole('img', { name: /snow-capped peaks/i })).toBeInTheDocument();
    const box = canvasElement.querySelector('.dsn-aspect-ratio') as HTMLElement;
    const { width, height } = box.getBoundingClientRect();
    await expect(Math.abs(width / height - 16 / 9)).toBeLessThan(0.02);
  },
};

export const Square: Story = {
  name: '1:1 square image',
  args: {
    ratio: '1:1',
    fit: 'cover',
    children: <img src={PORTRAIT} alt="Smiling person in a red sweater" />,
  },
  decorators: [(Story) => <div style={{ width: 240 }}><Story /></div>],
};

export const Rounded: Story = {
  decorators: mediumWidth,
  name: 'Rounded corners',
  args: {
    ratio: '3:2',
    fit: 'cover',
    shape: 'rounded',
    children: <img src={MOUNTAINS} alt="Snow-capped peaks above a sea of clouds" />,
  },
};

export const Circle: Story = {
  name: 'Circle (ellipse at 1:1)',
  args: {
    ratio: '1:1',
    fit: 'cover',
    shape: 'ellipse',
    children: <img src={PORTRAIT} alt="Smiling person in a red sweater" />,
  },
  decorators: [(Story) => <div style={{ width: 160 }}><Story /></div>],
};

// ─── Variations ───────────────────────────────────────────────────────────────

export const Ratios: Story = {
  decorators: [(Story) => <div style={{ width: 'min(960px, 90vw)' }}><Story /></div>],
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: 'var(--space-md)',
        alignItems: 'start',
      }}
    >
      {RATIOS.map((ratio) => (
        <div key={ratio}>
          <AspectRatio ratio={ratio} fit="cover" shape="rounded">
            <img src={ratio === '3:4' || ratio === '9:16' ? PORTRAIT : MOUNTAINS} alt="" />
          </AspectRatio>
          <div style={captionStyle}>{ratio}</div>
        </div>
      ))}
    </div>
  ),
};

export const Shapes: Story = {
  decorators: [(Story) => <div style={{ width: 'min(720px, 90vw)' }}><Story /></div>],
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-md)' }}>
      {SHAPES.map((shape) => (
        <div key={shape}>
          <AspectRatio ratio="4:3" fit="cover" shape={shape}>
            <img src={MOUNTAINS} alt="" />
          </AspectRatio>
          <div style={captionStyle}>{shape}</div>
        </div>
      ))}
    </div>
  ),
};

export const FitModes: Story = {
  name: 'Fit modes',
  decorators: [(Story) => <div style={{ width: 'min(720px, 90vw)' }}><Story /></div>],
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-md)' }}>
      {FITS.map((fit) => (
        <div key={fit}>
          <div style={{ backgroundColor: 'var(--color-background-interactive-disabled)' }}>
            <AspectRatio ratio="16:9" fit={fit}>
              <img
                src={unsplash('1494790108377-be9c29b29330', 120)}
                alt=""
                style={fit === 'center' ? { width: 64 } : undefined}
              />
            </AspectRatio>
          </div>
          <div style={captionStyle}>{fit}</div>
        </div>
      ))}
    </div>
  ),
};

// ─── In context ───────────────────────────────────────────────────────────────

export const Gallery: Story = {
  name: 'Image gallery (4:3)',
  decorators: [(Story) => <div style={{ width: 'min(720px, 90vw)' }}><Story /></div>],
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: 'var(--space-md)',
      }}
    >
      {GALLERY.map((image) => (
        <AspectRatio key={image.src} ratio="4:3" fit="cover" shape="rounded">
          <img src={image.src} alt={image.alt} />
        </AspectRatio>
      ))}
    </div>
  ),
};

export const LoadingSkeleton: Story = {
  decorators: mediumWidth,
  name: 'Loading skeleton',
  args: {
    ratio: '16:9',
    fit: 'cover',
    shape: 'rounded',
    children: <SkeletonLoading type="image" />,
  },
  play: async ({ canvasElement }) => {
    const box = canvasElement.querySelector('.dsn-aspect-ratio') as HTMLElement;
    const skeleton = canvasElement.querySelector('.dsn-skeleton-loading') as HTMLElement;
    await expect(skeleton.getBoundingClientRect().width).toBeCloseTo(box.getBoundingClientRect().width, 0);
    await expect(skeleton.getBoundingClientRect().height).toBeCloseTo(box.getBoundingClientRect().height, 0);
  },
};
