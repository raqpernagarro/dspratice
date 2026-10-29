import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from './Command';
import type { CommandProps } from './Command';
import { commandScore } from './commandScore';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderMenu(onSelect = vi.fn(), props: Partial<CommandProps> = {}) {
  render(
    <Command {...props}>
      <CommandInput placeholder="Search components" />
      <CommandList>
        <CommandEmpty />
        <CommandGroup heading="Components">
          <CommandItem value="Button" keywords={['actions']} onSelect={onSelect} />
          <CommandItem value="ButtonGroup" keywords={['actions']} onSelect={onSelect} />
          <CommandItem value="Badge" keywords={['data display']} onSelect={onSelect} />
          <CommandItem value="Avatar" keywords={['data display']} disabled onSelect={onSelect} />
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Guides">
          <CommandItem value="Getting started" keywords={['guide']} onSelect={onSelect} />
        </CommandGroup>
      </CommandList>
    </Command>,
  );
  return { input: screen.getByRole('combobox', { name: 'Search' }), onSelect };
}

const visibleOptions = () =>
  screen.queryAllByRole('option').filter((option) => !option.hidden).map((option) => option.textContent);

const activeOption = (input: HTMLElement) => {
  const id = input.getAttribute('aria-activedescendant');
  return id ? document.getElementById(id)?.textContent : null;
};

// ─── commandScore ─────────────────────────────────────────────────────────────

describe('commandScore', () => {
  it('ranks exact > prefix > word start > substring > keyword > fuzzy', () => {
    const exact = commandScore('Badge', 'badge');
    const prefix = commandScore('Button', 'but');
    const wordStart = commandScore('ButtonGroup', 'group');
    const substring = commandScore('Toolbar', 'bar');
    const keyword = commandScore('Badge', 'display', ['Data display']);
    const fuzzy = commandScore('Button', 'btn');
    expect(exact).toBeGreaterThan(prefix);
    expect(prefix).toBeGreaterThan(wordStart);
    expect(wordStart).toBeGreaterThan(substring);
    expect(substring).toBeGreaterThan(keyword);
    expect(keyword).toBeGreaterThan(fuzzy);
    expect(fuzzy).toBeGreaterThan(0);
  });

  it('returns 0 when any term is missing', () => {
    expect(commandScore('Button', 'xyz')).toBe(0);
    expect(commandScore('Button', 'button zzz')).toBe(0);
  });

  it('matches multi-term queries across value and keywords', () => {
    expect(commandScore('Badge', 'badge display', ['Data display'])).toBeGreaterThan(0);
  });
});

// ─── Structure ────────────────────────────────────────────────────────────────

describe('Command — structure', () => {
  it('wires the input to the listbox as a combobox', () => {
    const { input } = renderMenu();
    const listbox = screen.getByRole('listbox', { name: 'Results' });
    expect(input).toHaveAttribute('aria-controls', listbox.id);
    expect(input).toHaveAttribute('aria-autocomplete', 'list');
    expect(screen.getByRole('group', { name: 'Components' })).toBeInTheDocument();
  });

  it('marks the first enabled item active on mount', () => {
    const { input } = renderMenu();
    expect(activeOption(input)).toBe('Button');
    expect(screen.getByRole('option', { name: 'Button' })).toHaveAttribute('aria-selected', 'true');
  });

  it('renders description and shortcut', () => {
    render(
      <Command>
        <CommandInput />
        <CommandList>
          <CommandItem value="New project" description="Create a blank project" shortcutLabel="⌘ N" shortcutAriaLabel="Command N" />
        </CommandList>
      </Command>,
    );
    expect(screen.getByText('Create a blank project')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Command N' })).toBeInTheDocument();
  });
});

// ─── Filtering ────────────────────────────────────────────────────────────────

describe('Command — filtering', () => {
  it('filters items and hides groups with no matches', async () => {
    const user = userEvent.setup();
    const { input } = renderMenu();
    await user.type(input, 'badge');
    expect(visibleOptions()).toEqual(['Badge']);
    expect(screen.getByRole('group', { name: 'Components' })).toBeVisible();
    expect(screen.queryByRole('group', { name: 'Guides' })).not.toBeInTheDocument();
  });

  it('matches keywords that are not displayed', async () => {
    const user = userEvent.setup();
    const { input } = renderMenu();
    await user.type(input, 'guide');
    expect(visibleOptions()).toEqual(['Getting started']);
  });

  it('fuzzy-matches abbreviations', async () => {
    const user = userEvent.setup();
    const { input } = renderMenu();
    await user.type(input, 'btn');
    expect(visibleOptions()).toEqual(expect.arrayContaining(['Button', 'ButtonGroup']));
    expect(activeOption(input)).toBe('Button');
  });

  it('activates the best match, not the first in source order', async () => {
    const user = userEvent.setup();
    const { input } = renderMenu();
    await user.type(input, 'group');
    expect(activeOption(input)).toBe('ButtonGroup');
  });

  it('shows CommandEmpty when nothing matches and announces the count', async () => {
    const user = userEvent.setup();
    const { input } = renderMenu();
    await user.type(input, 'zzzz');
    expect(screen.getByText('No results. Try a different search.')).toBeInTheDocument();
    expect(input).not.toHaveAttribute('aria-activedescendant');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('No results', { selector: '[aria-live]' })).toBeInTheDocument();
  });

  it('hides separators while searching', async () => {
    const user = userEvent.setup();
    const { input } = renderMenu();
    expect(screen.getByRole('separator')).toBeInTheDocument();
    await user.type(input, 'b');
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
  });

  it('keeps every item visible when shouldFilter is false', async () => {
    const user = userEvent.setup();
    const { input } = renderMenu(vi.fn(), { shouldFilter: false });
    await user.type(input, 'zzzz');
    expect(visibleOptions()).toHaveLength(5);
  });

  it('supports a controlled search', async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    function Controlled() {
      const [search, setSearch] = useState('');
      return (
        <Command
          search={search}
          onSearchChange={(next) => {
            onSearchChange(next);
            setSearch(next.toUpperCase());
          }}
        >
          <CommandInput />
          <CommandList>
            <CommandItem value="Badge" />
          </CommandList>
        </Command>
      );
    }
    render(<Controlled />);
    await user.type(screen.getByRole('combobox'), 'b');
    expect(onSearchChange).toHaveBeenCalledWith('b');
    expect(screen.getByRole('combobox')).toHaveValue('B');
  });
});

