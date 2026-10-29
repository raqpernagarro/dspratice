import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox } from './components/checkbox/Checkbox';
import { CheckboxGroup } from './components/checkbox-group/CheckboxGroup';
import { checkboxGroupSpec } from './components/checkbox-group/checkbox-group.spec';
import { SPECIMENS } from './components/specimens';
import { SpecMatrix } from './shared/SpecMatrix';

const meta = {
  title: 'Base UI/Components/Checkbox Group',
  component: CheckboxGroup,
  parameters: { layout: 'centered' },
  argTypes: { size: { control: 'select', options: ['sm', 'md', 'lg'] }, disabled: { control: 'boolean' } },
} satisfies Meta<typeof CheckboxGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { label: 'Apples', size: 'md', defaultValue: ['fuji-apple'] },
  render: (args) => (
    <CheckboxGroup {...args}>
      <Checkbox value="fuji-apple">Fuji</Checkbox>
      <Checkbox value="gala-apple">Gala</Checkbox>
      <Checkbox value="granny-smith-apple">Granny Smith</Checkbox>
    </CheckboxGroup>
  ),
};

const APPLES = ['fuji-apple', 'gala-apple', 'granny-smith-apple'];

/** A parent checkbox selects all; it shows indeterminate while some are selected. */
export const SelectAll: Story = {
  args: {},
  render: () => {
    const [value, setValue] = React.useState<string[]>(['fuji-apple']);
    return (
      <CheckboxGroup label="Apples" value={value} onValueChange={setValue} allValues={APPLES}>
        <Checkbox parent>All apples</Checkbox>
        <Checkbox value="fuji-apple">Fuji</Checkbox>
        <Checkbox value="gala-apple">Gala</Checkbox>
        <Checkbox value="granny-smith-apple">Granny Smith</Checkbox>
      </CheckboxGroup>
    );
  },
};

/** Every Checkbox Group variant (Size). */
export const Matrix: Story = {
  args: {},
  render: () => <SpecMatrix spec={checkboxGroupSpec} render={SPECIMENS['checkbox-group']} sections={[]} columns="size" />,
  parameters: { layout: 'padded' },
};
