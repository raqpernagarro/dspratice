import type { Meta, StoryObj } from '@storybook/react-vite';
import { Slider } from './components/slider/Slider';
import { sliderSpec } from './components/slider/slider.spec';
import { SPECIMENS } from './components/specimens';
import { SpecMatrix } from './shared/SpecMatrix';

const meta = {
  title: 'Base UI/Components/Slider',
  component: Slider,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { size: 'md', defaultValue: 40, thumbLabels: ['Volume'] } };
/** Two thumbs for a range. */
export const Range: Story = { args: { size: 'md', defaultValue: [20, 70], thumbLabels: ['Minimum price', 'Maximum price'] } };
/** Every Figma variant (Size × State), states shown statically. */
export const Matrix: Story = {
  args: {},
  render: () => <SpecMatrix spec={sliderSpec} render={SPECIMENS['slider']} />,
  parameters: { layout: 'padded' },
};
