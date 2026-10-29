import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Download, Share2, FileOutput, Link } from 'lucide-react';
import { Button } from '../../atoms/Button';
import { MediaViewer } from './MediaViewer';
import type { MediaViewerItem, MediaViewerProps } from './MediaViewer';
import spec from './MediaViewer.spec.md?raw';
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
];

const OWNERS = [
  { name: 'Ana Costa', avatarSrc: 'https://i.pravatar.cc/64?img=47' },
  { name: 'João Silva' },
];

const IMAGES: MediaViewerItem[] = PHOTOS.map(({ id, alt }, i) => ({
  id,
  type: 'image',
  src: unsplash(id, 2400),
  thumbnailSrc: unsplash(id, 160),
  title: `site-visit-${String(i + 1).padStart(2, '0')}.jpg`,
  alt,
  mimeType: 'image/jpeg',
  size: `${(1.4 + i * 0.3).toFixed(1)} MB`,
  owner: OWNERS[i % 2],
  createdAt: `${12 + i} Mar 2026`,
}));

/**
 * Builds a one-page PDF in the browser so the story works offline and isn't
 * blocked by another site's frame-ancestors policy.
 */
function samplePdfUrl(): string {
  if (typeof URL.createObjectURL !== 'function') return '';
  const text = 'Service agreement - sample document';
  const stream = `BT /F1 24 Tf 72 720 Td (${text}) Tj ET`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let body = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((obj, i) => {
    offsets.push(body.length);
    body += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xref = body.length;
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  body += offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('');
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return URL.createObjectURL(new Blob([body], { type: 'application/pdf' }));
}

const PDF: MediaViewerItem = {
  id: 'contract',
  type: 'pdf',
  src: samplePdfUrl(),
  title: 'service-agreement.pdf',
  mimeType: 'application/pdf',
  size: '84 KB',
  owner: OWNERS[1],
  createdAt: '2 Apr 2026',
};

const VIDEO: MediaViewerItem = {
  id: 'walkthrough',
  type: 'video',
  src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  poster: unsplash(PHOTOS[3].id, 1280),
  title: 'garden-walkthrough.mp4',
  mimeType: 'video/mp4',
  size: '1.1 MB',
  owner: OWNERS[0],
  createdAt: '3 Apr 2026',
};

const ARCHIVE: MediaViewerItem = {
  id: 'assets',
  type: 'file',
  src: 'https://example.com/brand-assets.zip',
  title: 'brand-assets.zip',
  mimeType: 'application/zip',
  size: '24 MB',
  owner: OWNERS[1],
  createdAt: '4 Apr 2026',
};

const MIXED: MediaViewerItem[] = [IMAGES[0], PDF, VIDEO, IMAGES[1], ARCHIVE];

const iconButton = (label: string, icon: React.ReactNode, onClick: () => void) => (
  <Button
    key={label}
    variant="ghost"
    showLabel={false}
    showLeadingIcon
    leadingIcon={icon}
    aria-label={label}
    onClick={onClick}
  />
);

// ─── Harness ──────────────────────────────────────────────────────────────────

/** Trigger + viewer. The viewer covers the viewport, so stories open it from a button. */
function ViewerDemo(props: MediaViewerProps) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(props.defaultIndex ?? 0);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Open viewer
      </Button>
      <MediaViewer
        {...props}
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          props.onOpenChange?.(next);
        }}
        index={index}
        onIndexChange={(next) => {
          setIndex(next);
          props.onIndexChange?.(next);
        }}
      />
    </>
  );
}

const openViewer = async (canvas: ReturnType<typeof within>) => {
  await userEvent.click(canvas.getByRole('button', { name: 'Open viewer' }));
  return within(document.body);
};

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<typeof MediaViewer> = {
  title: 'Data Display/Media Viewer',
  component: MediaViewer,
  tags: ['autodocs'],
  render: (args) => <ViewerDemo {...args} />,
  argTypes: {
    showZoom: { control: 'boolean' },
    showCounter: { control: 'boolean' },
    showThumbnails: { control: 'boolean' },
    showMetadata: { control: 'boolean' },
    closeOnEscape: { control: 'boolean' },
    items: { control: false },
    actions: { control: false },
    open: { control: false },
    index: { control: false },
  },
  args: {
    onOpenChange: fn(),
    onIndexChange: fn(),
  },
  parameters: specDocsParameters(spec),
};

