import type { Meta, StoryObj } from '@storybook/react-vite';
import { SpecMatrix } from './shared/SpecMatrix';
import { tooltipSpec } from './components/tooltip/tooltip.spec';
import { SPECIMENS } from './components/specimens';
import { TextB, TextItalic, TextUnderline } from '@phosphor-icons/react';
import { IconButton } from './components/icon-button/IconButton';
import { Tooltip, TooltipPreview } from './components/tooltip/Tooltip';

const tools = [
  ['Bold', TextB],
  ['Italic', TextItalic],
  ['Underline', TextUnderline],
] as const;

function TooltipExample() {
  return (
    <Tooltip.Provider>
      <div style={{ display: 'flex', gap: 4 }}>
        {tools.map(([label, Icon]) => (
          <Tooltip.Root key={label}>
            <Tooltip.Trigger render={<IconButton variant="ghost" label={label} icon={<Icon weight="fill" />} />} />
            <Tooltip.Popup>{label}</Tooltip.Popup>
          </Tooltip.Root>
        ))}
      </div>
    </Tooltip.Provider>
  );
}

const meta = {
  title: 'Base UI/Components/Tooltip',
  component: TooltipExample,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof TooltipExample>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Hover or focus a button. Within the Provider, moving to the next button shows its tooltip at once. */
export const Default: Story = {};

/** The popup as designed in Figma (static). */
export const Preview: Story = { render: () => <TooltipPreview /> };

/** Every Side. */
export const Matrix: Story = {
  render: () => <SpecMatrix spec={tooltipSpec} render={SPECIMENS['tooltip']} />,
  parameters: { layout: 'padded' },
};
