import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent } from 'storybook/test';
import { Field } from './components/field/Field';
import { NumberField } from './components/number-field/NumberField';
import { numberFieldSpec } from './components/number-field/number-field.spec';
import { SPECIMENS } from './components/specimens';
import { SpecMatrix } from './shared/SpecMatrix';

const meta = {
  title: 'Base UI/Components/Number Field',
  component: NumberField,
  parameters: { layout: 'centered' },
  argTypes: { size: { control: 'select', options: ['sm', 'md', 'lg'] }, disabled: { control: 'boolean' } },
} satisfies Meta<typeof NumberField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { size: 'md', defaultValue: 100, min: 0, max: 999, 'aria-label': 'Amount' } };

/** With a label, inside Field. */
export const InField: Story = {
  args: {},
  render: () => (
    <Field label="Quantity" description="Up to 10 per order">
      <NumberField defaultValue={1} min={1} max={10} />
    </Field>
  ),
};

/** Every Figma variant (Size × State × Invalid), states shown statically. */
export const Matrix: Story = {
  args: {},
  render: () => <SpecMatrix spec={numberFieldSpec} render={SPECIMENS['number-field']} />,
  parameters: { layout: 'padded' },
};

/* ------------------------------------------------------------ behavior tests */

const amount = { size: 'md', defaultValue: 5, min: 0, max: 10, 'aria-label': 'Amount' } as const;

/** Behavior test: Increase and Decrease step the value by one. */
export const StepButtons: Story = {
  args: amount,
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'Amount' });
    await userEvent.click(canvas.getByRole('button', { name: 'Increase' }));
    await expect(input).toHaveValue('6');
    await userEvent.click(canvas.getByRole('button', { name: 'Decrease' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Decrease' }));
    await expect(input).toHaveValue('4');
  },
};

/** Behavior test: a typed number is kept, one above max is clamped to max when the field loses focus. */
export const TypedValueIsClamped: Story = {
  args: amount,
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'Amount' });
    await userEvent.clear(input);
    await userEvent.type(input, '7');
    await userEvent.tab();
    await expect(input).toHaveValue('7');
    await userEvent.clear(input);
    await userEvent.type(input, '50');
    await userEvent.tab();
    await expect(input).toHaveValue('10');
  },
};
