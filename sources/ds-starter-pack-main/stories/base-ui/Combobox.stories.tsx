import type { Meta, StoryObj } from '@storybook/react-vite';
import { Combobox } from './components/combobox/Combobox';
import { comboboxSpec } from './components/combobox/combobox.spec';
import { Field } from './components/field/Field';
import { SPECIMENS } from './components/specimens';
import { SpecMatrix } from './shared/SpecMatrix';

const fruits = ['Apple', 'Apricot', 'Banana', 'Blueberry', 'Cherry', 'Grape', 'Kiwi', 'Lemon', 'Mango', 'Orange', 'Peach', 'Pear', 'Plum', 'Raspberry', 'Strawberry'];

function ComboboxExample() {
  return (
    <Field label="Fruit" style={{ width: 240 }}>
      <Combobox.Root items={fruits}>
        <Combobox.Input placeholder="e.g. Apple" />
        <Combobox.Popup>
          <Combobox.Empty>No fruits found.</Combobox.Empty>
          <Combobox.List>
            {(fruit: string) => (
              <Combobox.Item key={fruit} value={fruit}>
                {fruit}
              </Combobox.Item>
            )}
          </Combobox.List>
        </Combobox.Popup>
      </Combobox.Root>
    </Field>
  );
}

const meta = {
  title: 'Base UI/Components/Combobox',
  component: ComboboxExample,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof ComboboxExample>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Type to filter; pick with Enter or a click. The popup is a Listbox (see Select). */
export const Default: Story = {};

/** Every field variant (Size × State × Filled × Invalid). */
export const Matrix: Story = {
  render: () => <SpecMatrix spec={comboboxSpec} render={SPECIMENS['combobox']} />,
  parameters: { layout: 'padded' },
};
