import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ChoiceList, type ChoiceListSection } from './ChoiceList';

describe('ChoiceList', () => {
  it('renders all section titles', () => {
    const sections: ChoiceListSection[] = [
      { id: 'default', title: 'Default', items: [{ id: 'a', kind: 'menu-cell' }] },
      { id: 'switchers', title: 'Switchers', items: [{ id: 'b', kind: 'menu-cell', variant: 'switcher' }] },
      { id: 'checkbox', title: 'Checkbox', items: [{ id: 'c', kind: 'checkbox-cell' }] },
      { id: 'radio', title: 'Radio', items: [{ id: 'd', kind: 'radio-cell' }] },
    ];

    render(<ChoiceList title="Choice list" sections={sections} />);

    expect(screen.getByText('Default')).toBeInTheDocument();
    expect(screen.getByText('Switchers')).toBeInTheDocument();
    expect(screen.getByText('Checkbox')).toBeInTheDocument();
    expect(screen.getByText('Radio')).toBeInTheDocument();
  });

  it('supports actions menu with optional shortcut', () => {
    const onAction = vi.fn();

    render(
      <ChoiceList
        title="Actions"
        sections={[
          {
            id: 'actions',
            title: 'Actions',
            items: [
              {
                id: 'action-with-shortcut',
                kind: 'menu-cell',
                props: { label: 'Run action', shortcut: true, shortcutLabel: '⌘ K', onClick: onAction },
              },
            ],
          },
        ]}
      />,
    );

    expect(screen.getByText('⌘ K')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('menuitem', { name: /Run action/i }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('supports selection menu with selected menu cell', () => {
    render(
      <ChoiceList
        title="Selection"
        sections={[
          {
            id: 'selection',
            title: 'Selection',
            items: [
              { id: 'first', kind: 'menu-cell', props: { label: 'Option A' } },
              { id: 'selected', kind: 'menu-cell', props: { label: 'Option B', selected: true } },
            ],
          },
        ]}
      />,
    );

    const selectedItem = screen.getByRole('menuitem', { name: 'Option B' });
    expect(selectedItem).toHaveAttribute('data-selected', 'true');
  });

  it('supports switcher menu items', () => {
    const onSwitcherChange = vi.fn();

    render(
      <ChoiceList
        title="Switcher"
        sections={[
          {
            id: 'switchers',
            title: 'Switchers',
            items: [
              {
                id: 'switch',
                kind: 'menu-cell',
                variant: 'switcher',
                props: {
                  label: 'Toggle item',
                  switcherChecked: false,
                  onSwitcherChange,
                },
              },
            ],
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole('switch', { name: 'Toggle option' }));
    expect(onSwitcherChange).toHaveBeenCalledWith(true);
  });

  it('supports checkbox list items', () => {
    const onCheckedChange = vi.fn();

    render(
      <ChoiceList
        title="Checkboxes"
        sections={[
          {
            id: 'checkboxes',
            title: 'Checkboxes',
            items: [
              {
                id: 'checkbox',
                kind: 'checkbox-cell',
                props: { label: 'Checkbox item', checked: true, onCheckedChange },
              },
            ],
          },
        ]}
      />,
    );

    const checkbox = screen.getByRole('checkbox', { name: 'Checkbox item' });
    expect(checkbox).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(checkbox);
    expect(onCheckedChange).toHaveBeenCalledTimes(1);
  });

  it('supports radio list items', () => {
    const onCheckedChange = vi.fn();

    render(
      <ChoiceList
        title="Radio"
        sections={[
          {
            id: 'radio',
            title: 'Radio',
            items: [
              {
                id: 'radio-item',
                kind: 'radio-cell',
                props: { label: 'Radio item', checked: false, onCheckedChange },
              },
            ],
          },
        ]}
      />,
    );

    const radio = screen.getByRole('radio', { name: 'Radio item' });
    expect(radio).toHaveAttribute('aria-checked', 'false');
    fireEvent.click(radio);
    expect(onCheckedChange).toHaveBeenCalledTimes(1);
  });

  it('supports roving keyboard navigation for menu items', async () => {
    const user = userEvent.setup();
    render(
      <ChoiceList
        title="Keyboard"
        enableMenuKeyboardNavigation
        sections={[
          {
            id: 'keyboard',
            title: 'Keyboard',
            items: [
              { id: 'one', kind: 'menu-cell', props: { label: 'First item' } },
              { id: 'two', kind: 'menu-cell', props: { label: 'Second item' } },
            ],
          },
        ]}
      />,
    );

    await user.tab();
    expect(screen.getByRole('menuitem', { name: 'First item' })).toHaveFocus();

    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Second item' })).toHaveFocus();

    await user.keyboard('{Home}');
    expect(screen.getByRole('menuitem', { name: 'First item' })).toHaveFocus();
  });
});

describe('ChoiceList — variant (Code Connect)', () => {
  const sections: ChoiceListSection[] = [
    {
      id: 's1',
      title: 'Options',
      items: [
        { id: 'a', kind: 'menu-cell', props: { label: 'Alpha' } },
        { id: 'b', kind: 'menu-cell', props: { label: 'Beta' } },
      ],
    },
  ];

  it('renders every row as a checkbox', () => {
    render(<ChoiceList variant="checkbox" sections={sections} />);
    expect(screen.getAllByRole('checkbox')).toHaveLength(2);
  });

  it('renders every row as a radio', () => {
    render(<ChoiceList variant="radio" sections={sections} />);
    expect(screen.getAllByRole('radio')).toHaveLength(2);
  });

  it('renders switcher rows', () => {
    render(<ChoiceList variant="switchers" sections={sections} />);
    expect(screen.getAllByRole('switch')).toHaveLength(2);
  });
});
