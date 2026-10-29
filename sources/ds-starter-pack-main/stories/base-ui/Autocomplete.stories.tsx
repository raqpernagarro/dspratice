import type { Meta, StoryObj } from '@storybook/react-vite';
import { Autocomplete } from './components/autocomplete/Autocomplete';
import { Field } from './components/field/Field';
import { SPECIMENS } from './components/specimens';

const tags = ['feature', 'fix', 'bug', 'docs', 'internal', 'mobile', 'performance', 'design', 'accessibility', 'security'];

function AutocompleteExample() {
  return (
    <Field label="Search tags" style={{ width: 240 }}>
      <Autocomplete.Root items={tags}>
        <Autocomplete.Input placeholder="e.g. feature" />
        <Autocomplete.Popup>
          <Autocomplete.Empty>No tags found.</Autocomplete.Empty>
          <Autocomplete.List>
            {(tag: string) => (
              <Autocomplete.Item key={tag} value={tag}>
                {tag}
              </Autocomplete.Item>
            )}
          </Autocomplete.List>
        </Autocomplete.Popup>
      </Autocomplete.Root>
    </Field>
  );
}

const meta = {
  title: 'Base UI/Components/Autocomplete',
  component: AutocompleteExample,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof AutocompleteExample>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Type to see suggestions; any text is a valid value. */
export const Default: Story = {};

/** As designed in Figma: an Input over a Listbox of Options without indicators (static). */
export const Preview: Story = { render: () => <>{SPECIMENS['autocomplete']({})}</> };
