import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { PlaceholderIcon } from '../../atoms/_dev/PlaceholderIcon';
import { CheckboxField } from './CheckboxField';
import spec from './CheckboxField.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

const meta: Meta<typeof CheckboxField> = {
  title: 'Inputs & Controls/Checkbox Field',
  component: CheckboxField,
  tags: ['autodocs'],
  parameters: { ...specDocsParameters(spec), storyWidth: 'field' },
};

export default meta;
type Story = StoryObj<typeof CheckboxField>;

export const Playground: Story = {
  args: {
    label: 'Label',
    checkboxLabel: 'Label',
    helperText: 'Help text',
  },
};

export const Optional: Story = {
  args: {
    label: 'Notifications',
    checkboxLabel: 'Enable email alerts',
    optional: true,
    helperText: 'You can change this later in settings.',
  },
};

export const Checked: Story = {
  args: {
    label: 'Label',
    checkboxLabel: 'Label',
    checked: true,
    helperText: 'Help text',
  },
};

export const WithHelperIcon: Story = {
  name: 'With helper icon',
  args: {
    label: 'Label',
    checkboxLabel: 'Label',
    helperText: 'Help text',
    helperIcon: <PlaceholderIcon />,
  },
};

export const Error: Story = {
  args: {
    label: 'Label',
    checkboxLabel: 'Label',
    error: true,
    errorMessage: 'Please check this option',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Label',
    checkboxLabel: 'Label',
    checked: true,
    disabled: true,
    helperText: 'Help text',
  },
};

export const Controlled: Story = {
  render: () => {
    const [checked, setChecked] = useState(false);
    return (
      <CheckboxField
        label="Label"
        checkboxLabel="Label"
        checked={checked}
        onCheckedChange={setChecked}
        helperText="Help text"
      />
    );
  },
};