// ─── Keyboard ─────────────────────────────────────────────────────────────────

describe('Command — keyboard', () => {
  it('ArrowDown / ArrowUp move the active item and skip disabled items', async () => {
    const user = userEvent.setup();
    const { input } = renderMenu();
    await user.click(input);
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(activeOption(input)).toBe('Badge');
    await user.keyboard('{ArrowDown}');
    expect(activeOption(input)).toBe('Getting started');
    await user.keyboard('{ArrowUp}');
    expect(activeOption(input)).toBe('Badge');
    expect(input).toHaveFocus();
  });

  it('wraps from the first item to the last by default', async () => {
    const user = userEvent.setup();
    const { input } = renderMenu();
    await user.click(input);
    await user.keyboard('{ArrowUp}');
    expect(activeOption(input)).toBe('Getting started');
  });

  it('does not wrap when loop is false', async () => {
    const user = userEvent.setup();
    const { input } = renderMenu(vi.fn(), { loop: false });
    await user.click(input);
    await user.keyboard('{ArrowUp}');
    expect(activeOption(input)).toBe('Button');
  });

  it('Enter runs onSelect for the active item with its value', async () => {
    const user = userEvent.setup();
    const { input, onSelect } = renderMenu();
    await user.type(input, 'badge{Enter}');
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('Badge');
  });

  it('Enter does nothing when there are no results', async () => {
    const user = userEvent.setup();
    const { input, onSelect } = renderMenu();
    await user.type(input, 'zzzz{Enter}');
    expect(onSelect).not.toHaveBeenCalled();
  });
});

// ─── Pointer ──────────────────────────────────────────────────────────────────

describe('Command — pointer', () => {
  it('click runs onSelect and keeps focus in the input', async () => {
    const user = userEvent.setup();
    const { input, onSelect } = renderMenu();
    await user.click(input);
    await user.click(screen.getByRole('option', { name: 'Badge' }));
    expect(onSelect).toHaveBeenCalledWith('Badge');
    expect(input).toHaveFocus();
  });

  it('clicking a disabled item does nothing', async () => {
    const user = userEvent.setup();
    const { onSelect } = renderMenu();
    const avatar = screen.getByRole('option', { name: 'Avatar' });
    expect(avatar).toHaveAttribute('aria-disabled', 'true');
    await user.click(avatar);
    expect(onSelect).not.toHaveBeenCalled();
  });
});

// ─── CommandDialog ────────────────────────────────────────────────────────────

describe('CommandDialog', () => {
  function Palette({ onSelect = vi.fn() }: { onSelect?: (value: string) => void }) {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button type="button" onClick={() => setOpen(true)}>
          Open search
        </button>
        <CommandDialog open={open} onOpenChange={setOpen} aria-label="Search the docs">
          <CommandInput placeholder="Search the docs" />
          <CommandList>
            <CommandEmpty />
            <CommandItem
              value="Button"
              onSelect={(value) => {
                onSelect(value);
                setOpen(false);
              }}
            />
          </CommandList>
        </CommandDialog>
      </>
    );
  }

  it('opens as a labelled modal dialog with focus in the input', async () => {
    const user = userEvent.setup();
    render(<Palette />);
    await user.click(screen.getByRole('button', { name: 'Open search' }));
    expect(screen.getByRole('dialog', { name: 'Search the docs' })).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('combobox')).toHaveFocus();
  });

  it('Escape closes and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    render(<Palette />);
    const trigger = screen.getByRole('button', { name: 'Open search' });
    await user.click(trigger);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('selecting an item can close the dialog, and the search resets on reopen', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Palette onSelect={onSelect} />);
    await user.click(screen.getByRole('button', { name: 'Open search' }));
    await user.type(screen.getByRole('combobox'), 'but{Enter}');
    expect(onSelect).toHaveBeenCalledWith('Button');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Open search' }));
    expect(screen.getByRole('combobox')).toHaveValue('');
  });
});

// ─── Guard rails ──────────────────────────────────────────────────────────────

describe('Command — guard rails', () => {
  it('throws a clear error when a part is used outside Command', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<CommandInput />)).toThrow('<CommandInput> must be rendered inside <Command>.');
    spy.mockRestore();
  });
});
