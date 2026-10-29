import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextAlignCenter, TextAlignLeft, TextAlignRight, TextB, TextItalic, TextUnderline } from '@phosphor-icons/react';
import { Toggle } from './components/toggle/Toggle';
import { ToggleGroup } from './components/toggle-group/ToggleGroup';
import { toggleGroupSpec } from './components/toggle-group/toggle-group.spec';
import { SPECIMENS } from './components/specimens';
import { SpecMatrix } from './shared/SpecMatrix';

const meta = {
  title: 'Base UI/Components/Toggle Group',
  component: ToggleGroup,
  parameters: { layout: 'centered' },
  argTypes: { size: { control: 'select', options: ['sm', 'md', 'lg'] }, disabled: { control: 'boolean' } },
} satisfies Meta<typeof ToggleGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/** One on at a time (alignment). */
export const Default: Story = {
  args: { size: 'md', defaultValue: ['left'] },
  render: (args) => (
    <ToggleGroup {...args}>
      <Toggle value="left" icon={TextAlignLeft} label="Align left" />
      <Toggle value="center" icon={TextAlignCenter} label="Align center" />
      <Toggle value="right" icon={TextAlignRight} label="Align right" />
    </ToggleGroup>
  ),
};

/** Several on at once (formatting). */
export const Multiple: Story = {
  args: { size: 'md', multiple: true, defaultValue: ['bold'] },
  render: (args) => (
    <ToggleGroup {...args}>
      <Toggle value="bold" icon={TextB} label="Bold" />
      <Toggle value="italic" icon={TextItalic} label="Italic" />
      <Toggle value="underline" icon={TextUnderline} label="Underline" />
    </ToggleGroup>
  ),
};

/** Every Figma variant (Size). */
export const Matrix: Story = {
  args: {},
  render: () => <SpecMatrix spec={toggleGroupSpec} render={SPECIMENS['toggle-group']} sections={[]} columns="size" />,
  parameters: { layout: 'padded' },
};
