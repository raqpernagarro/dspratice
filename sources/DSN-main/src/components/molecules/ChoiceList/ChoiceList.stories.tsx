import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChoiceList } from './ChoiceList';
import spec from './ChoiceList.spec.md?raw';
import { specDocsParameters } from '../../../docs/stripSpecTitle';

/** Decorator that supplies the required `menu` ancestor for stories containing `role="menuitem"` items. */
const menuDecorator: Meta['decorators'] = [
  (Story) => (
    <div role="menu" aria-label="Menu preview">
      <Story />
    </div>
  ),
];

const meta: Meta<typeof ChoiceList> = {
  parameters: { ...specDocsParameters(spec), storyWidth: 'field' },
  title: 'Inputs & Controls/Choice List',
  component: ChoiceList,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ChoiceList>;

const actionItems = Array.from({ length: 4 }, (_, idx) => ({
  id: `action-${idx + 1}`,
  kind: 'menu-cell' as const,
  props: {
    label: `Action ${idx + 1}`,
    showLeadingIcon: true,
    showTrailingIcon: false,
    shortcut: idx % 2 === 0,
    shortcutLabel: idx % 2 === 0 ? '⌘ K' : undefined,
  },
}));

const selectionItems = Array.from({ length: 4 }, (_, idx) => ({
  id: `selected-${idx + 1}`,
  kind: 'menu-cell' as const,
  props: {
    label: `Option ${idx + 1}`,
    selected: idx === 1,
    showLeadingIcon: true,
    showTrailingIcon: true,
  },
}));

const switcherItems = Array.from({ length: 4 }, (_, idx) => ({
  id: `switch-${idx + 1}`,
  kind: 'menu-cell' as const,
  variant: 'switcher' as const,
  props: { label: `Toggle ${idx + 1}`, switcherChecked: idx < 2, showLeadingIcon: true },
}));

const checkboxItems = Array.from({ length: 4 }, (_, idx) => ({
  id: `check-${idx + 1}`,
  kind: 'checkbox-cell' as const,
  props: { label: `Checkbox ${idx + 1}`, checked: idx % 2 === 1, showLeadingIcon: true },
}));

const radioItems = Array.from({ length: 4 }, (_, idx) => ({
  id: `radio-${idx + 1}`,
  kind: 'radio-cell' as const,
  props: { label: `Radio ${idx + 1}`, checked: idx === 2, showLeadingIcon: true },
}));

export const Playground: Story = {
  decorators: menuDecorator,
  args: {
    title: 'Actions',
    sections: [{ id: 'actions', title: 'Actions', items: actionItems }],
  },
};

export const SelectionMenu: Story = {
  decorators: menuDecorator,
  args: {
    title: 'Selection',
    sections: [{ id: 'selection', title: 'Selection', items: selectionItems }],
  },
};

export const SwitcherMenu: Story = {
  decorators: menuDecorator,
  args: {
    title: 'Switcher',
    sections: [{ id: 'switcher', title: 'Switcher', items: switcherItems }],
  },
};

export const CheckboxList: Story = {
  args: {
    title: 'Checkboxes',
    sections: [{ id: 'checkboxes', title: 'Checkboxes', items: checkboxItems }],
  },
};

export const RadioList: Story = {
  args: {
    title: 'Radio',
    sections: [{ id: 'radio', title: 'Radio', items: radioItems }],
  },
};