export default meta;
type Story = StoryObj<typeof MediaViewer>;

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Playground: Story = {
  args: {
    label: 'Site visit photos',
    items: IMAGES,
  },
};

/** Interaction test for the Playground setup. */
export const Interaction: Story = {
  args: {
    label: 'Site visit photos',
    items: IMAGES,
  },
  play: async ({ canvas, args }) => {
    const body = await openViewer(canvas);
    await expect(body.getByRole('dialog', { name: 'Site visit photos' })).toBeInTheDocument();
    await expect(body.getByRole('button', { name: 'Close viewer' })).toHaveFocus();
    await userEvent.click(body.getByRole('button', { name: 'Next file' }));
    await expect(args.onIndexChange).toHaveBeenCalledWith(1);
    await expect(body.getByRole('heading', { name: 'site-visit-02.jpg' })).toBeInTheDocument();
    await userEvent.click(body.getByRole('button', { name: 'Zoom in' }));
    // Zoom animates, so the scale (and the enabled state) updates a few frames later.
    await waitFor(() => expect(body.getByRole('button', { name: 'Zoom out' })).toBeEnabled());
    await expect(body.getByRole('group', { name: 'Move image' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await expect(args.onOpenChange).toHaveBeenCalledWith(false);
    await expect(canvas.getByRole('button', { name: 'Open viewer' })).toHaveFocus();
  },
};

export const MixedFiles: Story = {
  name: 'Mixed files with actions',
  args: {
    label: 'Project files',
    items: MIXED,
    showThumbnails: true,
    actions: (item) => [
      iconButton(`Share ${item.title}`, <Share2 size={16} />, () => {
        if (navigator.share) void navigator.share({ title: item.title, url: item.src });
      }),
      iconButton(`Copy link to ${item.title}`, <Link size={16} />, () => {
        void navigator.clipboard?.writeText(item.src);
      }),
      iconButton(`Export ${item.title}`, <FileOutput size={16} />, () => {}),
      iconButton(`Download ${item.title}`, <Download size={16} />, () => {
        window.open(item.src, '_blank', 'noopener');
      }),
    ],
  },
  play: async ({ canvas }) => {
    const body = await openViewer(canvas);
    await expect(body.getByRole('group', { name: 'File actions' })).toBeInTheDocument();
    await userEvent.click(body.getByRole('button', { name: 'Show service-agreement.pdf' }));
    await expect(body.getByRole('button', { name: 'Download service-agreement.pdf' })).toBeInTheDocument();
    await expect(body.queryByRole('group', { name: 'Zoom' })).toBeNull();
    await userEvent.click(body.getByRole('button', { name: 'Show brand-assets.zip' }));
    await expect(body.getByText("There's no preview for this file type.")).toBeInTheDocument();
    await userEvent.click(body.getByRole('button', { name: 'Close viewer' }));
  },
};

export const PdfDocument: Story = {
  name: 'PDF document',
  args: {
    label: 'Contract',
    items: [PDF],
  },
  play: async ({ canvas }) => {
    const body = await openViewer(canvas);
    await expect(body.queryByRole('button', { name: 'Next file' })).toBeNull();
    await userEvent.click(body.getByRole('button', { name: 'Close viewer' }));
  },
};

export const Video: Story = {
  name: 'Video',
  args: {
    label: 'Walkthrough',
    items: [VIDEO],
  },
};

export const WithoutMetadata: Story = {
  name: 'Without metadata',
  args: {
    label: 'Product photos',
    items: IMAGES.slice(0, 4),
    showMetadata: false,
    showThumbnails: true,
  },
  play: async ({ canvas }) => {
    const body = await openViewer(canvas);
    await expect(body.queryByText('JPG')).toBeNull();
    await userEvent.click(body.getByRole('button', { name: 'Close viewer' }));
  },
};

export const StartAtItem: Story = {
  name: 'Opened at a specific item',
  args: {
    label: 'Site visit photos',
    items: IMAGES,
    defaultIndex: 5,
    showThumbnails: true,
  },
  play: async ({ canvas }) => {
    const body = await openViewer(canvas);
    await expect(body.getByRole('heading', { name: 'site-visit-06.jpg' })).toBeInTheDocument();
    await userEvent.click(body.getByRole('button', { name: 'Close viewer' }));
  },
};
