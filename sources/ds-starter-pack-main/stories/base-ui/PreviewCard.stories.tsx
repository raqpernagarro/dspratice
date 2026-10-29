import type { Meta, StoryObj } from '@storybook/react-vite';
import { SpecMatrix } from './shared/SpecMatrix';
import { previewCardSpec } from './components/preview-card/preview-card.spec';
import { SPECIMENS } from './components/specimens';
import { PreviewCard, PreviewCardPreview } from './components/preview-card/PreviewCard';

// A local picture, so the story works offline.
const PICTURE =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="288"><defs><linearGradient id="g" x2="1" y2="1"><stop offset="0" stop-color="#c7d2fe"/><stop offset="1" stop-color="#fbcfe8"/></linearGradient></defs><rect width="480" height="288" fill="url(#g)"/><text x="40" y="200" font-family="Georgia" font-size="140" fill="#1e1b4b">Aa</text></svg>',
  );

function PreviewCardExample() {
  return (
    <PreviewCard.Root>
      <p style={{ margin: 0, maxWidth: 360, font: 'inherit', color: 'var(--color-foreground-neutral-primary)' }}>
        The principles of good{' '}
        <PreviewCard.Trigger href="https://en.wikipedia.org/wiki/Typography">typography</PreviewCard.Trigger> remain in the digital age.
      </p>
      <PreviewCard.Popup>
        <PreviewCard.Image src={PICTURE} alt="The letters Aa on a soft gradient" />
        <PreviewCard.Title>Typography</PreviewCard.Title>
        <PreviewCard.Summary>The art and science of arranging type to make written language clear and appealing.</PreviewCard.Summary>
      </PreviewCard.Popup>
    </PreviewCard.Root>
  );
}

const meta = {
  title: 'Base UI/Components/Preview Card',
  component: PreviewCardExample,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof PreviewCardExample>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Hover or focus the link. */
export const Default: Story = {};

/** The card as designed in Figma (static; the image is its placeholder). */
export const Preview: Story = { render: () => <PreviewCardPreview /> };

/** Every Side. */
export const Matrix: Story = {
  render: () => <SpecMatrix spec={previewCardSpec} render={SPECIMENS['preview-card']} />,
  parameters: { layout: 'padded' },
};
