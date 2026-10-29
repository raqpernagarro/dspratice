import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { PlaceholderIcon } from '../_dev/PlaceholderIcon';
import { Combobox } from './Combobox';
import spec from './Combobox.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

const options = [
  { value: 'one', label: 'Label A' },
  { value: 'two', label: 'Label B' },
  { value: 'three', label: 'Label C' },
  { value: 'four', label: 'Label D' },
];

const meta: Meta<typeof Combobox> = {
  title: 'Inputs & Controls/Combobox',
  component: Combobox,
  tags: ['autodocs'],
  parameters: { ...specDocsParameters(spec), storyWidth: 'field' },
};

export default meta;
type Story = StoryObj<typeof Combobox>;

export const Playground: Story = {
  args: {
    label: 'Label',
    placeholder: 'Placeholder',
    helperText: 'Help text',
    options,
  },
};

export const Optional: Story = {
  args: {
    label: 'Skills',
    placeholder: 'Search skills',
    optional: true,
    helperText: 'Add skills that are nice to have.',
    options,
  },
};

export const ActiveWithPopover: Story = {
  args: {
    label: 'Label',
    placeholder: 'Placeholder',
    helperText: 'Help text',
    options,
    defaultOpen: true,
  },
};

export const Filled: Story = {
  args: {
    label: 'Label',
    placeholder: 'Placeholder',
    helperText: 'Help text',
    options,
    defaultValue: 'two',
  },
};

export const Error: Story = {
  args: {
    label: 'Label',
    placeholder: 'Placeholder',
    helperText: 'Help text',
    options,
    error: true,
    errorMessage: 'Help text',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Label',
    placeholder: 'Placeholder',
    helperText: 'Help text',
    options,
    disabled: true,
  },
  parameters: {
    a11y: { disable: true },
  },
};

export const MultiSelectDefault: Story = {
  args: {
    label: 'Label',
    placeholder: 'Add',
    helperText: 'Help text',
    options,
    selectionMode: 'multi',
  },
};

export const MultiSelectActiveWithChips: Story = {
  args: {
    label: 'Label',
    placeholder: 'Add',
    helperText: 'Help text',
    options,
    selectionMode: 'multi',
    defaultValues: ['one'],
    defaultOpen: true,
  },
};

export const MultiSelectImmediateAdd: Story = {
  args: {
    label: 'Label',
    placeholder: 'Add',
    helperText: 'Help text',
    options,
    selectionMode: 'multi',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The listbox is portaled to document.body, outside the story canvas.
    const popover = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('combobox', { name: 'Label' }));
    const listbox = popover.getByRole('listbox', { name: 'Label options' });
    await userEvent.click(within(listbox).getByRole('option', { name: 'Label B' }));
    expect(canvas.getByLabelText('Remove Label B')).toBeInTheDocument();
  },
};

export const MultiSelectBlurCloses: Story = {
  args: {
    label: 'Label',
    placeholder: 'Add',
    helperText: 'Help text',
    options,
    selectionMode: 'multi',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The listbox is portaled to document.body, outside the story canvas.
    const popover = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('combobox', { name: 'Label' }));
    const listbox = popover.getByRole('listbox', { name: 'Label options' });
    await userEvent.click(within(listbox).getByRole('option', { name: 'Label C' }));
    expect(canvas.getByLabelText('Remove Label C')).toBeInTheDocument();
    await userEvent.click(canvasElement.ownerDocument.body);
    expect(popover.queryByRole('listbox')).not.toBeInTheDocument();
    expect(canvas.getByLabelText('Remove Label C')).toBeInTheDocument();
  },
};

export const MultiSelectEscapeCloses: Story = {
  args: {
    label: 'Label',
    placeholder: 'Add',
    helperText: 'Help text',
    options,
    selectionMode: 'multi',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The listbox is portaled to document.body, outside the story canvas.
    const popover = within(canvasElement.ownerDocument.body);
    const input = canvas.getByRole('combobox', { name: 'Label' });
    await userEvent.click(input);
    const listbox = popover.getByRole('listbox', { name: 'Label options' });
    await userEvent.click(within(listbox).getByRole('option', { name: 'Label D' }));
    expect(canvas.getByLabelText('Remove Label D')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(popover.queryByRole('listbox')).not.toBeInTheDocument();
    expect(canvas.getByLabelText('Remove Label D')).toBeInTheDocument();
  },
};

export const MultiSelectError: Story = {
  args: {
    label: 'Label',
    placeholder: 'Add',
    helperText: 'Help text',
    options,
    selectionMode: 'multi',
    error: true,
    errorMessage: 'Help text',
  },
};

export const MultiSelectDisabled: Story = {
  args: {
    label: 'Label',
    placeholder: 'Add',
    helperText: 'Help text',
    options,
    selectionMode: 'multi',
    defaultValues: ['one', 'two'],
    disabled: true,
  },
  parameters: {
    a11y: { disable: true },
  },
};

export const WithHelperIcon: Story = {
  name: 'With helper icon',
  args: {
    label: 'Label',
    placeholder: 'Placeholder',
    helperText: 'Help text',
    helperIcon: <PlaceholderIcon />,
    options,
  },
};
