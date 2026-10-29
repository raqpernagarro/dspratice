import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Slider } from './Slider';
import spec from './Slider.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

const meta: Meta<typeof Slider> = {
  title: 'Inputs & Controls/Slider',
  component: Slider,
  tags: ['autodocs'],
  parameters: { ...specDocsParameters(spec), storyWidth: 'field' },
};

export default meta;
type Story = StoryObj<typeof Slider>;

export const Playground: Story = {
  args: {
    min: 0,
    max: 200,
    defaultValue: 60,
    step: 5,
    showValue: true,
    showMinMax: true,
    'aria-label': 'Price slider',
  },
};

export const Controlled: Story = {
  render: (args) => {
    const [value, setValue] = useState(35);
    return <Slider {...args} value={value} onValueChange={setValue} />;
  },
  args: {
    min: 0,
    max: 100,
    step: 1,
    showValue: true,
    showMinMax: true,
    'aria-label': 'Volume slider',
  },
};

export const Disabled: Story = {
  args: {
    min: 0,
    max: 100,
    defaultValue: 45,
    disabled: true,
    showValue: true,
    showMinMax: true,
    'aria-label': 'Disabled slider',
  },
};

export const Range: Story = {
  args: {
    mode: 'range',
    min: 0,
    max: 200,
    defaultRangeValue: [40, 140],
    step: 5,
    showValue: true,
    showMinMax: true,
    minHandleAriaLabel: 'Minimum price',
    maxHandleAriaLabel: 'Maximum price',
  },
};

export const RangeControlled: Story = {
  render: (args) => {
    const [rangeValue, setRangeValue] = useState<[number, number]>([25, 70]);
    return <Slider {...args} mode="range" rangeValue={rangeValue} onRangeChange={setRangeValue} />;
  },
  args: {
    min: 0,
    max: 100,
    step: 1,
    showValue: true,
    showMinMax: true,
    minHandleAriaLabel: 'Minimum value',
    maxHandleAriaLabel: 'Maximum value',
  },
};

export const SetVerticalSingle: Story = {
  args: {
    mode: 'single',
    stack: 'vertical',
    showInput: true,
    min: 0,
    max: 200,
    defaultValue: 60,
    step: 5,
  },
};

export const SetVerticalRange: Story = {
  args: {
    mode: 'range',
    stack: 'vertical',
    showInput: true,
    min: 0,
    max: 200,
    defaultRangeValue: [40, 160],
    step: 5,
    minHandleAriaLabel: 'Minimum price',
    maxHandleAriaLabel: 'Maximum price',
    minInputLabel: 'Min',
    maxInputLabel: 'Max',
  },
};

export const SetHorizontalSingle: Story = {
  args: {
    mode: 'single',
    stack: 'horizontal',
    showInput: true,
    min: 0,
    max: 200,
    defaultValue: 60,
    step: 5,
  },
};

export const SetHorizontalRange: Story = {
  args: {
    mode: 'range',
    stack: 'horizontal',
    showInput: true,
    min: 0,
    max: 200,
    defaultRangeValue: [20, 140],
    step: 5,
    minHandleAriaLabel: 'Minimum price',
    maxHandleAriaLabel: 'Maximum price',
  },
};
