import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, screen } from 'storybook/test';
import { Field } from './components/field/Field';
import { ListboxPreview } from './components/listbox/Listbox';
import { optionSpec } from './components/listbox/option.spec';
import { Select } from './components/select/Select';
import { selectSpec } from './components/select/select.spec';
import { SPECIMENS } from './components/specimens';
import { SpecMatrix } from './shared/SpecMatrix';

const apples = [
  { label: 'Gala', value: 'gala' },
  { label: 'Fuji', value: 'fuji' },
  { label: 'Honeycrisp', value: 'honeycrisp' },
  { label: 'Granny Smith', value: 'granny-smith' },
  { label: 'Pink Lady', value: 'pink-lady', disabled: true },
];

function SelectExample() {
  return (
    <Field label="Apple" description="Pick your favourite." style={{ width: 240 }}>
      <Select.Root items={apples}>
        <Select.Trigger placeholder="Select apple" />
        <Select.Popup>
          {apples.map(({ label, value, disabled }) => (
            <Select.Item key={value} value={value} disabled={disabled}>
              {label}
            </Select.Item>
          ))}
        </Select.Popup>
      </Select.Root>
    </Field>
  );
}

const meta = {
  title: 'Base UI/Components/Select',
  component: SelectExample,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof SelectExample>;

export default meta;
type Story = StoryObj<typeof meta>;

/** In a Field. The list opens over the trigger, aligned with the selected option. */
export const Default: Story = {};

/** Every trigger variant (Size × State × Filled × Invalid). */
export const Matrix: Story = {
  render: () => <SpecMatrix spec={selectSpec} render={SPECIMENS['select']} />,
  parameters: { layout: 'padded' },
};

/** The Listbox as designed in Figma (static). Also Combobox's and Autocomplete's popup. */
export const Listbox: Story = { render: () => <ListboxPreview /> };

/** Every Option variant (State × Selected). */
export const OptionMatrix: Story = {
  render: () => <SpecMatrix spec={optionSpec} render={SPECIMENS['option']} />,
  parameters: { layout: 'padded' },
};

/* ------------------------------------------------------------ behavior tests */

/** Behavior test: open with a click, pick an option, the trigger shows it. */
export const ClickToChoose: Story = {
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('combobox', { name: 'Apple' });
    await userEvent.click(trigger);
    await userEvent.click(await screen.findByRole('option', { name: 'Fuji' }));
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
    await expect(trigger).toHaveTextContent('Fuji');
  },
};

/** Behavior test: from the keyboard, ArrowDown opens the list and moves, Enter picks. */
export const KeyboardToChoose: Story = {
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('combobox', { name: 'Apple' });
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    const gala = await screen.findByRole('option', { name: 'Gala' });
    await waitFor(() => expect(gala).toHaveAttribute('data-highlighted'));
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(screen.getByRole('option', { name: 'Fuji' })).toHaveAttribute('data-highlighted'));
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
    await expect(trigger).toHaveTextContent('Fuji');
  },
};
